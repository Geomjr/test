import "server-only";
import { inArray } from "drizzle-orm";
import { db, rawDb, tables } from "@/lib/db";
import { SNIPPET_CLOSE, SNIPPET_OPEN, toMatchQuery } from "@/lib/search";

export type SearchHit = {
  entityType: "contact" | "interaction" | "voice_note" | "task";
  entityId: string;
  contactId: string | null;
  title: string;
  subtitle: string | null;
  snippet: string | null;
  href: string;
};

type FtsRow = {
  entity_type: SearchHit["entityType"];
  entity_id: string;
  snip: string;
  title_snip: string;
};

export function searchAll(userId: string, query: string): SearchHit[] {
  const match = toMatchQuery(query);
  if (!match) return [];

  const rows = rawDb()
    .prepare(
      `SELECT entity_type, entity_id,
              snippet(search_index, 1, ?, ?, '…', 12) AS snip,
              snippet(search_index, 0, ?, ?, '…', 12) AS title_snip
       FROM search_index
       WHERE search_index MATCH ? AND user_id = ?
       ORDER BY bm25(search_index)
       LIMIT 40`,
    )
    .all(
      SNIPPET_OPEN,
      SNIPPET_CLOSE,
      SNIPPET_OPEN,
      SNIPPET_CLOSE,
      match,
      userId,
    ) as FtsRow[];

  if (rows.length === 0) return [];

  const idsByType = new Map<string, string[]>();
  for (const row of rows) {
    const list = idsByType.get(row.entity_type) ?? [];
    list.push(row.entity_id);
    idsByType.set(row.entity_type, list);
  }

  const contactMeta = new Map<string, { name: string; company: string | null }>();
  const contactIds = idsByType.get("contact") ?? [];
  if (contactIds.length > 0) {
    for (const c of db()
      .select({
        id: tables.contacts.id,
        name: tables.contacts.name,
        company: tables.contacts.company,
      })
      .from(tables.contacts)
      .where(inArray(tables.contacts.id, contactIds))
      .all()) {
      contactMeta.set(c.id, { name: c.name, company: c.company });
    }
  }

  const interactionMeta = new Map<string, { contactId: string; date: string; type: string }>();
  const interactionIds = idsByType.get("interaction") ?? [];
  if (interactionIds.length > 0) {
    for (const i of db()
      .select({
        id: tables.interactions.id,
        contactId: tables.interactions.contactId,
        date: tables.interactions.date,
        type: tables.interactions.type,
      })
      .from(tables.interactions)
      .where(inArray(tables.interactions.id, interactionIds))
      .all()) {
      interactionMeta.set(i.id, i);
    }
  }

  const voiceMeta = new Map<string, { contactId: string }>();
  const voiceIds = idsByType.get("voice_note") ?? [];
  if (voiceIds.length > 0) {
    for (const v of db()
      .select({ id: tables.voiceNotes.id, contactId: tables.voiceNotes.contactId })
      .from(tables.voiceNotes)
      .where(inArray(tables.voiceNotes.id, voiceIds))
      .all()) {
      voiceMeta.set(v.id, { contactId: v.contactId });
    }
  }

  const taskMeta = new Map<string, { contactId: string | null; completedAt: number | null }>();
  const taskIds = idsByType.get("task") ?? [];
  if (taskIds.length > 0) {
    for (const t of db()
      .select({
        id: tables.tasks.id,
        contactId: tables.tasks.contactId,
        completedAt: tables.tasks.completedAt,
      })
      .from(tables.tasks)
      .where(inArray(tables.tasks.id, taskIds))
      .all()) {
      taskMeta.set(t.id, t);
    }
  }

  // Interactions and voice notes display under their contact's name.
  const referencedContactIds = new Set<string>();
  for (const meta of interactionMeta.values()) referencedContactIds.add(meta.contactId);
  for (const meta of voiceMeta.values()) referencedContactIds.add(meta.contactId);
  const missing = [...referencedContactIds].filter((id) => !contactMeta.has(id));
  if (missing.length > 0) {
    for (const c of db()
      .select({
        id: tables.contacts.id,
        name: tables.contacts.name,
        company: tables.contacts.company,
      })
      .from(tables.contacts)
      .where(inArray(tables.contacts.id, missing))
      .all()) {
      contactMeta.set(c.id, { name: c.name, company: c.company });
    }
  }

  const hits: SearchHit[] = [];
  for (const row of rows) {
    if (row.entity_type === "contact") {
      const meta = contactMeta.get(row.entity_id);
      if (!meta) continue;
      hits.push({
        entityType: "contact",
        entityId: row.entity_id,
        contactId: row.entity_id,
        title: meta.name,
        subtitle: meta.company,
        snippet: row.snip.includes(SNIPPET_OPEN) ? row.snip : null,
        href: `/contacts/${row.entity_id}`,
      });
    } else if (row.entity_type === "interaction") {
      const meta = interactionMeta.get(row.entity_id);
      if (!meta) continue;
      const contact = contactMeta.get(meta.contactId);
      hits.push({
        entityType: "interaction",
        entityId: row.entity_id,
        contactId: meta.contactId,
        title: contact?.name ?? "Interaction",
        subtitle: `${meta.type} · ${meta.date}`,
        snippet: row.snip || null,
        href: `/contacts/${meta.contactId}`,
      });
    } else if (row.entity_type === "voice_note") {
      const meta = voiceMeta.get(row.entity_id);
      if (!meta) continue;
      const contact = contactMeta.get(meta.contactId);
      hits.push({
        entityType: "voice_note",
        entityId: row.entity_id,
        contactId: meta.contactId,
        title: contact?.name ?? "Voice note",
        subtitle: "Voice note",
        snippet: row.snip || null,
        href: `/contacts/${meta.contactId}`,
      });
    } else {
      const meta = taskMeta.get(row.entity_id);
      if (!meta) continue;
      hits.push({
        entityType: "task",
        entityId: row.entity_id,
        contactId: meta.contactId,
        title: row.title_snip,
        subtitle: meta.completedAt ? "Completed task" : "Task",
        snippet: null,
        href: meta.contactId ? `/contacts/${meta.contactId}` : "/tasks",
      });
    }
  }
  return hits;
}
