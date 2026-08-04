import "server-only";
import { and, eq, gte, isNull } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { listContacts } from "./contacts";
import { computeOverdue, type CadenceContact, type OverdueEntry } from "@/lib/domain/overdue";
import { expandUpcoming, type DateSource, type UpcomingEvent } from "@/lib/domain/upcoming";
import { pickReconnects, type ReconnectSuggestion } from "@/lib/domain/reconnect";
import { pickTodaysThree, type TodayMove } from "@/lib/domain/today";
import type { PipelineCard } from "./pipeline";
import { listPipeline } from "./pipeline";
import type { TaskWithContact } from "./tasks";
import { addDays } from "@/lib/dates";

export type WeekPulse = {
  total: number;
  /** Interactions per day, trailing 7 days ending today. */
  byDay: number[];
};

export type DashboardData = {
  todaysThree: TodayMove[];
  weekPulse: WeekPulse;
  overdue: OverdueEntry[];
  upcoming: UpcomingEvent[];
  reconnects: ReconnectSuggestion[];
  dueTasks: TaskWithContact[];
  stalePipeline: PipelineCard[];
  contactCount: number;
};

const STALE_PIPELINE_DAYS = 7;

export function getDashboardData(userId: string, todayIso: string): DashboardData {
  const contacts = listContacts(userId);
  const cadenceContacts: CadenceContact[] = contacts.map((c) => ({
    id: c.id,
    name: c.name,
    tier: c.tier,
    cadenceDays: c.cadenceDays,
    lastInteractionDate: c.lastInteractionDate,
    createdAt: c.createdAt,
  }));

  const overdue = computeOverdue(cadenceContacts, todayIso);

  const dateSources: DateSource[] = [];
  for (const contact of contacts) {
    if (contact.birthday) {
      dateSources.push({
        contactId: contact.id,
        contactName: contact.name,
        label: "Birthday",
        date: contact.birthday,
        recurring: true,
      });
    }
  }
  const dateRows = db()
    .select({
      id: tables.importantDates.id,
      contactId: tables.importantDates.contactId,
      label: tables.importantDates.label,
      date: tables.importantDates.date,
      recurring: tables.importantDates.recurring,
    })
    .from(tables.importantDates)
    .where(eq(tables.importantDates.userId, userId))
    .all();
  const nameById = new Map(contacts.map((c) => [c.id, c.name]));
  for (const row of dateRows) {
    dateSources.push({
      contactId: row.contactId,
      contactName: nameById.get(row.contactId) ?? "Unknown",
      label: row.label,
      date: row.date,
      recurring: row.recurring === 1,
    });
  }
  const upcoming = expandUpcoming(dateSources, todayIso, 14);

  const reconnects = pickReconnects(
    cadenceContacts,
    todayIso,
    new Set(overdue.map((o) => o.id)),
    3,
  );

  const soon = addDays(todayIso, 7);
  const dueTaskRows = db()
    .select({ task: tables.tasks, contactName: tables.contacts.name })
    .from(tables.tasks)
    .leftJoin(tables.contacts, eq(tables.tasks.contactId, tables.contacts.id))
    .where(and(eq(tables.tasks.userId, userId), isNull(tables.tasks.completedAt)))
    .orderBy(tables.tasks.dueDate)
    .all();
  const dueTasks = dueTaskRows
    .map((r) => ({ ...r.task, contactName: r.contactName }))
    .filter((t) => t.dueDate !== null && t.dueDate <= soon);

  const staleBefore = Date.now() - STALE_PIPELINE_DAYS * 86_400_000;
  const stalePipeline = listPipeline(userId).filter(
    (item) => item.stage !== "keep_warm" && item.updatedAt < staleBefore,
  );

  const weekStart = addDays(todayIso, -6);
  const weekRows = db()
    .select({ date: tables.interactions.date })
    .from(tables.interactions)
    .where(
      and(eq(tables.interactions.userId, userId), gte(tables.interactions.date, weekStart)),
    )
    .all();
  const byDay = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(todayIso, i - 6);
    return weekRows.filter((r) => r.date === day).length;
  });
  const weekPulse: WeekPulse = { total: weekRows.length, byDay };

  const todaysThree = pickTodaysThree({
    overdue,
    upcoming,
    reconnects,
    promiseTasks: dueTasks.map((t) => ({
      id: t.id,
      title: t.title,
      contactId: t.contactId,
      contactName: t.contactName,
      dueDate: t.dueDate,
    })),
  });

  return {
    todaysThree,
    weekPulse,
    overdue,
    upcoming,
    reconnects,
    dueTasks,
    stalePipeline,
    contactCount: contacts.length,
  };
}

