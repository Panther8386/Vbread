export type StockFlow = { received: number; sold: number; returned: number; wasted: number };

/** Tồn cuối ca (sổ sách) = Tồn đầu ca + Nhận − Bán − Trả − Hủy/Hao hụt. */
export function calcEndingStock({ received, sold, returned, wasted }: StockFlow): number {
  return received - sold - returned - wasted;
}

/** Chênh lệch = số thực tế − số phải có. Dùng chung cho hàng lẫn tiền. */
export function calcVariance(actual: number, expected: number): number {
  return actual - expected;
}

/** Tiền mặt phải có = Tiền đầu ca + Doanh thu tiền mặt. */
export function calcCashDue(openingCash: number, cashRevenue: number): number {
  return openingCash + cashRevenue;
}
