import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { formatDateTimeVn } from "@/lib/date";
import { diffAuditValues } from "@/lib/audit";

const TABLE_LABEL: Record<string, string> = {
  profiles: "Tài khoản",
  carts: "Xe",
  locations: "Điểm bán",
  products: "Sản phẩm",
  prices: "Giá bán",
  manager_scopes: "Phân quyền quản lý",
};

function formatValue(value: unknown): string {
  if (value === undefined) return "—";
  if (value === null) return "(trống)";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default async function NhatKyPage() {
  const user = await getCurrentUser();
  if (user?.role !== "owner") {
    return (
      <div className="mx-auto max-w-sm text-sm text-muted">
        Chỉ chủ đầu tư xem được nhật ký thay đổi.
      </div>
    );
  }

  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id, table_name, record_id, changed_by, changed_at, old_value, new_value, reason")
    .order("changed_at", { ascending: false })
    .limit(200);

  const changerIds = [...new Set((logs ?? []).map((l) => l.changed_by).filter(Boolean))] as string[];
  const { data: profiles } =
    changerIds.length > 0
      ? await supabase.from("profiles").select("id, full_name, phone").in("id", changerIds)
      : { data: [] };
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name || p.phone]));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <h1 className="font-heading text-2xl font-extrabold text-foreground">Nhật ký thay đổi</h1>
      <p className="text-sm text-muted">200 thay đổi gần nhất trên toàn hệ thống.</p>

      <ul className="flex flex-col gap-3">
        {(logs ?? []).map((log) => {
          const changes = diffAuditValues(
            log.old_value as Record<string, unknown> | null,
            log.new_value as Record<string, unknown> | null,
          );
          const action = !log.old_value ? "Thêm mới" : !log.new_value ? "Xóa" : "Sửa";

          return (
            <li key={log.id} className="rounded-md border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium text-foreground">
                  {TABLE_LABEL[log.table_name] ?? log.table_name} · {action}
                </span>
                <span className="font-mono text-xs text-muted">{formatDateTimeVn(log.changed_at)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">
                Người sửa: {log.changed_by ? nameById.get(log.changed_by) ?? "?" : "Hệ thống"}
              </p>

              {changes.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1 border-t border-border pt-2 text-sm">
                  {changes.map((c) => (
                    <li key={c.field} className="font-mono text-xs text-foreground">
                      {c.field}: <span className="text-muted">{formatValue(c.from)}</span>
                      {" → "}
                      <span className="text-foreground">{formatValue(c.to)}</span>
                    </li>
                  ))}
                </ul>
              )}

              {log.reason && (
                <p className="mt-2 text-sm text-foreground">Lý do: {log.reason}</p>
              )}
            </li>
          );
        })}
        {(logs ?? []).length === 0 && (
          <p className="text-sm text-muted">Chưa có thay đổi nào được ghi nhận.</p>
        )}
      </ul>
    </div>
  );
}
