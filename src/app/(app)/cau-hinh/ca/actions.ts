"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";

export async function createShiftTemplate(formData: FormData) {
  const user = await getCurrentUser();
  if (user?.role !== "owner") return;

  const name = String(formData.get("name") ?? "").trim();
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");
  if (!name || !startTime || !endTime) return;

  const supabase = await createClient();
  await supabase.from("shift_templates").insert({ name, start_time: startTime, end_time: endTime });
  revalidatePath("/cau-hinh/ca");
}

export async function updateShiftTemplate(formData: FormData) {
  const user = await getCurrentUser();
  if (user?.role !== "owner") return;

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");
  const status = String(formData.get("status") ?? "active");
  if (!id || !name || !startTime || !endTime) return;

  const supabase = await createClient();
  await supabase
    .from("shift_templates")
    .update({ name, start_time: startTime, end_time: endTime, status })
    .eq("id", id);
  revalidatePath("/cau-hinh/ca");
}
