"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createLocation(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  await supabase.from("locations").insert({ name, address });
  revalidatePath("/danh-muc/diem-ban");
}

export async function updateLocation(formData: FormData) {
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  if (!id || !name) return;

  const supabase = await createClient();
  await supabase.from("locations").update({ name, address }).eq("id", id);
  revalidatePath("/danh-muc/diem-ban");
}

export async function toggleLocationStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const nextStatus = String(formData.get("nextStatus"));

  const supabase = await createClient();
  await supabase.from("locations").update({ status: nextStatus }).eq("id", id);
  revalidatePath("/danh-muc/diem-ban");
}
