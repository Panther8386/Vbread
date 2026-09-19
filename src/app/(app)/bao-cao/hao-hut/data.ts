import "server-only";
import { createClient } from "@/lib/supabase/server";
import { calcEndingStock, calcVariance } from "@/lib/inventory";

export type HaoHutFilters = { from: string; to: string; cartId?: string; locationId?: string };

export async function getHaoHutReport(filters: HaoHutFilters) {
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

  const { data: movements } =
    shiftIds.length > 0
      ? await supabase
          .from("stock_movements")
          .select("shift_id, product_id, movement_type, quantity")
          .in("shift_id", shiftIds)
      : { data: [] };

  // Hao hut theo san pham (huy + hao_hut), gop toan bo ca trong pham vi loc.
  const wasteByProduct = new Map<string, { huy: number; hao_hut: number }>();
  for (const m of movements ?? []) {
    if (m.movement_type !== "huy" && m.movement_type !== "hao_hut") continue;
    const acc = wasteByProduct.get(m.product_id) ?? { huy: 0, hao_hut: 0 };
    if (m.movement_type === "huy") acc.huy += m.quantity;
    else acc.hao_hut += m.quantity;
    wasteByProduct.set(m.product_id, acc);
  }
  const wasteProductIds = [...wasteByProduct.keys()];
  const { data: wasteProducts } =
    wasteProductIds.length > 0
      ? await supabase.from("products").select("id, code, name, unit").in("id", wasteProductIds)
      : { data: [] };
  const { data: currentPrices } =
    wasteProductIds.length > 0
      ? await supabase.from("current_prices").select("product_id, price").in("product_id", wasteProductIds)
      : { data: [] };
  const priceByProduct = new Map((currentPrices ?? []).map((p) => [p.product_id, p.price]));
  const wasteProductById = new Map((wasteProducts ?? []).map((p) => [p.id, p]));

  const wasteRows = [...wasteByProduct.entries()]
    .map(([productId, agg]) => {
      const total = agg.huy + agg.hao_hut;
      const price = priceByProduct.get(productId) ?? 0;
      return { product: wasteProductById.get(productId), ...agg, total, estimatedValue: total * price };
    })
    .sort((a, b) => b.estimatedValue - a.estimatedValue);
  const totalWasteValue = wasteRows.reduce((sum, r) => sum + r.estimatedValue, 0);

  // Chenh lech hang theo ca: chi cac ca da co dong kiem_ke.
  const flowByKey = new Map<string, { received: number; sold: number; returned: number; wasted: number }>();
  const countedByKey = new Map<string, number>();
  for (const m of movements ?? []) {
    const key = `${m.shift_id}|${m.product_id}`;
    if (m.movement_type === "kiem_ke") {
      countedByKey.set(key, m.quantity);
      continue;
    }
    const flow = flowByKey.get(key) ?? { received: 0, sold: 0, returned: 0, wasted: 0 };
    if (m.movement_type === "nhan") flow.received += m.quantity;
    else if (m.movement_type === "ban") flow.sold += m.quantity;
    else if (m.movement_type === "tra") flow.returned += m.quantity;
    else if (m.movement_type === "huy" || m.movement_type === "hao_hut") flow.wasted += m.quantity;
    flowByKey.set(key, flow);
  }

  const varianceRows: {
    shiftId: string;
    businessDate: string;
    cartId: string;
    productId: string;
    endingStock: number;
    counted: number;
    variance: number;
  }[] = [];
  for (const [key, counted] of countedByKey.entries()) {
    const [shiftId, productId] = key.split("|");
    const shift = (shifts ?? []).find((s) => s.id === shiftId);
    if (!shift) continue;
    const endingStock = calcEndingStock(flowByKey.get(key) ?? { received: 0, sold: 0, returned: 0, wasted: 0 });
    const variance = calcVariance(counted, endingStock);
    if (variance !== 0) {
      varianceRows.push({
        shiftId,
        businessDate: shift.business_date,
        cartId: shift.cart_id,
        productId,
        endingStock,
        counted,
        variance,
      });
    }
  }
  varianceRows.sort((a, b) => b.businessDate.localeCompare(a.businessDate));

  const varianceCartIds = [...new Set(varianceRows.map((r) => r.cartId))];
  const varianceProductIds = [...new Set(varianceRows.map((r) => r.productId))];
  const { data: varianceCarts } =
    varianceCartIds.length > 0
      ? await supabase.from("carts").select("id, code, name").in("id", varianceCartIds)
      : { data: [] };
  const { data: varianceProducts } =
    varianceProductIds.length > 0
      ? await supabase.from("products").select("id, code, name, unit").in("id", varianceProductIds)
      : { data: [] };
  const varianceCartById = new Map((varianceCarts ?? []).map((c) => [c.id, c]));
  const varianceProductById = new Map((varianceProducts ?? []).map((p) => [p.id, p]));

  const varianceRowsWithNames = varianceRows.map((r) => ({
    ...r,
    cart: varianceCartById.get(r.cartId),
    product: varianceProductById.get(r.productId),
  }));

  return { wasteRows, totalWasteValue, varianceRows: varianceRowsWithNames };
}
