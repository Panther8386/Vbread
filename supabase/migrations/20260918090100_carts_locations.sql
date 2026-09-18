-- Xe (carts) và điểm bán (locations).

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  note text not null default '',
  partner_id uuid references public.profiles (id),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null default '',
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

alter table public.carts enable row level security;
alter table public.locations enable row level security;

create policy "Owner toàn quyền trên xe"
  on public.carts for all
  using (public.current_user_role() = 'owner');

create policy "Partner xem xe của mình"
  on public.carts for select
  using (partner_id = auth.uid());

create policy "Partner sửa xe của mình"
  on public.carts for update
  using (partner_id = auth.uid());

-- Chính sách "manager xem xe được gán" được thêm ở migration manager_scopes.

create policy "Người đã đăng nhập đọc điểm bán"
  on public.locations for select
  using (auth.uid() is not null);

create policy "Owner sửa điểm bán"
  on public.locations for insert
  with check (public.current_user_role() = 'owner');

create policy "Owner cập nhật điểm bán"
  on public.locations for update
  using (public.current_user_role() = 'owner');

create policy "Owner xóa điểm bán"
  on public.locations for delete
  using (public.current_user_role() = 'owner');
