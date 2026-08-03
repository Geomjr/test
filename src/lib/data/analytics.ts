import "server-only";
import { count, eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { listContacts } from "./contacts";
import { weeklyBuckets, type WeekBucket } from "@/lib/domain/weeks";
import { daysBetween } from "@/lib/dates";
import { TIER_META, TIER_ORDER } from "@/lib/tiers";

export type AnalyticsData = {
  byIndustry: { label: string; count: number }[];
  byCompany: { label: string; count: number }[];
  byTier: { label: string; tier: string; count: number }[];
  weekly: WeekBucket[];
  mostContacted: { id: string; name: string; count: number }[];
  neglected: { id: string; name: string; tier: string; daysSince: number }[];
  totalContacts: number;
  totalInteractions: number;
};

function topGroups(values: (string | null)[], limit: number) {
  const counts = new Map<string, number>();
  for (const value of values) {
    const key = value?.trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, n]) => ({ label, count: n }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

export function getAnalytics(userId: string, todayIso: string): AnalyticsData {
  const contacts = listContacts(userId);

  const interactionCounts = db()
    .select({ contactId: tables.interactions.contactId, n: count() })
    .from(tables.interactions)
    .where(eq(tables.interactions.userId, userId))
    .groupBy(tables.interactions.contactId)
    .all();
  const countByContact = new Map(interactionCounts.map((r) => [r.contactId, r.n]));

  const dates = db()
    .select({ date: tables.interactions.date })
    .from(tables.interactions)
    .where(eq(tables.interactions.userId, userId))
    .all()
    .map((r) => r.date);

  const mostContacted = contacts
    .map((c) => ({ id: c.id, name: c.name, count: countByContact.get(c.id) ?? 0 }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 5);

  // "Neglected": people you claim to care about (cadence set, or an inner /
  // close / active tier) with the longest silence.
  const neglected = contacts
    .filter((c) => c.cadenceDays != null || ["inner", "close", "active"].includes(c.tier))
    .map((c) => ({
      id: c.id,
      name: c.name,
      tier: c.tier,
      daysSince: daysBetween(
        c.lastInteractionDate ?? new Date(c.createdAt).toISOString().slice(0, 10),
        todayIso,
      ),
    }))
    .sort((a, b) => b.daysSince - a.daysSince)
    .slice(0, 6);

  return {
    byIndustry: topGroups(contacts.map((c) => c.industry), 8),
    byCompany: topGroups(contacts.map((c) => c.company), 8),
    byTier: TIER_ORDER.map((tier) => ({
      label: TIER_META[tier].label,
      tier,
      count: contacts.filter((c) => c.tier === tier).length,
    })),
    weekly: weeklyBuckets(dates, todayIso, 12),
    mostContacted,
    neglected,
    totalContacts: contacts.length,
    totalInteractions: dates.length,
  };
}
