import { getCurrentUser } from "@/lib/current-user";
import { businessDateVn, formatDateTimeVn } from "@/lib/date";
import { toCsv, csvResponse } from "@/lib/csv";
import { getChiTietReport } from "../data";

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Đã lên lịch",
  open: "Đang mở ca",
  pending_review: "Chờ duyệt",
  approved: "Đã duyệt",
};

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

  const { shiftRows, productRows, totalRevenue, totalOrders } = await getChiTietReport({
    from,
    to,
    cartId,
    locationId,
  });

  const rows: (string | number)[][] = [
    [`Báo cáo chi tiết ${from} → ${to}`],
    [`Xuất lúc: ${formatDateTimeVn(new Date().toISOString())}`],
    [],
    ["Theo ca"],
    ["Ngày", "Xe", "Điểm bán", "Trạng thái", "Số đơn", "Doanh thu"],
    ...shiftRows.map(({ shift: s, cart, location, agg }) => [
      s.business_date,
      cart ? `${cart.code} — ${cart.name}` : "",
      location?.name ?? "",
      STATUS_LABEL[s.status] ?? s.status,
      agg.count,
      agg.revenue,
    ]),
    ["", "", "", "Tổng cộng", totalOrders, totalRevenue],
    [],
    ["Sản lượng theo món"],
    ["Sản phẩm", "Số lượng", "Đơn vị", "Thành tiền"],
    ...productRows.map((r) => [
      r.product ? `${r.product.code} — ${r.product.name}` : "",
      r.quantity,
      r.product?.unit ?? "",
      r.amount,
    ]),
  ];

  return csvResponse(toCsv(rows), `bao-cao-chi-tiet-${from}_${to}.csv`);
}
