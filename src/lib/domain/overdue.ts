import { daysBetween } from "@/lib/dates";

export type CadenceContact = {
  id: string;
  name: string;
  tier: string;
  cadenceDays: number | null;
  lastInteractionDate: string | null;
  /** ms epoch — used as the baseline when no interaction was ever logged */
  createdAt: number;
};

export type OverdueEntry = {
  id: string;
  name: string;
  tier: string;
  cadenceDays: number;
  lastInteractionDate: string | null;
  daysSince: number;
  /** 0 = due today, N = N days past due */
  daysOverdue: number;
};

function baselineDate(contact: CadenceContact): string {
  if (contact.lastInteractionDate) return contact.lastInteractionDate;
  return new Date(contact.createdAt).toISOString().slice(0, 10);
}

/**
 * A contact is "overdue" once the days since the last interaction (or since
 * the contact was created, if never contacted) reach its cadence. Sorted
 * most-overdue first.
 */
export function computeOverdue(
  contacts: CadenceContact[],
  todayIso: string,
): OverdueEntry[] {
  const entries: OverdueEntry[] = [];
  for (const contact of contacts) {
    if (contact.cadenceDays == null || contact.cadenceDays <= 0) continue;
    const daysSince = daysBetween(baselineDate(contact), todayIso);
    const daysOverdue = daysSince - contact.cadenceDays;
    if (daysOverdue < 0) continue;
    entries.push({
      id: contact.id,
      name: contact.name,
      tier: contact.tier,
      cadenceDays: contact.cadenceDays,
      lastInteractionDate: contact.lastInteractionDate,
      daysSince,
      daysOverdue,
    });
  }
  return entries.sort((a, b) => b.daysOverdue - a.daysOverdue);
}
