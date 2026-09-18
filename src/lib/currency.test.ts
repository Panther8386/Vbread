import { describe, expect, it } from "vitest";
import { formatVnd } from "./currency";

describe("formatVnd", () => {
  it("định dạng số nguyên có dấu phân cách nghìn kiểu Việt Nam", () => {
    expect(formatVnd(25000)).toBe("25.000 ₫");
  });

  it("làm tròn số lẻ", () => {
    expect(formatVnd(1000.4)).toBe("1.000 ₫");
  });

  it("hiển thị 0 ₫ khi bằng 0", () => {
    expect(formatVnd(0)).toBe("0 ₫");
  });
});
