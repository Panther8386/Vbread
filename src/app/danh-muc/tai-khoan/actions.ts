"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/current-user";
import { toSyntheticEmail } from "@/lib/phone";

export type CreateAccountState = { error?: string; success?: boolean };

export async function createAccount(
  _prevState: CreateAccountState,
  formData: FormData,
): Promise<CreateAccountState> {
  const caller = await getCurrentUser();
  if (!caller || (caller.role !== "owner" && caller.role !== "partner")) {
    return { error: "Không có quyền tạo tài khoản." };
  }

  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  const cartId = String(formData.get("cart_id") ?? "").trim() || null;

  if (!phone || !password || !fullName || !role) {
    return { error: "Điền đủ số điện thoại, mật khẩu, họ tên và vai trò." };
  }
  if (password.length < 6) {
    return { error: "Mật khẩu cần ít nhất 6 ký tự." };
  }

  // Doi tac (partner) chi duoc tao staff/manager cho dung xe cua minh - kiem
  // ngay trong code, khong dua vao RLS (vi buoc tao user duoi day dung
  // service_role, bo qua RLS hoan toan).
  if (caller.role === "partner") {
    if (role !== "staff" && role !== "manager") {
      return { error: "Đối tác chỉ tạo được tài khoản nhân viên hoặc quản lý." };
    }
    if (role === "manager" && !cartId) {
      return { error: "Chọn xe để gán quản lý." };
    }
    if (cartId) {
      const supabase = await createClient();
      const { data: cart } = await supabase
        .from("carts")
        .select("id")
        .eq("id", cartId)
        .eq("partner_id", caller.id)
        .maybeSingle();
      if (!cart) return { error: "Xe không thuộc quyền quản lý của bạn." };
    }
  }

  const admin = createAdminClient();
  const email = toSyntheticEmail(phone);

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError) {
    const message = createError.message.includes("already been registered")
      ? "Số điện thoại này đã có tài khoản."
      : "Không tạo được tài khoản, thử lại sau.";
    return { error: message };
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ phone, full_name: fullName, role, created_by: caller.id })
    .eq("id", created.user.id);
  if (updateError) {
    return { error: "Tạo tài khoản xong nhưng chưa gán được vai trò, báo lại kỹ thuật." };
  }

  if (role === "manager" && cartId) {
    await admin.from("manager_scopes").insert({ manager_id: created.user.id, cart_id: cartId });
  }

  revalidatePath("/danh-muc/tai-khoan");
  return { success: true };
}
