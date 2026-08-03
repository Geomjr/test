import "server-only";
import { and, eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { newId } from "@/lib/ids";
import type { Intro } from "@/lib/db/schema";

export function createIntro(
  userId: string,
  input: {
    kind: "received" | "made";
    fromContactId: string;
    toContactId: string;
    date: string | null;
    note: string | null;
  },
): Intro | null {
  if (input.fromContactId === input.toContactId) return null;

  // Both sides must be the user's own contacts.
  for (const contactId of [input.fromContactId, input.toContactId]) {
    const owned = db()
      .select({ id: tables.contacts.id })
      .from(tables.contacts)
      .where(and(eq(tables.contacts.id, contactId), eq(tables.contacts.userId, userId)))
      .get();
    if (!owned) return null;
  }

  const intro: Intro = {
    id: newId(),
    userId,
    kind: input.kind,
    fromContactId: input.fromContactId,
    toContactId: input.toContactId,
    date: input.date,
    note: input.note,
    createdAt: Date.now(),
  };
  db().insert(tables.intros).values(intro).run();
  return intro;
}

export function deleteIntro(userId: string, id: string): boolean {
  const result = db()
    .delete(tables.intros)
    .where(and(eq(tables.intros.id, id), eq(tables.intros.userId, userId)))
    .run();
  return result.changes > 0;
}
