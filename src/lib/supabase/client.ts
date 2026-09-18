import { createBrowserClient } from "@supabase/ssr";

/** Client Supabase dùng trong component chạy ở trình duyệt ("use client"). */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
