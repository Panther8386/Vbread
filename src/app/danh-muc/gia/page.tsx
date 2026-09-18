import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { formatVnd } from "@/lib/currency";
import { addPrice } from "./actions";

export default async function GiaPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, code, name, unit")
    .eq("status", "active")
    .order("code");

  const { data: currentPrices } = await supabase
    .from("current_prices")
    .select("product_id, price, effective_date");

  const priceByProduct = new Map(
    (currentPrices ?? []).map((p) => [p.product_id, p]),
  );

  const isOwner = user?.role === "owner";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-heading text-2xl font-extrabold text-foreground">Giá bán</h1>
      <p className="text-sm text-muted">
        1 giá chung cho toàn hệ thống. Thêm giá mới không xóa giá cũ — giữ lịch sử theo ngày hiệu lực.
      </p>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase text-muted">
              <th className="px-3 py-2">Mã</th>
              <th className="px-3 py-2">Sản phẩm</th>
              <th className="px-3 py-2">Giá hiện hành</th>
              <th className="px-3 py-2">Hiệu lực từ</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => {
              const current = priceByProduct.get(p.id);
              return (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-mono">{p.code}</td>
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2 font-mono">
                    {current ? formatVnd(current.price) : "chưa có giá"}
                  </td>
                  <td className="px-3 py-2 text-muted">{current?.effective_date ?? "—"}</td>
                </tr>
              );
            })}
            {(products ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-muted">
                  Chưa có sản phẩm nào — thêm sản phẩm trước ở trang Sản phẩm.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isOwner && (products ?? []).length > 0 && (
        <form action={addPrice} className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
          <h2 className="font-heading text-lg font-bold text-foreground">Thêm giá mới</h2>
          <select
            name="product_id"
            required
            className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
          >
            {(products ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
          <input
            name="price"
            type="number"
            min="0"
            step="1000"
            required
            placeholder="Giá (đồng)"
            className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
          />
          <input
            name="effective_date"
            type="date"
            required
            defaultValue={today}
            className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="h-11 rounded-lg bg-primary font-heading font-bold text-primary-foreground"
          >
            Thêm giá
          </button>
        </form>
      )}
    </div>
  );
}
