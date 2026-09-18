"use client";

import { useActionState, useState } from "react";
import { createAccount, type ActionState } from "./actions";

type Cart = { id: string; code: string; name: string };

const initialState: ActionState = {};

export function AccountForm({
  canCreateOwnerPartner,
  carts,
}: {
  canCreateOwnerPartner: boolean;
  carts: Cart[];
}) {
  const [state, formAction, pending] = useActionState(createAccount, initialState);
  const [role, setRole] = useState("staff");
  const needsCart = role === "manager" || role === "partner";

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
      <h2 className="font-heading text-lg font-bold text-foreground">Tạo tài khoản</h2>

      <input
        name="full_name"
        required
        placeholder="Họ tên"
        className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
      />
      <input
        name="phone"
        required
        placeholder="Số điện thoại (0912345678)"
        className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
      />
      <input
        name="password"
        type="password"
        required
        placeholder="Mật khẩu (ít nhất 6 ký tự)"
        className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
      />
      <select
        name="role"
        required
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
      >
        <option value="staff">Nhân viên bán hàng</option>
        <option value="manager">Quản lý</option>
        {canCreateOwnerPartner && <option value="partner">Đối tác</option>}
        {canCreateOwnerPartner && <option value="owner">Chủ đầu tư</option>}
      </select>

      {needsCart && (
        <fieldset className="flex flex-col gap-2 rounded-md border border-border p-3">
          <legend className="px-1 text-xs uppercase text-muted">
            Chọn xe (bắt buộc, chọn được nhiều xe)
          </legend>
          {carts.length === 0 && <p className="text-sm text-muted">Chưa có xe nào.</p>}
          {carts.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" name="cart_id" value={c.id} className="size-4" />
              {c.code} — {c.name}
            </label>
          ))}
        </fieldset>
      )}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-secondary">Đã tạo tài khoản thành công.</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg bg-primary font-heading font-bold text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Đang tạo..." : "Tạo tài khoản"}
      </button>
    </form>
  );
}
