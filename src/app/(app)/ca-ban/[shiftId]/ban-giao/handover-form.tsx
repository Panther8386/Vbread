"use client";

import { useActionState } from "react";
import { createHandover, type ActionState } from "./actions";

type StaffOption = { id: string; label: string };

const initialState: ActionState = {};

export function HandoverForm({ shiftId, recipients }: { shiftId: string; recipients: StaffOption[] }) {
  const [state, formAction, pending] = useActionState(createHandover, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
      <input type="hidden" name="shift_id" value={shiftId} />
      <h2 className="font-heading text-lg font-bold text-foreground">Bàn giao ca</h2>

      <select
        name="to_staff_id"
        required
        defaultValue=""
        className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
      >
        <option value="" disabled>
          Bàn giao cho
        </option>
        {recipients.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </select>

      <input
        name="cash_handed_over"
        type="number"
        min="0"
        step="1000"
        required
        placeholder="Tiền mặt đang cầm (đồng)"
        className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
      />

      <textarea
        name="note"
        rows={2}
        placeholder="Ghi chú (tùy chọn)"
        className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
      />

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-secondary">Đã tạo phiếu bàn giao, chờ người nhận xác nhận.</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg bg-primary font-heading font-bold text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Đang tạo..." : "Tạo phiếu bàn giao"}
      </button>
    </form>
  );
}
