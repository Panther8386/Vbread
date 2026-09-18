export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-wide text-primary">
        Vbread App · GĐ-00
      </p>
      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
        Vbread – Vận hành xe bánh mì
      </h1>
      <p className="max-w-sm text-base text-muted">
        Nền tảng vận hành chuỗi xe bánh mì lưu động. Đang xây dựng nền tảng kỹ
        thuật (GĐ-00) — chưa có tính năng thật.
      </p>
    </main>
  );
}
