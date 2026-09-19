"use server";

import { revalidatePath } from "next/cache";
import { authorizeShiftAction } from "../shift-auth";

export type ActionState = { error?: string; success?: boolean };

export async function createHandover(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const shiftId = String(formData.get("shift_id") ?? "");
  const toStaffId = String(formData.get("to_staff_id") ?? "");
  const cashRaw = formData.get("cash_handed_over");
  const cash = Number(cashRaw);
  const note = String(formData.get("note") ?? "").trim();

  if (!shiftId || !toStaffId) return { error: "Chọn người nhận ca." };
  if (!cashRaw || !Number.isFinite(cash) || cash < 0) {
    return { error: "Nhập số tiền mặt bàn giao hợp lệ (số nguyên, không âm)." };
  }

  const authResult = await authorizeShiftAction(shiftId, "open");
  if ("error" in authResult) return { error: authResult.error };
  const { caller, supabase } = authResult;

  if (toStaffId === caller.id) return { error: "Không thể tự bàn giao cho chính mình." };

  const { data: recipientInShift } = await supabase
    .from("shift_staff")
    .select("shift_id")
    .eq("shift_id", shiftId)
    .eq("staff_id", toStaffId)
    .maybeSingle();
  if (!recipientInShift) return { error: "Người nhận phải là nhân viên được phân công vào ca này." };

  const { error } = await supabase.from("shift_handovers").insert({
    shift_id: shiftId,
    from_staff_id: caller.id,
    to_staff_id: toStaffId,
    cash_handed_over: Math.floor(cash),
    note: note || null,
    created_by: caller.id,
  });
  if (error) return { error: "Không tạo được phiếu bàn giao, thử lại sau." };

  revalidatePath(`/ca-ban/${shiftId}/ban-giao`);
  return { success: true };
}

export async function confirmHandover(formData: FormData) {
  const shiftId = String(formData.get("shift_id") ?? "");
  const handoverId = String(formData.get("handover_id") ?? "");
  if (!shiftId || !handoverId) return;

  const authResult = await authorizeShiftAction(shiftId, "open");
  if ("error" in authResult) return;
  const { caller, supabase } = authResult;

  const { data: handover } = await supabase
    .from("shift_handovers")
    .select("to_staff_id, confirmed_at")
    .eq("id", handoverId)
    .maybeSingle();
  if (!handover || handover.confirmed_at) return;
  // Nhan vien chi tu xac nhan duoc dong danh cho chinh minh; owner/partner
  // cua xe (da qua authorizeShiftAction) thi duyet thay duoc.
  if (caller.role === "staff" && handover.to_staff_id !== caller.id) return;

  await supabase
    .from("shift_handovers")
    .update({ confirmed_at: new Date().toISOString() })
    .eq("id", handoverId)
    .is("confirmed_at", null);

  revalidatePath(`/ca-ban/${shiftId}/ban-giao`);
}
