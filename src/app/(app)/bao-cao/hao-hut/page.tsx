import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { businessDateVn } from "@/lib/date";
import { formatVnd } from "@/lib/currency";
import { getHaoHutReport } from "./data";

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

  const { wasteRows, totalWasteValue, varianceRows } = await getHaoHutReport({
    from,
    to,
    cartId: cartFilter,
    locationId: locationFilter,
  });

  const supabase = await createClient();
  const { data: filterCarts } = await supabase.from("carts").select("id, code, name").order("code");
  const { data: filterLocations } = await supabase.from("locations").select("id, name").order("name");

  const exportQs = new URLSearchParams({ from, to, ...(cartFilter && { cart_id: cartFilter }), ...(locationFilter && { location_id: locationFilter }) }).toString();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link href="/bao-cao" className="text-sm text-primary underline">
        ← Tổng quan
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-extrabold text-foreground">Hao hụt &amp; chênh lệch hàng</h1>
        <a href={`/bao-cao/hao-hut/export?${exportQs}`} className="text-sm text-primary underline">
          Xuất Excel (CSV) →
        </a>
      </div>

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
              {varianceRows.map((r) => (
                <tr key={`${r.shiftId}|${r.productId}`} className="border-b border-border last:border-0">
                  <td className="py-1.5 pr-2 font-mono text-xs text-muted">{r.businessDate}</td>
                  <td className="py-1.5 pr-2">
                    <Link href={`/ca-ban/${r.shiftId}`} className="text-primary underline">
                      {r.cart ? `${r.cart.code} — ${r.cart.name}` : "Xe"}
                    </Link>
                  </td>
                  <td className="py-1.5 pr-2">{r.product ? `${r.product.code} — ${r.product.name}` : "Sản phẩm"}</td>
                  <td className="py-1.5 pr-2 text-right font-mono">{r.endingStock}</td>
                  <td className="py-1.5 pr-2 text-right font-mono">{r.counted}</td>
                  <td className="py-1.5 text-right font-mono text-destructive">
                    {r.variance > 0 ? "+" : ""}
                    {r.variance}
                  </td>
                </tr>
              ))}
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
