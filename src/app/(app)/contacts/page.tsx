import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { listContacts } from "@/lib/data/contacts";
import { Screen } from "@/components/ui/Screen";
import { PlusIcon } from "@/components/ui/icons";
import { ContactsList } from "@/components/contacts/ContactsList";

export const metadata = { title: "People" };

export default async function ContactsPage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  const contacts = listContacts(user.id).map((c) => ({
    id: c.id,
    name: c.name,
    company: c.company,
    role: c.role,
    tier: c.tier,
    hasPhoto: Boolean(c.photoPath),
    tags: c.tags,
    lastInteractionDate: c.lastInteractionDate,
  }));

  return (
    <Screen
      title="People"
      right={
        <Link
          href="/contacts/new"
          aria-label="Add contact"
          className="pressable flex h-[44px] w-[44px] items-center justify-center text-tint"
        >
          <PlusIcon size={24} strokeWidth={2.1} />
        </Link>
      }
    >
      <ContactsList contacts={contacts} />
    </Screen>
  );
}
