"use client";

import { useActionState, useState } from "react";
import { updateAccount, setAccountStatus, type ActionState } from "./actions";

const ROLE_LABEL: Record<string, string> = {
  owner: "Chủ đầu tư",
  partner: "Đối tác",
  manager: "Quản lý",
  staff: "Nhân viên",
};

type Account = {
  id: string;
  full_name: string;
  phone: string | null;
  role: string;
  status: string;
};

const initialState: ActionState = {};

export function AccountRow({ account, canEdit }: { account: Account; canEdit: boolean }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updateAccount, initialState);

  if (editing) {
    return (
      <li className="rounded-md border border-border bg-surface px-4 py-3">
        <form action={formAction} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={account.id} />
          <input
            name="full_name"
            defaultValue={account.full_name}
            required
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
          />
          <input
            name="phone"
            defaultValue={account.phone ?? ""}
            required
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
          />
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={pending} className="text-sm text-primary underline">
              {pending ? "Đang lưu..." : "Lưu"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-sm text-muted underline">
              Hủy
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li
      className={`flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 py-3 ${account.status === "inactive" ? "opacity-50" : ""}`}
    >
      <div>
        <p className="font-medium text-foreground">{account.full_name || "(chưa có tên)"}</p>
        <p className="text-sm text-muted">
          {account.phone}
          {account.status === "inactive" && " · đã vô hiệu hóa"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-primary">{ROLE_LABEL[account.role] ?? account.role}</span>
        {canEdit && (
          <>
            <button type="button" onClick={() => setEditing(true)} className="text-sm text-primary underline">
              Sửa
            </button>
            <form action={setAccountStatus}>
              <input type="hidden" name="id" value={account.id} />
              <input
                type="hidden"
                name="nextStatus"
                value={account.status === "active" ? "inactive" : "active"}
              />
              <button type="submit" className="text-sm text-destructive underline">
                {account.status === "active" ? "Vô hiệu hóa" : "Kích hoạt lại"}
              </button>
            </form>
          </>
        )}
      </div>
    </li>
  );
}
