import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { AccountForm } from "./account-form";

const ROLE_LABEL: Record<string, string> = {
  owner: "Chủ đầu tư",
  partner: "Đối tác",
  manager: "Quản lý",
  staff: "Nhân viên",
};

export default async function TaiKhoanPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: accounts } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, status")
    .order("created_at", { ascending: false });

  const { data: carts } = await supabase.from("carts").select("id, code, name").eq("status", "active");

  const isOwner = user?.role === "owner";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-heading text-2xl font-extrabold text-foreground">Tài khoản</h1>

      <ul className="flex flex-col gap-2">
        {(accounts ?? []).map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 py-3"
          >
            <div>
              <p className="font-medium text-foreground">{a.full_name || "(chưa có tên)"}</p>
              <p className="text-sm text-muted">{a.phone}</p>
            </div>
            <span className="font-mono text-xs text-primary">{ROLE_LABEL[a.role] ?? a.role}</span>
          </li>
        ))}
        {(accounts ?? []).length === 0 && <p className="text-sm text-muted">Chưa có tài khoản nào.</p>}
      </ul>

      <AccountForm canCreateOwnerPartner={isOwner} carts={carts ?? []} />
    </div>
  );
}
