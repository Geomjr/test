/**
 * Give-first intro matching. X-discourse grounding: the loudest emotional
 * objection to networking is that it feels transactional — people reach out
 * only when they need something and feel gross about it. Leading the home
 * screen with an act of generosity (connecting two of your people) inverts
 * that: you become the person who gives intros, not the one who extracts.
 */

export type IntroCandidate = {
  id: string;
  name: string;
  industry: string | null;
  company: string | null;
};

export type IntroMatch = {
  aId: string;
  aName: string;
  bId: string;
  bName: string;
  /** The shared trait that makes the intro plausible. */
  why: string;
};

export const pairKey = (a: string, b: string): string => [a, b].sort().join("|");

/** Deterministic per-day pick so the suggestion is stable across refreshes. */
function seededIndex(seed: string, length: number): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % length;
}

/**
 * Pick one plausible intro: two contacts in the same industry, at different
 * companies, not already introduced through the user. Rotates daily.
 */
export function pickIntroMatch(
  contacts: IntroCandidate[],
  alreadyIntroduced: ReadonlySet<string>,
  seed: string,
): IntroMatch | null {
  const byIndustry = new Map<string, IntroCandidate[]>();
  for (const contact of contacts) {
    const industry = contact.industry?.trim().toLowerCase();
    if (!industry) continue;
    const list = byIndustry.get(industry) ?? [];
    list.push(contact);
    byIndustry.set(industry, list);
  }

  const pairs: IntroMatch[] = [];
  for (const group of byIndustry.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i]!;
        const b = group[j]!;
        if (alreadyIntroduced.has(pairKey(a.id, b.id))) continue;
        const sameCompany =
          a.company && b.company && a.company.trim().toLowerCase() === b.company.trim().toLowerCase();
        if (sameCompany) continue; // colleagues don't need your intro
        pairs.push({
          aId: a.id,
          aName: a.name,
          bId: b.id,
          bName: b.name,
          why: a.industry!.trim(),
        });
      }
    }
  }

  if (pairs.length === 0) return null;
  // Stable order before seeding so the daily pick is deterministic.
  pairs.sort((x, y) => pairKey(x.aId, x.bId).localeCompare(pairKey(y.aId, y.bId)));
  return pairs[seededIndex(seed, pairs.length)] ?? null;
}
