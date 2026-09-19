import { describe, expect, it } from "vitest";
import { businessDateVn, formatDateTimeVn } from "./date";

describe("formatDateTimeVn", () => {
  it("đổi giờ UTC sang giờ Việt Nam (UTC+7), định dạng dd/MM/yyyy HH:mm", () => {
    expect(formatDateTimeVn("2026-09-18T14:07:00Z")).toBe("18/09/2026 21:07");
  });

  it("qua ngày mới khi cộng giờ Việt Nam vượt qua nửa đêm", () => {
    expect(formatDateTimeVn("2026-09-18T20:30:00Z")).toBe("19/09/2026 03:30");
  });
});

describe("businessDateVn", () => {
  it("trả về ngày theo giờ Việt Nam, dạng yyyy-MM-dd", () => {
    expect(businessDateVn(new Date("2026-09-18T14:07:00Z"))).toBe("2026-09-18");
  });

  it("qua ngày mới khi giờ UTC cộng thêm 7 tiếng vượt qua nửa đêm giờ VN", () => {
    expect(businessDateVn(new Date("2026-09-18T20:30:00Z"))).toBe("2026-09-19");
  });
});
