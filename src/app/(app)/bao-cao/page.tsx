import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { businessDateVn, formatDateTimeVn } from "@/lib/date";
import { formatVnd } from "@/lib/currency";

export default async function BaoCaoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "staff") {
    return (
      <div className="mx-auto max-w-sm text-sm text-muted">
        Trang tổng quan dành cho chủ đầu tư, đối tác và quản lý.
      </div>
    );
  }

  const supabase = await createClient();
  const today = businessDateVn();

  const { data: shiftsToday } = await supabase
    .from("shifts")
    .select("id")
    .eq("business_date", today)
    .neq("status", "cancelled");
  const shiftIdsToday = (shiftsToday ?? []).map((s) => s.id);

  const { data: salesToday } =
    shiftIdsToday.length > 0
      ? await supabase
          .from("sales")
          .select("total_amount")
          .in("shift_id", shiftIdsToday)
          .eq("status", "completed")
      : { data: [] };
  const revenueToday = (salesToday ?? []).reduce((sum, s) => sum + s.total_amount, 0);
  const orderCountToday = (salesToday ?? []).length;

  const { data: openShifts } = await supabase
    .from("shifts")
    .select("id, business_date, cart_id, location_id")
    .eq("status", "open")
    .order("business_date", { ascending: false });

  const { data: pendingShifts } = await supabase
    .from("shifts")
    .select("id, business_date, cart_id, closed_at, closing_reason")
    .eq("status", "pending_review")
    .order("closed_at", { ascending: false });

  const { data: variancePendingApproved } = await supabase
    .from("shifts")
    .select("id, business_date, cart_id, status, closing_reason")
    .in("status", ["pending_review", "approved"])
    .not("closing_reason", "is", null)
    .order("closed_at", { ascending: false })
    .limit(20);

  const cartIds = [
    ...new Set(
      [...(openShifts ?? []), ...(pendingShifts ?? []), ...(variancePendingApproved ?? [])].map((s) => s.cart_id),
    ),
  ];
  const { data: carts } =
    cartIds.length > 0 ? await supabase.from("carts").select("id, code, name").in("id", cartIds) : { data: [] };
  const cartById = new Map((carts ?? []).map((c) => [c.id, c]));

  const locationIds = [...new Set((openShifts ?? []).map((s) => s.location_id))];
  const { data: locations } =
    locationIds.length > 0 ? await supabase.from("locations").select("id, name").in("id", locationIds) : { data: [] };
  const locationById = new Map((locations ?? []).map((l) => [l.id, l]));

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-extrabold text-foreground">Tổng quan</h1>
        <div className="flex gap-3">
          <Link href="/bao-cao/chi-tiet" className="text-sm text-primary underline">
            Báo cáo chi tiết →
          </Link>
          <Link href="/bao-cao/hao-hut" className="text-sm text-primary underline">
            Hao hụt &amp; chênh lệch →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-xs uppercase text-muted">Doanh thu hôm nay</p>
          <p className="mt-1 font-mono text-xl font-bold text-primary">{formatVnd(revenueToday)}</p>
        </div>
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-xs uppercase text-muted">Số đơn hôm nay</p>
          <p className="mt-1 font-mono text-xl font-bold text-foreground">{orderCountToday}</p>
        </div>
      </div>

      <div className="rounded-md border border-border bg-surface p-4">
        <h2 className="font-heading text-lg font-bold text-foreground">Xe đang mở ca ({(openShifts ?? []).length})</h2>
        <ul className="mt-2 flex flex-col gap-1">
          {(openShifts ?? []).map((s) => {
            const cart = cartById.get(s.cart_id);
            const location = locationById.get(s.location_id);
            return (
              <li key={s.id}>
                <Link href={`/ca-ban/${s.id}`} className="flex items-center justify-between text-sm text-primary underline">
                  <span>{cart ? `${cart.code} — ${cart.name}` : "Xe"}</span>
                  <span className="text-muted">{location?.name ?? ""}</span>
                </Link>
              </li>
            );
          })}
          {(openShifts ?? []).length === 0 && <li className="text-sm text-muted">Không có xe nào đang mở ca.</li>}
        </ul>
      </div>

      <div className="rounded-md border border-border bg-surface p-4">
        <h2 className="font-heading text-lg font-bold text-foreground">Ca chờ duyệt ({(pendingShifts ?? []).length})</h2>
        <ul className="mt-2 flex flex-col gap-1">
          {(pendingShifts ?? []).map((s) => {
            const cart = cartById.get(s.cart_id);
            return (
              <li key={s.id}>
                <Link href={`/ca-ban/${s.id}`} className="flex items-center justify-between text-sm text-primary underline">
                  <span>{cart ? `${cart.code} — ${cart.name}` : "Xe"}</span>
                  <span className="text-muted">{s.closed_at ? formatDateTimeVn(s.closed_at) : ""}</span>
                </Link>
              </li>
            );
          })}
          {(pendingShifts ?? []).length === 0 && <li className="text-sm text-muted">Không có ca nào chờ duyệt.</li>}
        </ul>
      </div>

      <div className="rounded-md border border-border bg-surface p-4">
        <h2 className="font-heading text-lg font-bold text-foreground">Cảnh báo chênh lệch</h2>
        <ul className="mt-2 flex flex-col gap-1">
          {(variancePendingApproved ?? []).map((s) => {
            const cart = cartById.get(s.cart_id);
            return (
              <li key={s.id}>
                <Link href={`/ca-ban/${s.id}`} className="block text-sm text-primary underline">
                  {cart ? `${cart.code} — ${cart.name}` : "Xe"} ({s.business_date})
                </Link>
                <p className="text-xs text-muted">{s.closing_reason}</p>
              </li>
            );
          })}
          {(variancePendingApproved ?? []).length === 0 && (
            <li className="text-sm text-muted">Không có ca nào chênh lệch.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
