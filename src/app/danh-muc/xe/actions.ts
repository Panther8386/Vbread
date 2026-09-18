"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";

export async function createCart(formData: FormData) {
  const user = await getCurrentUser();
  if (user?.role !== "owner") return;

  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const partnerId = String(formData.get("partner_id") ?? "").trim();
  if (!code || !name) return;

  const supabase = await createClient();
  await supabase.from("carts").insert({
    code,
    name,
    partner_id: partnerId || null,
  });
  revalidatePath("/danh-muc/xe");
}

/** Owner sửa đầy đủ: mã, tên, đối tác, trạng thái. */
export async function updateCartFull(formData: FormData) {
  const user = await getCurrentUser();
  if (user?.role !== "owner") return;

  const id = String(formData.get("id"));
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const partnerId = String(formData.get("partner_id") ?? "").trim();
  const status = String(formData.get("status") ?? "active");
  if (!id || !code || !name) return;

  const supabase = await createClient();
  await supabase
    .from("carts")
    .update({ code, name, partner_id: partnerId || null, status })
    .eq("id", id);
  revalidatePath("/danh-muc/xe");
  revalidatePath("/danh-muc/tai-khoan");
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
