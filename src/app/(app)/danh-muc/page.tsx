import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";

export default async function DanhMucIndexPage() {
  const user = await getCurrentUser();
  const target =
    user?.role === "owner" || user?.role === "partner" ? "/danh-muc/xe" : "/danh-muc/diem-ban";
  redirect(target);
}
