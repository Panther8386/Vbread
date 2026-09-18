// Tao du lieu mau ban dau: 2 xe, 3 diem ban, 3 mon ban + banh nen + bao bi kem gia.
// Cach dung: node --env-file=.env.local scripts/seed-sample-data.mjs
import { createClient } from "@supabase/supabase-js";
import { setDefaultResultOrder } from "node:dns";

setDefaultResultOrder("ipv4first");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function upsertLocation(name, address) {
  const { data: existing } = await supabase.from("locations").select("id").eq("name", name).maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase.from("locations").insert({ name, address }).select().single();
  if (error) throw error;
  return data.id;
}

async function upsertCart(code, name) {
  const { data: existing } = await supabase.from("carts").select("id").eq("code", code).maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase.from("carts").insert({ code, name }).select().single();
  if (error) throw error;
  return data.id;
}

async function upsertProduct(code, name, unit, group) {
  const { data: existing } = await supabase.from("products").select("id").eq("code", code).maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from("products")
    .insert({ code, name, unit, product_group: group })
    .select()
    .single();
  if (error) throw error;
  return data.id;
}

async function ensurePrice(productId, price) {
  const { data: existing } = await supabase
    .from("prices")
    .select("id")
    .eq("product_id", productId)
    .maybeSingle();
  if (existing) return;
  const { error } = await supabase
    .from("prices")
    .insert({ product_id: productId, price, effective_date: new Date().toISOString().slice(0, 10) });
  if (error) throw error;
}

const locationIds = [
  await upsertLocation("Cổng KCN Tân Bình", ""),
  await upsertLocation("Ngã tư Bảy Hiền", ""),
  await upsertLocation("Cổng Trường ĐH Công nghiệp", ""),
];
console.log("Điểm bán:", locationIds.length);

const cartIds = [await upsertCart("VB-01", "Xe Vbread 01"), await upsertCart("VB-02", "Xe Vbread 02")];
console.log("Xe:", cartIds.length);

const products = [
  ["BM01", "Bánh mì pate", "ổ", "mon_ban", 22000],
  ["BM02", "Bánh mì chả", "ổ", "mon_ban", 27000],
  ["BM03", "Bánh mì pate chả", "ổ", "mon_ban", 27000],
  ["BANH-NEN", "Bánh mì nền", "ổ", "banh_nen", 5000],
  ["BAO-BI", "Túi giấy gói", "cái", "bao_bi", 500],
];

for (const [code, name, unit, group, price] of products) {
  const id = await upsertProduct(code, name, unit, group);
  await ensurePrice(id, price);
  console.log("Sản phẩm:", code);
}

console.log("Xong.");
