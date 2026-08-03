import "server-only";
import { and, desc, eq, inArray, max, sql } from "drizzle-orm";
import { db, rawDb, tables } from "@/lib/db";
import { newId } from "@/lib/ids";
import type { Contact, ImportantDate, Interaction, PipelineItem, Task, VoiceNote } from "@/lib/db/schema";
import type { ContactInput } from "@/lib/validation";

export type ContactListItem = Contact & {
  tags: string[];
  lastInteractionDate: string | null;
};

export function listContacts(userId: string): ContactListItem[] {
  const rows = db()
    .select()
    .from(tables.contacts)
    .where(eq(tables.contacts.userId, userId))
    .orderBy(tables.contacts.name)
    .all();

  const tagRows = db()
    .select({
      contactId: tables.contactTags.contactId,
      name: tables.tags.name,
    })
    .from(tables.contactTags)
    .innerJoin(tables.tags, eq(tables.contactTags.tagId, tables.tags.id))
    .where(eq(tables.tags.userId, userId))
    .all();

  const lastRows = db()
    .select({
      contactId: tables.interactions.contactId,
      last: max(tables.interactions.date),
    })
    .from(tables.interactions)
    .where(eq(tables.interactions.userId, userId))
    .groupBy(tables.interactions.contactId)
    .all();

  const tagsByContact = new Map<string, string[]>();
  for (const row of tagRows) {
    const list = tagsByContact.get(row.contactId) ?? [];
    list.push(row.name);
    tagsByContact.set(row.contactId, list);
  }
  const lastByContact = new Map(lastRows.map((r) => [r.contactId, r.last]));

  return rows.map((contact) => ({
    ...contact,
    tags: (tagsByContact.get(contact.id) ?? []).sort(),
    lastInteractionDate: lastByContact.get(contact.id) ?? null,
  }));
}

export function getContact(userId: string, id: string): Contact | null {
  return (
    db()
      .select()
      .from(tables.contacts)
      .where(and(eq(tables.contacts.id, id), eq(tables.contacts.userId, userId)))
      .get() ?? null
  );
}

export type IntroWithNames = {
  id: string;
  kind: "received" | "made";
  fromContactId: string;
  toContactId: string;
  fromName: string;
  toName: string;
  date: string | null;
  note: string | null;
};

export type ContactDetail = {
  contact: Contact;
  tags: string[];
  importantDates: ImportantDate[];
  interactions: Interaction[];
  voiceNotes: VoiceNote[];
  pipelineItem: PipelineItem | null;
  tasks: Task[];
  intros: IntroWithNames[];
};

export function getContactDetail(userId: string, id: string): ContactDetail | null {
  const contact = getContact(userId, id);
  if (!contact) return null;

  const tagRows = db()
    .select({ name: tables.tags.name })
    .from(tables.contactTags)
    .innerJoin(tables.tags, eq(tables.contactTags.tagId, tables.tags.id))
    .where(eq(tables.contactTags.contactId, id))
    .all();

  const importantDates = db()
    .select()
    .from(tables.importantDates)
    .where(and(eq(tables.importantDates.contactId, id), eq(tables.importantDates.userId, userId)))
    .orderBy(tables.importantDates.date)
    .all();

  const interactionRows = db()
    .select()
    .from(tables.interactions)
    .where(and(eq(tables.interactions.contactId, id), eq(tables.interactions.userId, userId)))
    .orderBy(desc(tables.interactions.date), desc(tables.interactions.createdAt))
    .all();

  const voiceRows = db()
    .select()
    .from(tables.voiceNotes)
    .where(and(eq(tables.voiceNotes.contactId, id), eq(tables.voiceNotes.userId, userId)))
    .orderBy(desc(tables.voiceNotes.createdAt))
    .all();

  const pipelineItem =
    db()
      .select()
      .from(tables.pipelineItems)
      .where(and(eq(tables.pipelineItems.contactId, id), eq(tables.pipelineItems.userId, userId)))
      .get() ?? null;

  const taskRows = db()
    .select()
    .from(tables.tasks)
    .where(and(eq(tables.tasks.contactId, id), eq(tables.tasks.userId, userId)))
    .orderBy(sql`${tables.tasks.completedAt} IS NOT NULL`, tables.tasks.dueDate)
    .all();

  const introRows = db()
    .select()
    .from(tables.intros)
    .where(
      and(
        eq(tables.intros.userId, userId),
        sql`(${tables.intros.fromContactId} = ${id} OR ${tables.intros.toContactId} = ${id})`,
      ),
    )
    .all();

  const nameIds = new Set<string>();
  for (const intro of introRows) {
    nameIds.add(intro.fromContactId);
    nameIds.add(intro.toContactId);
  }
  const names = new Map<string, string>();
  if (nameIds.size > 0) {
    const nameRows = db()
      .select({ id: tables.contacts.id, name: tables.contacts.name })
      .from(tables.contacts)
      .where(inArray(tables.contacts.id, [...nameIds]))
      .all();
    for (const row of nameRows) names.set(row.id, row.name);
  }

  return {
    contact,
    tags: tagRows.map((t) => t.name).sort(),
    importantDates,
    interactions: interactionRows,
    voiceNotes: voiceRows,
    pipelineItem,
    tasks: taskRows,
    intros: introRows.map((intro) => ({
      id: intro.id,
      kind: intro.kind,
      fromContactId: intro.fromContactId,
      toContactId: intro.toContactId,
      fromName: names.get(intro.fromContactId) ?? "Unknown",
      toName: names.get(intro.toContactId) ?? "Unknown",
      date: intro.date,
      note: intro.note,
    })),
  };
}

function setContactTags(userId: string, contactId: string, tagNames: string[]): void {
  const normalized = [...new Set(tagNames.map((t) => t.trim()).filter(Boolean))];

  db().delete(tables.contactTags).where(eq(tables.contactTags.contactId, contactId)).run();

  for (const name of normalized) {
    let tag = db()
      .select()
      .from(tables.tags)
      .where(and(eq(tables.tags.userId, userId), eq(tables.tags.name, name)))
      .get();
    if (!tag) {
      tag = { id: newId(), userId, name };
      db().insert(tables.tags).values(tag).run();
    }
    db().insert(tables.contactTags).values({ contactId, tagId: tag.id }).run();
  }

  // Prune tags that no longer label anything.
  db().run(sql`
    DELETE FROM tags WHERE user_id = ${userId}
    AND id NOT IN (SELECT tag_id FROM contact_tags)
  `);
}

/** Runs multi-statement writes atomically (nested calls become savepoints). */
function atomically<T>(fn: () => T): T {
  return rawDb().transaction(fn)();
}

export function createContact(userId: string, input: ContactInput): Contact {
  const now = Date.now();
  const contact: Contact = {
    id: newId(),
    userId,
    name: input.name,
    photoPath: null,
    company: input.company,
    role: input.role,
    industry: input.industry,
    city: input.city,
    email: input.email,
    phone: input.phone,
    linkedinUrl: input.linkedinUrl,
    howWeMet: input.howWeMet,
    tier: input.tier,
    cadenceDays: input.cadenceDays,
    birthday: input.birthday,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
  atomically(() => {
    db().insert(tables.contacts).values(contact).run();
    setContactTags(userId, contact.id, input.tags);
  });
  return contact;
}

export function updateContact(
  userId: string,
  id: string,
  input: ContactInput,
): Contact | null {
  const existing = getContact(userId, id);
  if (!existing) return null;

  atomically(() => {
    db()
      .update(tables.contacts)
      .set({
        name: input.name,
      company: input.company,
      role: input.role,
      industry: input.industry,
      city: input.city,
      email: input.email,
      phone: input.phone,
      linkedinUrl: input.linkedinUrl,
      howWeMet: input.howWeMet,
      tier: input.tier,
      cadenceDays: input.cadenceDays,
      birthday: input.birthday,
        notes: input.notes,
        updatedAt: Date.now(),
      })
      .where(and(eq(tables.contacts.id, id), eq(tables.contacts.userId, userId)))
      .run();

    setContactTags(userId, id, input.tags);
  });
  return getContact(userId, id);
}

/** Returns file paths (photo + voice notes) the caller should delete from storage. */
export function deleteContact(userId: string, id: string): string[] | null {
  const existing = getContact(userId, id);
  if (!existing) return null;

  const files: string[] = [];
  if (existing.photoPath) files.push(existing.photoPath);
  const voiceRows = db()
    .select({ filePath: tables.voiceNotes.filePath })
    .from(tables.voiceNotes)
    .where(and(eq(tables.voiceNotes.contactId, id), eq(tables.voiceNotes.userId, userId)))
    .all();
  files.push(...voiceRows.map((v) => v.filePath));

  atomically(() => {
    // FK cascades don't reliably fire child-table triggers in SQLite, so scrub
    // the search index for this contact's children explicitly before deleting.
    db().run(sql`
      DELETE FROM search_index WHERE
        (entity_type = 'interaction' AND entity_id IN (SELECT id FROM interactions WHERE contact_id = ${id}))
        OR (entity_type = 'voice_note' AND entity_id IN (SELECT id FROM voice_notes WHERE contact_id = ${id}))
        OR (entity_type = 'task' AND entity_id IN (SELECT id FROM tasks WHERE contact_id = ${id}))
    `);

    db()
      .delete(tables.contacts)
      .where(and(eq(tables.contacts.id, id), eq(tables.contacts.userId, userId)))
      .run();
  });

  return files;
}

export function setContactPhoto(userId: string, id: string, photoPath: string | null): void {
  db()
    .update(tables.contacts)
    .set({ photoPath, updatedAt: Date.now() })
    .where(and(eq(tables.contacts.id, id), eq(tables.contacts.userId, userId)))
    .run();
}

export function listAllTags(userId: string): string[] {
  return db()
    .select({ name: tables.tags.name })
    .from(tables.tags)
    .where(eq(tables.tags.userId, userId))
    .orderBy(tables.tags.name)
    .all()
    .map((t) => t.name);
}
