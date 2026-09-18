import { describe, expect, it } from "vitest";
import { diffAuditValues } from "./audit";

describe("diffAuditValues", () => {
  it("dòng thêm mới (insert): chỉ có new_value -> mọi trường đều là mới", () => {
    const changes = diffAuditValues(null, { code: "BM01", price: 20000 });
    expect(changes).toEqual([
      { field: "code", from: undefined, to: "BM01" },
      { field: "price", from: undefined, to: 20000 },
    ]);
  });

  it("dòng xóa (delete): chỉ có old_value -> mọi trường đều mất", () => {
    const changes = diffAuditValues({ code: "BM01", price: 20000 }, null);
    expect(changes).toEqual([
      { field: "code", from: "BM01", to: undefined },
      { field: "price", from: 20000, to: undefined },
    ]);
  });

  it("dòng sửa (update): chỉ trả về trường thực sự thay đổi", () => {
    const changes = diffAuditValues(
      { code: "BM01", price: 20000, status: "active" },
      { code: "BM01", price: 25000, status: "active" },
    );
    expect(changes).toEqual([{ field: "price", from: 20000, to: 25000 }]);
  });

  it("không có thay đổi thực sự -> trả về mảng rỗng", () => {
    const changes = diffAuditValues({ code: "BM01" }, { code: "BM01" });
    expect(changes).toEqual([]);
  });

  it("cả 2 giá trị đều rỗng -> mảng rỗng", () => {
    expect(diffAuditValues(null, null)).toEqual([]);
  });
});
