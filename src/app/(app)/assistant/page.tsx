import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { aiEnabled } from "@/lib/ai/client";
import { Screen } from "@/components/ui/Screen";
import { AssistantScreen } from "@/components/assistant/AssistantScreen";

export const metadata = { title: "Assistant" };

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/sign-in");
  const { q } = await searchParams;

  return (
    <Screen title="Assistant" back={{ href: "/more", label: "More" }}>
      <AssistantScreen aiOn={aiEnabled()} initialQuestion={q} />
    </Screen>
  );
}
