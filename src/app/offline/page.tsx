import { OrbitLogo } from "@/components/OrbitLogo";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-8 text-center">
      <OrbitLogo size={64} />
      <h1 className="text-[22px] font-bold">You're offline</h1>
      <p className="max-w-[300px] text-[15px] text-label-2">
        Orbit needs a connection to load your people. Check your network and try
        again.
      </p>
    </main>
  );
}
