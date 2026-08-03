import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { listAllTags } from "@/lib/data/contacts";
import { Screen } from "@/components/ui/Screen";
import { ContactForm } from "@/components/contacts/ContactForm";

export const metadata = { title: "New Person" };

export default async function NewContactPage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  return (
    <Screen title="New Person" back={{ href: "/contacts", label: "People" }}>
      <ContactForm suggestedTags={listAllTags(user.id)} />
    </Screen>
  );
}
