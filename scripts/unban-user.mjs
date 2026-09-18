// Khan cap: mo khoa dang nhap + kich hoat lai 1 tai khoan.
// Cach dung: node --env-file=.env.local scripts/unban-user.mjs <sdt>
import { createClient } from "@supabase/supabase-js";
import { setDefaultResultOrder } from "node:dns";

setDefaultResultOrder("ipv4first");

const [, , phoneArg] = process.argv;

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
const { data: list } = await supabase.auth.admin.listUsers();
const user = list.users.find((u) => u.email === email);
if (!user) {
  console.error("Không tìm thấy tài khoản:", phoneArg);
  process.exit(1);
}

await supabase.auth.admin.updateUserById(user.id, { ban_duration: "none" });
await supabase.from("profiles").update({ status: "active" }).eq("id", user.id);

console.log("Đã mở khóa và kích hoạt lại:", phoneArg, user.id);
