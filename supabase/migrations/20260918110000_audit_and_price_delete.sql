-- Ghi audit_logs cho moi thay doi tren cac bang danh muc + tai khoan.
-- manager_scopes dung khoa chinh kep (manager_id, cart_id), can them cot id
-- rieng de dung chung ham log_audit() (ham nay doc new.id/old.id).

alter table public.manager_scopes add column id uuid not null default gen_random_uuid() unique;

create trigger profiles_audit
  after update or delete on public.profiles
  for each row execute function public.log_audit();

create trigger carts_audit
  after insert or update or delete on public.carts
  for each row execute function public.log_audit();

create trigger locations_audit
  after insert or update or delete on public.locations
  for each row execute function public.log_audit();

create trigger products_audit
  after insert or update or delete on public.products
  for each row execute function public.log_audit();

create trigger manager_scopes_audit
  after insert or delete on public.manager_scopes
  for each row execute function public.log_audit();

-- Cho phep owner xoa gia (sua sai sot nhap lieu) - van con audit_logs giu lai gia tri cu.
create policy "Owner xóa giá"
  on public.prices for delete
  using (public.current_user_role() = 'owner');
