import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { buttonVariants } from "@/components/ui/button";

const ROLE_LABEL: Record<string, string> = {
  owner: "Chủ đầu tư",
  partner: "Đối tác",
  manager: "Quản lý",
  staff: "Nhân viên",
};

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-wide text-primary">
        Vbread App
      </p>
      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
        Vbread – Vận hành xe bánh mì
      </h1>

      {user ? (
        <>
          <p className="max-w-sm text-base text-muted">
            Xin chào {user.fullName || "bạn"} — vai trò:{" "}
            <span className="font-mono text-foreground">{ROLE_LABEL[user.role] ?? user.role}</span>
          </p>
          <Link href="/danh-muc/xe" className={buttonVariants({ className: "h-11" })}>
            Vào Danh mục
          </Link>
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
