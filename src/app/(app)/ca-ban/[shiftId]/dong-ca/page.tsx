import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { calcCashDue, calcEndingStock } from "@/lib/inventory";
import { CloseShiftForm } from "./close-shift-form";

const METHOD_LABEL: Record<string, string> = {
  chuyen_khoan: "Chuyển khoản",
  qr: "QR",
  vi_dien_tu: "Ví điện tử",
  khac: "Khác",
};
const OTHER_METHODS = ["chuyen_khoan", "qr", "vi_dien_tu", "khac"] as const;

export default async function DongCaPage({
  params,
}: {
  params: Promise<{ shiftId: string }>;
}) {
  const { shiftId } = await params;
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: shift } = await supabase
    .from("shifts")
    .select("id, cart_id, status, opening_cash")
    .eq("id", shiftId)
    .maybeSingle();
  if (!shift) notFound();

  const { data: cart } = await supabase.from("carts").select("partner_id").eq("id", shift.cart_id).maybeSingle();
  const { data: staffRow } =
    user?.role === "staff"
      ? await supabase
          .from("shift_staff")
          .select("shift_id")
          .eq("shift_id", shiftId)
          .eq("staff_id", user.id)
          .maybeSingle()
      : { data: null };

  const canClose =
    user?.role === "owner" ||
    (user?.role === "partner" && cart?.partner_id === user.id) ||
    (user?.role === "staff" && !!staffRow);

  if (shift.status !== "open" || !canClose) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <Link href={`/ca-ban/${shiftId}`} className="text-sm text-primary underline">
          ← Chi tiết ca
        </Link>
        <p className="text-sm text-muted">
          {shift.status !== "open" ? "Ca này chưa mở hoặc đã đóng." : "Bạn không có quyền đóng ca này."}
        </p>
      </div>
    );
  }

  const { data: movements } = await supabase
    .from("stock_movements")
    .select("product_id, movement_type, quantity")
    .eq("shift_id", shiftId);

  const flowByProduct = new Map<string, { received: number; sold: number; returned: number; wasted: number }>();
  for (const m of movements ?? []) {
    const flow = flowByProduct.get(m.product_id) ?? { received: 0, sold: 0, returned: 0, wasted: 0 };
    if (m.movement_type === "nhan") flow.received += m.quantity;
    else if (m.movement_type === "ban") flow.sold += m.quantity;
    else if (m.movement_type === "tra") flow.returned += m.quantity;
    else if (m.movement_type === "huy" || m.movement_type === "hao_hut") flow.wasted += m.quantity;
    flowByProduct.set(m.product_id, flow);
  }

  // Chi kiem ke san pham thuc su co phat sinh trong ca nay (khong phai moi
  // san pham dang hoat dong toan he thong) - dung vua giam nham lan, vua
  // tranh loi rang buoc "so luong > 0" khi mot san pham chua tung dong tay.
  const touchedProductIds = [...flowByProduct.keys()];
  const { data: products } =
    touchedProductIds.length > 0
      ? await supabase.from("products").select("id, code, name, unit").in("id", touchedProductIds).order("code")
      : { data: [] };

  const { data: sales } = await supabase
    .from("sales")
    .select("id")
    .eq("shift_id", shiftId)
    .eq("status", "completed");
  const saleIds = (sales ?? []).map((s) => s.id);
  const { data: payments } =
    saleIds.length > 0
      ? await supabase.from("payments").select("method, amount").in("sale_id", saleIds)
      : { data: [] };
  const revenueByMethod = new Map<string, number>();
  for (const p of payments ?? []) {
    revenueByMethod.set(p.method, (revenueByMethod.get(p.method) ?? 0) + p.amount);
  }

  const productRows = (products ?? []).map((p) => {
    const flow = flowByProduct.get(p.id) ?? { received: 0, sold: 0, returned: 0, wasted: 0 };
    return { id: p.id, code: p.code, name: p.name, unit: p.unit, endingStock: calcEndingStock(flow) };
  });

  const cashDue = calcCashDue(shift.opening_cash ?? 0, revenueByMethod.get("tien_mat") ?? 0);
  const otherMethodRows = OTHER_METHODS.filter((m) => (revenueByMethod.get(m) ?? 0) > 0).map((m) => ({
    method: m,
    label: METHOD_LABEL[m],
    due: revenueByMethod.get(m) ?? 0,
  }));

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <Link href={`/ca-ban/${shiftId}`} className="text-sm text-primary underline">
        ← Chi tiết ca
      </Link>
      <h1 className="font-heading text-2xl font-extrabold text-foreground">Đóng ca</h1>
      <p className="text-sm text-muted">
        Số đã điền sẵn theo sổ sách — sửa lại nếu đếm thực tế khác. Có chênh lệch thì bắt buộc ghi lý do.
      </p>
      <CloseShiftForm shiftId={shiftId} products={productRows} cashDue={cashDue} otherMethods={otherMethodRows} />
    </div>
  );
}
