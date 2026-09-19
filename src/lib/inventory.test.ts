import { describe, expect, it } from "vitest";
import { calcCashDue, calcEndingStock, calcVariance } from "./inventory";

describe("calcEndingStock", () => {
  it("tính đúng theo công thức: nhận − bán − trả − hủy/hao hụt", () => {
    expect(calcEndingStock({ received: 50, sold: 30, returned: 2, wasted: 3 })).toBe(15);
  });

  it("không nhận/bán/trả/hủy gì thì tồn bằng 0", () => {
    expect(calcEndingStock({ received: 0, sold: 0, returned: 0, wasted: 0 })).toBe(0);
  });
});

describe("calcVariance", () => {
  it("thực tế nhiều hơn sổ sách -> chênh lệch dương", () => {
    expect(calcVariance(20, 15)).toBe(5);
  });

  it("thực tế ít hơn sổ sách -> chênh lệch âm", () => {
    expect(calcVariance(10, 15)).toBe(-5);
  });

  it("khớp nhau thì chênh lệch bằng 0", () => {
    expect(calcVariance(15, 15)).toBe(0);
  });
});

describe("calcCashDue", () => {
  it("tiền mặt phải có = tiền đầu ca + doanh thu tiền mặt", () => {
    expect(calcCashDue(500000, 1250000)).toBe(1750000);
  });

  it("không có doanh thu tiền mặt thì bằng đúng tiền đầu ca", () => {
    expect(calcCashDue(500000, 0)).toBe(500000);
  });
});
