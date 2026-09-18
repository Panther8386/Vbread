export type AuditChange = { field: string; from: unknown; to: unknown };

/** So sánh giá trị cũ/mới của 1 dòng audit_logs, trả về danh sách các trường thay đổi. */
export function diffAuditValues(
  oldValue: Record<string, unknown> | null,
  newValue: Record<string, unknown> | null,
): AuditChange[] {
  if (!oldValue && !newValue) return [];
  if (!oldValue) {
    return Object.entries(newValue!).map(([field, to]) => ({ field, from: undefined, to }));
  }
  if (!newValue) {
    return Object.entries(oldValue).map(([field, from]) => ({ field, from, to: undefined }));
  }

  const fields = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);
  const changes: AuditChange[] = [];
  for (const field of fields) {
    const from = oldValue[field];
    const to = newValue[field];
    if (JSON.stringify(from) !== JSON.stringify(to)) {
      changes.push({ field, from, to });
    }
  }
  return changes;
}
