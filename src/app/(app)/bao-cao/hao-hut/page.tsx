import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { businessDateVn } from "@/lib/date";
import { formatVnd } from "@/lib/currency";
import { calcEndingStock, calcVariance } from "@/lib/inventory";

export default async function BaoCaoHaoHutPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; cart_id?: string; location_id?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "staff") {
    return (
      <div className="mx-auto max-w-sm text-sm text-muted">
        Trang báo cáo dành cho chủ đầu tư, đối tác và quản lý.
      </div>
    );
  }

  const today = businessDateVn();
  const { from: fromParam, to: toParam, cart_id: cartFilter, location_id: locationFilter } = await searchParams;
  const from = fromParam || today;
  const to = toParam || today;

  const supabase = await createClient();

  let query = supabase
    .from("shifts")
    .select("id, business_date, status, cart_id, location_id")
    .gte("business_date", from)
    .lte("business_date", to)
    .neq("status", "cancelled")
    .order("business_date", { ascending: false });
  if (cartFilter) query = query.eq("cart_id", cartFilter);
  if (locationFilter) query = query.eq("location_id", locationFilter);

  const { data: shifts } = await query;
  const shiftIds = (shifts ?? []).map((s) => s.id);

  const { data: movements } =
    shiftIds.length > 0
      ? await supabase.from("stock_movements").select("shift_id, product_id, movement_type, quantity").in("shift_id", shiftIds)
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

  // Chenh lech hang theo ca: chi cac ca da dong (co dong kiem_ke).
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

  const varianceRows: { shiftId: string; businessDate: string; cartId: string; productId: string; endingStock: number; counted: number; variance: number }[] = [];
  for (const [key, counted] of countedByKey.entries()) {
    const [shiftId, productId] = key.split("|");
    const shift = (shifts ?? []).find((s) => s.id === shiftId);
    if (!shift) continue;
    const endingStock = calcEndingStock(flowByKey.get(key) ?? { received: 0, sold: 0, returned: 0, wasted: 0 });
    const variance = calcVariance(counted, endingStock);
    if (variance !== 0) {
      varianceRows.push({ shiftId, businessDate: shift.business_date, cartId: shift.cart_id, productId, endingStock, counted, variance });
    }
  }
  varianceRows.sort((a, b) => b.businessDate.localeCompare(a.businessDate));

  const varianceCartIds = [...new Set(varianceRows.map((r) => r.cartId))];
  const varianceProductIds = [...new Set(varianceRows.map((r) => r.productId))];
  const { data: varianceCarts } =
    varianceCartIds.length > 0 ? await supabase.from("carts").select("id, code, name").in("id", varianceCartIds) : { data: [] };
  const { data: varianceProducts } =
    varianceProductIds.length > 0
      ? await supabase.from("products").select("id, code, name, unit").in("id", varianceProductIds)
      : { data: [] };
  const varianceCartById = new Map((varianceCarts ?? []).map((c) => [c.id, c]));
  const varianceProductById = new Map((varianceProducts ?? []).map((p) => [p.id, p]));

  const { data: filterCarts } = await supabase.from("carts").select("id, code, name").order("code");
  const { data: filterLocations } = await supabase.from("locations").select("id, name").order("name");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link href="/bao-cao" className="text-sm text-primary underline">
        ← Tổng quan
      </Link>
      <h1 className="font-heading text-2xl font-extrabold text-foreground">Hao hụt &amp; chênh lệch hàng</h1>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-md border border-border bg-surface p-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="from" className="text-xs text-muted">
            Từ ngày
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={from}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="to" className="text-xs text-muted">
            Đến ngày
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={to}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cart_id" className="text-xs text-muted">
            Xe
          </label>
          <select
            id="cart_id"
            name="cart_id"
            defaultValue={cartFilter ?? ""}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">Tất cả</option>
            {(filterCarts ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="location_id" className="text-xs text-muted">
            Điểm bán
          </label>
          <select
            id="location_id"
            name="location_id"
            defaultValue={locationFilter ?? ""}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">Tất cả</option>
            {(filterLocations ?? []).map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="h-10 rounded-lg bg-primary px-4 font-heading font-bold text-primary-foreground">
          Lọc
        </button>
        {(cartFilter || locationFilter || fromParam || toParam) && (
          <Link href="/bao-cao/hao-hut" className="text-sm text-primary underline">
            Bỏ lọc
          </Link>
        )}
      </form>

      <div className="rounded-md border border-border bg-surface p-4">
        <p className="text-xs uppercase text-muted">Giá trị hao hụt ước tính</p>
        <p className="mt-1 font-mono text-xl font-bold text-primary">{formatVnd(totalWasteValue)}</p>
        <p className="mt-1 text-xs text-muted">Tính theo giá bán hiện hành — chỉ mang tính ước tính.</p>
      </div>

      <div className="rounded-md border border-border bg-surface p-4">
        <h2 className="font-heading text-lg font-bold text-foreground">Hao hụt theo sản phẩm</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted">
                <th className="py-1.5 pr-2">Sản phẩm</th>
                <th className="py-1.5 pr-2 text-right">Hủy</th>
                <th className="py-1.5 pr-2 text-right">Hao hụt</th>
                <th className="py-1.5 pr-2 text-right">Tổng</th>
                <th className="py-1.5 text-right">Giá trị ước tính</th>
              </tr>
            </thead>
            <tbody>
              {wasteRows.map((r) => (
                <tr key={r.product?.id} className="border-b border-border last:border-0">
                  <td className="py-1.5 pr-2">{r.product ? `${r.product.code} — ${r.product.name}` : "Sản phẩm"}</td>
                  <td className="py-1.5 pr-2 text-right font-mono">{r.huy}</td>
                  <td className="py-1.5 pr-2 text-right font-mono">{r.hao_hut}</td>
                  <td className="py-1.5 pr-2 text-right font-mono">
                    {r.total} {r.product?.unit}
                  </td>
                  <td className="py-1.5 text-right font-mono">{formatVnd(r.estimatedValue)}</td>
                </tr>
              ))}
              {wasteRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-3 text-center text-sm text-muted">
                    Không có hao hụt nào trong khoảng đã chọn.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-md border border-border bg-surface p-4">
        <h2 className="font-heading text-lg font-bold text-foreground">Chênh lệch hàng theo ca (đã kiểm kê)</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted">
                <th className="py-1.5 pr-2">Ngày</th>
                <th className="py-1.5 pr-2">Xe</th>
                <th className="py-1.5 pr-2">Sản phẩm</th>
                <th className="py-1.5 pr-2 text-right">Sổ sách</th>
                <th className="py-1.5 pr-2 text-right">Kiểm kê</th>
                <th className="py-1.5 text-right">Chênh lệch</th>
              </tr>
            </thead>
            <tbody>
              {varianceRows.map((r) => {
                const cart = varianceCartById.get(r.cartId);
                const product = varianceProductById.get(r.productId);
                return (
                  <tr key={`${r.shiftId}|${r.productId}`} className="border-b border-border last:border-0">
                    <td className="py-1.5 pr-2 font-mono text-xs text-muted">{r.businessDate}</td>
                    <td className="py-1.5 pr-2">
                      <Link href={`/ca-ban/${r.shiftId}`} className="text-primary underline">
                        {cart ? `${cart.code} — ${cart.name}` : "Xe"}
                      </Link>
                    </td>
                    <td className="py-1.5 pr-2">{product ? `${product.code} — ${product.name}` : "Sản phẩm"}</td>
                    <td className="py-1.5 pr-2 text-right font-mono">{r.endingStock}</td>
                    <td className="py-1.5 pr-2 text-right font-mono">{r.counted}</td>
                    <td className="py-1.5 text-right font-mono text-destructive">
                      {r.variance > 0 ? "+" : ""}
                      {r.variance}
                    </td>
                  </tr>
                );
              })}
              {varianceRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-3 text-center text-sm text-muted">
                    Không có chênh lệch hàng nào trong khoảng đã chọn.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
