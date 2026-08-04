import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { aiEnabled } from "@/lib/ai/client";
import { Screen } from "@/components/ui/Screen";
import { AssistantScreen } from "@/components/assistant/AssistantScreen";

export const metadata = { title: "Ask" };

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/sign-in");
  const { q } = await searchParams;

  return (
    <Screen title="Ask">
      <AssistantScreen aiOn={aiEnabled()} initialQuestion={q} />
    </Screen>
  );
}
