import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { getContactDetail, listAllTags } from "@/lib/data/contacts";
import { Screen } from "@/components/ui/Screen";
import { ContactForm } from "@/components/contacts/ContactForm";
import { PhotoEditor } from "@/components/contacts/PhotoEditor";

export const metadata = { title: "Edit Person" };

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/sign-in");
  const { id } = await params;

  const detail = getContactDetail(user.id, id);
  if (!detail) notFound();
  const { contact } = detail;

  return (
    <Screen title="Edit" back={{ href: `/contacts/${id}`, label: contact.name.split(" ")[0] }}>
      <PhotoEditor
        contactId={contact.id}
        name={contact.name}
        hasPhoto={Boolean(contact.photoPath)}
      />
      <ContactForm
        contactId={contact.id}
        suggestedTags={listAllTags(user.id)}
        initial={{
          name: contact.name,
          company: contact.company ?? "",
          role: contact.role ?? "",
          industry: contact.industry ?? "",
          city: contact.city ?? "",
          email: contact.email ?? "",
          phone: contact.phone ?? "",
          linkedinUrl: contact.linkedinUrl ?? "",
          howWeMet: contact.howWeMet ?? "",
          tier: contact.tier,
          cadenceDays: contact.cadenceDays,
          birthday: contact.birthday ?? "",
          notes: contact.notes ?? "",
          tags: detail.tags,
        }}
      />
    </Screen>
  );
}
