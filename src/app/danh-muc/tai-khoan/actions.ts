"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/current-user";
import { isValidVietnamesePhone, toSyntheticEmail } from "@/lib/phone";

export type ActionState = { error?: string; success?: boolean };

export async function createAccount(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const caller = await getCurrentUser();
  if (!caller || (caller.role !== "owner" && caller.role !== "partner")) {
    return { error: "Không có quyền tạo tài khoản." };
  }

  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  const cartIds = formData.getAll("cart_id").map(String).filter(Boolean);

  if (!phone || !password || !fullName || !role) {
    return { error: "Điền đủ số điện thoại, mật khẩu, họ tên và vai trò." };
  }
  if (!isValidVietnamesePhone(phone)) {
    return { error: "Số điện thoại không hợp lệ (cần 10 số, đầu số di động)." };
  }
  if (password.length < 6) {
    return { error: "Mật khẩu cần ít nhất 6 ký tự." };
  }
  if ((role === "manager" || role === "partner") && cartIds.length === 0) {
    return { error: "Chọn ít nhất 1 xe cho vai trò này." };
  }

  const supabase = await createClient();

  // Doi tac (partner) chi duoc tao staff/manager cho dung xe cua minh - kiem
  // ngay trong code, khong dua vao RLS (vi buoc tao user duoi day dung
  // service_role, bo qua RLS hoan toan).
  if (caller.role === "partner") {
    if (role !== "staff" && role !== "manager") {
      return { error: "Đối tác chỉ tạo được tài khoản nhân viên hoặc quản lý." };
    }
    if (cartIds.length > 0) {
      const { data: ownedCarts } = await supabase
        .from("carts")
        .select("id")
        .in("id", cartIds)
        .eq("partner_id", caller.id);
      if ((ownedCarts?.length ?? 0) !== cartIds.length) {
        return { error: "Có xe không thuộc quyền quản lý của bạn." };
      }
    }
  }

  // Chi owner duoc tao "doi tac": kiem xe chon co dang chua thuoc doi tac nao
  // khac khong, tranh vo tinh chuyen xe cua nguoi khac sang.
  if (role === "partner") {
    const { data: pickedCarts } = await supabase
      .from("carts")
      .select("id, partner_id")
      .in("id", cartIds);
    const alreadyOwned = (pickedCarts ?? []).find((c) => c.partner_id);
    if (alreadyOwned) {
      return { error: "Có xe đã thuộc về đối tác khác, bỏ chọn xe đó hoặc gỡ gán trước." };
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

  if (role === "manager" && cartIds.length > 0) {
    await admin
      .from("manager_scopes")
      .insert(cartIds.map((cartId) => ({ manager_id: created.user.id, cart_id: cartId })));
  }

  if (role === "partner" && cartIds.length > 0) {
    await admin.from("carts").update({ partner_id: created.user.id }).in("id", cartIds);
  }

  revalidatePath("/danh-muc/tai-khoan");
  revalidatePath("/danh-muc/xe");
  return { success: true };
}

export async function updateAccount(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const caller = await getCurrentUser();
  if (caller?.role !== "owner") return { error: "Chỉ chủ đầu tư sửa được tài khoản." };

  const id = String(formData.get("id") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!id || !fullName || !phone) return { error: "Thiếu thông tin." };
  if (!isValidVietnamesePhone(phone)) {
    return { error: "Số điện thoại không hợp lệ." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ full_name: fullName, phone }).eq("id", id);
  if (error) return { error: "Không lưu được thay đổi." };

  revalidatePath("/danh-muc/tai-khoan");
  return { success: true };
}

export async function setAccountStatus(formData: FormData) {
  const caller = await getCurrentUser();
  if (caller?.role !== "owner") return;

  const id = String(formData.get("id") ?? "");
  const nextStatus = String(formData.get("nextStatus") ?? "");
  if (!id || (nextStatus !== "active" && nextStatus !== "inactive")) return;

  const admin = createAdminClient();
  await admin.from("profiles").update({ status: nextStatus }).eq("id", id);
  // Khoa/mo dang nhap that su, khong chi doi trang thai hien thi.
  await admin.auth.admin.updateUserById(id, {
    ban_duration: nextStatus === "inactive" ? "876000h" : "none",
  });

  revalidatePath("/danh-muc/tai-khoan");
}
