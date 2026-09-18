import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { createLocation, toggleLocationStatus, updateLocation } from "./actions";

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

      <ul className="flex flex-col gap-3">
        {(locations ?? []).map((loc) => (
          <li
            key={loc.id}
            className={`rounded-md border border-border bg-surface p-4 ${loc.status === "inactive" ? "opacity-50" : ""}`}
          >
            {isOwner ? (
              <form action={updateLocation} className="flex flex-col gap-2">
                <input type="hidden" name="id" value={loc.id} />
                <input
                  name="name"
                  defaultValue={loc.name}
                  required
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                />
                <input
                  name="address"
                  defaultValue={loc.address ?? ""}
                  placeholder="Địa chỉ"
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                />
                <div className="flex items-center gap-3">
                  <button type="submit" className="text-sm text-primary underline">
                    Lưu
                  </button>
                  <span className="font-mono text-xs text-muted">
                    {loc.status === "active" ? "đang mở" : "đã tắt"}
                  </span>
                </div>
              </form>
            ) : (
              <div>
                <p className="font-medium text-foreground">{loc.name}</p>
                {loc.address && <p className="text-sm text-muted">{loc.address}</p>}
              </div>
            )}

            {isOwner && (
              <form action={toggleLocationStatus} className="mt-2 border-t border-border pt-2">
                <input type="hidden" name="id" value={loc.id} />
                <input
                  type="hidden"
                  name="nextStatus"
                  value={loc.status === "active" ? "inactive" : "active"}
                />
                <button type="submit" className="text-sm text-destructive underline">
                  {loc.status === "active" ? "Vô hiệu hóa" : "Kích hoạt lại"}
                </button>
              </form>
            )}
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
