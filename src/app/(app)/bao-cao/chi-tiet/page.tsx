import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { businessDateVn } from "@/lib/date";
import { formatVnd } from "@/lib/currency";

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Đã lên lịch",
  open: "Đang mở ca",
  pending_review: "Chờ duyệt",
  approved: "Đã duyệt",
};

export default async function BaoCaoChiTietPage({
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

  const { data: sales } =
    shiftIds.length > 0
      ? await supabase.from("sales").select("id, shift_id, total_amount").in("shift_id", shiftIds).eq("status", "completed")
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

  // Du lieu cho form loc.
  const { data: filterCarts } = await supabase.from("carts").select("id, code, name").order("code");
  const { data: filterLocations } = await supabase.from("locations").select("id, name").order("name");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link href="/bao-cao" className="text-sm text-primary underline">
        ← Tổng quan
      </Link>
      <h1 className="font-heading text-2xl font-extrabold text-foreground">Báo cáo chi tiết</h1>

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
          <Link href="/bao-cao/chi-tiet" className="text-sm text-primary underline">
            Bỏ lọc
          </Link>
        )}
      </form>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-xs uppercase text-muted">Tổng doanh thu</p>
          <p className="mt-1 font-mono text-xl font-bold text-primary">{formatVnd(totalRevenue)}</p>
        </div>
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-xs uppercase text-muted">Tổng số đơn</p>
          <p className="mt-1 font-mono text-xl font-bold text-foreground">{totalOrders}</p>
        </div>
      </div>

      <div className="rounded-md border border-border bg-surface p-4">
        <h2 className="font-heading text-lg font-bold text-foreground">Theo ca</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted">
                <th className="py-1.5 pr-2">Ngày</th>
                <th className="py-1.5 pr-2">Xe</th>
                <th className="py-1.5 pr-2">Điểm bán</th>
                <th className="py-1.5 pr-2">Trạng thái</th>
                <th className="py-1.5 pr-2 text-right">Số đơn</th>
                <th className="py-1.5 text-right">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {(shifts ?? []).map((s) => {
                const cart = cartById.get(s.cart_id);
                const location = locationById.get(s.location_id);
                const agg = revenueByShift.get(s.id) ?? { revenue: 0, count: 0 };
                return (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="py-1.5 pr-2 font-mono text-xs text-muted">{s.business_date}</td>
                    <td className="py-1.5 pr-2">
                      <Link href={`/ca-ban/${s.id}`} className="text-primary underline">
                        {cart ? `${cart.code} — ${cart.name}` : "Xe"}
                      </Link>
                    </td>
                    <td className="py-1.5 pr-2 text-muted">{location?.name ?? ""}</td>
                    <td className="py-1.5 pr-2 text-xs text-muted">{STATUS_LABEL[s.status] ?? s.status}</td>
                    <td className="py-1.5 pr-2 text-right font-mono">{agg.count}</td>
                    <td className="py-1.5 text-right font-mono">{formatVnd(agg.revenue)}</td>
                  </tr>
                );
              })}
              {(shifts ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="py-3 text-center text-sm text-muted">
                    Không có ca nào trong khoảng đã chọn.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-md border border-border bg-surface p-4">
        <h2 className="font-heading text-lg font-bold text-foreground">Sản lượng theo món (bán chạy nhất trước)</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted">
                <th className="py-1.5 pr-2">Sản phẩm</th>
                <th className="py-1.5 pr-2 text-right">Số lượng</th>
                <th className="py-1.5 text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {productRows.map((r) => (
                <tr key={r.product?.id} className="border-b border-border last:border-0">
                  <td className="py-1.5 pr-2">
                    {r.product ? `${r.product.code} — ${r.product.name}` : "Sản phẩm"}
                  </td>
                  <td className="py-1.5 pr-2 text-right font-mono">
                    {r.quantity} {r.product?.unit}
                  </td>
                  <td className="py-1.5 text-right font-mono">{formatVnd(r.amount)}</td>
                </tr>
              ))}
              {productRows.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-3 text-center text-sm text-muted">
                    Không có dữ liệu bán hàng trong khoảng đã chọn.
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
