// Tạo tài khoản đăng nhập (dùng khóa service_role, chỉ chạy ở máy/máy chủ).
// Cách dùng: node --env-file=.env.local scripts/create-user.mjs <sdt> <mat_khau> <ho_ten> <vai_tro>
// vai_tro: owner | partner | manager | staff (mặc định staff)
import { createClient } from "@supabase/supabase-js";
import { setDefaultResultOrder } from "node:dns";

setDefaultResultOrder("ipv4first");

const [, , phoneArg, passwordArg, fullNameArg, roleArg] = process.argv;

if (!phoneArg || !passwordArg) {
  console.error(
    "Dùng: node --env-file=.env.local scripts/create-user.mjs <sdt> <mat_khau> [ho_ten] [vai_tro]",
  );
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
const fullName = fullNameArg ?? "";
const role = roleArg ?? "staff";

const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email,
  password: passwordArg,
  email_confirm: true,
  user_metadata: { full_name: fullName },
});

if (createError) {
  console.error("Lỗi tạo tài khoản:", createError.message);
  process.exit(1);
}

const userId = created.user.id;

const { error: updateError } = await supabase
  .from("profiles")
  .update({ phone: phoneArg, full_name: fullName, role })
  .eq("id", userId);

if (updateError) {
  console.error("Lỗi cập nhật hồ sơ:", updateError.message);
  process.exit(1);
}

console.log("Đã tạo tài khoản:", { userId, email, role });
