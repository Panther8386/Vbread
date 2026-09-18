import { describe, expect, it } from "vitest";
import { isValidVietnamesePhone, toE164Vietnam, toSyntheticEmail } from "./phone";

describe("toE164Vietnam", () => {
  it("đổi số bắt đầu bằng 0 sang +84", () => {
    expect(toE164Vietnam("0912345678")).toBe("+84912345678");
  });

  it("bỏ dấu cách và giữ nguyên nếu đã có 84", () => {
    expect(toE164Vietnam("84 912 345 678")).toBe("+84912345678");
  });

  it("giữ nguyên nếu đã nhập kèm dấu +", () => {
    expect(toE164Vietnam("+84912345678")).toBe("+84912345678");
  });
});

describe("toSyntheticEmail", () => {
  it("đổi số dạng 0 đầu thành email giả @vbread.local", () => {
    expect(toSyntheticEmail("0912345678")).toBe("0912345678@vbread.local");
  });

  it("đổi số dạng +84 về lại dạng 0 trước khi ghép email", () => {
    expect(toSyntheticEmail("+84912345678")).toBe("0912345678@vbread.local");
  });
});

describe("isValidVietnamesePhone", () => {
  it("chấp nhận số di động 10 số hợp lệ", () => {
    expect(isValidVietnamesePhone("0912345678")).toBe(true);
    expect(isValidVietnamesePhone("0769999369")).toBe(true);
  });

  it("chấp nhận dạng +84", () => {
    expect(isValidVietnamesePhone("+84912345678")).toBe(true);
  });

  it("từ chối số quá ngắn/quá dài", () => {
    expect(isValidVietnamesePhone("091234")).toBe(false);
    expect(isValidVietnamesePhone("09123456789")).toBe(false);
  });

  it("từ chối đầu số không phải di động (ví dụ 02 cố định)", () => {
    expect(isValidVietnamesePhone("0212345678")).toBe(false);
  });

  it("từ chối chuỗi không phải số điện thoại", () => {
    expect(isValidVietnamesePhone("abc")).toBe(false);
  });
});
