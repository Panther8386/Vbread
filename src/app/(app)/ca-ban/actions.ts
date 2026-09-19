"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";

export type ActionState = { error?: string; success?: boolean };

export async function createShift(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const caller = await getCurrentUser();
  if (!caller || (caller.role !== "owner" && caller.role !== "partner")) {
    return { error: "Không có quyền phân công ca." };
  }

  const businessDate = String(formData.get("business_date") ?? "");
  const cartId = String(formData.get("cart_id") ?? "");
  const locationId = String(formData.get("location_id") ?? "");
  const shiftTemplateId = String(formData.get("shift_template_id") ?? "");
  const staffIds = [...new Set(formData.getAll("staff_id").map(String).filter(Boolean))];

  if (!businessDate || !cartId || !locationId || !shiftTemplateId) {
    return { error: "Điền đủ ngày, xe, điểm bán và ca." };
  }

  const supabase = await createClient();

  // Doi tac chi phan cong duoc cho xe cua minh - kiem ngay trong code.
  if (caller.role === "partner") {
    const { data: owned } = await supabase
      .from("carts")
      .select("id")
      .eq("id", cartId)
      .eq("partner_id", caller.id)
      .maybeSingle();
    if (!owned) return { error: "Xe này không thuộc quyền quản lý của bạn." };
  }

  // Xe khong duoc doi diem ban trong ngay (da chot o docs/01).
  const { data: sameDayShifts } = await supabase
    .from("shifts")
    .select("location_id")
    .eq("cart_id", cartId)
    .eq("business_date", businessDate)
    .eq("status", "scheduled");
  const hasOtherLocation = (sameDayShifts ?? []).some((s) => s.location_id !== locationId);
  if (hasOtherLocation) {
    return { error: "Xe không được đổi điểm bán trong ngày — chọn đúng điểm bán đã dùng cho ngày này." };
  }

  const { data: shift, error: shiftError } = await supabase
    .from("shifts")
    .insert({
      business_date: businessDate,
      cart_id: cartId,
      location_id: locationId,
      shift_template_id: shiftTemplateId,
      created_by: caller.id,
    })
    .select("id")
    .single();

  if (shiftError || !shift) {
    return { error: "Không tạo được ca, thử lại sau." };
  }

  if (staffIds.length > 0) {
    const { error: staffError } = await supabase
      .from("shift_staff")
      .insert(staffIds.map((staffId) => ({ shift_id: shift.id, staff_id: staffId })));
    if (staffError) {
      return { error: "Tạo ca xong nhưng chưa gán được nhân viên — mở lại ca này để gán sau." };
    }
  }

  revalidatePath("/ca-ban");
  return { success: true };
}

export async function cancelShift(formData: FormData) {
  const caller = await getCurrentUser();
  if (!caller || (caller.role !== "owner" && caller.role !== "partner")) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("shifts").update({ status: "cancelled" }).eq("id", id).eq("status", "scheduled");
  revalidatePath("/ca-ban");
}
