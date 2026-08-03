import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { newId } from "@/lib/ids";
import type { Task } from "@/lib/db/schema";

export type TaskWithContact = Task & { contactName: string | null };

export function listTasks(userId: string): TaskWithContact[] {
  const rows = db()
    .select({ task: tables.tasks, contactName: tables.contacts.name })
    .from(tables.tasks)
    .leftJoin(tables.contacts, eq(tables.tasks.contactId, tables.contacts.id))
    .where(eq(tables.tasks.userId, userId))
    .orderBy(
      sql`${tables.tasks.completedAt} IS NOT NULL`,
      sql`${tables.tasks.dueDate} IS NULL`,
      tables.tasks.dueDate,
      tables.tasks.createdAt,
    )
    .all();
  return rows.map((r) => ({ ...r.task, contactName: r.contactName }));
}

export function createTask(
  userId: string,
  input: { title: string; contactId: string | null; dueDate: string | null },
): Task | null {
  if (input.contactId) {
    const contact = db()
      .select({ id: tables.contacts.id })
      .from(tables.contacts)
      .where(and(eq(tables.contacts.id, input.contactId), eq(tables.contacts.userId, userId)))
      .get();
    if (!contact) return null;
  }

  const task: Task = {
    id: newId(),
    userId,
    contactId: input.contactId,
    title: input.title,
    dueDate: input.dueDate,
    completedAt: null,
    createdAt: Date.now(),
  };
  db().insert(tables.tasks).values(task).run();
  return task;
}

export function patchTask(
  userId: string,
  id: string,
  patch: { title?: string; dueDate?: string | null; completed?: boolean },
): Task | null {
  const existing = db()
    .select()
    .from(tables.tasks)
    .where(and(eq(tables.tasks.id, id), eq(tables.tasks.userId, userId)))
    .get();
  if (!existing) return null;

  const updates: Partial<Task> = {};
  if (patch.title !== undefined) updates.title = patch.title;
  if (patch.dueDate !== undefined) updates.dueDate = patch.dueDate;
  if (patch.completed !== undefined) {
    updates.completedAt = patch.completed ? Date.now() : null;
  }
  if (Object.keys(updates).length === 0) return existing; // empty PATCH body

  db()
    .update(tables.tasks)
    .set(updates)
    .where(and(eq(tables.tasks.id, id), eq(tables.tasks.userId, userId)))
    .run();

  return { ...existing, ...updates };
}

export function deleteTask(userId: string, id: string): boolean {
  const result = db()
    .delete(tables.tasks)
    .where(and(eq(tables.tasks.id, id), eq(tables.tasks.userId, userId)))
    .run();
  return result.changes > 0;
}
