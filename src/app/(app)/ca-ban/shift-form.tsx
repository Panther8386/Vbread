"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createShift, type ActionState } from "./actions";

type Option = { id: string; label: string };

const initialState: ActionState = {};

export function ShiftForm({
  defaultDate,
  carts,
  locations,
  shiftTemplates,
  staffOptions,
}: {
  defaultDate: string;
  carts: Option[];
  locations: Option[];
  shiftTemplates: Option[];
  staffOptions: Option[];
}) {
  const [state, formAction, pending] = useActionState(createShift, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
      <h2 className="font-heading text-lg font-bold text-foreground">Phân công ca mới</h2>

      <input
        name="business_date"
        type="date"
        defaultValue={defaultDate}
        required
        className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
      />

      <select
        name="cart_id"
        required
        defaultValue=""
        className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
      >
        <option value="" disabled>
          Chọn xe
        </option>
        {carts.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>

      <select
        name="location_id"
        required
        defaultValue=""
        className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
      >
        <option value="" disabled>
          Chọn điểm bán
        </option>
        {locations.map((l) => (
          <option key={l.id} value={l.id}>
            {l.label}
          </option>
        ))}
      </select>

      <select
        name="shift_template_id"
        required
        defaultValue=""
        className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
      >
        <option value="" disabled>
          Chọn ca
        </option>
        {shiftTemplates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>

      <fieldset className="flex flex-col gap-2 rounded-md border border-border p-3">
        <legend className="px-1 text-xs uppercase text-muted">Nhân viên (tối đa 2)</legend>
        {staffOptions.length === 0 && (
          <p className="text-sm text-muted">
            Chưa có nhân viên nào —{" "}
            <Link href="/danh-muc/tai-khoan" className="text-primary underline">
              vào Tài khoản để tạo
            </Link>{" "}
            (có thể phân công ca trước, gán nhân viên sau).
          </p>
        )}
        {staffOptions.map((s) => (
          <label key={s.id} className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" name="staff_id" value={s.id} className="size-4" />
            {s.label}
          </label>
        ))}
      </fieldset>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-secondary">Đã phân công ca thành công.</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg bg-primary font-heading font-bold text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Đang lưu..." : "Phân công ca"}
      </button>
    </form>
  );
}
