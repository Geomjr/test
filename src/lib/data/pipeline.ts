import "server-only";
import { and, eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { newId } from "@/lib/ids";
import type { Contact, PipelineItem, PipelineStage } from "@/lib/db/schema";

export type PipelineCard = PipelineItem & {
  contact: Pick<Contact, "id" | "name" | "company" | "role" | "photoPath" | "tier">;
};

export function listPipeline(userId: string): PipelineCard[] {
  const rows = db()
    .select({ item: tables.pipelineItems, contact: tables.contacts })
    .from(tables.pipelineItems)
    .innerJoin(tables.contacts, eq(tables.pipelineItems.contactId, tables.contacts.id))
    .where(eq(tables.pipelineItems.userId, userId))
    .orderBy(tables.pipelineItems.position, tables.pipelineItems.createdAt)
    .all();

  return rows.map((r) => ({
    ...r.item,
    contact: {
      id: r.contact.id,
      name: r.contact.name,
      company: r.contact.company,
      role: r.contact.role,
      photoPath: r.contact.photoPath,
      tier: r.contact.tier,
    },
  }));
}

export function addToPipeline(
  userId: string,
  input: { contactId: string; stage: PipelineStage; note: string | null },
): PipelineItem | null {
  const contact = db()
    .select({ id: tables.contacts.id })
    .from(tables.contacts)
    .where(and(eq(tables.contacts.id, input.contactId), eq(tables.contacts.userId, userId)))
    .get();
  if (!contact) return null;

  const existing = db()
    .select({ id: tables.pipelineItems.id })
    .from(tables.pipelineItems)
    .where(
      and(
        eq(tables.pipelineItems.userId, userId),
        eq(tables.pipelineItems.contactId, input.contactId),
      ),
    )
    .get();
  if (existing) return null; // already on the board

  const now = Date.now();
  const item: PipelineItem = {
    id: newId(),
    userId,
    contactId: input.contactId,
    stage: input.stage,
    note: input.note,
    position: now, // append to end of column; fractional moves adjust later
    createdAt: now,
    updatedAt: now,
  };
  db().insert(tables.pipelineItems).values(item).run();
  return item;
}

export function patchPipelineItem(
  userId: string,
  id: string,
  patch: { stage?: PipelineStage; position?: number; note?: string | null },
): PipelineItem | null {
  const existing = db()
    .select()
    .from(tables.pipelineItems)
    .where(and(eq(tables.pipelineItems.id, id), eq(tables.pipelineItems.userId, userId)))
    .get();
  if (!existing) return null;

  const updates: Partial<PipelineItem> = { updatedAt: Date.now() };
  if (patch.stage !== undefined) updates.stage = patch.stage;
  if (patch.position !== undefined) updates.position = patch.position;
  if (patch.note !== undefined) updates.note = patch.note;

  db()
    .update(tables.pipelineItems)
    .set(updates)
    .where(and(eq(tables.pipelineItems.id, id), eq(tables.pipelineItems.userId, userId)))
    .run();

  return { ...existing, ...updates };
}

export function removeFromPipeline(userId: string, id: string): boolean {
  const result = db()
    .delete(tables.pipelineItems)
    .where(and(eq(tables.pipelineItems.id, id), eq(tables.pipelineItems.userId, userId)))
    .run();
  return result.changes > 0;
}
