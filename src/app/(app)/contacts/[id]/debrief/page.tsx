import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { getContactDetail } from "@/lib/data/contacts";
import { aiEnabled } from "@/lib/ai/client";
import { userToday } from "@/lib/today";
import { Screen } from "@/components/ui/Screen";
import { EmptyState } from "@/components/ui/EmptyState";
import { SparklesIcon } from "@/components/ui/icons";
import { DebriefChat } from "@/components/debrief/DebriefChat";

export const metadata = { title: "Debrief" };

export default async function DebriefPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) redirect("/sign-in");
  const { id } = await params;

  const detail = getContactDetail(user.id, id);
  if (!detail) notFound();

  const today = await userToday();

  return (
    <Screen
      title={`Debrief · ${detail.contact.name}`}
      back={{ href: `/contacts/${id}`, label: detail.contact.name.split(" ")[0] }}
      largeTitle={false}
    >
      {aiEnabled() ? (
        <DebriefChat contactId={id} contactName={detail.contact.name} today={today} />
      ) : (
        <EmptyState
          icon={<SparklesIcon size={44} />}
          title="AI is off"
          subtitle="Debrief needs the assistant — set ANTHROPIC_API_KEY on the server to turn it on."
        />
      )}
    </Screen>
  );
}
