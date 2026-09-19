import { describe, expect, it } from "vitest";
import { csvRow, toCsv } from "./csv";

describe("csvRow", () => {
  it("nối các ô bằng dấu phẩy", () => {
    expect(csvRow(["a", "b", 1])).toBe("a,b,1");
  });

  it("bọc ngoặc kép ô có dấu phẩy", () => {
    expect(csvRow(["Bánh mì, pate", "20000"])).toBe('"Bánh mì, pate",20000');
  });

  it("nhân đôi dấu ngoặc kép bên trong ô có ngoặc kép", () => {
    expect(csvRow(['Ghi chú "đặc biệt"'])).toBe('"Ghi chú ""đặc biệt"""');
  });

  it("ô bình thường không có dấu phẩy/ngoặc kép thì giữ nguyên", () => {
    expect(csvRow(["Bánh mì pate", 25000])).toBe("Bánh mì pate,25000");
  });
});

describe("toCsv", () => {
  it("nối nhiều dòng bằng CRLF", () => {
    expect(toCsv([["a", "b"], ["c", "d"]])).toBe("a,b\r\nc,d");
  });
});
