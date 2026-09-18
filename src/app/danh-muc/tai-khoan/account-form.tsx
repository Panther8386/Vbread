"use client";

import { useActionState } from "react";
import { createAccount, type CreateAccountState } from "./actions";

type Cart = { id: string; code: string; name: string };

const initialState: CreateAccountState = {};

export function AccountForm({
  canCreateOwnerPartner,
  carts,
}: {
  canCreateOwnerPartner: boolean;
  carts: Cart[];
}) {
  const [state, formAction, pending] = useActionState(createAccount, initialState);

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
        defaultValue="staff"
        className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
      >
        <option value="staff">Nhân viên bán hàng</option>
        <option value="manager">Quản lý</option>
        {canCreateOwnerPartner && <option value="partner">Đối tác</option>}
        {canCreateOwnerPartner && <option value="owner">Chủ đầu tư</option>}
      </select>
      <select
        name="cart_id"
        defaultValue=""
        className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
      >
        <option value="">Không gán xe cụ thể</option>
        {carts.map((c) => (
          <option key={c.id} value={c.id}>
            {c.code} — {c.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted">Bắt buộc chọn xe nếu vai trò là Quản lý.</p>

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
