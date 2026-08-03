/**
 * All dates are stored as ISO `YYYY-MM-DD` strings (calendar semantics, no
 * timezone math in storage). "Today" is computed from the user's timezone,
 * which the client reports via a `tz` cookie.
 */

export function todayISO(tz?: string | null): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    // Unknown timezone string — fall back to UTC.
    return new Date().toISOString().slice(0, 10);
  }
}

export function isoToUTC(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((isoToUTC(toISO) - isoToUTC(fromISO)) / 86_400_000);
}

export function addDays(iso: string, days: number): string {
  const t = new Date(isoToUTC(iso) + days * 86_400_000);
  return t.toISOString().slice(0, 10);
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "2026-03-12" → "Mar 12, 2026"; "--03-12" (year unknown) → "Mar 12". */
export function formatDate(iso: string, opts?: { year?: boolean }): string {
  if (iso.startsWith("--")) {
    const md = monthDay(iso);
    return md ? `${MONTHS[md.month - 1]} ${md.day}` : iso;
  }
  const [y, m, d] = iso.split("-").map(Number);
  if (!m || !d) return iso;
  const base = `${MONTHS[m - 1]} ${d}`;
  return opts?.year === false || !y ? base : `${base}, ${y}`;
}

/** Month/day of a date, supporting year-less birthdays stored as "--MM-DD". */
export function monthDay(iso: string): { month: number; day: number } | null {
  const match = /^(?:\d{4}|-)-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return { month: Number(match[1]), day: Number(match[2]) };
}

/** Human relative label for a past date: Today / Yesterday / 5d ago / Mar 2. */
export function relativePast(iso: string, todayIso: string): string {
  const diff = daysBetween(iso, todayIso);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 30) return `${diff}d ago`;
  if (diff < 365) return formatDate(iso, { year: false });
  return formatDate(iso);
}

/** Human label for an upcoming date: Today / Tomorrow / In 5 days / Mar 2. */
export function relativeFuture(iso: string, todayIso: string): string {
  const diff = daysBetween(todayIso, iso);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 15) return `In ${diff} days`;
  return formatDate(iso, { year: false });
}
