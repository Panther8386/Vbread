"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function DoiMatKhauPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu mới nhập lại không khớp.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu mới cần ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user?.email) {
      setLoading(false);
      router.push("/login");
      return;
    }

    // Xác nhận lại mật khẩu cũ bằng cách đăng nhập lại trước khi đổi.
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password: currentPassword,
    });
    if (verifyError) {
      setLoading(false);
      setError("Mật khẩu hiện tại không đúng.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (updateError) {
      setError("Không đổi được mật khẩu, thử lại sau.");
      return;
    }

    setSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="font-heading text-2xl font-extrabold text-foreground">
          Đổi mật khẩu
        </h1>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="current" className="text-sm text-muted">
            Mật khẩu hiện tại
          </label>
          <input
            id="current"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="h-11 rounded-md border border-border bg-surface px-3 text-base text-foreground outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="new" className="text-sm text-muted">
            Mật khẩu mới
          </label>
          <input
            id="new"
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="h-11 rounded-md border border-border bg-surface px-3 text-base text-foreground outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm" className="text-sm text-muted">
            Nhập lại mật khẩu mới
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-11 rounded-md border border-border bg-surface px-3 text-base text-foreground outline-none focus:border-primary"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-secondary">Đã đổi mật khẩu thành công.</p>}

        <Button type="submit" disabled={loading} className="h-11">
          {loading ? "Đang lưu..." : "Đổi mật khẩu"}
        </Button>

        <p className="text-sm text-muted">
          Quên mật khẩu hiện tại? Nhờ chủ chuỗi đặt lại giúp — không thể tự khôi phục vì
          tài khoản dùng số điện thoại, không có email/SMS xác minh.
        </p>
      </form>
    </main>
  );
}
