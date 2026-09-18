-- Quản lý nào phụ trách xe nào (do đối tác gán).

create table public.manager_scopes (
  manager_id uuid not null references public.profiles (id),
  cart_id uuid not null references public.carts (id),
  created_at timestamptz not null default now(),
  primary key (manager_id, cart_id)
);

alter table public.manager_scopes enable row level security;

create policy "Owner toàn quyền trên manager_scopes"
  on public.manager_scopes for all
  using (public.current_user_role() = 'owner');

create policy "Partner quản lý scope cho xe của mình"
  on public.manager_scopes for all
  using (
    exists (
      select 1 from public.carts c
      where c.id = manager_scopes.cart_id and c.partner_id = auth.uid()
    )
  );

create policy "Manager xem scope của chính mình"
  on public.manager_scopes for select
  using (manager_id = auth.uid());

-- Nay carts + manager_scopes đã tồn tại: bổ sung 2 chính sách còn thiếu từ các migration trước.

create policy "Manager xem xe được gán"
  on public.carts for select
  using (
    exists (
      select 1 from public.manager_scopes ms
      where ms.cart_id = carts.id and ms.manager_id = auth.uid()
    )
  );

create policy "Partner xem hồ sơ manager được gán vào xe của mình"
  on public.profiles for select
  using (
    exists (
      select 1 from public.manager_scopes ms
      join public.carts c on c.id = ms.cart_id
      where ms.manager_id = profiles.id
        and c.partner_id = auth.uid()
    )
  );
