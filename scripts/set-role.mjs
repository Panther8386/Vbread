// Cập nhật profile (họ tên, số điện thoại, vai trò) cho tài khoản đã tồn tại.
// Cách dùng: node --env-file=.env.local scripts/set-role.mjs <sdt> <ho_ten> <vai_tro>
import { createClient } from "@supabase/supabase-js";
import { setDefaultResultOrder } from "node:dns";

setDefaultResultOrder("ipv4first");

const [, , phoneArg, fullNameArg, roleArg] = process.argv;

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
  console.error("Không tìm thấy tài khoản với email giả:", email);
  process.exit(1);
}

const { error: updateError } = await supabase
  .from("profiles")
  .update({ phone: phoneArg, full_name: fullNameArg ?? "", role: roleArg ?? "staff" })
  .eq("id", user.id);

if (updateError) {
  console.error("Lỗi cập nhật hồ sơ:", updateError.message);
  process.exit(1);
}

console.log("Đã cập nhật:", { userId: user.id, email, role: roleArg });
