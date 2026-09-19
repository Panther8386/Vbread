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

describe("RLS: ca bán (shifts)", () => {
  let locationId: string;
  let templateId: string;
  let shiftAId: string;

  beforeAll(async () => {
    const { data: location, error: locationError } = await admin
      .from("locations")
      .insert({ name: `Điểm test ${suffix}` })
      .select()
      .single();
    if (locationError) throw locationError;
    locationId = location.id;

    const { data: template, error: templateError } = await admin
      .from("shift_templates")
      .insert({ name: `Ca test ${suffix}`, start_time: "06:00", end_time: "14:00" })
      .select()
      .single();
    if (templateError) throw templateError;
    templateId = template.id;

    const { data: shiftA, error: shiftAError } = await admin
      .from("shifts")
      .insert({
        business_date: "2026-01-01",
        cart_id: cartAId,
        location_id: locationId,
        shift_template_id: templateId,
      })
      .select()
      .single();
    if (shiftAError) throw shiftAError;
    shiftAId = shiftA.id;

    const { error: staffError } = await admin
      .from("shift_staff")
      .insert({ shift_id: shiftAId, staff_id: users.staff.id });
    if (staffError) throw staffError;
  });

  afterAll(async () => {
    if (shiftAId) {
      await admin.from("shift_staff").delete().eq("shift_id", shiftAId);
      await admin.from("shifts").delete().eq("cart_id", cartAId).eq("business_date", "2026-01-03");
      await admin.from("shifts").delete().eq("id", shiftAId);
    }
    if (templateId) await admin.from("shift_templates").delete().eq("id", templateId);
    if (locationId) await admin.from("locations").delete().eq("id", locationId);
  });

  it("partner A thấy ca của xe mình", async () => {
    const client = await signIn("partnerA");
    const { data, error } = await client.from("shifts").select("id").eq("id", shiftAId);
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
  });

  it("partner B không thấy ca của xe A", async () => {
    const client = await signIn("partnerB");
    const { data, error } = await client.from("shifts").select("id").eq("id", shiftAId);
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });

  it("manager (được gán xe A) đọc được ca nhưng không tạo được ca mới", async () => {
    const client = await signIn("manager");
    const { data, error } = await client.from("shifts").select("id").eq("id", shiftAId);
    expect(error).toBeNull();
    expect(data?.length).toBe(1);

    const { error: insertError } = await client.from("shifts").insert({
      business_date: "2026-01-02",
      cart_id: cartAId,
      location_id: locationId,
      shift_template_id: templateId,
    });
    expect(insertError).not.toBeNull();
  });

  it("staff được gán vào ca thấy đúng ca đó và xem được tên xe của ca", async () => {
    const client = await signIn("staff");
    const { data, error } = await client.from("shifts").select("id").eq("id", shiftAId);
    expect(error).toBeNull();
    expect(data?.length).toBe(1);

    const { data: cart, error: cartError } = await client.from("carts").select("id").eq("id", cartAId);
    expect(cartError).toBeNull();
    expect(cart?.length).toBe(1);
  });

  it("partner A tự phân công ca mới cho xe mình được (RLS cho phép insert)", async () => {
    const client = await signIn("partnerA");
    const { error } = await client.from("shifts").insert({
      business_date: "2026-01-03",
      cart_id: cartAId,
      location_id: locationId,
      shift_template_id: templateId,
    });
    expect(error).toBeNull();
  });

  it("chưa đăng nhập không đọc được ca", async () => {
    const client = anonClient();
    const { error } = await client.from("shifts").select("id");
    expect(error).not.toBeNull();
  });
});

describe("RLS: mở ca (stock_movements)", () => {
  let locationId: string;
  let templateId: string;
  let shiftAId: string;
  let movementId: string;
  let staff2Email: string;

  beforeAll(async () => {
    const { data: location, error: locationError } = await admin
      .from("locations")
      .insert({ name: `Điểm mở ca ${suffix}` })
      .select()
      .single();
    if (locationError) throw locationError;
    locationId = location.id;

    const { data: template, error: templateError } = await admin
      .from("shift_templates")
      .insert({ name: `Ca mở ca ${suffix}`, start_time: "06:00", end_time: "14:00" })
      .select()
      .single();
    if (templateError) throw templateError;
    templateId = template.id;

    const { data: shiftA, error: shiftAError } = await admin
      .from("shifts")
      .insert({
        business_date: "2026-02-01",
        cart_id: cartAId,
        location_id: locationId,
        shift_template_id: templateId,
      })
      .select()
      .single();
    if (shiftAError) throw shiftAError;
    shiftAId = shiftA.id;

    const { error: staffError } = await admin
      .from("shift_staff")
      .insert({ shift_id: shiftAId, staff_id: users.staff.id });
    if (staffError) throw staffError;

    staff2Email = `test-${suffix}-staff2@vbread.local`;
    const { data: staff2, error: staff2Error } = await admin.auth.admin.createUser({
      email: staff2Email,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    if (staff2Error) throw staff2Error;
    await admin.from("profiles").update({ role: "staff", full_name: "Test staff2" }).eq("id", staff2.user.id);
  });

  afterAll(async () => {
    if (movementId) await admin.from("stock_movements").delete().eq("id", movementId);
    if (shiftAId) {
      await admin.from("shift_staff").delete().eq("shift_id", shiftAId);
      await admin.from("shifts").delete().eq("id", shiftAId);
    }
    if (templateId) await admin.from("shift_templates").delete().eq("id", templateId);
    if (locationId) await admin.from("locations").delete().eq("id", locationId);
    const { data: list } = await admin.auth.admin.listUsers();
    const staff2 = list.users.find((u) => u.email === staff2Email);
    if (staff2) await admin.auth.admin.deleteUser(staff2.id);
  });

  it("nhân viên được gán vào ca ghi được phiếu nhận hàng đầu ca", async () => {
    const client = await signIn("staff");
    const { data, error } = await client
      .from("stock_movements")
      .insert({ shift_id: shiftAId, product_id: productId, movement_type: "nhan", quantity: 5 })
      .select()
      .single();
    expect(error).toBeNull();
    expect(data?.quantity).toBe(5);
    movementId = data!.id;
  });

  it("nhân viên khác (không được gán vào ca này) không ghi được phiếu kho", async () => {
    const client = anonClient();
    const { error: signInError } = await client.auth.signInWithPassword({
      email: staff2Email,
      password: TEST_PASSWORD,
    });
    expect(signInError).toBeNull();
    const { error } = await client
      .from("stock_movements")
      .insert({ shift_id: shiftAId, product_id: productId, movement_type: "nhan", quantity: 3 });
    expect(error).not.toBeNull();
  });

  it("partner B không thấy phiếu kho của ca thuộc xe A", async () => {
    const client = await signIn("partnerB");
    const { data, error } = await client.from("stock_movements").select("id").eq("shift_id", shiftAId);
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });

  it("chưa đăng nhập không đọc được phiếu kho", async () => {
    const client = anonClient();
    const { error } = await client.from("stock_movements").select("id");
    expect(error).not.toBeNull();
  });
});

describe("RLS: bán hàng (sales)", () => {
  let locationId: string;
  let templateId: string;
  let shiftAId: string;
  let saleId: string;
  let staff2Email: string;

  beforeAll(async () => {
    const { data: location, error: locationError } = await admin
      .from("locations")
      .insert({ name: `Điểm bán hàng ${suffix}` })
      .select()
      .single();
    if (locationError) throw locationError;
    locationId = location.id;

    const { data: template, error: templateError } = await admin
      .from("shift_templates")
      .insert({ name: `Ca bán hàng ${suffix}`, start_time: "06:00", end_time: "14:00" })
      .select()
      .single();
    if (templateError) throw templateError;
    templateId = template.id;

    const { data: shiftA, error: shiftAError } = await admin
      .from("shifts")
      .insert({
        business_date: "2026-03-01",
        cart_id: cartAId,
        location_id: locationId,
        shift_template_id: templateId,
        status: "open",
      })
      .select()
      .single();
    if (shiftAError) throw shiftAError;
    shiftAId = shiftA.id;

    const { error: staffError } = await admin
      .from("shift_staff")
      .insert({ shift_id: shiftAId, staff_id: users.staff.id });
    if (staffError) throw staffError;

    staff2Email = `test-${suffix}-sale-staff2@vbread.local`;
    const { data: staff2, error: staff2Error } = await admin.auth.admin.createUser({
      email: staff2Email,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    if (staff2Error) throw staff2Error;
    await admin.from("profiles").update({ role: "staff", full_name: "Test sale staff2" }).eq("id", staff2.user.id);

    await admin.from("prices").insert({ product_id: productId, price: 20000, effective_date: "2026-01-01" });
  });

  afterAll(async () => {
    if (saleId) {
      await admin.from("stock_movements").delete().eq("sale_id", saleId);
      await admin.from("payments").delete().eq("sale_id", saleId);
      await admin.from("sale_items").delete().eq("sale_id", saleId);
      await admin.from("sales").delete().eq("id", saleId);
    }
    if (shiftAId) {
      await admin.from("shift_staff").delete().eq("shift_id", shiftAId);
      await admin.from("shifts").delete().eq("id", shiftAId);
    }
    if (templateId) await admin.from("shift_templates").delete().eq("id", templateId);
    if (locationId) await admin.from("locations").delete().eq("id", locationId);
    const { data: list } = await admin.auth.admin.listUsers();
    const staff2 = list.users.find((u) => u.email === staff2Email);
    if (staff2) await admin.auth.admin.deleteUser(staff2.id);
  });

  it("nhân viên được gán vào ca tạo được đơn bán cho ca đó", async () => {
    const client = await signIn("staff");
    const { data, error } = await client
      .from("sales")
      .insert({ shift_id: shiftAId, cart_id: cartAId, subtotal: 20000, total_amount: 20000 })
      .select()
      .single();
    expect(error).toBeNull();
    saleId = data!.id;
  });

  it("nhân viên khác (không thuộc ca này) không tạo được đơn bán", async () => {
    const client = anonClient();
    const { error: signInError } = await client.auth.signInWithPassword({
      email: staff2Email,
      password: TEST_PASSWORD,
    });
    expect(signInError).toBeNull();
    const { error } = await client
      .from("sales")
      .insert({ shift_id: shiftAId, cart_id: cartAId, subtotal: 10000, total_amount: 10000 });
    expect(error).not.toBeNull();
  });

  it("partner B không thấy đơn bán thuộc xe A", async () => {
    const client = await signIn("partnerB");
    const { data, error } = await client.from("sales").select("id").eq("id", saleId);
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });

  it("chưa đăng nhập không đọc được đơn bán", async () => {
    const client = anonClient();
    const { error } = await client.from("sales").select("id");
    expect(error).not.toBeNull();
  });
});
