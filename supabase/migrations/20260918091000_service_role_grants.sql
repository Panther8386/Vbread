-- service_role vượt qua RLS nhưng vẫn cần quyền GRANT ở mức bảng (bị ảnh hưởng
-- vì đã tắt "Automatically expose new tables" khi tạo project).

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all routines in schema public to service_role;
