import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";

export default async function CauHinhIndexPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-3">
      <h1 className="font-heading text-2xl font-extrabold text-foreground">Cấu hình hệ thống</h1>
      <Link
        href="/cau-hinh/doi-mat-khau"
        className="rounded-md border border-border bg-surface px-4 py-3 text-base text-foreground hover:border-primary"
      >
        Đổi mật khẩu
      </Link>
      {user?.role === "owner" && (
        <Link
          href="/cau-hinh/nhat-ky"
          className="rounded-md border border-border bg-surface px-4 py-3 text-base text-foreground hover:border-primary"
        >
          Nhật ký thay đổi
        </Link>
      )}
    </div>
  );
}
