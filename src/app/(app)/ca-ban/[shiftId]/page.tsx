import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { formatDateTimeVn } from "@/lib/date";
import { formatVnd } from "@/lib/currency";
import { calcCashDue, calcEndingStock, calcVariance } from "@/lib/inventory";
import { OpenShiftForm } from "./open-shift-form";

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Đã lên lịch",
  open: "Đang mở ca",
  pending_review: "Chờ duyệt",
  cancelled: "Đã hủy",
};

const METHOD_LABEL: Record<string, string> = {
  tien_mat: "Tiền mặt",
  chuyen_khoan: "Chuyển khoản",
  qr: "QR",
  vi_dien_tu: "Ví điện tử",
  khac: "Khác",
};

export default async function ShiftDetailPage({
  params,
}: {
  params: Promise<{ shiftId: string }>;
}) {
  const { shiftId } = await params;
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: shift } = await supabase
    .from("shifts")
    .select(
      "id, business_date, status, cart_id, location_id, shift_template_id, opening_cash, opened_at, opened_by, cash_counted, closing_reason, closed_at",
    )
    .eq("id", shiftId)
    .maybeSingle();
  if (!shift) notFound();

  const [{ data: cart }, { data: location }, { data: template }, { data: staffRows }] = await Promise.all([
    supabase.from("carts").select("code, name, partner_id").eq("id", shift.cart_id).maybeSingle(),
    supabase.from("locations").select("name").eq("id", shift.location_id).maybeSingle(),
    supabase
      .from("shift_templates")
      .select("name, start_time, end_time")
      .eq("id", shift.shift_template_id)
      .maybeSingle(),
    supabase.from("shift_staff").select("staff_id").eq("shift_id", shiftId),
  ]);

  const staffIds = (staffRows ?? []).map((r) => r.staff_id);
  const { data: staffProfiles } =
    staffIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", staffIds)
      : { data: [] };
  const staffNames = (staffProfiles ?? []).map((p) => p.full_name);

  const isStaffAssigned = !!user && staffIds.includes(user.id);
  const isPartnerOfCart = user?.role === "partner" && cart?.partner_id === user.id;
  const canOpen = user?.role === "owner" || isPartnerOfCart || (user?.role === "staff" && isStaffAssigned);

  const { data: products } =
    shift.status === "scheduled" && canOpen
      ? await supabase.from("products").select("id, code, name, unit").eq("status", "active").order("code")
      : { data: [] };

  const { data: movements } =
    shift.status !== "scheduled"
      ? await supabase
          .from("stock_movements")
          .select("id, product_id, movement_type, quantity, created_at")
          .eq("shift_id", shiftId)
          .eq("movement_type", "nhan")
          .order("created_at")
      : { data: [] };

  const movementProductIds = [...new Set((movements ?? []).map((m) => m.product_id))];
  const { data: movementProducts } =
    movementProductIds.length > 0
      ? await supabase.from("products").select("id, code, name, unit").in("id", movementProductIds)
      : { data: [] };
  const productById = new Map((movementProducts ?? []).map((p) => [p.id, p]));

  const { data: sales } =
    shift.status !== "scheduled"
      ? await supabase
          .from("sales")
          .select("id, total_amount, status, created_at")
          .eq("shift_id", shiftId)
          .order("created_at", { ascending: false })
      : { data: [] };

  let closingRows: { code: string; name: string; unit: string; endingStock: number; counted: number; variance: number }[] = [];
  let closingCash = { due: 0, counted: 0, variance: 0 };
  let closingOtherMethods: { label: string; due: number; counted: number; variance: number }[] = [];

  if (shift.status === "pending_review") {
    const { data: allMovements } = await supabase
      .from("stock_movements")
      .select("product_id, movement_type, quantity")
      .eq("shift_id", shiftId);

    const flowByProduct = new Map<string, { received: number; sold: number; returned: number; wasted: number }>();
    const countedByProduct = new Map<string, number>();
    for (const m of allMovements ?? []) {
      if (m.movement_type === "kiem_ke") {
        countedByProduct.set(m.product_id, m.quantity);
        continue;
      }
      const flow = flowByProduct.get(m.product_id) ?? { received: 0, sold: 0, returned: 0, wasted: 0 };
      if (m.movement_type === "nhan") flow.received += m.quantity;
      else if (m.movement_type === "ban") flow.sold += m.quantity;
      else if (m.movement_type === "tra") flow.returned += m.quantity;
      else if (m.movement_type === "huy" || m.movement_type === "hao_hut") flow.wasted += m.quantity;
      flowByProduct.set(m.product_id, flow);
    }

    const closingProductIds = [...countedByProduct.keys()];
    const { data: closingProducts } =
      closingProductIds.length > 0
        ? await supabase.from("products").select("id, code, name, unit").in("id", closingProductIds)
        : { data: [] };

    closingRows = (closingProducts ?? []).map((p) => {
      const endingStock = calcEndingStock(flowByProduct.get(p.id) ?? { received: 0, sold: 0, returned: 0, wasted: 0 });
      const counted = countedByProduct.get(p.id) ?? 0;
      return { code: p.code, name: p.name, unit: p.unit, endingStock, counted, variance: calcVariance(counted, endingStock) };
    });

    const { data: closingSales } = await supabase
      .from("sales")
      .select("id")
      .eq("shift_id", shiftId)
      .eq("status", "completed");
    const closingSaleIds = (closingSales ?? []).map((s) => s.id);
    const { data: closingPayments } =
      closingSaleIds.length > 0
        ? await supabase.from("payments").select("method, amount").in("sale_id", closingSaleIds)
        : { data: [] };
    const revenueByMethod = new Map<string, number>();
    for (const p of closingPayments ?? []) {
      revenueByMethod.set(p.method, (revenueByMethod.get(p.method) ?? 0) + p.amount);
    }

    const cashDue = calcCashDue(shift.opening_cash ?? 0, revenueByMethod.get("tien_mat") ?? 0);
    closingCash = {
      due: cashDue,
      counted: shift.cash_counted ?? 0,
      variance: calcVariance(shift.cash_counted ?? 0, cashDue),
    };

    const { data: paymentCounts } = await supabase
      .from("shift_payment_counts")
      .select("method, counted_amount")
      .eq("shift_id", shiftId);
    closingOtherMethods = (paymentCounts ?? []).map((pc) => ({
      label: METHOD_LABEL[pc.method] ?? pc.method,
      due: revenueByMethod.get(pc.method) ?? 0,
      counted: pc.counted_amount,
      variance: calcVariance(pc.counted_amount, revenueByMethod.get(pc.method) ?? 0),
    }));
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <Link href="/ca-ban" className="text-sm text-primary underline">
        ← Danh sách ca
      </Link>

      <div className="rounded-md border border-border bg-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-heading text-xl font-bold text-foreground">
            {cart ? `${cart.code} — ${cart.name}` : "Xe"}
          </p>
          <span className="font-mono text-xs text-muted">{STATUS_LABEL[shift.status] ?? shift.status}</span>
        </div>
        <p className="mt-1 text-sm text-muted">
          {shift.business_date} · {location?.name ?? "Điểm bán"}
        </p>
        <p className="text-sm text-foreground">
          {template
            ? `${template.name} (${template.start_time.slice(0, 5)}–${template.end_time.slice(0, 5)})`
            : "Ca"}
        </p>
        <p className="mt-1 text-sm text-muted">
          Nhân viên: {staffNames.length > 0 ? staffNames.join(", ") : "Chưa gán"}
        </p>
      </div>

      {shift.status === "scheduled" && canOpen && (
        <OpenShiftForm
          shiftId={shift.id}
          products={(products ?? []).map((p) => ({ id: p.id, code: p.code, name: p.name, unit: p.unit }))}
        />
      )}

      {shift.status === "scheduled" && !canOpen && (
        <p className="text-sm text-muted">Chỉ nhân viên được phân công (hoặc đối tác/chủ đầu tư) mới mở được ca này.</p>
      )}

      {shift.status !== "scheduled" && (
        <div className="rounded-md border border-border bg-surface p-4">
          <h2 className="font-heading text-lg font-bold text-foreground">Đã mở ca</h2>
          <p className="text-sm text-muted">
            Tiền lẻ đầu ca: <span className="text-foreground">{formatVnd(shift.opening_cash ?? 0)}</span>
          </p>
          {shift.opened_at && (
            <p className="text-sm text-muted">Mở lúc: {formatDateTimeVn(shift.opened_at)}</p>
          )}

          <p className="mt-3 text-sm font-medium text-foreground">Hàng nhận đầu ca</p>
          <ul className="mt-1 flex flex-col gap-1">
            {(movements ?? []).map((m) => {
              const p = productById.get(m.product_id);
              return (
                <li key={m.id} className="text-sm text-foreground">
                  {p ? `${p.code} — ${p.name}` : "Sản phẩm"}: {m.quantity} {p?.unit}
                </li>
              );
            })}
            {(movements ?? []).length === 0 && <li className="text-sm text-muted">Không nhận hàng đầu ca.</li>}
          </ul>
        </div>
      )}

      {shift.status === "open" && (
        <div className="flex gap-3">
          <Link
            href={`/ca-ban/${shiftId}/ban-hang`}
            className="h-11 flex-1 rounded-lg bg-primary text-center font-heading font-bold leading-[44px] text-primary-foreground"
          >
            Bán hàng
          </Link>
          <Link
            href={`/ca-ban/${shiftId}/hang-hoa`}
            className="h-11 flex-1 rounded-lg border border-border text-center font-heading font-bold leading-[44px] text-foreground"
          >
            Hàng hóa
          </Link>
          <Link
            href={`/ca-ban/${shiftId}/dong-ca`}
            className="h-11 flex-1 rounded-lg border border-border text-center font-heading font-bold leading-[44px] text-foreground"
          >
            Đóng ca
          </Link>
        </div>
      )}

      {shift.status === "pending_review" && (
        <div className="rounded-md border border-border bg-surface p-4">
          <h2 className="font-heading text-lg font-bold text-foreground">Đã đóng ca — chờ duyệt</h2>
          {shift.closed_at && <p className="text-sm text-muted">Đóng lúc: {formatDateTimeVn(shift.closed_at)}</p>}

          <p className="mt-3 text-sm font-medium text-foreground">Kiểm kê hàng hóa</p>
          <ul className="mt-1 flex flex-col gap-1">
            {closingRows.map((r) => (
              <li key={r.code} className="text-sm text-foreground">
                {r.code} — {r.name}: sổ sách {r.endingStock} {r.unit}, kiểm kê {r.counted} {r.unit}
                {r.variance !== 0 && (
                  <span className="text-destructive"> (lệch {r.variance > 0 ? "+" : ""}{r.variance})</span>
                )}
              </li>
            ))}
            {closingRows.length === 0 && <li className="text-sm text-muted">Không có dữ liệu kiểm kê.</li>}
          </ul>

          <p className="mt-3 text-sm font-medium text-foreground">Đối soát tiền</p>
          <ul className="mt-1 flex flex-col gap-1 text-sm text-foreground">
            <li>
              Tiền mặt: phải có {formatVnd(closingCash.due)}, thực đếm {formatVnd(closingCash.counted)}
              {closingCash.variance !== 0 && (
                <span className="text-destructive"> (lệch {closingCash.variance > 0 ? "+" : ""}{formatVnd(closingCash.variance)})</span>
              )}
            </li>
            {closingOtherMethods.map((m) => (
              <li key={m.label}>
                {m.label}: phải có {formatVnd(m.due)}, thực nhận {formatVnd(m.counted)}
                {m.variance !== 0 && (
                  <span className="text-destructive"> (lệch {m.variance > 0 ? "+" : ""}{formatVnd(m.variance)})</span>
                )}
              </li>
            ))}
          </ul>

          {shift.closing_reason && (
            <p className="mt-3 text-sm text-foreground">Lý do chênh lệch: {shift.closing_reason}</p>
          )}
        </div>
      )}
      {shift.status !== "open" && shift.status !== "scheduled" && (
        <Link href={`/ca-ban/${shiftId}/hang-hoa`} className="text-sm text-primary underline">
          Xem lịch sử hàng hóa trong ca →
        </Link>
      )}

      {shift.status !== "scheduled" && (
        <div className="rounded-md border border-border bg-surface p-4">
          <h2 className="font-heading text-lg font-bold text-foreground">Đơn hàng trong ca</h2>
          <ul className="mt-2 flex flex-col gap-1">
            {(sales ?? []).map((s) => (
              <li key={s.id}>
                <Link
                  href={`/ca-ban/${shiftId}/ban-hang/${s.id}`}
                  className="flex items-center justify-between text-sm text-primary underline"
                >
                  <span>{formatDateTimeVn(s.created_at)}</span>
                  <span className="font-mono">
                    {formatVnd(s.total_amount)}
                    {s.status === "cancelled" ? " (đã hủy)" : ""}
                  </span>
                </Link>
              </li>
            ))}
            {(sales ?? []).length === 0 && <li className="text-sm text-muted">Chưa có đơn nào.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
