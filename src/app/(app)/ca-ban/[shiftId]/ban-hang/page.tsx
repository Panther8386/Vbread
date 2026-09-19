import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { PosCart } from "./pos-cart";

export default async function BanHangPage({
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

  const canSell =
    user?.role === "owner" ||
    (user?.role === "partner" && cart?.partner_id === user.id) ||
    (user?.role === "staff" && !!staffRow);

  if (shift.status !== "open" || !canSell) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <Link href={`/ca-ban/${shiftId}`} className="text-sm text-primary underline">
          ← Chi tiết ca
        </Link>
        <p className="text-sm text-muted">
          {shift.status !== "open"
            ? "Ca này chưa mở hoặc đã đóng, không bán được."
            : "Bạn không có quyền bán hàng cho ca này."}
        </p>
      </div>
    );
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, code, name, unit")
    .eq("status", "active")
    .order("code");

  const productIds = (products ?? []).map((p) => p.id);
  const { data: prices } =
    productIds.length > 0
      ? await supabase.from("current_prices").select("product_id, price").in("product_id", productIds)
      : { data: [] };
  const priceByProduct = new Map((prices ?? []).map((p) => [p.product_id, p.price]));

  const posProducts = (products ?? [])
    .filter((p) => priceByProduct.has(p.id))
    .map((p) => ({ id: p.id, code: p.code, name: p.name, unit: p.unit, price: priceByProduct.get(p.id)! }));

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <Link href={`/ca-ban/${shiftId}`} className="text-sm text-primary underline">
        ← Chi tiết ca
      </Link>
      <h1 className="font-heading text-2xl font-extrabold text-foreground">Bán hàng</h1>
      <PosCart shiftId={shiftId} products={posProducts} />
    </div>
  );
}
