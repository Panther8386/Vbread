import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { createLocation, toggleLocationStatus } from "./actions";

export default async function DiemBanPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, address, status")
    .order("created_at", { ascending: false });

  const isOwner = user?.role === "owner";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-heading text-2xl font-extrabold text-foreground">Điểm bán</h1>

      <ul className="flex flex-col gap-2">
        {(locations ?? []).map((loc) => (
          <li
            key={loc.id}
            className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 py-3"
          >
            <div>
              <p className="font-medium text-foreground">{loc.name}</p>
              {loc.address && <p className="text-sm text-muted">{loc.address}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted">
                {loc.status === "active" ? "đang mở" : "đã tắt"}
              </span>
              {isOwner && (
                <form action={toggleLocationStatus}>
                  <input type="hidden" name="id" value={loc.id} />
                  <input
                    type="hidden"
                    name="nextStatus"
                    value={loc.status === "active" ? "inactive" : "active"}
                  />
                  <button type="submit" className="text-sm text-primary underline">
                    {loc.status === "active" ? "Tắt" : "Bật"}
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
        {(locations ?? []).length === 0 && (
          <p className="text-sm text-muted">Chưa có điểm bán nào.</p>
        )}
      </ul>

      {isOwner && (
        <form action={createLocation} className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
          <h2 className="font-heading text-lg font-bold text-foreground">Thêm điểm bán</h2>
          <input
            name="name"
            required
            placeholder="Tên điểm bán"
            className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
          />
          <input
            name="address"
            placeholder="Địa chỉ (tùy chọn)"
            className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
          />
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
