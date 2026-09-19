import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { createShiftTemplate, updateShiftTemplate } from "./actions";

export default async function CaMauPage() {
  const user = await getCurrentUser();
  const isOwner = user?.role === "owner";

  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("shift_templates")
    .select("id, name, start_time, end_time, status")
    .order("start_time");

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="font-heading text-2xl font-extrabold text-foreground">Cấu hình ca</h1>
      <p className="text-sm text-muted">
        Số ca/ngày và khung giờ áp dụng chung cho toàn hệ thống — chủ đầu tư tự thêm/sửa tại đây.
      </p>

      <ul className="flex flex-col gap-3">
        {(templates ?? []).map((t) => (
          <li
            key={t.id}
            className={`rounded-md border border-border bg-surface p-4 ${t.status === "inactive" ? "opacity-50" : ""}`}
          >
            {isOwner ? (
              <form action={updateShiftTemplate} className="flex flex-col gap-2">
                <input type="hidden" name="id" value={t.id} />
                <input
                  name="name"
                  defaultValue={t.name}
                  required
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                />
                <div className="flex gap-2">
                  <input
                    name="start_time"
                    type="time"
                    defaultValue={t.start_time.slice(0, 5)}
                    required
                    className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                  />
                  <span className="self-center text-sm text-muted">đến</span>
                  <input
                    name="end_time"
                    type="time"
                    defaultValue={t.end_time.slice(0, 5)}
                    required
                    className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <select
                    name="status"
                    defaultValue={t.status}
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                  >
                    <option value="active">Đang dùng</option>
                    <option value="inactive">Ngừng dùng</option>
                  </select>
                  <button type="submit" className="text-sm text-primary underline">
                    Lưu
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{t.name}</span>
                <span className="font-mono text-sm text-muted">
                  {t.start_time.slice(0, 5)} – {t.end_time.slice(0, 5)}
                </span>
              </div>
            )}
          </li>
        ))}
        {(templates ?? []).length === 0 && <p className="text-sm text-muted">Chưa có ca nào.</p>}
      </ul>

      {isOwner && (
        <form action={createShiftTemplate} className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
          <h2 className="font-heading text-lg font-bold text-foreground">Thêm ca mới</h2>
          <input
            name="name"
            required
            placeholder="Tên ca (ví dụ: Ca sáng)"
            className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
          />
          <div className="flex items-center gap-2">
            <input
              name="start_time"
              type="time"
              required
              className="h-11 flex-1 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
            />
            <span className="text-sm text-muted">đến</span>
            <input
              name="end_time"
              type="time"
              required
              className="h-11 flex-1 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            className="h-11 rounded-lg bg-primary font-heading font-bold text-primary-foreground"
          >
            Thêm ca
          </button>
        </form>
      )}
    </div>
  );
}
