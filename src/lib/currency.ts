/** Định dạng số tiền đồng Việt Nam, ví dụ: 25000 -> "25.000 ₫". */
export function formatVnd(amount: number): string {
  return `${Math.round(amount).toLocaleString("vi-VN")} ₫`;
}
