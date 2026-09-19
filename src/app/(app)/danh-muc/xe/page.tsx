import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { createCart } from "./actions";
import { OwnerCartRow, PartnerCartNote } from "./cart-row";

export default async function XePage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const isOwner = user?.role === "owner";

  const { data: carts } = await supabase
    .from("carts")
    .select("id, code, name, note, status, partner_id")
    .order("created_at", { ascending: false });

  const { data: partners } = isOwner
    ? await supabase.from("profiles").select("id, full_name, phone").eq("role", "partner")
    : { data: null };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-heading text-2xl font-extrabold text-foreground">Xe</h1>

      <ul className="flex flex-col gap-3">
        {(carts ?? []).map((cart) => {
          const canEditNote = !isOwner && cart.partner_id === user?.id;

          if (isOwner) {
            return <OwnerCartRow key={cart.id} cart={cart} partners={partners ?? []} />;
          }

          return (
            <li
              key={cart.id}
              className={`rounded-md border border-border bg-surface p-4 ${cart.status === "inactive" ? "opacity-50" : ""}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-sm text-primary">{cart.code}</p>
                  <p className="font-medium text-foreground">{cart.name}</p>
                </div>
                <span className="font-mono text-xs text-muted">
                  {cart.status === "active" ? "đang hoạt động" : "đã vô hiệu hóa"}
                </span>
              </div>

              {canEditNote && <PartnerCartNote cart={cart} />}
            </li>
          );
        })}
        {(carts ?? []).length === 0 && <p className="text-sm text-muted">Chưa có xe nào.</p>}
      </ul>

      {isOwner && (
        <form action={createCart} className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
          <h2 className="font-heading text-lg font-bold text-foreground">Thêm xe</h2>
          <input
            name="code"
            required
            placeholder="Mã xe (ví dụ VB-01)"
            className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
          />
          <input
            name="name"
            required
            placeholder="Tên xe"
            className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
          />
          <select
            name="partner_id"
            defaultValue=""
            className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
          >
            <option value="">Chưa gán đối tác</option>
            {(partners ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} ({p.phone})
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-11 rounded-lg bg-primary font-heading font-bold text-primary-foreground"
          >
            Thêm xe
          </button>
        </form>
      )}
    </div>
  );
}
