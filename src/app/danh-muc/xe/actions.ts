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

export async function updateCart(formData: FormData) {
  const id = String(formData.get("id"));
  const note = String(formData.get("note") ?? "");
  const status = String(formData.get("status") ?? "active");

  const supabase = await createClient();
  await supabase.from("carts").update({ note, status }).eq("id", id);
  revalidatePath("/danh-muc/xe");
}
