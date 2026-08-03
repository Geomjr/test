import "server-only";
import { and, eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { newId } from "@/lib/ids";
import type { ImportantDate } from "@/lib/db/schema";

export function createImportantDate(
  userId: string,
  input: { contactId: string; label: string; date: string; recurring: boolean },
): ImportantDate | null {
  const contact = db()
    .select({ id: tables.contacts.id })
    .from(tables.contacts)
    .where(and(eq(tables.contacts.id, input.contactId), eq(tables.contacts.userId, userId)))
    .get();
  if (!contact) return null;

  const row: ImportantDate = {
    id: newId(),
    userId,
    contactId: input.contactId,
    label: input.label,
    date: input.date,
    recurring: input.recurring ? 1 : 0,
  };
  db().insert(tables.importantDates).values(row).run();
  return row;
}

export function deleteImportantDate(userId: string, id: string): boolean {
  const result = db()
    .delete(tables.importantDates)
    .where(and(eq(tables.importantDates.id, id), eq(tables.importantDates.userId, userId)))
    .run();
  return result.changes > 0;
}
