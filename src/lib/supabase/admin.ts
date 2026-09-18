import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client dùng khóa service_role — bỏ qua toàn bộ RLS.
 * CHỈ import file này từ code chạy trên server (Server Action / Route Handler).
 * `import "server-only"` sẽ làm build lỗi ngay nếu lỡ import vào Client Component.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
