-- Ghi nhan ai tao tai khoan nay, de partner xem lai duoc nhan vien minh vua tao
-- (RLS truoc gio chi cho partner thay manager qua manager_scopes, chua thay staff
-- vi staff chua gan vao xe nao cho den khi co bang shift_staff o GD-02).

alter table public.profiles add column created_by uuid references public.profiles (id);

create policy "Người tạo xem lại tài khoản mình đã tạo"
  on public.profiles for select
  using (created_by = auth.uid());
