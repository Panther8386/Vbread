-- Duyet ca sau khi dong ca: chi doi tac cua xe hoac owner duyet (khong phai
-- quan ly - quan ly chi xem). RLS update tren shifts da co san tu GD-02
-- (owner/partner-cua-xe), khong can them policy moi - chi can them trang
-- thai "approved" vao check constraint.

alter table public.shifts add column approved_by uuid references public.profiles (id);
alter table public.shifts add column approved_at timestamptz;

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
  check (status in ('scheduled', 'open', 'pending_review', 'approved', 'cancelled'));
