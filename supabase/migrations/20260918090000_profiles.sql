-- Bảng người dùng (profiles) + vai trò + tự tạo hồ sơ khi có tài khoản đăng nhập mới.

create type public.user_role as enum ('owner', 'partner', 'manager', 'staff');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text,
  full_name text not null default '',
  role public.user_role not null default 'staff',
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

-- Đọc vai trò của người gọi hiện tại mà không đệ quy vào RLS của bảng profiles.
create function public.current_user_role()
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Tự tạo 1 dòng profiles (role mặc định 'staff') mỗi khi có tài khoản auth.users mới.
-- Tài khoản owner đầu tiên sẽ được nâng quyền tay bằng SQL sau khi tạo qua Dashboard.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone, full_name)
  values (new.id, new.phone, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "Xem hồ sơ của chính mình"
  on public.profiles for select
  using (id = auth.uid());

create policy "Owner xem tất cả hồ sơ"
  on public.profiles for select
  using (public.current_user_role() = 'owner');

-- Chính sách "partner xem hồ sơ manager được gán vào xe của mình" được thêm ở
-- migration manager_scopes (sau khi bảng carts + manager_scopes đã tồn tại).

create policy "Owner cập nhật hồ sơ"
  on public.profiles for update
  using (public.current_user_role() = 'owner');
