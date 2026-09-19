"use client";

import { useActionState } from "react";
import { updateCartFull, updateCart, type CartActionState } from "./actions";

type Partner = { id: string; full_name: string; phone: string | null };
type Cart = {
  id: string;
  code: string;
  name: string;
  note: string;
  status: string;
  partner_id: string | null;
};

const initialState: CartActionState = {};

export function OwnerCartRow({ cart, partners }: { cart: Cart; partners: Partner[] }) {
  const [state, formAction, pending] = useActionState(updateCartFull, initialState);

  return (
    <li className={`rounded-md border border-border bg-surface p-4 ${cart.status === "inactive" ? "opacity-50" : ""}`}>
      <form action={formAction} className="flex flex-col gap-2">
        <input type="hidden" name="id" value={cart.id} />
        <div className="flex gap-2">
          <input
            name="code"
            defaultValue={cart.code}
            required
            className="h-10 w-24 rounded-md border border-border bg-background px-3 font-mono text-sm text-foreground outline-none focus:border-primary"
          />
          <input
            name="name"
            defaultValue={cart.name}
            required
            className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
        <select
          name="partner_id"
          defaultValue={cart.partner_id ?? ""}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="">Chưa gán đối tác</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name} ({p.phone})
            </option>
          ))}
        </select>
        <div className="flex items-center gap-3">
          <select
            name="status"
            defaultValue={cart.status}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Đã vô hiệu hóa</option>
          </select>
          <button type="submit" disabled={pending} className="text-sm text-primary underline">
            {pending ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      </form>
    </li>
  );
}

export function PartnerCartNote({ cart }: { cart: Cart }) {
  return (
    <form action={updateCart} className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
      <input type="hidden" name="id" value={cart.id} />
      <input
        name="note"
        defaultValue={cart.note ?? ""}
        placeholder="Ghi chú"
        className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
      />
      <div className="flex items-center gap-3">
        <select
          name="status"
          defaultValue={cart.status}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Đã tắt</option>
        </select>
        <button type="submit" className="text-sm text-primary underline">
          Lưu
        </button>
      </div>
    </form>
  );
}
