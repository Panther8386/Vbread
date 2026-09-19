import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { formatDateTimeVn } from "@/lib/date";
import { formatVnd } from "@/lib/currency";
import { HandoverForm } from "./handover-form";
import { confirmHandover } from "./actions";

export default async function BanGiaoPage({
  params,
}: {
  params: Promise<{ shiftId: string }>;
}) {
  const { shiftId } = await params;
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: shift } = await supabase
    .from("shifts")
    .select("id, cart_id, status")
    .eq("id", shiftId)
    .maybeSingle();
  if (!shift) notFound();

  const { data: cart } = await supabase.from("carts").select("partner_id").eq("id", shift.cart_id).maybeSingle();
  const { data: staffRows } = await supabase.from("shift_staff").select("staff_id").eq("shift_id", shiftId);
  const staffIds = (staffRows ?? []).map((r) => r.staff_id);
  const { data: staffProfiles } =
    staffIds.length > 0
      ? await supabase.from("profiles").select("id, full_name, phone").in("id", staffIds)
      : { data: [] };
  const staffById = new Map((staffProfiles ?? []).map((p) => [p.id, p]));

  const isStaffAssigned = !!user && staffIds.includes(user.id);
  const isPartnerOfCart = user?.role === "partner" && cart?.partner_id === user.id;

  if (shift.status !== "open") {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <Link href={`/ca-ban/${shiftId}`} className="text-sm text-primary underline">
          ← Chi tiết ca
        </Link>
        <p className="text-sm text-muted">Ca này chưa mở hoặc đã đóng.</p>
      </div>
    );
  }

  const { data: handovers } = await supabase
    .from("shift_handovers")
    .select("id, from_staff_id, to_staff_id, cash_handed_over, note, confirmed_at, created_at")
    .eq("shift_id", shiftId)
    .order("created_at", { ascending: false });

  const recipients = (staffProfiles ?? [])
    .filter((p) => p.id !== user?.id)
    .map((p) => ({ id: p.id, label: `${p.full_name} (${p.phone})` }));

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <Link href={`/ca-ban/${shiftId}`} className="text-sm text-primary underline">
        ← Chi tiết ca
      </Link>
      <h1 className="font-heading text-2xl font-extrabold text-foreground">Bàn giao ca</h1>

      {staffIds.length < 2 ? (
        <p className="text-sm text-muted">Ca này chỉ có 1 nhân viên, không cần bàn giao.</p>
      ) : (
        <>
          {user?.role === "staff" && isStaffAssigned && recipients.length > 0 && (
            <HandoverForm shiftId={shiftId} recipients={recipients} />
          )}

          <div className="rounded-md border border-border bg-surface p-4">
            <h2 className="font-heading text-lg font-bold text-foreground">Phiếu bàn giao</h2>
            <ul className="mt-2 flex flex-col gap-3">
              {(handovers ?? []).map((h) => {
                const from = staffById.get(h.from_staff_id);
                const to = staffById.get(h.to_staff_id);
                const canConfirm = !h.confirmed_at && (user?.role === "owner" || isPartnerOfCart || user?.id === h.to_staff_id);
                return (
                  <li key={h.id} className="border-t border-border pt-2 text-sm first:border-t-0 first:pt-0">
                    <p className="text-foreground">
                      {from?.full_name ?? "?"} → {to?.full_name ?? "?"}: {formatVnd(h.cash_handed_over)}
                    </p>
                    <p className="text-xs text-muted">{formatDateTimeVn(h.created_at)}</p>
                    {h.note && <p className="text-muted">Ghi chú: {h.note}</p>}
                    <p className={h.confirmed_at ? "text-secondary" : "text-accent"}>
                      {h.confirmed_at ? `Đã xác nhận lúc ${formatDateTimeVn(h.confirmed_at)}` : "Chờ xác nhận"}
                    </p>
                    {canConfirm && (
                      <form action={confirmHandover} className="mt-1">
                        <input type="hidden" name="shift_id" value={shiftId} />
                        <input type="hidden" name="handover_id" value={h.id} />
                        <button type="submit" className="text-sm text-primary underline">
                          Xác nhận đã nhận
                        </button>
                      </form>
                    )}
                  </li>
                );
              })}
              {(handovers ?? []).length === 0 && <li className="text-sm text-muted">Chưa có phiếu bàn giao nào.</li>}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
