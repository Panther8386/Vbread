-- Ban hang: don ban, dong hang trong don, thanh toan.

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts (id),
  cart_id uuid not null references public.carts (id),
  created_by uuid references public.profiles (id),
  subtotal bigint not null check (subtotal >= 0),
  discount_amount bigint not null default 0 check (discount_amount >= 0),
  total_amount bigint not null check (total_amount >= 0),
  status text not null default 'completed' check (status in ('completed', 'cancelled')),
  cancel_reason text,
  cancelled_by uuid references public.profiles (id),
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales (id),
  product_id uuid not null references public.products (id),
  quantity int not null check (quantity > 0),
  unit_price bigint not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales (id),
  method text not null check (method in ('tien_mat', 'chuyen_khoan', 'qr', 'vi_dien_tu', 'khac')),
  amount bigint not null check (amount > 0),
  created_at timestamptz not null default now()
);

alter table public.stock_movements add column sale_id uuid references public.sales (id);

-- Can xoa dong stock_movements gan voi 1 don ban khi huy don (hoan ton kho) -
-- chua co policy/grant delete tu migration truoc.
create policy "Owner/partner/nhan vien trong ca xoa phieu kho khi huy don"
  on public.stock_movements for delete
  using (
    public.current_user_role() = 'owner'
    or public.is_partner_of_cart(public.get_shift_cart(shift_id))
    or public.is_staff_of_shift(shift_id)
  );

grant delete on public.stock_movements to authenticated;

-- Ham security definer chi doc 1 bang duy nhat, tranh de quy RLS (giong
-- is_partner_of_cart/get_shift_cart o cac migration truoc).
create function public.get_sale_cart(target_sale_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select cart_id from public.sales where id = target_sale_id;
$$;

create function public.get_sale_shift(target_sale_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select shift_id from public.sales where id = target_sale_id;
$$;

alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.payments enable row level security;

create policy "Xem don ban theo pham vi ca"
  on public.sales for select
  using (
    public.current_user_role() = 'owner'
    or public.is_partner_of_cart(cart_id)
    or public.is_manager_of_cart(cart_id)
    or public.is_staff_of_shift(shift_id)
  );

create policy "Owner/partner/nhan vien trong ca tao don ban"
  on public.sales for insert
  with check (
    public.current_user_role() = 'owner'
    or public.is_partner_of_cart(cart_id)
    or public.is_staff_of_shift(shift_id)
  );

create policy "Owner/partner/nhan vien trong ca huy don ban"
  on public.sales for update
  using (
    public.current_user_role() = 'owner'
    or public.is_partner_of_cart(cart_id)
    or public.is_staff_of_shift(shift_id)
  );

create policy "Xem dong hang theo pham vi ca"
  on public.sale_items for select
  using (
    public.current_user_role() = 'owner'
    or public.is_partner_of_cart(public.get_sale_cart(sale_id))
    or public.is_manager_of_cart(public.get_sale_cart(sale_id))
    or public.is_staff_of_shift(public.get_sale_shift(sale_id))
  );

create policy "Owner/partner/nhan vien trong ca ghi dong hang"
  on public.sale_items for insert
  with check (
    public.current_user_role() = 'owner'
    or public.is_partner_of_cart(public.get_sale_cart(sale_id))
    or public.is_staff_of_shift(public.get_sale_shift(sale_id))
  );

create policy "Xem thanh toan theo pham vi ca"
  on public.payments for select
  using (
    public.current_user_role() = 'owner'
    or public.is_partner_of_cart(public.get_sale_cart(sale_id))
    or public.is_manager_of_cart(public.get_sale_cart(sale_id))
    or public.is_staff_of_shift(public.get_sale_shift(sale_id))
  );

create policy "Owner/partner/nhan vien trong ca ghi thanh toan"
  on public.payments for insert
  with check (
    public.current_user_role() = 'owner'
    or public.is_partner_of_cart(public.get_sale_cart(sale_id))
    or public.is_staff_of_shift(public.get_sale_shift(sale_id))
  );

create trigger sales_audit
  after insert or update or delete on public.sales
  for each row execute function public.log_audit();

grant select, insert, update on public.sales to authenticated;
grant select, insert on public.sale_items to authenticated;
grant select, insert on public.payments to authenticated;
