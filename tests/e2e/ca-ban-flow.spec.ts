import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { setDefaultResultOrder } from "node:dns";

// Tranh loi "fetch failed" ngau nhien do Node thu IPv6 truoc roi moi rot ve IPv4
// (giong ly do da xu ly trong src/lib/supabase/rls.test.ts).
setDefaultResultOrder("ipv4first");

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TEST_PASSWORD = "TestPass123!@#";

const admin = createClient(URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const suffix = Date.now();
const partnerPhone = `09${String(suffix).slice(-8)}`;
const partnerEmail = `${partnerPhone}@vbread.local`;

let partnerId: string;
let staffId: string;
let cartId: string;
let locationId: string;
let templateId: string;
let productId: string;

test.describe("Luồng chính: phân công ca → mở ca → bán hàng → đóng ca → duyệt", () => {
  test.beforeAll(async () => {
    const { data: partner, error: partnerError } = await admin.auth.admin.createUser({
      email: partnerEmail,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    if (partnerError) throw partnerError;
    partnerId = partner.user.id;
    await admin.from("profiles").update({ phone: partnerPhone, role: "partner", full_name: "Đối tác E2E" }).eq("id", partnerId);

    const staffEmail = `e2e-staff-${suffix}@vbread.local`;
    const { data: staff, error: staffError } = await admin.auth.admin.createUser({
      email: staffEmail,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    if (staffError) throw staffError;
    staffId = staff.user.id;
    await admin
      .from("profiles")
      .update({ phone: `08${String(suffix).slice(-8)}`, role: "staff", full_name: "Nhân viên E2E", created_by: partnerId })
      .eq("id", staffId);

    const { data: cart, error: cartError } = await admin
      .from("carts")
      .insert({ code: `E2E-${suffix}`, name: "Xe kiểm thử E2E", partner_id: partnerId, status: "inactive" })
      .select()
      .single();
    if (cartError) throw cartError;
    cartId = cart.id;

    const { data: location, error: locationError } = await admin
      .from("locations")
      .insert({ name: `Điểm E2E ${suffix}` })
      .select()
      .single();
    if (locationError) throw locationError;
    locationId = location.id;

    const { data: template, error: templateError } = await admin
      .from("shift_templates")
      .insert({ name: `Ca E2E ${suffix}`, start_time: "06:00", end_time: "14:00" })
      .select()
      .single();
    if (templateError) throw templateError;
    templateId = template.id;

    const { data: product, error: productError } = await admin
      .from("products")
      .insert({ code: `E2E-P-${suffix}`, name: "Bánh mì kiểm thử", unit: "ổ", product_group: "mon_ban" })
      .select()
      .single();
    if (productError) throw productError;
    productId = product.id;
    await admin.from("prices").insert({ product_id: productId, price: 25000, effective_date: "2020-01-01" });
  });

  // Don du lieu test that su can than: 1 buoc loi khong duoc chan cac buoc
  // sau (tung xay ra that: 1 loi mang giua chung lam sot lai xe/diem ban/ca
  // mau vi cac buoc xoa phia sau khong chay toi).
  async function safeDelete(label: string, run: () => PromiseLike<{ error: unknown }>) {
    try {
      const { error } = await run();
      if (error) console.log(`[don du lieu E2E] Loi khi ${label}:`, error);
    } catch (err) {
      console.log(`[don du lieu E2E] Loi khi ${label}:`, err);
    }
  }

  test.afterAll(async () => {
    const { data: shifts } = await admin.from("shifts").select("id").eq("cart_id", cartId);
    const shiftIds = (shifts ?? []).map((s) => s.id);
    if (shiftIds.length > 0) {
      const { data: sales } = await admin.from("sales").select("id").in("shift_id", shiftIds);
      const saleIds = (sales ?? []).map((s) => s.id);
      // stock_movements tham chieu ca shift_id lan sale_id (dong "ban" gan voi
      // 1 don) nen phai xoa TRUOC sales, khong phai sau - thu tu sai truoc do
      // lam sot du lieu vi xoa sales bi chan boi stock_movements con tham chieu.
      await safeDelete("xóa stock_movements", () => admin.from("stock_movements").delete().in("shift_id", shiftIds));
      if (saleIds.length > 0) {
        await safeDelete("xóa payments", () => admin.from("payments").delete().in("sale_id", saleIds));
        await safeDelete("xóa sale_items", () => admin.from("sale_items").delete().in("sale_id", saleIds));
        await safeDelete("xóa sales", () => admin.from("sales").delete().in("id", saleIds));
      }
      await safeDelete("xóa shift_handovers", () => admin.from("shift_handovers").delete().in("shift_id", shiftIds));
      await safeDelete("xóa shift_payment_counts", () =>
        admin.from("shift_payment_counts").delete().in("shift_id", shiftIds),
      );
      await safeDelete("xóa shift_staff", () => admin.from("shift_staff").delete().in("shift_id", shiftIds));
      await safeDelete("xóa shifts", () => admin.from("shifts").delete().in("id", shiftIds));
    }
    if (productId) {
      await safeDelete("xóa prices", () => admin.from("prices").delete().eq("product_id", productId));
      await safeDelete("xóa products", () => admin.from("products").delete().eq("id", productId));
    }
    if (templateId) await safeDelete("xóa shift_templates", () => admin.from("shift_templates").delete().eq("id", templateId));
    if (locationId) await safeDelete("xóa locations", () => admin.from("locations").delete().eq("id", locationId));
    if (cartId) await safeDelete("xóa carts", () => admin.from("carts").delete().eq("id", cartId));

    // audit_logs khong bao gio xoa voi du lieu nghiep vu that (dung theo
    // CLAUDE.md), nhung day la du lieu test thuan tuy - xoa luon de khong
    // con gi tham chieu toi profiles, moi xoa duoc tai khoan test o duoi.
    const actorIds = [partnerId, staffId].filter(Boolean);
    if (actorIds.length > 0) {
      await safeDelete("xóa audit_logs của tài khoản test", () =>
        admin.from("audit_logs").delete().in("changed_by", actorIds),
      );
    }
    // Xoa nhan vien TRUOC doi tac: profiles.created_by cua nhan vien tro toi
    // doi tac, xoa doi tac truoc se bi chan boi chinh dong nhan vien nay.
    if (staffId) await safeDelete("xóa tài khoản nhân viên", () => admin.auth.admin.deleteUser(staffId));
    if (partnerId) await safeDelete("xóa tài khoản đối tác", () => admin.auth.admin.deleteUser(partnerId));
  });

  test("đối tác đi hết luồng: phân công ca, mở ca, bán hàng, đóng ca, duyệt", async ({ page }) => {
    await test.step("Đăng nhập", async () => {
      await page.goto("/login");
      await page.getByLabel("Số điện thoại").fill(partnerPhone);
      await page.getByLabel("Mật khẩu").fill(TEST_PASSWORD);
      await page.getByRole("button", { name: "Đăng nhập" }).click();
      await page.waitForURL(/\/danh-muc/);
    });

    let shiftId = "";

    await test.step("Phân công ca", async () => {
      await page.goto("/ca-ban");
      await page.locator('select[name="cart_id"]').selectOption(cartId);
      await page.locator('select[name="location_id"]').selectOption(locationId);
      await page.locator('select[name="shift_template_id"]').selectOption(templateId);
      await page.locator(`input[name="staff_id"][value="${staffId}"]`).check();
      await page.getByRole("button", { name: "Phân công ca" }).click();
      await expect(page.getByText("Đã phân công ca thành công.")).toBeVisible();

      const shiftLink = page.locator(`li:has-text("E2E-${suffix}")`).getByRole("link", { name: /Xem chi tiết/ });
      await expect(shiftLink).toBeVisible();
      const href = await shiftLink.getAttribute("href");
      shiftId = href!.split("/").pop()!;
      expect(shiftId).toBeTruthy();
    });

    await test.step("Mở ca", async () => {
      await page.goto(`/ca-ban/${shiftId}`);
      await page.getByLabel("Tiền lẻ đầu ca (đồng)").fill("500000");
      await page.locator(`input[name="qty_${productId}"]`).fill("10");
      await page.getByRole("button", { name: "Mở ca" }).click();
      await expect(page.getByText("Đang mở ca")).toBeVisible();
    });

    let saleId = "";

    await test.step("Bán hàng", async () => {
      await page.getByRole("link", { name: "Bán hàng" }).click();
      await page.waitForURL(/\/ban-hang$/);
      await page.getByRole("button", { name: /Bánh mì kiểm thử/ }).click();
      await page.getByRole("button", { name: "Thanh toán" }).click();
      await page.waitForURL(/\/ban-hang\/[^/]+$/);
      await expect(page.getByText("Hóa đơn bán hàng")).toBeVisible();
      await expect(page.getByText("Bánh mì kiểm thử × 1")).toBeVisible();
      saleId = page.url().split("/").pop()!;
      expect(saleId).toBeTruthy();
    });

    await test.step("Đóng ca (không lệch, không cần lý do)", async () => {
      await page.goto(`/ca-ban/${shiftId}`);
      await page.getByRole("link", { name: "Đóng ca" }).click();
      await page.waitForURL(/\/dong-ca$/);
      await page.getByRole("button", { name: "Đóng ca" }).click();
      await page.waitForURL(new RegExp(`/ca-ban/${shiftId}$`));
      await expect(page.getByText("Chờ duyệt", { exact: true })).toBeVisible();
    });

    await test.step("Duyệt ca", async () => {
      await page.getByRole("button", { name: "Duyệt ca" }).click();
      await expect(page.getByText(/Đã duyệt bởi Đối tác E2E/)).toBeVisible();
    });
  });
});
