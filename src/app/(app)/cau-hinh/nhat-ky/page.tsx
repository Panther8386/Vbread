import Link from "next/link";
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
  shift_templates: "Cấu hình ca",
  shifts: "Ca bán",
  shift_staff: "Nhân viên trong ca",
};

const PAGE_SIZE_OPTIONS = [10, 15, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;

function formatValue(value: unknown): string {
  if (value === undefined) return "—";
  if (value === null) return "(trống)";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function buildHref(params: { page?: number; table?: string; who?: string; size?: number }) {
  const q = new URLSearchParams();
  if (params.table) q.set("table", params.table);
  if (params.who) q.set("who", params.who);
  if (params.size && params.size !== DEFAULT_PAGE_SIZE) q.set("size", String(params.size));
  if (params.page && params.page > 1) q.set("page", String(params.page));
  const qs = q.toString();
  return qs ? `/cau-hinh/nhat-ky?${qs}` : "/cau-hinh/nhat-ky";
}

/** Danh sách số trang để hiện (có "..." khi nhiều trang), luôn có trang đầu/cuối và quanh trang hiện tại. */
function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  const keep = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = [...keep].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("ellipsis");
    result.push(p);
    prev = p;
  }
  return result;
}

export default async function NhatKyPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; table?: string; who?: string; size?: string }>;
}) {
  const user = await getCurrentUser();
  if (user?.role !== "owner") {
    return (
      <div className="mx-auto max-w-sm text-sm text-muted">
        Chỉ chủ đầu tư xem được nhật ký thay đổi.
      </div>
    );
  }

  const { page: pageParam, table: tableFilter, who: whoFilter, size: sizeParam } = await searchParams;
  const pageSize = PAGE_SIZE_OPTIONS.includes(Number(sizeParam) as (typeof PAGE_SIZE_OPTIONS)[number])
    ? Number(sizeParam)
    : DEFAULT_PAGE_SIZE;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();

  let query = supabase
    .from("audit_logs")
    .select("id, table_name, record_id, changed_by, changed_at, old_value, new_value, reason", {
      count: "exact",
    })
    .order("changed_at", { ascending: false })
    .range(from, to);
  if (tableFilter) query = query.eq("table_name", tableFilter);
  if (whoFilter) query = query.eq("changed_by", whoFilter);

  const { data: logs, count } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));

  const changerIds = [...new Set((logs ?? []).map((l) => l.changed_by).filter(Boolean))] as string[];
  const { data: changers } =
    changerIds.length > 0
      ? await supabase.from("profiles").select("id, full_name, phone").in("id", changerIds)
      : { data: [] };
  const nameById = new Map((changers ?? []).map((p) => [p.id, p.full_name || p.phone]));

  const { data: allUsers } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .order("full_name");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <h1 className="font-heading text-2xl font-extrabold text-foreground">Nhật ký thay đổi</h1>
      <p className="text-sm text-muted">
        {count ?? 0} thay đổi{tableFilter || whoFilter ? " khớp bộ lọc" : " trên toàn hệ thống"} — trang{" "}
        {page}/{totalPages}.
      </p>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-md border border-border bg-surface p-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="table" className="text-xs text-muted">
            Bảng
          </label>
          <select
            id="table"
            name="table"
            defaultValue={tableFilter ?? ""}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">Tất cả</option>
            {Object.entries(TABLE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="who" className="text-xs text-muted">
            Người sửa
          </label>
          <select
            id="who"
            name="who"
            defaultValue={whoFilter ?? ""}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">Tất cả</option>
            {(allUsers ?? []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name || u.phone}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="size" className="text-xs text-muted">
            Số dòng/trang
          </label>
          <select
            id="size"
            name="size"
            defaultValue={String(pageSize)}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="h-10 rounded-lg bg-primary px-4 font-heading font-bold text-primary-foreground">
          Lọc
        </button>
        {(tableFilter || whoFilter || pageSize !== DEFAULT_PAGE_SIZE) && (
          <Link href="/cau-hinh/nhat-ky" className="text-sm text-primary underline">
            Bỏ lọc
          </Link>
        )}
      </form>

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
          <p className="text-sm text-muted">Không có thay đổi nào khớp.</p>
        )}
      </ul>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {page > 1 && (
            <Link
              href={buildHref({ page: page - 1, table: tableFilter, who: whoFilter, size: pageSize })}
              className="rounded-md border border-border px-2.5 py-1.5 text-sm text-primary hover:border-primary"
            >
              ← Trước
            </Link>
          )}
          {getPageNumbers(page, totalPages).map((p, i) =>
            p === "ellipsis" ? (
              <span key={`e${i}`} className="px-1 text-sm text-muted">
                …
              </span>
            ) : (
              <Link
                key={p}
                href={buildHref({ page: p, table: tableFilter, who: whoFilter, size: pageSize })}
                aria-current={p === page ? "page" : undefined}
                className={`rounded-md border px-3 py-1.5 font-mono text-sm ${
                  p === page
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-foreground hover:border-primary"
                }`}
              >
                {p}
              </Link>
            ),
          )}
          {page < totalPages && (
            <Link
              href={buildHref({ page: page + 1, table: tableFilter, who: whoFilter, size: pageSize })}
              className="rounded-md border border-border px-2.5 py-1.5 text-sm text-primary hover:border-primary"
            >
              Sau →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
