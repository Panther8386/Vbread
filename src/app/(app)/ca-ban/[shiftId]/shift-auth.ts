import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";

const STATUS_MESSAGE: Record<"scheduled" | "open", string> = {
  scheduled: "Ca này đã mở hoặc đã hủy, không thực hiện lại được.",
  open: "Ca chưa mở hoặc đã đóng, không thực hiện được.",
};

/**
 * Kiểm quyền chung cho các thao tác trên 1 ca cụ thể: chỉ owner, đối tác của
 * xe, hoặc nhân viên được phân công vào ca mới thao tác được — và ca phải
 * đúng trạng thái yêu cầu (mở ca cần "scheduled", bán hàng/hàng hóa cần "open").
 */
export async function authorizeShiftAction(shiftId: string, requiredStatus: "scheduled" | "open") {
  const caller = await getCurrentUser();
  if (!caller) return { error: "Chưa đăng nhập." } as const;

  const supabase = await createClient();
  const { data: shift } = await supabase
    .from("shifts")
    .select("id, cart_id, status")
    .eq("id", shiftId)
    .maybeSingle();
  if (!shift) return { error: "Không tìm thấy ca." } as const;
  if (shift.status !== requiredStatus) return { error: STATUS_MESSAGE[requiredStatus] } as const;

  if (caller.role === "partner") {
    const { data: owned } = await supabase
      .from("carts")
      .select("id")
      .eq("id", shift.cart_id)
      .eq("partner_id", caller.id)
      .maybeSingle();
    if (!owned) return { error: "Bạn không phụ trách xe của ca này." } as const;
  } else if (caller.role === "staff") {
    const { data: assigned } = await supabase
      .from("shift_staff")
      .select("shift_id")
      .eq("shift_id", shiftId)
      .eq("staff_id", caller.id)
      .maybeSingle();
    if (!assigned) return { error: "Bạn không được phân công vào ca này." } as const;
  } else if (caller.role !== "owner") {
    return { error: "Không có quyền thực hiện." } as const;
  }

  return { caller, supabase, shift } as const;
}
