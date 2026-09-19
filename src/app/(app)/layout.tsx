import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";

const NAV = [
  { href: "/bao-cao", label: "Báo cáo", roles: ["owner", "partner", "manager"] },
  { href: "/danh-muc/xe", label: "Xe", roles: ["owner", "partner"] },
  { href: "/danh-muc/diem-ban", label: "Điểm bán", roles: ["owner", "partner", "manager", "staff"] },
  { href: "/danh-muc/san-pham", label: "Sản phẩm", roles: ["owner"] },
  { href: "/danh-muc/gia", label: "Giá bán", roles: ["owner"] },
  { href: "/danh-muc/tai-khoan", label: "Tài khoản", roles: ["owner", "partner"] },
  { href: "/ca-ban", label: "Ca bán", roles: ["owner", "partner", "manager", "staff"] },
  { href: "/cau-hinh", label: "Cấu hình", roles: ["owner", "partner", "manager", "staff"] },
] as const;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const items = NAV.filter((item) => (item.roles as readonly string[]).includes(user.role));

  return (
    <div className="flex flex-1 flex-col">
      <header className="print:hidden border-b border-border px-4 py-3">
        <nav className="flex flex-wrap gap-4">
          <Link href="/" className="text-sm text-muted hover:text-foreground">
            Vbread
          </Link>
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-foreground hover:text-primary">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="flex-1 px-4 py-6">{children}</div>
    </div>
  );
}
