import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { formatDateTimeVn } from "@/lib/date";
import { StockMovementForm } from "./stock-movement-form";

const TYPE_LABEL: Record<string, string> = {
  nhan: "Nhận thêm hàng",
  tra: "Trả hàng",
  huy: "Hủy hàng",
  hao_hut: "Hao hụt",
};

export default async function HangHoaPage({
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
  const { data: staffRow } =
    user?.role === "staff"
      ? await supabase
          .from("shift_staff")
          .select("shift_id")
          .eq("shift_id", shiftId)
          .eq("staff_id", user.id)
          .maybeSingle()
      : { data: null };

  const canWrite =
    user?.role === "owner" ||
    (user?.role === "partner" && cart?.partner_id === user.id) ||
    (user?.role === "staff" && !!staffRow);

  const { data: products } =
    shift.status === "open" && canWrite
      ? await supabase.from("products").select("id, code, name, unit").eq("status", "active").order("code")
      : { data: [] };

  const { data: movements } = await supabase
    .from("stock_movements")
    .select("id, product_id, movement_type, quantity, reason, created_at, created_by")
    .eq("shift_id", shiftId)
    .neq("movement_type", "ban")
    .order("created_at", { ascending: false });

  const movementProductIds = [...new Set((movements ?? []).map((m) => m.product_id))];
  const { data: movementProducts } =
    movementProductIds.length > 0
      ? await supabase.from("products").select("id, code, name, unit").in("id", movementProductIds)
      : { data: [] };
  const productById = new Map((movementProducts ?? []).map((p) => [p.id, p]));

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <Link href={`/ca-ban/${shiftId}`} className="text-sm text-primary underline">
        ← Chi tiết ca
      </Link>
      <h1 className="font-heading text-2xl font-extrabold text-foreground">Hàng hóa trong ca</h1>

      {shift.status === "open" && canWrite && (
        <StockMovementForm
          shiftId={shiftId}
          products={(products ?? []).map((p) => ({ id: p.id, code: p.code, name: p.name, unit: p.unit }))}
        />
      )}

      {shift.status !== "open" && (
        <p className="text-sm text-muted">Ca không còn mở, chỉ xem được lịch sử bên dưới.</p>
      )}

      <div className="rounded-md border border-border bg-surface p-4">
        <h2 className="font-heading text-lg font-bold text-foreground">Lịch sử</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {(movements ?? []).map((m) => {
            const p = productById.get(m.product_id);
            return (
              <li key={m.id} className="border-t border-border pt-2 text-sm first:border-t-0 first:pt-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{TYPE_LABEL[m.movement_type] ?? m.movement_type}</span>
                  <span className="font-mono text-xs text-muted">{formatDateTimeVn(m.created_at)}</span>
                </div>
                <p className="text-foreground">
                  {p ? `${p.code} — ${p.name}` : "Sản phẩm"}: {m.quantity} {p?.unit}
                </p>
                {m.reason && <p className="text-muted">Lý do: {m.reason}</p>}
              </li>
            );
          })}
          {(movements ?? []).length === 0 && <li className="text-sm text-muted">Chưa có phát sinh nào.</li>}
        </ul>
      </div>
    </div>
  );
}
