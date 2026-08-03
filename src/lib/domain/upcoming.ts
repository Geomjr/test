import { daysBetween, monthDay } from "@/lib/dates";

export type DateSource = {
  contactId: string;
  contactName: string;
  label: string;
  /** YYYY-MM-DD, or --MM-DD for year-less birthdays */
  date: string;
  recurring: boolean;
};

export type UpcomingEvent = DateSource & {
  /** Concrete next occurrence, YYYY-MM-DD */
  occursOn: string;
  inDays: number;
};

function isLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function occurrenceInYear(year: number, month: number, day: number): string {
  // Feb 29 birthdays observe Feb 28 in non-leap years.
  const actualDay = month === 2 && day === 29 && !isLeap(year) ? 28 : day;
  return `${year}-${String(month).padStart(2, "0")}-${String(actualDay).padStart(2, "0")}`;
}

/**
 * Expands recurring dates (and includes literal one-off dates) that fall
 * within the next `horizonDays` days, today inclusive. Handles year rollover
 * (a Jan 2 birthday shows up in late December) and Feb 29.
 */
export function expandUpcoming(
  sources: DateSource[],
  todayIso: string,
  horizonDays = 14,
): UpcomingEvent[] {
  const todayYear = Number(todayIso.slice(0, 4));
  const events: UpcomingEvent[] = [];

  for (const source of sources) {
    if (source.recurring) {
      const md = monthDay(source.date);
      if (!md) continue;
      let occursOn = occurrenceInYear(todayYear, md.month, md.day);
      if (daysBetween(todayIso, occursOn) < 0) {
        occursOn = occurrenceInYear(todayYear + 1, md.month, md.day);
      }
      const inDays = daysBetween(todayIso, occursOn);
      if (inDays >= 0 && inDays <= horizonDays) {
        events.push({ ...source, occursOn, inDays });
      }
    } else {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(source.date)) continue;
      const inDays = daysBetween(todayIso, source.date);
      if (inDays >= 0 && inDays <= horizonDays) {
        events.push({ ...source, occursOn: source.date, inDays });
      }
    }
  }

  return events.sort((a, b) => a.inDays - b.inDays || a.contactName.localeCompare(b.contactName));
}
