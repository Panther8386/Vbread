"use client";

import { useActionState } from "react";
import { closeShift, type ActionState } from "./actions";
import { formatVnd } from "@/lib/currency";

type ProductRow = { id: string; code: string; name: string; unit: string; endingStock: number };
type MethodRow = { method: string; label: string; due: number };

const initialState: ActionState = {};

export function CloseShiftForm({
  shiftId,
  products,
  cashDue,
  otherMethods,
}: {
  shiftId: string;
  products: ProductRow[];
  cashDue: number;
  otherMethods: MethodRow[];
}) {
  const [state, formAction, pending] = useActionState(closeShift, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="shift_id" value={shiftId} />

      <div className="rounded-md border border-border bg-surface p-4">
        <h2 className="font-heading text-lg font-bold text-foreground">Kiểm kê cuối ca</h2>
        <ul className="mt-2 flex flex-col gap-3">
          {products.map((p) => (
            <li key={p.id} className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {p.code} — {p.name}
                </p>
                <p className="text-xs text-muted">
                  Tồn sổ sách: {p.endingStock} {p.unit}
                </p>
              </div>
              <input
                name={`kiem_ke_${p.id}`}
                type="number"
                min="0"
                step="1"
                required
                defaultValue={p.endingStock}
                className="h-10 w-24 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </li>
          ))}
          {products.length === 0 && <li className="text-sm text-muted">Chưa có sản phẩm nào.</li>}
        </ul>
      </div>

      <div className="rounded-md border border-border bg-surface p-4">
        <h2 className="font-heading text-lg font-bold text-foreground">Đối soát tiền</h2>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Tiền mặt</p>
            <p className="text-xs text-muted">Phải có: {formatVnd(cashDue)}</p>
          </div>
          <input
            name="cash_counted"
            type="number"
            min="0"
            step="1000"
            required
            defaultValue={cashDue}
            className="h-10 w-32 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>

        {otherMethods.map((m) => (
          <div key={m.method} className="mt-2 flex items-center gap-3 border-t border-border pt-2">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{m.label}</p>
              <p className="text-xs text-muted">Phải có: {formatVnd(m.due)}</p>
            </div>
            <input
              name={`method_${m.method}`}
              type="number"
              min="0"
              step="1000"
              required
              defaultValue={m.due}
              className="h-10 w-32 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="closing_reason" className="text-sm text-muted">
          Lý do chênh lệch (bắt buộc nếu có chênh lệch hàng hoặc tiền)
        </label>
        <textarea
          id="closing_reason"
          name="closing_reason"
          rows={2}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg bg-primary font-heading font-bold text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Đang đóng ca..." : "Đóng ca"}
      </button>
    </form>
  );
}
