export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-5 py-10">
      <div
        aria-hidden
        className="screen-wash pointer-events-none absolute inset-x-0 top-0 h-[420px]"
      />
      <div className="relative w-full max-w-[380px]">{children}</div>
    </main>
  );
}
