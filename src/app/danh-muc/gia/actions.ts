"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addPrice(formData: FormData) {
  const productId = String(formData.get("product_id") ?? "");
  const price = Number(formData.get("price"));
  const effectiveDate = String(formData.get("effective_date") ?? "");
  if (!productId || !Number.isFinite(price) || price < 0 || !effectiveDate) return;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  await supabase.from("prices").insert({
    product_id: productId,
    price,
    effective_date: effectiveDate,
    created_by: userData.user?.id,
  });
  revalidatePath("/danh-muc/gia");
}

/** Sửa 1 dòng giá đã nhập (ví dụ nhập nhầm) — vẫn ghi lại audit_logs. */
export async function updatePrice(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const price = Number(formData.get("price"));
  const effectiveDate = String(formData.get("effective_date") ?? "");
  if (!id || !Number.isFinite(price) || price < 0 || !effectiveDate) return;

  const supabase = await createClient();
  await supabase.from("prices").update({ price, effective_date: effectiveDate }).eq("id", id);
  revalidatePath("/danh-muc/gia");
}

/** Xóa 1 dòng giá nhập nhầm — giữ lại trong audit_logs (giá trị cũ được ghi trước khi xóa). */
export async function deletePrice(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("prices").delete().eq("id", id);
  revalidatePath("/danh-muc/gia");
}
