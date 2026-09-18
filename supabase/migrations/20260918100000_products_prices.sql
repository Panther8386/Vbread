-- San pham va gia ban (1 gia chung toan he thong, luu lich su theo ngay hieu luc).

create table public.products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  unit text not null,
  product_group text not null check (product_group in ('mon_ban', 'banh_nen', 'bao_bi')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table public.prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id),
  price bigint not null check (price >= 0),
  effective_date date not null default current_date,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- Gia hien hanh cua moi san pham: gia moi nhat co effective_date <= hom nay.
create view public.current_prices as
select distinct on (product_id)
  product_id, price, effective_date
from public.prices
where effective_date <= current_date
order by product_id, effective_date desc, created_at desc;

alter table public.products enable row level security;
alter table public.prices enable row level security;

create policy "Người đã đăng nhập đọc sản phẩm"
  on public.products for select
  using (auth.uid() is not null);

create policy "Owner ghi sản phẩm"
  on public.products for all
  using (public.current_user_role() = 'owner');

create policy "Người đã đăng nhập đọc giá"
  on public.prices for select
  using (auth.uid() is not null);

create policy "Owner ghi giá"
  on public.prices for insert
  with check (public.current_user_role() = 'owner');

create policy "Owner sửa giá"
  on public.prices for update
  using (public.current_user_role() = 'owner');

-- Bat buoc ghi audit_logs khi doi gia (theo quy uoc trong CLAUDE.md).
create trigger prices_audit
  after insert or update or delete on public.prices
  for each row execute function public.log_audit();

grant select on public.products to authenticated;
grant insert, update on public.products to authenticated;
grant select on public.prices to authenticated;
grant insert, update on public.prices to authenticated;
grant select on public.current_prices to authenticated;

grant all on public.products to service_role;
grant all on public.prices to service_role;
grant select on public.current_prices to service_role;

-- Tu dong cap quyen day du cho service_role tren moi bang tao sau nay,
-- de khong quen lam lai buoc nay o cac migration tiep theo.
alter default privileges in schema public grant all on tables to service_role;

