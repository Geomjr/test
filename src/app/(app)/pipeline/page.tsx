import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { listPipeline } from "@/lib/data/pipeline";
import { listContacts } from "@/lib/data/contacts";
import { Screen } from "@/components/ui/Screen";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";

export const metadata = { title: "Pipeline" };

export default async function PipelinePage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  const items = listPipeline(user.id).map((item) => ({
    id: item.id,
    stage: item.stage,
    note: item.note,
    position: item.position,
    contact: {
      id: item.contact.id,
      name: item.contact.name,
      company: item.contact.company,
      role: item.contact.role,
      photoVersion: item.contact.photoPath ? item.updatedAt : null,
    },
  }));

  const candidates = listContacts(user.id).map((c) => ({
    id: c.id,
    name: c.name,
    company: c.company,
  }));

  return (
    <Screen title="Pipeline" contentClassName="pb-28 lg:pb-10 px-4">
      <PipelineBoard items={items} candidates={candidates} />
    </Screen>
  );
}
