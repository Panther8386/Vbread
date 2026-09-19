-- Cho phep so luong = 0 trong stock_movements: kiem ke cuoi ca la 1 lan dem
-- tuyet doi (co the ban het sach hang, kiem ke dung = 0), khac voi cac loai
-- phat sinh khac (nhan/ban/tra/huy/hao_hut) luon phai > 0 - da duoc kiem o
-- tang ung dung (Server Action) roi, khong can DB chan tiep.

do $$
declare
  old_constraint text;
begin
  select con.conname into old_constraint
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'stock_movements' and con.contype = 'c' and pg_get_constraintdef(con.oid) ilike '%quantity%';
  if old_constraint is not null then
    execute format('alter table public.stock_movements drop constraint %I', old_constraint);
  end if;
end $$;

alter table public.stock_movements add constraint stock_movements_quantity_check
  check (quantity >= 0);
