-- Cấp quyền truy cập bảng cho vai trò 'authenticated' (đã đăng nhập).
-- Không cấp cho 'anon' — app yêu cầu đăng nhập, không cho xem ẩn danh.
-- RLS (ở các migration trước) mới là lớp kiểm soát THEO DÒNG dữ liệu; grant này chỉ
-- mở quyền truy cập bảng ở mức tổng quát cho người đã đăng nhập.

grant usage on schema public to authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.carts to authenticated;
grant select, insert, update, delete on public.locations to authenticated;
grant select, insert, update, delete on public.manager_scopes to authenticated;
grant select on public.audit_logs to authenticated;
