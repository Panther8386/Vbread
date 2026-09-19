/** Đổi 1 dòng thành CSV, tự thêm ngoặc kép khi ô có dấu phẩy/ngoặc kép/xuống dòng. */
export function csvRow(cells: (string | number)[]): string {
  return cells
    .map((c) => {
      const s = String(c);
      return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    })
    .join(",");
}

/** Ghép nhiều dòng thành nội dung CSV hoàn chỉnh (CRLF — đúng chuẩn Excel). */
export function toCsv(rows: (string | number)[][]): string {
  return rows.map(csvRow).join("\r\n");
}

/** Thêm BOM UTF-8 để Excel hiển thị đúng tiếng Việt có dấu khi mở file CSV. */
export function csvResponse(content: string, filename: string): Response {
  const withBom = "﻿" + content;
  return new Response(withBom, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
