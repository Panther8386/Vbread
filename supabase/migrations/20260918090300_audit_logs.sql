-- Nhật ký chỉnh sửa. Bảng sẵn sàng dùng; hàm log_audit() sẽ được gắn trigger vào
-- các bảng nghiệp vụ (giá, ca, phiếu kho, đối soát tiền) ở các giai đoạn sau.

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id text not null,
  changed_by uuid references public.profiles (id),
  changed_at timestamptz not null default now(),
  old_value jsonb,
  new_value jsonb,
  reason text
);

create function public.log_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (table_name, record_id, changed_by, old_value, new_value, reason)
  values (
    tg_table_name,
    coalesce(new.id, old.id)::text,
    auth.uid(),
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end,
    current_setting('request.audit_reason', true)
  );
  return coalesce(new, old);
end;
$$;

alter table public.audit_logs enable row level security;

create policy "Owner đọc audit_logs"
  on public.audit_logs for select
  using (public.current_user_role() = 'owner');
