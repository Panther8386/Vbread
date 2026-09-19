import { describe, expect, it } from "vitest";
import { calcSaleTotal, calcSubtotal } from "./sales";

describe("calcSubtotal", () => {
  it("cộng dồn đơn giá × số lượng của từng dòng", () => {
    expect(
      calcSubtotal([
        { unitPrice: 20000, quantity: 2 },
        { unitPrice: 25000, quantity: 1 },
      ]),
    ).toBe(65000);
  });

  it("giỏ hàng rỗng trả về 0", () => {
    expect(calcSubtotal([])).toBe(0);
  });
});

describe("calcSaleTotal", () => {
  it("trừ giảm giá khỏi tổng tiền hàng", () => {
    expect(calcSaleTotal([{ unitPrice: 20000, quantity: 2 }], 5000)).toBe(35000);
  });

  it("không giảm giá thì bằng tổng tiền hàng", () => {
    expect(calcSaleTotal([{ unitPrice: 20000, quantity: 1 }], 0)).toBe(20000);
  });

  it("giảm giá lớn hơn tổng tiền hàng thì kết quả không âm", () => {
    expect(calcSaleTotal([{ unitPrice: 20000, quantity: 1 }], 50000)).toBe(0);
  });
});
