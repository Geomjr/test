import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { Sidebar } from "@/components/ui/Sidebar";
import { TabBar } from "@/components/ui/TabBar";
import { ToastProvider } from "@/components/ui/Toast";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  return (
    <ToastProvider>
      <Sidebar userName={user.name} />
      <main className="min-h-dvh lg:pl-[260px]">{children}</main>
      <TabBar />
    </ToastProvider>
  );
}
