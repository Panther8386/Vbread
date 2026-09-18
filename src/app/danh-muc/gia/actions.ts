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
