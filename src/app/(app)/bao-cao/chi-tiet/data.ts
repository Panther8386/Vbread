import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ChiTietFilters = { from: string; to: string; cartId?: string; locationId?: string };

export async function getChiTietReport(filters: ChiTietFilters) {
  const supabase = await createClient();

  let query = supabase
    .from("shifts")
    .select("id, business_date, status, cart_id, location_id")
    .gte("business_date", filters.from)
    .lte("business_date", filters.to)
    .neq("status", "cancelled")
    .order("business_date", { ascending: false });
  if (filters.cartId) query = query.eq("cart_id", filters.cartId);
  if (filters.locationId) query = query.eq("location_id", filters.locationId);

  const { data: shifts } = await query;
  const shiftIds = (shifts ?? []).map((s) => s.id);

  const { data: sales } =
    shiftIds.length > 0
      ? await supabase
          .from("sales")
          .select("id, shift_id, total_amount")
          .in("shift_id", shiftIds)
          .eq("status", "completed")
      : { data: [] };

  const revenueByShift = new Map<string, { revenue: number; count: number }>();
  for (const s of sales ?? []) {
    const acc = revenueByShift.get(s.shift_id) ?? { revenue: 0, count: 0 };
    acc.revenue += s.total_amount;
    acc.count += 1;
    revenueByShift.set(s.shift_id, acc);
  }

  const cartIds = [...new Set((shifts ?? []).map((s) => s.cart_id))];
  const { data: shiftCarts } =
    cartIds.length > 0 ? await supabase.from("carts").select("id, code, name").in("id", cartIds) : { data: [] };
  const cartById = new Map((shiftCarts ?? []).map((c) => [c.id, c]));

  const locationIds = [...new Set((shifts ?? []).map((s) => s.location_id))];
  const { data: shiftLocations } =
    locationIds.length > 0
      ? await supabase.from("locations").select("id, name").in("id", locationIds)
      : { data: [] };
  const locationById = new Map((shiftLocations ?? []).map((l) => [l.id, l]));

  const totalRevenue = (sales ?? []).reduce((sum, s) => sum + s.total_amount, 0);
  const totalOrders = (sales ?? []).length;

  // San luong theo mon: gop tat ca dong hang cua cac don da hoan tat trong pham vi loc.
  const saleIds = (sales ?? []).map((s) => s.id);
  const { data: saleItems } =
    saleIds.length > 0
      ? await supabase.from("sale_items").select("sale_id, product_id, quantity, unit_price").in("sale_id", saleIds)
      : { data: [] };

  const byProduct = new Map<string, { quantity: number; amount: number }>();
  for (const i of saleItems ?? []) {
    const acc = byProduct.get(i.product_id) ?? { quantity: 0, amount: 0 };
    acc.quantity += i.quantity;
    acc.amount += i.quantity * i.unit_price;
    byProduct.set(i.product_id, acc);
  }
  const productIds = [...byProduct.keys()];
  const { data: products } =
    productIds.length > 0
      ? await supabase.from("products").select("id, code, name, unit").in("id", productIds)
      : { data: [] };
  const productById = new Map((products ?? []).map((p) => [p.id, p]));
  const productRows = [...byProduct.entries()]
    .map(([productId, agg]) => ({ product: productById.get(productId), ...agg }))
    .sort((a, b) => b.amount - a.amount);

  const shiftRows = (shifts ?? []).map((s) => ({
    shift: s,
    cart: cartById.get(s.cart_id),
    location: locationById.get(s.location_id),
    agg: revenueByShift.get(s.id) ?? { revenue: 0, count: 0 },
  }));

  return { shiftRows, productRows, totalRevenue, totalOrders };
}
