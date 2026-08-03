import { daysBetween } from "@/lib/dates";
import type { CadenceContact } from "./overdue";

export type ReconnectSuggestion = {
  id: string;
  name: string;
  tier: string;
  daysSince: number;
  lastInteractionDate: string | null;
};

/** Deterministic PRNG so the day's suggestions are stable across refreshes. */
function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 100_000) / 100_000;
  };
}

const QUIET_THRESHOLD_DAYS = 21;

/**
 * Gentle serendipity beyond hard cadence rules: picks 2-3 people who have
 * gone quiet (3+ weeks), excluding anyone already surfaced as overdue,
 * mixing tiers where possible. Stable for a given day.
 */
export function pickReconnects(
  contacts: CadenceContact[],
  todayIso: string,
  excludeIds: Set<string>,
  count = 3,
): ReconnectSuggestion[] {
  const candidates: ReconnectSuggestion[] = [];
  for (const contact of contacts) {
    if (excludeIds.has(contact.id)) continue;
    const baseline =
      contact.lastInteractionDate ??
      new Date(contact.createdAt).toISOString().slice(0, 10);
    const daysSince = daysBetween(baseline, todayIso);
    if (daysSince < QUIET_THRESHOLD_DAYS) continue;
    candidates.push({
      id: contact.id,
      name: contact.name,
      tier: contact.tier,
      daysSince,
      lastInteractionDate: contact.lastInteractionDate,
    });
  }
  if (candidates.length === 0) return [];

  const rand = seededRandom(todayIso);
  const shuffled = [...candidates].sort(() => rand() - 0.5);

  // Greedy pick preferring unseen tiers, so suggestions span the network.
  const picked: ReconnectSuggestion[] = [];
  const usedTiers = new Set<string>();
  for (const candidate of shuffled) {
    if (picked.length >= count) break;
    if (!usedTiers.has(candidate.tier)) {
      picked.push(candidate);
      usedTiers.add(candidate.tier);
    }
  }
  for (const candidate of shuffled) {
    if (picked.length >= count) break;
    if (!picked.includes(candidate)) picked.push(candidate);
  }
  return picked;
}
