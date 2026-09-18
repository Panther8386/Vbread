"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createProduct(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const productGroup = String(formData.get("product_group") ?? "");
  if (!code || !name || !unit) return;

  const supabase = await createClient();
  await supabase.from("products").insert({ code, name, unit, product_group: productGroup });
  revalidatePath("/danh-muc/san-pham");
}

export async function updateProduct(formData: FormData) {
  const id = String(formData.get("id"));
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const productGroup = String(formData.get("product_group") ?? "");
  if (!id || !code || !name || !unit) return;

  const supabase = await createClient();
  await supabase
    .from("products")
    .update({ code, name, unit, product_group: productGroup })
    .eq("id", id);
  revalidatePath("/danh-muc/san-pham");
}

export async function toggleProductStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const nextStatus = String(formData.get("nextStatus"));

  const supabase = await createClient();
  await supabase.from("products").update({ status: nextStatus }).eq("id", id);
  revalidatePath("/danh-muc/san-pham");
}
