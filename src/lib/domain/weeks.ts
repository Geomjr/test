import { addDays, daysBetween, isoToUTC } from "@/lib/dates";

export type WeekBucket = {
  /** Monday of the week, YYYY-MM-DD */
  startsOn: string;
  count: number;
};

export function mondayOf(iso: string): string {
  const dayOfWeek = new Date(isoToUTC(iso)).getUTCDay(); // 0 = Sunday
  const sinceMonday = (dayOfWeek + 6) % 7;
  return addDays(iso, -sinceMonday);
}

/** Buckets interaction dates into the trailing `weeks` ISO weeks, oldest first. */
export function weeklyBuckets(
  dates: string[],
  todayIso: string,
  weeks = 12,
): WeekBucket[] {
  const currentMonday = mondayOf(todayIso);
  const buckets: WeekBucket[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    buckets.push({ startsOn: addDays(currentMonday, -7 * i), count: 0 });
  }
  const firstMonday = buckets[0]!.startsOn;

  for (const date of dates) {
    const offset = daysBetween(firstMonday, date);
    if (offset < 0) continue;
    const index = Math.floor(offset / 7);
    if (index >= 0 && index < buckets.length) buckets[index]!.count += 1;
  }
  return buckets;
}
