import "server-only";
import { and, eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { newId } from "@/lib/ids";
import type { Interaction, InteractionType } from "@/lib/db/schema";

export function createInteraction(
  userId: string,
  input: { contactId: string; type: InteractionType; date: string; notes: string | null },
): Interaction | null {
  const contact = db()
    .select({ id: tables.contacts.id })
    .from(tables.contacts)
    .where(and(eq(tables.contacts.id, input.contactId), eq(tables.contacts.userId, userId)))
    .get();
  if (!contact) return null;

  const interaction: Interaction = {
    id: newId(),
    userId,
    contactId: input.contactId,
    type: input.type,
    date: input.date,
    notes: input.notes,
    createdAt: Date.now(),
  };
  db().insert(tables.interactions).values(interaction).run();
  return interaction;
}

export function updateInteraction(
  userId: string,
  id: string,
  patch: { type?: InteractionType; date?: string; notes?: string | null },
): Interaction | null {
  const existing = db()
    .select()
    .from(tables.interactions)
    .where(and(eq(tables.interactions.id, id), eq(tables.interactions.userId, userId)))
    .get();
  if (!existing) return null;

  const updates = {
    ...(patch.type !== undefined ? { type: patch.type } : {}),
    ...(patch.date !== undefined ? { date: patch.date } : {}),
    ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
  };
  if (Object.keys(updates).length === 0) return existing; // empty PATCH body

  db()
    .update(tables.interactions)
    .set(updates)
    .where(and(eq(tables.interactions.id, id), eq(tables.interactions.userId, userId)))
    .run();

  return { ...existing, ...updates };
}

export function deleteInteraction(userId: string, id: string): boolean {
  const result = db()
    .delete(tables.interactions)
    .where(and(eq(tables.interactions.id, id), eq(tables.interactions.userId, userId)))
    .run();
  return result.changes > 0;
}
