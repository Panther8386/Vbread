import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";

export default async function Home() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  let fullName: string | null = null;
  let role: string | null = null;

  if (userData.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", userData.user.id)
      .single();
    fullName = profile?.full_name ?? null;
    role = profile?.role ?? null;
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-wide text-primary">
        Vbread App
      </p>
      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
        Vbread – Vận hành xe bánh mì
      </h1>

      {userData.user ? (
        <>
          <p className="max-w-sm text-base text-muted">
            Xin chào{fullName ? ` ${fullName}` : ""} — vai trò:{" "}
            <span className="font-mono text-foreground">{role ?? "chưa gán"}</span>
          </p>
          <Link href="/doi-mat-khau" className="text-sm text-primary underline">
            Đổi mật khẩu
          </Link>
        </>
      ) : (
        <>
          <p className="max-w-sm text-base text-muted">
            Nền tảng vận hành chuỗi xe bánh mì lưu động.
          </p>
          <Link href="/login" className={buttonVariants({ className: "h-11" })}>
            Đăng nhập
          </Link>
        </>
      )}
    </main>
  );
}
