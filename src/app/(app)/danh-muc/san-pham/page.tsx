import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { createProduct, toggleProductStatus, updateProduct } from "./actions";

const GROUP_LABEL: Record<string, string> = {
  mon_ban: "Món bán",
  banh_nen: "Bánh nền",
  bao_bi: "Bao bì",
};

export default async function SanPhamPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, code, name, unit, product_group, status")
    .order("created_at", { ascending: false });

  const isOwner = user?.role === "owner";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-heading text-2xl font-extrabold text-foreground">Sản phẩm</h1>

      <ul className="flex flex-col gap-3">
        {(products ?? []).map((p) => (
          <li
            key={p.id}
            className={`rounded-md border border-border bg-surface p-4 ${p.status === "inactive" ? "opacity-50" : ""}`}
          >
            {isOwner ? (
              <form action={updateProduct} className="flex flex-col gap-2">
                <input type="hidden" name="id" value={p.id} />
                <div className="flex gap-2">
                  <input
                    name="code"
                    defaultValue={p.code}
                    required
                    className="h-10 w-28 rounded-md border border-border bg-background px-3 font-mono text-sm text-foreground outline-none focus:border-primary"
                  />
                  <input
                    name="name"
                    defaultValue={p.name}
                    required
                    className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    name="unit"
                    defaultValue={p.unit}
                    required
                    placeholder="Đơn vị"
                    className="h-10 w-24 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                  />
                  <select
                    name="product_group"
                    defaultValue={p.product_group}
                    className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                  >
                    <option value="mon_ban">Món bán</option>
                    <option value="banh_nen">Bánh nền</option>
                    <option value="bao_bi">Bao bì</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <button type="submit" className="text-sm text-primary underline">
                    Lưu
                  </button>
                  <span className="font-mono text-xs text-muted">
                    {p.status === "active" ? "đang bán" : "đã tắt"}
                  </span>
                </div>
              </form>
            ) : (
              <div>
                <p className="font-mono text-sm text-primary">{p.code}</p>
                <p className="font-medium text-foreground">{p.name}</p>
                <p className="text-sm text-muted">
                  {p.unit} · {GROUP_LABEL[p.product_group] ?? p.product_group}
                </p>
              </div>
            )}

            {isOwner && (
              <form action={toggleProductStatus} className="mt-2 border-t border-border pt-2">
                <input type="hidden" name="id" value={p.id} />
                <input
                  type="hidden"
                  name="nextStatus"
                  value={p.status === "active" ? "inactive" : "active"}
                />
                <button type="submit" className="text-sm text-destructive underline">
                  {p.status === "active" ? "Vô hiệu hóa" : "Kích hoạt lại"}
                </button>
              </form>
            )}
          </li>
        ))}
        {(products ?? []).length === 0 && (
          <p className="text-sm text-muted">Chưa có sản phẩm nào.</p>
        )}
      </ul>

      {isOwner && (
        <form action={createProduct} className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
          <h2 className="font-heading text-lg font-bold text-foreground">Thêm sản phẩm</h2>
          <input
            name="code"
            required
            placeholder="Mã (ví dụ BM01)"
            className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
          />
          <input
            name="name"
            required
            placeholder="Tên sản phẩm"
            className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
          />
          <input
            name="unit"
            required
            placeholder="Đơn vị (ổ, gói, hộp...)"
            className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
          />
          <select
            name="product_group"
            required
            defaultValue="mon_ban"
            className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
          >
            <option value="mon_ban">Món bán</option>
            <option value="banh_nen">Bánh nền</option>
            <option value="bao_bi">Bao bì</option>
          </select>
          <button
            type="submit"
            className="h-11 rounded-lg bg-primary font-heading font-bold text-primary-foreground"
          >
            Thêm
          </button>
        </form>
      )}
    </div>
  );
}
