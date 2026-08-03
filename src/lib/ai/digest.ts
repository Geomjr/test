import "server-only";
import { desc, eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { listContacts, getContactDetail } from "@/lib/data/contacts";
import { listPipeline } from "@/lib/data/pipeline";
import { listTasks } from "@/lib/data/tasks";
import { TIER_META } from "@/lib/tiers";
import { STAGE_META } from "@/lib/pipeline-meta";

const trim = (text: string | null | undefined, max: number): string =>
  text ? (text.length > max ? `${text.slice(0, max)}…` : text) : "";

/**
 * A compact, deterministic text digest of the user's entire CRM, used as
 * cacheable context for the assistant. Stable ordering, no "now" timestamps —
 * so repeated requests hit the prompt cache.
 */
export function buildDigest(userId: string): string {
  const contacts = listContacts(userId);

  const interactionRows = db()
    .select()
    .from(tables.interactions)
    .where(eq(tables.interactions.userId, userId))
    .orderBy(desc(tables.interactions.date), desc(tables.interactions.createdAt))
    .all();
  const interactionsByContact = new Map<string, typeof interactionRows>();
  for (const row of interactionRows) {
    const list = interactionsByContact.get(row.contactId) ?? [];
    if (list.length < 3) list.push(row);
    interactionsByContact.set(row.contactId, list);
  }

  const voiceRows = db()
    .select()
    .from(tables.voiceNotes)
    .where(eq(tables.voiceNotes.userId, userId))
    .orderBy(desc(tables.voiceNotes.createdAt))
    .all();
  const voiceByContact = new Map<string, typeof voiceRows>();
  for (const row of voiceRows) {
    if (!row.transcript) continue;
    const list = voiceByContact.get(row.contactId) ?? [];
    if (list.length < 2) list.push(row);
    voiceByContact.set(row.contactId, list);
  }

  const dateRows = db()
    .select()
    .from(tables.importantDates)
    .where(eq(tables.importantDates.userId, userId))
    .orderBy(tables.importantDates.date)
    .all();
  const datesByContact = new Map<string, typeof dateRows>();
  for (const row of dateRows) {
    const list = datesByContact.get(row.contactId) ?? [];
    list.push(row);
    datesByContact.set(row.contactId, list);
  }

  const lines: string[] = ["## People"];
  for (const contact of contacts) {
    const parts = [
      contact.name,
      [contact.role, contact.company].filter(Boolean).join(" at "),
      contact.industry,
      contact.city,
      `tier: ${TIER_META[contact.tier].label}`,
      contact.cadenceDays ? `cadence: every ${contact.cadenceDays}d` : null,
      `last contact: ${contact.lastInteractionDate ?? "never"}`,
      contact.birthday ? `birthday: ${contact.birthday}` : null,
      contact.tags.length ? `tags: ${contact.tags.join(", ")}` : null,
      contact.howWeMet ? `met: ${trim(contact.howWeMet, 120)}` : null,
      contact.notes ? `notes: ${trim(contact.notes, 240)}` : null,
    ].filter(Boolean);
    lines.push(`- ${parts.join(" | ")}`);

    for (const interaction of interactionsByContact.get(contact.id) ?? []) {
      lines.push(
        `  · ${interaction.date} ${interaction.type}${interaction.notes ? `: ${trim(interaction.notes, 160)}` : ""}`,
      );
    }
    for (const voice of voiceByContact.get(contact.id) ?? []) {
      lines.push(`  · voice note: ${trim(voice.transcript, 160)}`);
    }
    for (const date of datesByContact.get(contact.id) ?? []) {
      lines.push(`  · ${date.label}: ${date.date}${date.recurring ? " (yearly)" : ""}`);
    }
  }

  const pipeline = listPipeline(userId);
  if (pipeline.length > 0) {
    lines.push("", "## Recruiting pipeline");
    for (const item of pipeline) {
      lines.push(
        `- ${item.contact.name}: ${STAGE_META[item.stage].label}${item.note ? ` — ${trim(item.note, 120)}` : ""}`,
      );
    }
  }

  const tasks = listTasks(userId).filter((t) => !t.completedAt);
  if (tasks.length > 0) {
    lines.push("", "## Open tasks");
    for (const task of tasks) {
      lines.push(
        `- ${task.title}${task.contactName ? ` (${task.contactName})` : ""}${task.dueDate ? ` — due ${task.dueDate}` : ""}`,
      );
    }
  }

  return lines.join("\n");
}

/** Rich context for one person: everything Orbit knows about them. */
export function buildContactContext(userId: string, contactId: string): string | null {
  const detail = getContactDetail(userId, contactId);
  if (!detail) return null;
  const { contact } = detail;

  const lines: string[] = [
    `Name: ${contact.name}`,
    contact.company ? `Company: ${contact.company}` : "",
    contact.role ? `Role: ${contact.role}` : "",
    contact.industry ? `Industry: ${contact.industry}` : "",
    contact.city ? `City: ${contact.city}` : "",
    `Tier: ${TIER_META[contact.tier].label}`,
    contact.cadenceDays ? `Cadence: every ${contact.cadenceDays} days` : "",
    contact.birthday ? `Birthday: ${contact.birthday}` : "",
    contact.howWeMet ? `How we met: ${contact.howWeMet}` : "",
    detail.tags.length ? `Tags: ${detail.tags.join(", ")}` : "",
    contact.notes ? `Notes: ${contact.notes}` : "",
  ].filter(Boolean);

  if (detail.pipelineItem) {
    lines.push(
      `Pipeline stage: ${STAGE_META[detail.pipelineItem.stage].label}${detail.pipelineItem.note ? ` — ${detail.pipelineItem.note}` : ""}`,
    );
  }

  if (detail.importantDates.length > 0) {
    lines.push("", "Important dates:");
    for (const date of detail.importantDates) {
      lines.push(`- ${date.label}: ${date.date}${date.recurring ? " (yearly)" : ""}`);
    }
  }

  if (detail.interactions.length > 0) {
    lines.push("", "Interaction history (newest first):");
    for (const interaction of detail.interactions) {
      lines.push(
        `- ${interaction.date} ${interaction.type}${interaction.notes ? `: ${interaction.notes}` : ""}`,
      );
    }
  }

  if (detail.voiceNotes.some((v) => v.transcript)) {
    lines.push("", "Voice note transcripts:");
    for (const voice of detail.voiceNotes) {
      if (voice.transcript) lines.push(`- ${voice.transcript}`);
    }
  }

  const openTasks = detail.tasks.filter((t) => !t.completedAt);
  if (openTasks.length > 0) {
    lines.push("", "Open tasks:");
    for (const task of openTasks) {
      lines.push(`- ${task.title}${task.dueDate ? ` (due ${task.dueDate})` : ""}`);
    }
  }

  if (detail.intros.length > 0) {
    lines.push("", "Introductions:");
    for (const intro of detail.intros) {
      lines.push(
        intro.kind === "received"
          ? `- ${intro.fromName} introduced me to ${intro.toName}`
          : `- I introduced ${intro.fromName} and ${intro.toName}`,
      );
    }
  }

  return lines.join("\n");
}
