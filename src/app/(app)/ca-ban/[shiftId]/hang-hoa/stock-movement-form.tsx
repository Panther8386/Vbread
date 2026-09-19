"use client";

import { useActionState, useState } from "react";
import { addStockMovement, type ActionState } from "./actions";

type Product = { id: string; code: string; name: string; unit: string };

const TYPE_LABEL: Record<string, string> = {
  nhan: "Nhận thêm hàng",
  tra: "Trả hàng",
  huy: "Hủy hàng",
  hao_hut: "Hao hụt",
};

const initialState: ActionState = {};

export function StockMovementForm({ shiftId, products }: { shiftId: string; products: Product[] }) {
  const [state, formAction, pending] = useActionState(addStockMovement, initialState);
  const [movementType, setMovementType] = useState("nhan");
  const needsReason = movementType === "huy" || movementType === "hao_hut";

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
      <input type="hidden" name="shift_id" value={shiftId} />
      <h2 className="font-heading text-lg font-bold text-foreground">Ghi nhận hàng hóa</h2>

      <select
        name="movement_type"
        required
        value={movementType}
        onChange={(e) => setMovementType(e.target.value)}
        className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
      >
        {Object.entries(TYPE_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <select
        name="product_id"
        required
        defaultValue=""
        className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
      >
        <option value="" disabled>
          Chọn sản phẩm
        </option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.code} — {p.name} ({p.unit})
          </option>
        ))}
      </select>

      <input
        name="quantity"
        type="number"
        min="1"
        step="1"
        required
        placeholder="Số lượng"
        className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="reason" className="text-sm text-muted">
          Lý do{needsReason ? " (bắt buộc)" : " (tùy chọn)"}
        </label>
        <input
          id="reason"
          name="reason"
          required={needsReason}
          placeholder={needsReason ? "Ví dụ: hỏng, rơi, quá hạn..." : ""}
          className="h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary"
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-secondary">Đã ghi nhận.</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg bg-primary font-heading font-bold text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Đang lưu..." : "Ghi nhận"}
      </button>
    </form>
  );
}
