/** Chuẩn hóa số điện thoại Việt Nam về dạng E.164 (+84...) mà Supabase Auth yêu cầu. */
export function toE164Vietnam(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("84")) return `+${digits}`;
  if (digits.startsWith("0")) return `+84${digits.slice(1)}`;
  return `+${digits}`;
}

/**
 * Supabase project này không bật provider Phone (cần dịch vụ SMS trả phí).
 * Đăng nhập thật vẫn dùng số điện thoại + mật khẩu ở giao diện, nhưng phía sau
 * dùng provider Email có sẵn — đổi số điện thoại thành 1 "email giả" duy nhất
 * theo số điện thoại, không phải email thật, người dùng không cần biết.
 */
export function toSyntheticEmail(input: string): string {
  const digits = input.replace(/\D/g, "");
  const local = digits.startsWith("84") ? `0${digits.slice(2)}` : digits;
  return `${local}@vbread.local`;
}

/**
 * Kiểm tra số điện thoại di động Việt Nam hợp lệ: 10 số bắt đầu bằng 0
 * (hoặc +84) và đầu số di động hợp lệ (03/05/07/08/09).
 */
export function isValidVietnamesePhone(input: string): boolean {
  const digits = input.replace(/\D/g, "");
  const local = digits.startsWith("84") ? `0${digits.slice(2)}` : digits;
  return /^0(3|5|7|8|9)\d{8}$/.test(local);
}
