import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { formatVnd } from "@/lib/currency";
import { addPrice, deletePrice, updatePrice } from "./actions";

export default async function GiaPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, code, name, unit")
    .eq("status", "active")
    .order("code");

  const { data: allPrices } = await supabase
    .from("prices")
    .select("id, product_id, price, effective_date")
    .order("effective_date", { ascending: false })
    .order("created_at", { ascending: false });

  // Moi san pham lay dong gia moi nhat (dong dau tien sau khi sap xep o tren).
  const latestPriceByProduct = new Map<string, { id: string; price: number; effective_date: string }>();
  for (const row of allPrices ?? []) {
    if (!latestPriceByProduct.has(row.product_id)) {
      latestPriceByProduct.set(row.product_id, row);
    }
  }

  const isOwner = user?.role === "owner";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-heading text-2xl font-extrabold text-foreground">Giá bán</h1>
      <p className="text-sm text-muted">
        1 giá chung cho toàn hệ thống. Mọi thay đổi (thêm/sửa/xóa) đều được ghi lại trong nhật ký.
      </p>

      <ul className="flex flex-col gap-3">
        {(products ?? []).map((p) => {
          const current = latestPriceByProduct.get(p.id);
          return (
            <li key={p.id} className="rounded-md border border-border bg-surface p-4">
              <p className="font-mono text-sm text-primary">{p.code}</p>
              <p className="font-medium text-foreground">{p.name}</p>

              {current ? (
                isOwner ? (
                  <form action={updatePrice} className="mt-2 flex flex-col gap-2 border-t border-border pt-2">
                    <input type="hidden" name="id" value={current.id} />
                    <div className="flex gap-2">
                      <input
                        name="price"
                        type="number"
                        min="0"
                        step="1000"
                        defaultValue={current.price}
                        required
                        className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                      />
                      <input
                        name="effective_date"
                        type="date"
                        defaultValue={current.effective_date}
                        required
                        className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="submit" className="text-sm text-primary underline">
                        Lưu
                      </button>
                      <span className="text-xs text-muted">Hiện: {formatVnd(current.price)}</span>
                    </div>
                  </form>
                ) : (
                  <p className="mt-1 font-mono text-sm text-foreground">{formatVnd(current.price)}</p>
                )
              ) : (
                <p className="mt-1 text-sm text-muted">Chưa có giá</p>
              )}

              {isOwner && current && (
                <form action={deletePrice} className="mt-2">
                  <input type="hidden" name="id" value={current.id} />
                  <button type="submit" className="text-sm text-destructive underline">
                    Xóa dòng giá này
                  </button>
                </form>
              )}
            </li>
          );
        })}
        {(products ?? []).length === 0 && (
          <p className="text-sm text-muted">Chưa có sản phẩm nào — thêm sản phẩm trước ở trang Sản phẩm.</p>
        )}
      </ul>

      {isOwner && (products ?? []).length > 0 && (
        <form action={addPrice} className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
          <h2 className="font-heading text-lg font-bold text-foreground">Thêm giá mới (giữ lịch sử)</h2>
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
