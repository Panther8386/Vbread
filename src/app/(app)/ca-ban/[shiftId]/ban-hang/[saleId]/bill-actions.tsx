"use client";

import { useActionState } from "react";
import { cancelSale, type ActionState } from "../actions";

const initialState: ActionState = {};

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden h-11 rounded-lg border border-border px-4 text-sm font-medium text-foreground"
    >
      In hóa đơn
    </button>
  );
}

export function CancelSaleForm({ shiftId, saleId }: { shiftId: string; saleId: string }) {
  const [state, formAction, pending] = useActionState(cancelSale, initialState);

  return (
    <form action={formAction} className="print:hidden flex flex-col gap-2 rounded-md border border-border bg-surface p-4">
      <input type="hidden" name="shift_id" value={shiftId} />
      <input type="hidden" name="sale_id" value={saleId} />
      <label htmlFor="reason" className="text-sm text-muted">
        Lý do hủy đơn (bắt buộc)
      </label>
      <textarea
        id="reason"
        name="reason"
        required
        rows={2}
        className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
      />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="h-10 self-start rounded-lg bg-destructive px-4 text-sm font-bold text-white disabled:opacity-50"
      >
        {pending ? "Đang hủy..." : "Hủy đơn"}
      </button>
    </form>
  );
}
