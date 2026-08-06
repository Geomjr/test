import "server-only";
import { and, desc, eq, gte, inArray, isNotNull, isNull } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { listContacts } from "./contacts";
import { computeOverdue, type CadenceContact, type OverdueEntry } from "@/lib/domain/overdue";
import { expandUpcoming, type DateSource, type UpcomingEvent } from "@/lib/domain/upcoming";
import { pickReconnects, type ReconnectSuggestion } from "@/lib/domain/reconnect";
import { pickTodaysThree, type TodayMove } from "@/lib/domain/today";
import { extractPocketHooks, type PocketHook } from "@/lib/domain/pocket";
import { pairKey, pickIntroMatch, type IntroMatch } from "@/lib/domain/intro-match";
import type { PipelineCard } from "./pipeline";
import { listPipeline } from "./pipeline";
import type { TaskWithContact } from "./tasks";
import { addDays } from "@/lib/dates";

export type WeekPulse = {
  total: number;
  /** Interactions per day, trailing 7 days ending today. */
  byDay: number[];
};

export type ThankYouItem = {
  contactId: string;
  contactName: string;
  when: "today" | "yesterday";
};

export type DashboardData = {
  todaysThree: TodayMove[];
  weekPulse: WeekPulse;
  pocketHooks: PocketHook[];
  thankYous: ThankYouItem[];
  introMatch: IntroMatch | null;
  overdue: OverdueEntry[];
  upcoming: UpcomingEvent[];
  reconnects: ReconnectSuggestion[];
  dueTasks: TaskWithContact[];
  stalePipeline: PipelineCard[];
  contactCount: number;
};

/** Touchpoint types that represent a live conversation worth thanking. */
const LIVE_TYPES = ["coffee", "call", "meal", "event"] as const;

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

  // "In your pocket": the debrief coach's ask-next-time hooks for today's people.
  const heroIds = todaysThree.map((m) => m.contactId);
  let pocketHooks: PocketHook[] = [];
  if (heroIds.length > 0) {
    const noteRows = db()
      .select({
        contactId: tables.interactions.contactId,
        notes: tables.interactions.notes,
        date: tables.interactions.date,
      })
      .from(tables.interactions)
      .where(
        and(
          eq(tables.interactions.userId, userId),
          inArray(tables.interactions.contactId, heroIds),
          isNotNull(tables.interactions.notes),
        ),
      )
      .orderBy(desc(tables.interactions.date), desc(tables.interactions.createdAt))
      .all();
    pocketHooks = extractPocketHooks(
      noteRows.map((r) => ({
        contactId: r.contactId,
        contactName: nameById.get(r.contactId) ?? "Unknown",
        notes: r.notes ?? "",
      })),
    );
  }

  // Thank-you queue: live conversations from today/yesterday.
  const yesterday = addDays(todayIso, -1);
  const recentRows = db()
    .select({
      contactId: tables.interactions.contactId,
      type: tables.interactions.type,
      date: tables.interactions.date,
    })
    .from(tables.interactions)
    .where(and(eq(tables.interactions.userId, userId), gte(tables.interactions.date, yesterday)))
    .orderBy(desc(tables.interactions.date))
    .all();
  const thankYous: ThankYouItem[] = [];
  const thanked = new Set<string>();
  for (const row of recentRows) {
    if (!(LIVE_TYPES as readonly string[]).includes(row.type)) continue;
    if (thanked.has(row.contactId)) continue;
    const name = nameById.get(row.contactId);
    if (!name) continue;
    thankYous.push({
      contactId: row.contactId,
      contactName: name,
      when: row.date === todayIso ? "today" : "yesterday",
    });
    thanked.add(row.contactId);
    if (thankYous.length >= 3) break;
  }

  // Give-first: one plausible intro between two of the user's people.
  const introRows = db()
    .select({
      fromContactId: tables.intros.fromContactId,
      toContactId: tables.intros.toContactId,
    })
    .from(tables.intros)
    .where(eq(tables.intros.userId, userId))
    .all();
  const introduced = new Set(introRows.map((r) => pairKey(r.fromContactId, r.toContactId)));
  const introMatch = pickIntroMatch(
    contacts.map((c) => ({ id: c.id, name: c.name, industry: c.industry, company: c.company })),
    introduced,
    todayIso,
  );

  return {
    todaysThree,
    weekPulse,
    pocketHooks,
    thankYous,
    introMatch,
    overdue,
    upcoming,
    reconnects,
    dueTasks,
    stalePipeline,
    contactCount: contacts.length,
  };
}

