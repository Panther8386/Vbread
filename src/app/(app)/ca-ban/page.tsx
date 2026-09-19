import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { businessDateVn } from "@/lib/date";
import { cancelShift } from "./actions";
import { ShiftForm } from "./shift-form";

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Đã lên lịch",
  open: "Đang mở ca",
  cancelled: "Đã hủy",
};

export default async function CaBanPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const date = dateParam || businessDateVn();
  const user = await getCurrentUser();
  const canManage = user?.role === "owner" || user?.role === "partner";

  const supabase = await createClient();

  const { data: shifts } = await supabase
    .from("shifts")
    .select("id, business_date, status, cart_id, location_id, shift_template_id")
    .eq("business_date", date)
    .order("created_at");

  const cartIds = [...new Set((shifts ?? []).map((s) => s.cart_id))];
  const locationIds = [...new Set((shifts ?? []).map((s) => s.location_id))];
  const templateIds = [...new Set((shifts ?? []).map((s) => s.shift_template_id))];
  const shiftIds = (shifts ?? []).map((s) => s.id);

  const [{ data: shiftCarts }, { data: shiftLocations }, { data: shiftTemplatesUsed }, { data: shiftStaffRows }] =
    await Promise.all([
      cartIds.length > 0
        ? supabase.from("carts").select("id, code, name").in("id", cartIds)
        : Promise.resolve({ data: [] }),
      locationIds.length > 0
        ? supabase.from("locations").select("id, name").in("id", locationIds)
        : Promise.resolve({ data: [] }),
      templateIds.length > 0
        ? supabase.from("shift_templates").select("id, name, start_time, end_time").in("id", templateIds)
        : Promise.resolve({ data: [] }),
      shiftIds.length > 0
        ? supabase.from("shift_staff").select("shift_id, staff_id").in("shift_id", shiftIds)
        : Promise.resolve({ data: [] }),
    ]);

  const staffIds = [...new Set((shiftStaffRows ?? []).map((r) => r.staff_id))];
  const { data: staffProfiles } =
    staffIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", staffIds)
      : { data: [] };

  const cartById = new Map((shiftCarts ?? []).map((c) => [c.id, c]));
  const locationById = new Map((shiftLocations ?? []).map((l) => [l.id, l]));
  const templateById = new Map((shiftTemplatesUsed ?? []).map((t) => [t.id, t]));
  const staffNameById = new Map((staffProfiles ?? []).map((p) => [p.id, p.full_name]));
  const staffIdsByShift = new Map<string, string[]>();
  for (const row of shiftStaffRows ?? []) {
    const list = staffIdsByShift.get(row.shift_id) ?? [];
    list.push(row.staff_id);
    staffIdsByShift.set(row.shift_id, list);
  }

  // Du lieu cho form tao ca moi. Khong loc theo status: xe chi thuc su
  // "Dang hoat dong" SAU KHI co nhan vien duoc phan cong vao ca dau tien,
  // nen phai cho chon duoc ca xe dang "Chua hoat dong".
  const { data: formCarts } = canManage
    ? await supabase.from("carts").select("id, code, name").order("code")
    : { data: [] };
  const { data: formLocations } = canManage
    ? await supabase.from("locations").select("id, name").eq("status", "active").order("name")
    : { data: [] };
  const { data: formTemplates } = canManage
    ? await supabase
        .from("shift_templates")
        .select("id, name, start_time, end_time")
        .eq("status", "active")
        .order("start_time")
    : { data: [] };
  const { data: formStaff } = canManage
    ? await supabase.from("profiles").select("id, full_name, phone").eq("role", "staff").order("full_name")
    : { data: [] };

  const prevDate = shiftDate(date, -1);
  const nextDate = shiftDate(date, 1);

  const missingCarts = (formCarts ?? []).length === 0;
  const missingLocations = (formLocations ?? []).length === 0;
  const missingTemplates = (formTemplates ?? []).length === 0;
  const canCreateShift = canManage && !missingCarts && !missingLocations && !missingTemplates;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-heading text-2xl font-extrabold text-foreground">Ca bán</h1>

      <div className="flex items-center justify-between gap-3">
        <Link href={`/ca-ban?date=${prevDate}`} className="text-sm text-primary underline">
          ← Ngày trước
        </Link>
        <span className="font-mono text-sm text-foreground">{date}</span>
        <Link href={`/ca-ban?date=${nextDate}`} className="text-sm text-primary underline">
          Ngày sau →
        </Link>
      </div>

      <ul className="flex flex-col gap-3">
        {(shifts ?? []).map((s) => {
          const cart = cartById.get(s.cart_id);
          const location = locationById.get(s.location_id);
          const template = templateById.get(s.shift_template_id);
          const staffNames = (staffIdsByShift.get(s.id) ?? []).map((id) => staffNameById.get(id) ?? "Nhân viên");

          return (
            <li
              key={s.id}
              className={`rounded-md border border-border bg-surface p-4 ${s.status === "cancelled" ? "opacity-50" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-foreground">
                  {cart ? `${cart.code} — ${cart.name}` : "Xe"}
                </p>
                <span className="font-mono text-xs text-muted">{STATUS_LABEL[s.status] ?? s.status}</span>
              </div>
              <p className="text-sm text-muted">{location?.name ?? "Điểm bán"}</p>
              <p className="text-sm text-foreground">
                {template ? `${template.name} (${template.start_time.slice(0, 5)}–${template.end_time.slice(0, 5)})` : "Ca"}
              </p>
              <p className="text-sm text-muted">
                Nhân viên: {staffNames.length > 0 ? staffNames.join(", ") : "Chưa gán"}
              </p>

              <Link href={`/ca-ban/${s.id}`} className="mt-2 inline-block text-sm text-primary underline">
                Xem chi tiết{s.status === "scheduled" ? " / Mở ca" : ""}
              </Link>

              {canManage && s.status === "scheduled" && (
                <form action={cancelShift} className="mt-2">
                  <input type="hidden" name="id" value={s.id} />
                  <button type="submit" className="text-sm text-destructive underline">
                    Hủy ca
                  </button>
                </form>
              )}
            </li>
          );
        })}
        {(shifts ?? []).length === 0 && <p className="text-sm text-muted">Chưa có ca nào ngày này.</p>}
      </ul>

      {canManage && !canCreateShift && (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-surface p-4 text-sm text-muted">
          <p className="font-medium text-foreground">Cần chuẩn bị thêm trước khi phân công ca:</p>
          {missingCarts && (
            <p>
              Chưa có xe nào —{" "}
              <Link href="/danh-muc/xe" className="text-primary underline">
                vào Xe để tạo
              </Link>
              .
            </p>
          )}
          {missingLocations && (
            <p>
              Chưa có điểm bán nào —{" "}
              <Link href="/danh-muc/diem-ban" className="text-primary underline">
                vào Điểm bán để thêm
              </Link>
              .
            </p>
          )}
          {missingTemplates && (
            <p>
              Chưa có ca mẫu nào —{" "}
              <Link href="/cau-hinh/ca" className="text-primary underline">
                vào Cấu hình ca để thêm
              </Link>
              .
            </p>
          )}
        </div>
      )}

      {canCreateShift && (
        <ShiftForm
          defaultDate={date}
          carts={(formCarts ?? []).map((c) => ({ id: c.id, label: `${c.code} — ${c.name}` }))}
          locations={(formLocations ?? []).map((l) => ({ id: l.id, label: l.name }))}
          shiftTemplates={(formTemplates ?? []).map((t) => ({
            id: t.id,
            label: `${t.name} (${t.start_time.slice(0, 5)}–${t.end_time.slice(0, 5)})`,
          }))}
          staffOptions={(formStaff ?? []).map((p) => ({ id: p.id, label: `${p.full_name} (${p.phone})` }))}
        />
      )}
    </div>
  );
}

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
