// Chu chuoi (owner) dat lai mat khau cho nguoi khac khi ho quen mat khau.
// Cach dung: node --env-file=.env.local scripts/reset-password.mjs <sdt> <mat_khau_moi>
import { createClient } from "@supabase/supabase-js";
import { setDefaultResultOrder } from "node:dns";

setDefaultResultOrder("ipv4first");

const [, , phoneArg, newPasswordArg] = process.argv;

if (!phoneArg || !newPasswordArg) {
  console.error("Dùng: node --env-file=.env.local scripts/reset-password.mjs <sdt> <mat_khau_moi>");
  process.exit(1);
}

function toSyntheticEmail(input) {
  const digits = input.replace(/\D/g, "");
  const local = digits.startsWith("84") ? `0${digits.slice(2)}` : digits;
  return `${local}@vbread.local`;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const email = toSyntheticEmail(phoneArg);

const { data: list, error: listError } = await supabase.auth.admin.listUsers();
if (listError) {
  console.error("Lỗi tìm tài khoản:", listError.message);
  process.exit(1);
}

const user = list.users.find((u) => u.email === email);
if (!user) {
  console.error("Không tìm thấy tài khoản với số điện thoại này:", phoneArg);
  process.exit(1);
}

const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
  password: newPasswordArg,
});

if (updateError) {
  console.error("Lỗi đặt lại mật khẩu:", updateError.message);
  process.exit(1);
}

console.log("Đã đặt lại mật khẩu cho:", phoneArg);
