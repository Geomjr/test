import "server-only";
import { and, eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { newId } from "@/lib/ids";
import type { VoiceNote } from "@/lib/db/schema";

export function contactOwned(userId: string, contactId: string): boolean {
  return Boolean(
    db()
      .select({ id: tables.contacts.id })
      .from(tables.contacts)
      .where(and(eq(tables.contacts.id, contactId), eq(tables.contacts.userId, userId)))
      .get(),
  );
}

export function newVoiceNoteId(): string {
  return newId();
}

export function createVoiceNote(note: VoiceNote): VoiceNote {
  db().insert(tables.voiceNotes).values(note).run();
  return note;
}

export function getVoiceNote(userId: string, id: string): VoiceNote | null {
  return (
    db()
      .select()
      .from(tables.voiceNotes)
      .where(and(eq(tables.voiceNotes.id, id), eq(tables.voiceNotes.userId, userId)))
      .get() ?? null
  );
}

export function updateTranscript(
  userId: string,
  id: string,
  transcript: string | null,
): VoiceNote | null {
  const existing = getVoiceNote(userId, id);
  if (!existing) return null;
  db()
    .update(tables.voiceNotes)
    .set({ transcript })
    .where(and(eq(tables.voiceNotes.id, id), eq(tables.voiceNotes.userId, userId)))
    .run();
  return { ...existing, transcript };
}

/** Deletes the row and returns the file path for storage cleanup. */
export function deleteVoiceNote(userId: string, id: string): string | null {
  const existing = getVoiceNote(userId, id);
  if (!existing) return null;
  db()
    .delete(tables.voiceNotes)
    .where(and(eq(tables.voiceNotes.id, id), eq(tables.voiceNotes.userId, userId)))
    .run();
  return existing.filePath;
}
