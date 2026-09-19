"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { authorizeShiftAction } from "./shift-auth";

export type ActionState = { error?: string; success?: boolean };

export async function openShift(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const shiftId = String(formData.get("shift_id") ?? "");
  const openingCashRaw = formData.get("opening_cash");
  const openingCash = Number(openingCashRaw);
  if (!shiftId || !openingCashRaw || !Number.isFinite(openingCash) || openingCash < 0) {
    return { error: "Nhập tiền lẻ đầu ca hợp lệ (số nguyên, không âm)." };
  }

  const authResult = await authorizeShiftAction(shiftId, "scheduled");
  if ("error" in authResult) return { error: authResult.error };
  const { caller, supabase } = authResult;

  const productIds = formData.getAll("product_id").map(String);
  const movements: { shift_id: string; product_id: string; movement_type: "nhan"; quantity: number; created_by: string }[] = [];
  for (const productId of productIds) {
    const qty = Number(formData.get(`qty_${productId}`));
    if (Number.isFinite(qty) && qty > 0) {
      movements.push({
        shift_id: shiftId,
        product_id: productId,
        movement_type: "nhan",
        quantity: Math.floor(qty),
        created_by: caller.id,
      });
    }
  }

  if (movements.length > 0) {
    const { error: movementError } = await supabase.from("stock_movements").insert(movements);
    if (movementError) return { error: "Không lưu được hàng nhận đầu ca, thử lại sau." };
  }

  const { error: shiftError } = await supabase
    .from("shifts")
    .update({
      status: "open",
      opening_cash: Math.floor(openingCash),
      opened_at: new Date().toISOString(),
      opened_by: caller.id,
    })
    .eq("id", shiftId)
    .eq("status", "scheduled");
  if (shiftError) return { error: "Không mở được ca, thử lại sau." };

  revalidatePath(`/ca-ban/${shiftId}`);
  revalidatePath("/ca-ban");
  return { success: true };
}

/** Duyệt ca sau khi đóng ca — chỉ đối tác của xe hoặc chủ đầu tư (không phải quản lý). */
export async function approveShift(formData: FormData) {
  const caller = await getCurrentUser();
  if (!caller) return;

  const shiftId = String(formData.get("shift_id") ?? "");
  if (!shiftId) return;

  const supabase = await createClient();
  const { data: shift } = await supabase.from("shifts").select("cart_id, status").eq("id", shiftId).maybeSingle();
  if (!shift || shift.status !== "pending_review") return;

  if (caller.role === "partner") {
    const { data: owned } = await supabase
      .from("carts")
      .select("id")
      .eq("id", shift.cart_id)
      .eq("partner_id", caller.id)
      .maybeSingle();
    if (!owned) return;
  } else if (caller.role !== "owner") {
    return;
  }

  await supabase
    .from("shifts")
    .update({ status: "approved", approved_by: caller.id, approved_at: new Date().toISOString() })
    .eq("id", shiftId)
    .eq("status", "pending_review");

  revalidatePath(`/ca-ban/${shiftId}`);
  revalidatePath("/ca-ban");
}
