-- Ban giao tien mat giua 2 nhan vien cung 1 ca dang mo. Chi ban giao tien mat
-- + ghi chu - khong lam kiem ke hang hoa tam thoi (kiem_ke da danh rieng cho
-- dong ca, xem migration shift_closing).

create table public.shift_handovers (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts (id),
  from_staff_id uuid not null references public.profiles (id),
  to_staff_id uuid not null references public.profiles (id),
  cash_handed_over bigint not null check (cash_handed_over >= 0),
  note text,
  confirmed_at timestamptz,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.shift_handovers enable row level security;

create policy "Xem ban giao theo pham vi ca"
  on public.shift_handovers for select
  using (
    public.current_user_role() = 'owner'
    or public.is_partner_of_cart(public.get_shift_cart(shift_id))
    or public.is_manager_of_cart(public.get_shift_cart(shift_id))
    or public.is_staff_of_shift(shift_id)
  );

create policy "Owner/partner/nhan vien trong ca tao phieu ban giao"
  on public.shift_handovers for insert
  with check (
    public.current_user_role() = 'owner'
    or public.is_partner_of_cart(public.get_shift_cart(shift_id))
    or public.is_staff_of_shift(shift_id)
  );

create policy "Owner/partner/dung nguoi nhan xac nhan ban giao"
  on public.shift_handovers for update
  using (
    public.current_user_role() = 'owner'
    or public.is_partner_of_cart(public.get_shift_cart(shift_id))
    or to_staff_id = auth.uid()
  );

create trigger shift_handovers_audit
  after insert or update or delete on public.shift_handovers
  for each row execute function public.log_audit();

grant select, insert, update on public.shift_handovers to authenticated;
