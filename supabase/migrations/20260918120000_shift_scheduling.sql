-- Ca mau (owner cau hinh so ca/gio ca), phan cong ca cho xe, nhan vien trong ca.
-- Chua lam mo ca / ban giao / dong ca (se lam o phan sau, gan voi stock_movements).

create table public.shift_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  business_date date not null,
  cart_id uuid not null references public.carts (id),
  location_id uuid not null references public.locations (id),
  shift_template_id uuid not null references public.shift_templates (id),
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled')),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.shift_staff (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts (id),
  staff_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (shift_id, staff_id)
);

-- Ham security definer chi doc 1 bang duy nhat, tranh de quy RLS (giong
-- is_partner_of_cart/is_manager_of_cart o migration fix_rls_recursion).
create function public.is_staff_of_shift(target_shift_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.shift_staff where shift_id = target_shift_id and staff_id = auth.uid()
  );
$$;

create function public.get_shift_cart(target_shift_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select cart_id from public.shifts where id = target_shift_id;
$$;

alter table public.shift_templates enable row level security;
alter table public.shifts enable row level security;
alter table public.shift_staff enable row level security;

create policy "Người đã đăng nhập đọc ca mẫu"
  on public.shift_templates for select
  using (auth.uid() is not null);

create policy "Owner ghi ca mẫu"
  on public.shift_templates for all
  using (public.current_user_role() = 'owner');

create policy "Xem ca theo phạm vi (owner/partner/manager/nhân viên trong ca)"
  on public.shifts for select
  using (
    public.current_user_role() = 'owner'
    or public.is_partner_of_cart(cart_id)
    or public.is_manager_of_cart(cart_id)
    or public.is_staff_of_shift(id)
  );

create policy "Owner/partner tạo ca"
  on public.shifts for insert
  with check (
    public.current_user_role() = 'owner' or public.is_partner_of_cart(cart_id)
  );

create policy "Owner/partner sửa ca (hủy ca)"
  on public.shifts for update
  using (
    public.current_user_role() = 'owner' or public.is_partner_of_cart(cart_id)
  );

create policy "Xem nhân viên trong ca theo phạm vi"
  on public.shift_staff for select
  using (
    public.current_user_role() = 'owner'
    or public.is_partner_of_cart(public.get_shift_cart(shift_id))
    or public.is_manager_of_cart(public.get_shift_cart(shift_id))
    or staff_id = auth.uid()
  );

create policy "Owner/partner gán nhân viên vào ca"
  on public.shift_staff for insert
  with check (
    public.current_user_role() = 'owner' or public.is_partner_of_cart(public.get_shift_cart(shift_id))
  );

create policy "Owner/partner gỡ nhân viên khỏi ca"
  on public.shift_staff for delete
  using (
    public.current_user_role() = 'owner' or public.is_partner_of_cart(public.get_shift_cart(shift_id))
  );

-- Nhan vien duoc gan vao 1 ca can xem duoc ten/ma xe cua ca do (carts truoc gio
-- chi cho owner/partner-cua-xe/manager-duoc-gan xem, chua co staff).
create policy "Staff xem xe có ca của mình"
  on public.carts for select
  using (
    exists (
      select 1 from public.shifts s
      where s.cart_id = carts.id and public.is_staff_of_shift(s.id)
    )
  );

create trigger shift_templates_audit
  after insert or update or delete on public.shift_templates
  for each row execute function public.log_audit();

create trigger shifts_audit
  after insert or update or delete on public.shifts
  for each row execute function public.log_audit();

create trigger shift_staff_audit
  after insert or update or delete on public.shift_staff
  for each row execute function public.log_audit();

grant select, insert, update, delete on public.shift_templates to authenticated;
grant select, insert, update on public.shifts to authenticated;
grant select, insert, delete on public.shift_staff to authenticated;
