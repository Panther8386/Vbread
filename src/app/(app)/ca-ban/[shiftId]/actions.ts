"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";

export type ActionState = { error?: string; success?: boolean };

export async function openShift(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const caller = await getCurrentUser();
  if (!caller) return { error: "Chưa đăng nhập." };

  const shiftId = String(formData.get("shift_id") ?? "");
  const openingCashRaw = formData.get("opening_cash");
  const openingCash = Number(openingCashRaw);
  if (!shiftId || !openingCashRaw || !Number.isFinite(openingCash) || openingCash < 0) {
    return { error: "Nhập tiền lẻ đầu ca hợp lệ (số nguyên, không âm)." };
  }

  const supabase = await createClient();

  const { data: shift } = await supabase
    .from("shifts")
    .select("id, cart_id, status")
    .eq("id", shiftId)
    .maybeSingle();
  if (!shift) return { error: "Không tìm thấy ca." };
  if (shift.status !== "scheduled") return { error: "Ca này đã mở hoặc đã hủy, không mở lại được." };

  // Chi owner / partner cua xe / nhan vien trong ca moi mo duoc (RLS cung
  // chan tuong tu o stock_movements, nhung kiem truoc de bao loi ro rang).
  if (caller.role === "partner") {
    const { data: owned } = await supabase
      .from("carts")
      .select("id")
      .eq("id", shift.cart_id)
      .eq("partner_id", caller.id)
      .maybeSingle();
    if (!owned) return { error: "Bạn không phụ trách xe của ca này." };
  } else if (caller.role === "staff") {
    const { data: assigned } = await supabase
      .from("shift_staff")
      .select("shift_id")
      .eq("shift_id", shiftId)
      .eq("staff_id", caller.id)
      .maybeSingle();
    if (!assigned) return { error: "Bạn không được phân công vào ca này." };
  } else if (caller.role !== "owner") {
    return { error: "Không có quyền mở ca." };
  }

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
