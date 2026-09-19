-- Dong ca: kiem ke cuoi ca + doi soat tien. Kiem ke dung lai
-- stock_movements (movement_type='kiem_ke', so luong = so dem thuc te,
-- da co san check constraint tu GD-02). Doi soat tien mat luu thang tren
-- shifts (co "dau ca"); cac phuong thuc khac luu bang rieng.

alter table public.shifts add column cash_counted bigint;
alter table public.shifts add column closing_reason text;
alter table public.shifts add column closed_at timestamptz;
alter table public.shifts add column closed_by uuid references public.profiles (id);

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
  check (status in ('scheduled', 'open', 'pending_review', 'cancelled'));

create table public.shift_payment_counts (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts (id),
  method text not null check (method in ('tien_mat', 'chuyen_khoan', 'qr', 'vi_dien_tu', 'khac')),
  counted_amount bigint not null check (counted_amount >= 0),
  created_at timestamptz not null default now()
);

alter table public.shift_payment_counts enable row level security;

create policy "Xem doi soat tien theo pham vi ca"
  on public.shift_payment_counts for select
  using (
    public.current_user_role() = 'owner'
    or public.is_partner_of_cart(public.get_shift_cart(shift_id))
    or public.is_manager_of_cart(public.get_shift_cart(shift_id))
    or public.is_staff_of_shift(shift_id)
  );

create policy "Owner/partner/nhan vien trong ca ghi doi soat tien"
  on public.shift_payment_counts for insert
  with check (
    public.current_user_role() = 'owner'
    or public.is_partner_of_cart(public.get_shift_cart(shift_id))
    or public.is_staff_of_shift(shift_id)
  );

create trigger shift_payment_counts_audit
  after insert or update or delete on public.shift_payment_counts
  for each row execute function public.log_audit();

grant select, insert on public.shift_payment_counts to authenticated;
