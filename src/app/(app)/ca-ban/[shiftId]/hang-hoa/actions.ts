"use server";

import { revalidatePath } from "next/cache";
import { authorizeShiftAction } from "../shift-auth";

export type ActionState = { error?: string; success?: boolean };

const MOVEMENT_TYPES = ["nhan", "tra", "huy", "hao_hut"] as const;
type MovementType = (typeof MOVEMENT_TYPES)[number];

export async function addStockMovement(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const shiftId = String(formData.get("shift_id") ?? "");
  const movementType = String(formData.get("movement_type") ?? "");
  const productId = String(formData.get("product_id") ?? "");
  const quantity = Number(formData.get("quantity"));
  const reason = String(formData.get("reason") ?? "").trim();

  if (!shiftId || !productId) return { error: "Thiếu thông tin." };
  if (!MOVEMENT_TYPES.includes(movementType as MovementType)) return { error: "Chọn loại hàng hóa hợp lệ." };
  if (!Number.isFinite(quantity) || quantity <= 0) return { error: "Số lượng phải lớn hơn 0." };
  if ((movementType === "huy" || movementType === "hao_hut") && !reason) {
    return { error: "Bắt buộc nhập lý do khi hủy hàng hoặc hao hụt." };
  }

  const authResult = await authorizeShiftAction(shiftId, "open");
  if ("error" in authResult) return { error: authResult.error };
  const { caller, supabase } = authResult;

  const { error } = await supabase.from("stock_movements").insert({
    shift_id: shiftId,
    product_id: productId,
    movement_type: movementType,
    quantity: Math.floor(quantity),
    reason: reason || null,
    created_by: caller.id,
  });
  if (error) return { error: "Không lưu được, thử lại sau." };

  revalidatePath(`/ca-ban/${shiftId}/hang-hoa`);
  revalidatePath(`/ca-ban/${shiftId}`);
  return { success: true };
}
