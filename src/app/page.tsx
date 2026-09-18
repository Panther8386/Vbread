import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { buttonVariants } from "@/components/ui/button";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/danh-muc");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-wide text-primary">
        Vbread App
      </p>
      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
        Vbread – Vận hành xe bánh mì
      </h1>
      <p className="max-w-sm text-base text-muted">
        Nền tảng vận hành chuỗi xe bánh mì lưu động.
      </p>
      <Link href="/login" className={buttonVariants({ className: "h-11" })}>
        Đăng nhập
      </Link>
    </main>
  );
}
