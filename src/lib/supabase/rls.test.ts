// @vitest-environment node
//
// Test phân quyền RLS thật trên database Supabase (không mock). Tự tạo vài
// tài khoản + xe thử nghiệm (tên có timestamp để không đụng dữ liệu thật),
// kiểm tra đúng người thấy đúng việc, rồi xóa sạch sau khi test xong.
//
// Chạy: npm test (cần .env.local có SUPABASE_SERVICE_ROLE_KEY).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { setDefaultResultOrder } from "node:dns";

// Tránh lỗi "fetch failed" ngẫu nhiên do Node thử IPv6 trước rồi mới rớt về IPv4.
setDefaultResultOrder("ipv4first");

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const noSession = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(URL, SERVICE_KEY, noSession);

function anonClient(): SupabaseClient {
  return createClient(URL, ANON_KEY, noSession);
}

const suffix = Date.now();
const TEST_PASSWORD = "TestPass123!@#";

type Key = "partnerA" | "partnerB" | "manager" | "staff";
const users = {} as Record<Key, { id: string; email: string }>;
let cartAId: string;
let cartBId: string;
let productId: string;

async function createTestUser(key: Key, role: string) {
  const email = `test-${suffix}-${key}@vbread.local`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error) throw error;
  const { error: updateError } = await admin
    .from("profiles")
    .update({ role, full_name: `Test ${key}` })
    .eq("id", data.user.id);
  if (updateError) throw updateError;
  users[key] = { id: data.user.id, email };
}

async function signIn(key: Key) {
  const client = anonClient();
  const { error } = await client.auth.signInWithPassword({
    email: users[key].email,
    password: TEST_PASSWORD,
  });
  if (error) throw error;
  return client;
}

beforeAll(async () => {
  await createTestUser("partnerA", "partner");
  await createTestUser("partnerB", "partner");
  await createTestUser("manager", "manager");
  await createTestUser("staff", "staff");

  const { data: cartA, error: cartAError } = await admin
    .from("carts")
    .insert({ code: `TEST-A-${suffix}`, name: "Xe test A", partner_id: users.partnerA.id })
    .select()
    .single();
  if (cartAError) throw cartAError;

  const { data: cartB, error: cartBError } = await admin
    .from("carts")
    .insert({ code: `TEST-B-${suffix}`, name: "Xe test B", partner_id: users.partnerB.id })
    .select()
    .single();
  if (cartBError) throw cartBError;

  cartAId = cartA.id;
  cartBId = cartB.id;

  const { error: scopeError } = await admin
    .from("manager_scopes")
    .insert({ manager_id: users.manager.id, cart_id: cartAId });
  if (scopeError) throw scopeError;

  const { data: product, error: productError } = await admin
    .from("products")
    .insert({ code: `TEST-P-${suffix}`, name: "Món test", unit: "ổ", product_group: "mon_ban" })
    .select()
    .single();
  if (productError) throw productError;
  productId = product.id;
});

afterAll(async () => {
  if (productId) {
    await admin.from("prices").delete().eq("product_id", productId);
    await admin.from("products").delete().eq("id", productId);
  }
  if (cartAId) await admin.from("manager_scopes").delete().eq("cart_id", cartAId);
  if (cartAId || cartBId) {
    await admin.from("carts").delete().in("id", [cartAId, cartBId].filter(Boolean));
  }
  for (const u of Object.values(users)) {
    await admin.auth.admin.deleteUser(u.id);
  }
});

describe("RLS: xe (carts)", () => {
  it("partner A chỉ thấy xe của mình", async () => {
    const client = await signIn("partnerA");
    const { data, error } = await client.from("carts").select("id");
    expect(error).toBeNull();
    expect(data?.map((c) => c.id)).toEqual([cartAId]);
  });

  it("partner B chỉ thấy xe của mình, không thấy xe của partner A", async () => {
    const client = await signIn("partnerB");
    const { data, error } = await client.from("carts").select("id");
    expect(error).toBeNull();
    expect(data?.map((c) => c.id)).toEqual([cartBId]);
  });

  it("manager chỉ thấy xe được gán, không thấy xe khác", async () => {
    const client = await signIn("manager");
    const { data, error } = await client.from("carts").select("id");
    expect(error).toBeNull();
    expect(data?.map((c) => c.id)).toEqual([cartAId]);
  });

  it("staff chưa được gán ca thì không thấy xe nào", async () => {
    const client = await signIn("staff");
    const { data, error } = await client.from("carts").select("id");
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });

  it("chưa đăng nhập (anon) không đọc được bảng xe", async () => {
    const client = anonClient();
    const { error } = await client.from("carts").select("id");
    expect(error).not.toBeNull();
  });
});

describe("RLS: hồ sơ (profiles)", () => {
  it("partner A xem được hồ sơ manager gán vào xe của mình", async () => {
    const client = await signIn("partnerA");
    const { data, error } = await client.from("profiles").select("id").eq("id", users.manager.id);
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
  });

  it("partner B không xem được hồ sơ manager (không thuộc xe của mình)", async () => {
    const client = await signIn("partnerB");
    const { data, error } = await client.from("profiles").select("id").eq("id", users.manager.id);
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });

  it("ai cũng xem được hồ sơ của chính mình", async () => {
    const client = await signIn("staff");
    const { data, error } = await client.from("profiles").select("id").eq("id", users.staff.id);
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
  });
});

describe("RLS: sản phẩm & giá (products, prices)", () => {
  it("ai đã đăng nhập cũng đọc được sản phẩm", async () => {
    const client = await signIn("staff");
    const { data, error } = await client.from("products").select("id").eq("id", productId);
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
  });

  it("partner không thêm được sản phẩm mới (chỉ owner)", async () => {
    const client = await signIn("partnerA");
    const { error } = await client
      .from("products")
      .insert({ code: `TEST-P2-${suffix}`, name: "Không được phép", unit: "ổ", product_group: "mon_ban" });
    expect(error).not.toBeNull();
  });

  it("partner không thêm được giá mới (chỉ owner)", async () => {
    const client = await signIn("partnerA");
    const { error } = await client
      .from("prices")
      .insert({ product_id: productId, price: 20000, effective_date: "2026-01-01" });
    expect(error).not.toBeNull();
  });

  it("chưa đăng nhập không đọc được sản phẩm", async () => {
    const client = anonClient();
    const { error } = await client.from("products").select("id");
    expect(error).not.toBeNull();
  });
});
