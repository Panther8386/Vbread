import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Client Supabase dùng trong Server Component / Route Handler / Server Action. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Bỏ qua khi gọi từ Server Component (không cho set cookie) —
            // middleware sẽ đảm nhiệm việc làm mới session.
          }
        },
      },
    },
  );
}
