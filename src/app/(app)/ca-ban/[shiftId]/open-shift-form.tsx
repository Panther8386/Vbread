"use client";

import { useActionState } from "react";
import { openShift, type ActionState } from "./actions";

type Product = { id: string; code: string; name: string; unit: string };

const initialState: ActionState = {};

export function OpenShiftForm({ shiftId, products }: { shiftId: string; products: Product[] }) {
  const [state, formAction, pending] = useActionState(openShift, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
      <input type="hidden" name="shift_id" value={shiftId} />
      <h2 className="font-heading text-lg font-bold text-foreground">Mở ca — hàng nhận đầu ca</h2>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="opening_cash" className="text-sm text-muted">
          Tiền lẻ đầu ca (đồng)
        </label>
        <input
          id="opening_cash"
          name="opening_cash"
          type="number"
          min="0"
          step="1000"
          required
          className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
        />
      </div>

      <fieldset className="flex flex-col gap-2 rounded-md border border-border p-3">
        <legend className="px-1 text-xs uppercase text-muted">Hàng nhận đầu ca (để trống nếu không nhận)</legend>
        {products.length === 0 && <p className="text-sm text-muted">Chưa có sản phẩm nào.</p>}
        {products.map((p) => (
          <div key={p.id} className="flex items-center gap-3">
            <input type="hidden" name="product_id" value={p.id} />
            <span className="flex-1 text-sm text-foreground">
              {p.code} — {p.name}
            </span>
            <input
              name={`qty_${p.id}`}
              type="number"
              min="0"
              step="1"
              placeholder="0"
              className="h-10 w-24 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
            />
            <span className="w-10 text-xs text-muted">{p.unit}</span>
          </div>
        ))}
      </fieldset>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg bg-primary font-heading font-bold text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Đang mở ca..." : "Mở ca"}
      </button>
    </form>
  );
}
