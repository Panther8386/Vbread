"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";

export type CartActionState = { error?: string; success?: boolean };

export async function createCart(formData: FormData) {
  const user = await getCurrentUser();
  if (user?.role !== "owner") return;

  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const partnerId = String(formData.get("partner_id") ?? "").trim();
  if (!code || !name) return;

  const supabase = await createClient();
  // Xe moi tao luon "Chua hoat dong" - chi chuyen "Dang hoat dong" khi co
  // nhan vien duoc phan cong vao 1 ca cu the (xem createShift).
  await supabase.from("carts").insert({
    code,
    name,
    partner_id: partnerId || null,
    status: "inactive",
  });
  revalidatePath("/danh-muc/xe");
}

/** Owner sửa đầy đủ: mã, tên, đối tác, trạng thái. */
export async function updateCartFull(
  _prevState: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const user = await getCurrentUser();
  if (user?.role !== "owner") return { error: "Không có quyền." };

  const id = String(formData.get("id"));
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const partnerId = String(formData.get("partner_id") ?? "").trim();
  const status = String(formData.get("status") ?? "active");
  if (!id || !code || !name) return { error: "Điền đủ mã xe và tên xe." };

  const supabase = await createClient();

  // Xe chua gan doi tac VA chua tung co ca nao thi khong duoc "Dang hoat dong".
  // (Kich hoat that su xay ra tu dong khi co nhan vien duoc phan cong vao 1 ca
  // cu the - xem createShift. O day chi la lop chan an toan khi owner tu sua tay.)
  if (status === "active" && !partnerId) {
    const { count } = await supabase
      .from("shifts")
      .select("id", { count: "exact", head: true })
      .eq("cart_id", id);
    if (!count) {
      return {
        error: "Xe chưa gán đối tác và chưa có ca nào — không thể chuyển sang Đang hoạt động.",
      };
    }
  }

  const { error } = await supabase
    .from("carts")
    .update({ code, name, partner_id: partnerId || null, status })
    .eq("id", id);
  if (error) return { error: "Không lưu được thay đổi." };

  revalidatePath("/danh-muc/xe");
  revalidatePath("/danh-muc/tai-khoan");
  return { success: true };
}

/** Đối tác chỉ sửa ghi chú/trạng thái xe của mình (RLS đã chặn xe không phải của họ). */
export async function updateCart(formData: FormData) {
  const id = String(formData.get("id"));
  const note = String(formData.get("note") ?? "");
  const status = String(formData.get("status") ?? "active");

  const supabase = await createClient();
  await supabase.from("carts").update({ note, status }).eq("id", id);
  revalidatePath("/danh-muc/xe");
}
