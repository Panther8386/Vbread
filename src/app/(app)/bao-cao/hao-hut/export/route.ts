import { getCurrentUser } from "@/lib/current-user";
import { businessDateVn, formatDateTimeVn } from "@/lib/date";
import { toCsv, csvResponse } from "@/lib/csv";
import { getHaoHutReport } from "../data";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "staff") {
    return new Response("Không có quyền.", { status: 403 });
  }

  const url = new URL(request.url);
  const today = businessDateVn();
  const from = url.searchParams.get("from") || today;
  const to = url.searchParams.get("to") || today;
  const cartId = url.searchParams.get("cart_id") ?? undefined;
  const locationId = url.searchParams.get("location_id") ?? undefined;

  const { wasteRows, totalWasteValue, varianceRows } = await getHaoHutReport({ from, to, cartId, locationId });

  const rows: (string | number)[][] = [
    [`Hao hụt & chênh lệch hàng ${from} → ${to}`],
    [`Xuất lúc: ${formatDateTimeVn(new Date().toISOString())}`],
    [],
    ["Hao hụt theo sản phẩm"],
    ["Sản phẩm", "Hủy", "Hao hụt", "Tổng", "Đơn vị", "Giá trị ước tính"],
    ...wasteRows.map((r) => [
      r.product ? `${r.product.code} — ${r.product.name}` : "",
      r.huy,
      r.hao_hut,
      r.total,
      r.product?.unit ?? "",
      r.estimatedValue,
    ]),
    ["", "", "", "", "Tổng giá trị ước tính", totalWasteValue],
    [],
    ["Chênh lệch hàng theo ca (đã kiểm kê)"],
    ["Ngày", "Xe", "Sản phẩm", "Sổ sách", "Kiểm kê", "Chênh lệch"],
    ...varianceRows.map((r) => [
      r.businessDate,
      r.cart ? `${r.cart.code} — ${r.cart.name}` : "",
      r.product ? `${r.product.code} — ${r.product.name}` : "",
      r.endingStock,
      r.counted,
      r.variance,
    ]),
  ];

  return csvResponse(toCsv(rows), `bao-cao-hao-hut-${from}_${to}.csv`);
}
