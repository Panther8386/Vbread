"use server";

import { redirect } from "next/navigation";
import { authorizeShiftAction } from "../shift-auth";
import { calcCashDue, calcEndingStock, calcVariance } from "@/lib/inventory";

export type ActionState = { error?: string };

const OTHER_METHODS = ["chuyen_khoan", "qr", "vi_dien_tu", "khac"] as const;

export async function closeShift(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const shiftId = String(formData.get("shift_id") ?? "");
  if (!shiftId) return { error: "Thiếu thông tin ca." };

  const authResult = await authorizeShiftAction(shiftId, "open");
  if ("error" in authResult) return { error: authResult.error };
  const { caller, supabase } = authResult;

  const { data: shiftRow } = await supabase.from("shifts").select("opening_cash").eq("id", shiftId).single();
  const openingCash = shiftRow?.opening_cash ?? 0;

  // Tinh ton so sach tung san pham tu stock_movements (gop nhan-dau-ca va
  // nhan-them-trong-ca vi ca 2 deu cung movement_type='nhan').
  const { data: movements } = await supabase
    .from("stock_movements")
    .select("product_id, movement_type, quantity")
    .eq("shift_id", shiftId);

  const flowByProduct = new Map<string, { received: number; sold: number; returned: number; wasted: number }>();
  for (const m of movements ?? []) {
    const flow = flowByProduct.get(m.product_id) ?? { received: 0, sold: 0, returned: 0, wasted: 0 };
    if (m.movement_type === "nhan") flow.received += m.quantity;
    else if (m.movement_type === "ban") flow.sold += m.quantity;
    else if (m.movement_type === "tra") flow.returned += m.quantity;
    else if (m.movement_type === "huy" || m.movement_type === "hao_hut") flow.wasted += m.quantity;
    flowByProduct.set(m.product_id, flow);
  }

  // Chi kiem ke san pham thuc su co phat sinh trong ca nay - phai khop dung
  // danh sach ma trang /dong-ca da hien cho nguoi dung nhap.
  const touchedProductIds = [...flowByProduct.keys()];
  const { data: products } =
    touchedProductIds.length > 0
      ? await supabase.from("products").select("id, code, name, unit").in("id", touchedProductIds).order("code")
      : { data: [] };

  // Tinh doanh thu tung phuong thuc thanh toan (chi don chua huy).
  const { data: sales } = await supabase
    .from("sales")
    .select("id")
    .eq("shift_id", shiftId)
    .eq("status", "completed");
  const saleIds = (sales ?? []).map((s) => s.id);
  const { data: payments } =
    saleIds.length > 0
      ? await supabase.from("payments").select("method, amount").in("sale_id", saleIds)
      : { data: [] };
  const revenueByMethod = new Map<string, number>();
  for (const p of payments ?? []) {
    revenueByMethod.set(p.method, (revenueByMethod.get(p.method) ?? 0) + p.amount);
  }

  const cashCountedRaw = formData.get("cash_counted");
  const cashCounted = Number(cashCountedRaw);
  if (!cashCountedRaw || !Number.isFinite(cashCounted) || cashCounted < 0) {
    return { error: "Nhập tiền mặt thực đếm hợp lệ." };
  }
  const cashDue = calcCashDue(openingCash, revenueByMethod.get("tien_mat") ?? 0);
  let hasVariance = calcVariance(cashCounted, cashDue) !== 0;

  const stockMovementsToInsert: { shift_id: string; product_id: string; movement_type: "kiem_ke"; quantity: number; created_by: string }[] = [];
  for (const p of products ?? []) {
    const countedRaw = formData.get(`kiem_ke_${p.id}`);
    const counted = Number(countedRaw);
    if (!countedRaw || !Number.isFinite(counted) || counted < 0) {
      return { error: `Nhập số kiểm kê hợp lệ cho sản phẩm ${p.code}.` };
    }
    const flow = flowByProduct.get(p.id) ?? { received: 0, sold: 0, returned: 0, wasted: 0 };
    const endingStock = calcEndingStock(flow);
    if (calcVariance(Math.floor(counted), endingStock) !== 0) hasVariance = true;
    stockMovementsToInsert.push({
      shift_id: shiftId,
      product_id: p.id,
      movement_type: "kiem_ke",
      quantity: Math.floor(counted),
      created_by: caller.id,
    });
  }

  const otherMethodsUsed = OTHER_METHODS.filter((m) => (revenueByMethod.get(m) ?? 0) > 0);
  const paymentCountsToInsert: { shift_id: string; method: string; counted_amount: number }[] = [];
  for (const method of otherMethodsUsed) {
    const countedRaw = formData.get(`method_${method}`);
    const counted = Number(countedRaw);
    if (!countedRaw || !Number.isFinite(counted) || counted < 0) {
      return { error: "Nhập số tiền thực nhận hợp lệ cho các phương thức đã dùng trong ca." };
    }
    if (calcVariance(Math.floor(counted), revenueByMethod.get(method) ?? 0) !== 0) hasVariance = true;
    paymentCountsToInsert.push({ shift_id: shiftId, method, counted_amount: Math.floor(counted) });
  }

  const reason = String(formData.get("closing_reason") ?? "").trim();
  if (hasVariance && !reason) {
    return { error: "Có chênh lệch — bắt buộc nhập lý do." };
  }

  if (stockMovementsToInsert.length > 0) {
    const { error } = await supabase.from("stock_movements").insert(stockMovementsToInsert);
    if (error) return { error: "Không lưu được kiểm kê, thử lại sau." };
  }

  if (paymentCountsToInsert.length > 0) {
    const { error } = await supabase.from("shift_payment_counts").insert(paymentCountsToInsert);
    if (error) return { error: "Không lưu được đối soát tiền, thử lại sau." };
  }

  const { error: closeError } = await supabase
    .from("shifts")
    .update({
      status: "pending_review",
      cash_counted: Math.floor(cashCounted),
      closing_reason: reason || null,
      closed_at: new Date().toISOString(),
      closed_by: caller.id,
    })
    .eq("id", shiftId)
    .eq("status", "open");
  if (closeError) return { error: "Không đóng được ca, thử lại sau." };

  redirect(`/ca-ban/${shiftId}`);
}
