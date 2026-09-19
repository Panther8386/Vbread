"use client";

import { useActionState, useState } from "react";
import { createSale, type ActionState } from "./actions";
import { calcSaleTotal, calcSubtotal } from "@/lib/sales";
import { formatVnd } from "@/lib/currency";

type Product = { id: string; code: string; name: string; unit: string; price: number };

const PAYMENT_LABEL: Record<string, string> = {
  tien_mat: "Tiền mặt",
  chuyen_khoan: "Chuyển khoản",
  qr: "QR",
  vi_dien_tu: "Ví điện tử",
  khac: "Khác",
};

const initialState: ActionState = {};

export function PosCart({ shiftId, products }: { shiftId: string; products: Product[] }) {
  const [state, formAction, pending] = useActionState(createSale, initialState);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [discount, setDiscount] = useState(0);
  const [method, setMethod] = useState("tien_mat");

  const productById = new Map(products.map((p) => [p.id, p]));
  const cartItems = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([productId, quantity]) => ({ productId, quantity, product: productById.get(productId) }));

  const priceItems = cartItems.map((i) => ({ unitPrice: i.product?.price ?? 0, quantity: i.quantity }));
  const subtotal = calcSubtotal(priceItems);
  const total = calcSaleTotal(priceItems, discount);

  function addOne(productId: string) {
    setCart((prev) => ({ ...prev, [productId]: (prev[productId] ?? 0) + 1 }));
  }
  function changeQty(productId: string, delta: number) {
    setCart((prev) => {
      const next = Math.max(0, (prev[productId] ?? 0) + delta);
      return { ...prev, [productId]: next };
    });
  }

  const cartJson = JSON.stringify(cartItems.map((i) => ({ productId: i.productId, quantity: i.quantity })));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {products.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => addOne(p.id)}
            className="flex min-h-[64px] flex-col items-start rounded-md border border-border bg-surface p-3 text-left hover:border-primary"
          >
            <span className="font-mono text-xs text-primary">{p.code}</span>
            <span className="text-sm font-medium text-foreground">{p.name}</span>
            <span className="mt-1 font-mono text-sm text-foreground">{formatVnd(p.price)}</span>
          </button>
        ))}
        {products.length === 0 && <p className="col-span-full text-sm text-muted">Chưa có sản phẩm nào.</p>}
      </div>

      <form action={formAction} className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
        <input type="hidden" name="shift_id" value={shiftId} />
        <input type="hidden" name="cart_json" value={cartJson} />

        <h2 className="font-heading text-lg font-bold text-foreground">Giỏ hàng</h2>
        <ul className="flex flex-col gap-2">
          {cartItems.map((i) => (
            <li key={i.productId} className="flex items-center gap-2">
              <span className="flex-1 text-sm text-foreground">{i.product?.name ?? "Sản phẩm"}</span>
              <button
                type="button"
                onClick={() => changeQty(i.productId, -1)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground"
              >
                −
              </button>
              <span className="w-6 text-center font-mono text-sm text-foreground">{i.quantity}</span>
              <button
                type="button"
                onClick={() => changeQty(i.productId, 1)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground"
              >
                +
              </button>
              <span className="w-24 text-right font-mono text-sm text-foreground">
                {formatVnd((i.product?.price ?? 0) * i.quantity)}
              </span>
            </li>
          ))}
          {cartItems.length === 0 && <li className="text-sm text-muted">Chạm vào món để thêm vào giỏ.</li>}
        </ul>

        <div className="flex items-center justify-between text-sm text-muted">
          <span>Tiền hàng</span>
          <span className="font-mono">{formatVnd(subtotal)}</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="discount_amount" className="text-sm text-muted">
            Giảm giá (đồng)
          </label>
          <input
            id="discount_amount"
            name="discount_amount"
            type="number"
            min="0"
            step="1000"
            value={discount}
            onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="payment_method" className="text-sm text-muted">
            Phương thức thanh toán
          </label>
          <select
            id="payment_method"
            name="payment_method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
          >
            {Object.entries(PAYMENT_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="font-heading text-base font-bold text-foreground">Tổng cần thu</span>
          <span className="font-mono text-lg font-bold text-primary">{formatVnd(total)}</span>
        </div>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <button
          type="submit"
          disabled={pending || cartItems.length === 0}
          className="h-11 rounded-lg bg-primary font-heading font-bold text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Đang lưu..." : "Thanh toán"}
        </button>
      </form>
    </div>
  );
}
