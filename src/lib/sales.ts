export type SaleItemInput = { unitPrice: number; quantity: number };

/** Tổng tiền hàng (chưa trừ giảm giá) của 1 đơn bán. */
export function calcSubtotal(items: SaleItemInput[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

/** Tổng tiền phải thu = tổng tiền hàng − giảm giá, không âm. */
export function calcSaleTotal(items: SaleItemInput[], discount: number): number {
  return Math.max(0, calcSubtotal(items) - discount);
}
