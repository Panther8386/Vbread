import { test, expect } from "@playwright/test";

test("nhập sai mật khẩu thì thấy thông báo lỗi", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Số điện thoại").fill("0769999369");
  await page.getByLabel("Mật khẩu").fill("mat-khau-sai-123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();

  await expect(page.getByText("Số điện thoại hoặc mật khẩu không đúng.")).toBeVisible();
});
