import { describe, expect, it } from "vitest";
import { toE164Vietnam, toSyntheticEmail } from "./phone";

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
