import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { formatDateTimeVn } from "@/lib/date";
import { formatVnd } from "@/lib/currency";
import { OpenShiftForm } from "./open-shift-form";

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Đã lên lịch",
  open: "Đang mở ca",
  cancelled: "Đã hủy",
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
      "id, business_date, status, cart_id, location_id, shift_template_id, opening_cash, opened_at, opened_by",
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
          .order("created_at")
      : { data: [] };

  const movementProductIds = [...new Set((movements ?? []).map((m) => m.product_id))];
  const { data: movementProducts } =
    movementProductIds.length > 0
      ? await supabase.from("products").select("id, code, name, unit").in("id", movementProductIds)
      : { data: [] };
  const productById = new Map((movementProducts ?? []).map((p) => [p.id, p]));

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
    </div>
  );
}
