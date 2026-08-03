import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { getContactDetail, listContacts } from "@/lib/data/contacts";
import { userToday } from "@/lib/today";
import { aiEnabled } from "@/lib/ai/client";
import { daysBetween } from "@/lib/dates";
import { sanitizeHttpUrl } from "@/lib/urls";
import { Screen } from "@/components/ui/Screen";
import { Avatar } from "@/components/ui/Avatar";
import { TagChip, TierBadge } from "@/components/ui/badges";
import { ListRow, ListSection } from "@/components/ui/List";
import { EnvelopeIcon, LinkIcon, PhoneIcon } from "@/components/ui/icons";
import { QuickLog } from "@/components/contacts/QuickLog";
import { Timeline } from "@/components/contacts/Timeline";
import { VoiceNotes } from "@/components/voice/VoiceNotes";
import { AIPanel } from "@/components/contacts/AIPanel";
import { PipelineRow } from "@/components/contacts/PipelineRow";
import { ContactMenu } from "@/components/contacts/ContactMenu";
import {
  ContactDates,
  ContactIntros,
  ContactTasks,
} from "@/components/contacts/Extras";

export default async function ContactPage({
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
  const today = await userToday();

  const lastDate = detail.interactions[0]?.date ?? null;
  const cadenceState =
    contact.cadenceDays && lastDate
      ? daysBetween(lastDate, today) - contact.cadenceDays
      : null;

  const otherContacts = listContacts(user.id)
    .filter((c) => c.id !== contact.id)
    .map((c) => ({ id: c.id, name: c.name }));

  const subtitle = [contact.role, contact.company].filter(Boolean).join(" · ");
  const location = [contact.industry, contact.city].filter(Boolean).join(" · ");
  // Defense in depth for rows written before URL sanitization existed.
  const safeLinkedinUrl = sanitizeHttpUrl(contact.linkedinUrl);

  return (
    <Screen
      title={contact.name}
      back={{ href: "/contacts", label: "People" }}
      right={<ContactMenu contactId={contact.id} name={contact.name} />}
      largeTitle={false}
    >
      {/* Header card */}
      <div className="flex flex-col items-center gap-2 pb-2 pt-4 text-center">
        <Avatar
          name={contact.name}
          photoUrl={
            contact.photoPath
              ? `/api/contacts/${contact.id}/photo?v=${contact.updatedAt}`
              : null
          }
          size={92}
        />
        <div>
          <h2 className="text-[26px] font-bold tracking-tight">{contact.name}</h2>
          {subtitle ? <p className="text-[15px] text-label-2">{subtitle}</p> : null}
          {location ? <p className="text-[13px] text-label-3">{location}</p> : null}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <TierBadge tier={contact.tier} />
          {detail.tags.map((tag) => (
            <TagChip key={tag} name={tag} />
          ))}
        </div>
        {contact.cadenceDays ? (
          <p
            className={`text-[13px] font-medium ${
              cadenceState !== null && cadenceState >= 0 ? "text-red" : "text-label-2"
            }`}
          >
            {cadenceState === null
              ? `Keep in touch every ${contact.cadenceDays} days`
              : cadenceState >= 0
                ? cadenceState === 0
                  ? "Due for a catch-up today"
                  : `${cadenceState}d past your ${contact.cadenceDays}-day cadence`
                : `Next touch in ${-cadenceState}d`}
          </p>
        ) : null}
      </div>

      <QuickLog contactId={contact.id} today={today} />
      <AIPanel contactId={contact.id} aiOn={aiEnabled()} />

      <PipelineRow
        contactId={contact.id}
        item={
          detail.pipelineItem
            ? {
                id: detail.pipelineItem.id,
                stage: detail.pipelineItem.stage,
                note: detail.pipelineItem.note,
              }
            : null
        }
      />

      <Timeline
        interactions={detail.interactions.map((i) => ({
          id: i.id,
          type: i.type,
          date: i.date,
          notes: i.notes,
        }))}
        today={today}
      />

      <VoiceNotes
        contactId={contact.id}
        notes={detail.voiceNotes.map((v) => ({
          id: v.id,
          durationSec: v.durationSec,
          transcript: v.transcript,
          createdAt: v.createdAt,
        }))}
      />

      <ContactTasks
        contactId={contact.id}
        today={today}
        tasks={detail.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate,
          completedAt: t.completedAt,
        }))}
      />

      <ContactDates
        contactId={contact.id}
        birthday={contact.birthday}
        dates={detail.importantDates.map((d) => ({
          id: d.id,
          label: d.label,
          date: d.date,
          recurring: d.recurring,
        }))}
      />

      <ContactIntros
        contactId={contact.id}
        contactName={contact.name.split(" ")[0] ?? contact.name}
        intros={detail.intros}
        otherContacts={otherContacts}
      />

      {(contact.email || contact.phone || contact.linkedinUrl) ? (
        <ListSection title="Contact">
          {contact.email ? (
            <ListRow
              leading={<EnvelopeIcon size={20} />}
              title={<a href={`mailto:${contact.email}`} className="text-tint">{contact.email}</a>}
            />
          ) : null}
          {contact.phone ? (
            <ListRow
              leading={<PhoneIcon size={20} />}
              title={<a href={`tel:${contact.phone}`} className="text-tint">{contact.phone}</a>}
            />
          ) : null}
          {safeLinkedinUrl ? (
            <ListRow
              leading={<LinkIcon size={20} />}
              title={
                <a
                  href={safeLinkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-tint"
                >
                  LinkedIn profile
                </a>
              }
            />
          ) : null}
        </ListSection>
      ) : null}

      {(contact.howWeMet || contact.notes) ? (
        <ListSection title="About">
          {contact.howWeMet ? (
            <div className="hairline-b last:after:hidden px-4 py-3">
              <p className="pb-0.5 text-[13px] font-medium text-label-2">How you met</p>
              <p className="whitespace-pre-wrap text-[15px]">{contact.howWeMet}</p>
            </div>
          ) : null}
          {contact.notes ? (
            <div className="hairline-b last:after:hidden px-4 py-3">
              <p className="pb-0.5 text-[13px] font-medium text-label-2">Notes</p>
              <p className="whitespace-pre-wrap text-[15px]">{contact.notes}</p>
            </div>
          ) : null}
        </ListSection>
      ) : null}
    </Screen>
  );
}
