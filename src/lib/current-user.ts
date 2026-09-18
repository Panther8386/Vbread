import { createClient } from "@/lib/supabase/server";

export type Role = "owner" | "partner" | "manager" | "staff";

export type CurrentUser = {
  id: string;
  fullName: string;
  role: Role;
  phone: string | null;
};

/** Lấy hồ sơ người đang đăng nhập (từ session thật trên server). Null nếu chưa đăng nhập. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, phone")
    .eq("id", userData.user.id)
    .single();
  if (!profile) return null;

  return {
    id: userData.user.id,
    fullName: profile.full_name,
    role: profile.role as Role,
    phone: profile.phone,
  };
}
