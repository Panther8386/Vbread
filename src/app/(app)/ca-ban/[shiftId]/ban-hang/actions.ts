"use server";

import { redirect } from "next/navigation";
import { calcSaleTotal, calcSubtotal } from "@/lib/sales";
import { authorizeShiftAction } from "../shift-auth";

export type ActionState = { error?: string };

export async function createSale(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const shiftId = String(formData.get("shift_id") ?? "");
  const cartJson = String(formData.get("cart_json") ?? "[]");
  const discountRaw = Number(formData.get("discount_amount") ?? 0);
  const method = String(formData.get("payment_method") ?? "");

  if (!shiftId) return { error: "Thiếu thông tin ca." };
  if (!["tien_mat", "chuyen_khoan", "qr", "vi_dien_tu", "khac"].includes(method)) {
    return { error: "Chọn phương thức thanh toán." };
  }
  const discount = Number.isFinite(discountRaw) && discountRaw > 0 ? Math.floor(discountRaw) : 0;

  let cart: { productId: string; quantity: number }[];
  try {
    cart = JSON.parse(cartJson);
  } catch {
    return { error: "Giỏ hàng không hợp lệ." };
  }
  if (!Array.isArray(cart) || cart.length === 0) {
    return { error: "Chưa chọn món nào." };
  }

  const authResult = await authorizeShiftAction(shiftId, "open");
  if ("error" in authResult) return { error: authResult.error };
  const { caller, supabase, shift } = authResult;

  const productIds = [...new Set(cart.map((c) => c.productId))];
  const { data: prices } = await supabase
    .from("current_prices")
    .select("product_id, price")
    .in("product_id", productIds);
  const priceByProduct = new Map((prices ?? []).map((p) => [p.product_id, p.price]));

  const missing = productIds.filter((id) => !priceByProduct.has(id));
  if (missing.length > 0) {
    return { error: "Có sản phẩm chưa có giá bán, không thể bán được." };
  }

  const items = cart.map((c) => ({
    productId: c.productId,
    quantity: Math.floor(c.quantity),
    unitPrice: priceByProduct.get(c.productId)!,
  }));
  if (items.some((i) => !Number.isFinite(i.quantity) || i.quantity <= 0)) {
    return { error: "Số lượng không hợp lệ." };
  }

  const subtotal = calcSubtotal(items.map((i) => ({ unitPrice: i.unitPrice, quantity: i.quantity })));
  const totalAmount = calcSaleTotal(
    items.map((i) => ({ unitPrice: i.unitPrice, quantity: i.quantity })),
    discount,
  );

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      shift_id: shiftId,
      cart_id: shift.cart_id,
      created_by: caller.id,
      subtotal,
      discount_amount: discount,
      total_amount: totalAmount,
    })
    .select("id")
    .single();
  if (saleError || !sale) return { error: "Không tạo được đơn, thử lại sau." };

  const { error: itemsError } = await supabase.from("sale_items").insert(
    items.map((i) => ({
      sale_id: sale.id,
      product_id: i.productId,
      quantity: i.quantity,
      unit_price: i.unitPrice,
    })),
  );
  if (itemsError) return { error: "Không lưu được các dòng hàng, thử lại sau." };

  const { error: paymentError } = await supabase
    .from("payments")
    .insert({ sale_id: sale.id, method, amount: totalAmount });
  if (paymentError) return { error: "Không lưu được thanh toán, thử lại sau." };

  const { error: movementError } = await supabase.from("stock_movements").insert(
    items.map((i) => ({
      shift_id: shiftId,
      product_id: i.productId,
      movement_type: "ban" as const,
      quantity: i.quantity,
      sale_id: sale.id,
      created_by: caller.id,
    })),
  );
  if (movementError) return { error: "Không trừ được tồn kho, thử lại sau." };

  redirect(`/ca-ban/${shiftId}/ban-hang/${sale.id}`);
}

export async function cancelSale(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const saleId = String(formData.get("sale_id") ?? "");
  const shiftId = String(formData.get("shift_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!saleId || !shiftId) return { error: "Thiếu thông tin đơn." };
  if (!reason) return { error: "Nhập lý do hủy đơn." };

  const authResult = await authorizeShiftAction(shiftId, "open");
  if ("error" in authResult) return { error: authResult.error };
  const { caller, supabase } = authResult;

  const { data: sale } = await supabase.from("sales").select("id, status").eq("id", saleId).maybeSingle();
  if (!sale) return { error: "Không tìm thấy đơn." };
  if (sale.status !== "completed") return { error: "Đơn này đã bị hủy trước đó." };

  const { error: cancelError } = await supabase
    .from("sales")
    .update({
      status: "cancelled",
      cancel_reason: reason,
      cancelled_by: caller.id,
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", saleId)
    .eq("status", "completed");
  if (cancelError) return { error: "Không hủy được đơn, thử lại sau." };

  // Hoan lai ton kho: xoa cac dong stock_movements gan voi don nay.
  await supabase.from("stock_movements").delete().eq("sale_id", saleId);

  redirect(`/ca-ban/${shiftId}/ban-hang/${saleId}`);
}
