// Don du lieu thu nghiem con sot lai (tai khoan email @vbread.local bat dau bang
// "test-" hoac "probe-test", va cac xe co code bat dau "TEST-").
import { createClient } from "@supabase/supabase-js";
import { setDefaultResultOrder } from "node:dns";

setDefaultResultOrder("ipv4first");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const { data: cartList } = await supabase.from("carts").select("id, code").like("code", "TEST-%");
if (cartList?.length) {
  const ids = cartList.map((c) => c.id);
  await supabase.from("manager_scopes").delete().in("cart_id", ids);
  await supabase.from("carts").delete().in("id", ids);
  console.log("Da xoa xe test:", cartList.map((c) => c.code));
}

const { data: userList } = await supabase.auth.admin.listUsers();
const testUsers = userList.users.filter(
  (u) => u.email?.startsWith("test-") || u.email?.startsWith("probe-test"),
);
for (const u of testUsers) {
  await supabase.auth.admin.deleteUser(u.id);
  console.log("Da xoa tai khoan test:", u.email);
}

console.log("Xong. Tong cong xoa", testUsers.length, "tai khoan.");
