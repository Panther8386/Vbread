import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTimeVn } from "@/lib/date";
import { formatVnd } from "@/lib/currency";
import { PrintButton, CancelSaleForm } from "./bill-actions";

const PAYMENT_LABEL: Record<string, string> = {
  tien_mat: "Tiền mặt",
  chuyen_khoan: "Chuyển khoản",
  qr: "QR",
  vi_dien_tu: "Ví điện tử",
  khac: "Khác",
};

export default async function BillPage({
  params,
}: {
  params: Promise<{ shiftId: string; saleId: string }>;
}) {
  const { shiftId, saleId } = await params;
  const supabase = await createClient();

  const { data: sale } = await supabase
    .from("sales")
    .select("id, subtotal, discount_amount, total_amount, status, cancel_reason, created_at, cart_id")
    .eq("id", saleId)
    .maybeSingle();
  if (!sale) notFound();

  const [{ data: cart }, { data: items }, { data: payments }] = await Promise.all([
    supabase.from("carts").select("code, name").eq("id", sale.cart_id).maybeSingle(),
    supabase.from("sale_items").select("id, product_id, quantity, unit_price").eq("sale_id", saleId),
    supabase.from("payments").select("method, amount").eq("sale_id", saleId),
  ]);

  const productIds = (items ?? []).map((i) => i.product_id);
  const { data: products } =
    productIds.length > 0
      ? await supabase.from("products").select("id, code, name, unit").in("id", productIds)
      : { data: [] };
  const productById = new Map((products ?? []).map((p) => [p.id, p]));

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <Link href={`/ca-ban/${shiftId}`} className="print:hidden text-sm text-primary underline">
        ← Chi tiết ca
      </Link>

      <div className="rounded-md border border-border bg-surface p-4">
        <p className="font-heading text-lg font-bold text-foreground">Hóa đơn bán hàng</p>
        <p className="text-sm text-muted">
          {cart ? `${cart.code} — ${cart.name}` : "Xe"} · {formatDateTimeVn(sale.created_at)}
        </p>
        <p className="font-mono text-xs text-muted">Mã đơn: {sale.id}</p>
        {sale.status === "cancelled" && (
          <p className="mt-2 text-sm font-medium text-destructive">
            Đã hủy — lý do: {sale.cancel_reason}
          </p>
        )}

        <ul className="mt-3 flex flex-col gap-1 border-t border-border pt-3">
          {(items ?? []).map((i) => {
            const p = productById.get(i.product_id);
            return (
              <li key={i.id} className="flex items-center justify-between text-sm text-foreground">
                <span>
                  {p?.name ?? "Sản phẩm"} × {i.quantity}
                </span>
                <span className="font-mono">{formatVnd(i.unit_price * i.quantity)}</span>
              </li>
            );
          })}
        </ul>

        <div className="mt-3 flex flex-col gap-1 border-t border-border pt-3 text-sm">
          <div className="flex items-center justify-between text-muted">
            <span>Tiền hàng</span>
            <span className="font-mono">{formatVnd(sale.subtotal)}</span>
          </div>
          {sale.discount_amount > 0 && (
            <div className="flex items-center justify-between text-muted">
              <span>Giảm giá</span>
              <span className="font-mono">−{formatVnd(sale.discount_amount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between font-heading text-base font-bold text-foreground">
            <span>Tổng cộng</span>
            <span className="font-mono text-primary">{formatVnd(sale.total_amount)}</span>
          </div>
          {(payments ?? []).map((p, idx) => (
            <div key={idx} className="flex items-center justify-between text-muted">
              <span>Thanh toán ({PAYMENT_LABEL[p.method] ?? p.method})</span>
              <span className="font-mono">{formatVnd(p.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      <PrintButton />

      {sale.status === "completed" && <CancelSaleForm shiftId={shiftId} saleId={saleId} />}
    </div>
  );
}
