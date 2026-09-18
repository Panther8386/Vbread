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

export function AccountRow({
  account,
  canEdit,
  isSelf,
}: {
  account: Account;
  canEdit: boolean;
  isSelf: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editState, editAction, editPending] = useActionState(updateAccount, initialState);
  const [statusState, statusAction, statusPending] = useActionState(setAccountStatus, initialState);

  if (editing) {
    return (
      <li className="rounded-md border border-border bg-surface px-4 py-3">
        <form action={editAction} className="flex flex-col gap-2">
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
          {editState.error && <p className="text-sm text-destructive">{editState.error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={editPending} className="text-sm text-primary underline">
              {editPending ? "Đang lưu..." : "Lưu"}
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
      className={`flex flex-col gap-1 rounded-md border border-border bg-surface px-4 py-3 ${account.status === "inactive" ? "opacity-50" : ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">
            {account.full_name || "(chưa có tên)"}
            {isSelf && <span className="ml-2 text-xs text-muted">(bạn)</span>}
          </p>
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
              {!isSelf && (
                <form action={statusAction}>
                  <input type="hidden" name="id" value={account.id} />
                  <input
                    type="hidden"
                    name="nextStatus"
                    value={account.status === "active" ? "inactive" : "active"}
                  />
                  <button type="submit" disabled={statusPending} className="text-sm text-destructive underline">
                    {account.status === "active" ? "Vô hiệu hóa" : "Kích hoạt lại"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
      {statusState.error && <p className="text-sm text-destructive">{statusState.error}</p>}
    </li>
  );
}
