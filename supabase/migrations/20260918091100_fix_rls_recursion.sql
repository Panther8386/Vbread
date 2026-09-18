-- Sửa lỗi đệ quy vô hạn: profiles -> manager_scopes -> carts -> manager_scopes -> ...
-- Cách sửa: dùng hàm security definer chỉ đọc 1 bảng duy nhất (bỏ qua RLS bên trong
-- hàm đó), thay cho việc join trực tiếp qua lại giữa 2 bảng có RLS.

create function public.is_partner_of_cart(target_cart_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.carts where id = target_cart_id and partner_id = auth.uid()
  );
$$;

create function public.is_manager_of_cart(target_cart_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.manager_scopes where cart_id = target_cart_id and manager_id = auth.uid()
  );
$$;

drop policy "Manager xem xe được gán" on public.carts;
create policy "Manager xem xe được gán"
  on public.carts for select
  using (public.is_manager_of_cart(id));

drop policy "Partner quản lý scope cho xe của mình" on public.manager_scopes;
create policy "Partner quản lý scope cho xe của mình"
  on public.manager_scopes for all
  using (public.is_partner_of_cart(cart_id));

drop policy "Partner xem hồ sơ manager được gán vào xe của mình" on public.profiles;
create policy "Partner xem hồ sơ manager được gán vào xe của mình"
  on public.profiles for select
  using (
    exists (
      select 1 from public.manager_scopes ms
      where ms.manager_id = profiles.id and public.is_partner_of_cart(ms.cart_id)
    )
  );
