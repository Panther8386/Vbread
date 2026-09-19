-- Mo ca: hang nhan dau ca + tien le dau ca. Bang stock_movements dung chung
-- cho ca phan "Hang hoa" sau nay (chi dung loai 'nhan' o buoc nay).

alter table public.shifts add column opening_cash bigint;
alter table public.shifts add column opened_at timestamptz;
alter table public.shifts add column opened_by uuid references public.profiles (id);

-- Tim dung ten constraint cu (khong doan ten, phong khi Postgres dat ten khac).
do $$
declare
  old_constraint text;
begin
  select con.conname into old_constraint
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'shifts' and con.contype = 'c' and pg_get_constraintdef(con.oid) ilike '%status%';
  if old_constraint is not null then
    execute format('alter table public.shifts drop constraint %I', old_constraint);
  end if;
end $$;

alter table public.shifts add constraint shifts_status_check
  check (status in ('scheduled', 'open', 'cancelled'));

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts (id),
  product_id uuid not null references public.products (id),
  movement_type text not null check (movement_type in ('nhan', 'ban', 'tra', 'huy', 'hao_hut', 'kiem_ke')),
  quantity int not null check (quantity > 0),
  reason text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.stock_movements enable row level security;

create policy "Xem phieu kho theo pham vi ca"
  on public.stock_movements for select
  using (
    public.current_user_role() = 'owner'
    or public.is_partner_of_cart(public.get_shift_cart(shift_id))
    or public.is_manager_of_cart(public.get_shift_cart(shift_id))
    or public.is_staff_of_shift(shift_id)
  );

create policy "Owner/partner/nhan vien trong ca ghi phieu kho"
  on public.stock_movements for insert
  with check (
    public.current_user_role() = 'owner'
    or public.is_partner_of_cart(public.get_shift_cart(shift_id))
    or public.is_staff_of_shift(shift_id)
  );

create trigger stock_movements_audit
  after insert or update or delete on public.stock_movements
  for each row execute function public.log_audit();

grant select, insert on public.stock_movements to authenticated;
