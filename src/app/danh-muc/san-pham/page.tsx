import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { createProduct, toggleProductStatus } from "./actions";

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

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase text-muted">
              <th className="px-3 py-2">Mã</th>
              <th className="px-3 py-2">Tên</th>
              <th className="px-3 py-2">Đơn vị</th>
              <th className="px-3 py-2">Nhóm</th>
              <th className="px-3 py-2">Trạng thái</th>
              {isOwner && <th className="px-3 py-2" />}
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2 font-mono">{p.code}</td>
                <td className="px-3 py-2">{p.name}</td>
                <td className="px-3 py-2">{p.unit}</td>
                <td className="px-3 py-2">{GROUP_LABEL[p.product_group] ?? p.product_group}</td>
                <td className="px-3 py-2">{p.status === "active" ? "đang bán" : "đã tắt"}</td>
                {isOwner && (
                  <td className="px-3 py-2">
                    <form action={toggleProductStatus}>
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        type="hidden"
                        name="nextStatus"
                        value={p.status === "active" ? "inactive" : "active"}
                      />
                      <button type="submit" className="text-primary underline">
                        {p.status === "active" ? "Tắt" : "Bật"}
                      </button>
                    </form>
                  </td>
                )}
              </tr>
            ))}
            {(products ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-muted">
                  Chưa có sản phẩm nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
