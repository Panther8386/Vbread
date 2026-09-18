"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toSyntheticEmail } from "@/lib/phone";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: toSyntheticEmail(phone),
      password,
    });

    setLoading(false);

    if (signInError) {
      setError("Số điện thoại hoặc mật khẩu không đúng.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4"
      >
        <h1 className="font-heading text-2xl font-extrabold text-foreground">
          Đăng nhập Vbread
        </h1>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="text-sm text-muted">
            Số điện thoại
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-11 rounded-md border border-border bg-surface px-3 text-base text-foreground outline-none focus:border-primary"
            placeholder="0912345678"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm text-muted">
            Mật khẩu
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 rounded-md border border-border bg-surface px-3 text-base text-foreground outline-none focus:border-primary"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={loading} className="h-11">
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </form>
    </main>
  );
}
