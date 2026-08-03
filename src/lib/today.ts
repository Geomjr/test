import "server-only";
import { cookies } from "next/headers";
import { todayISO } from "@/lib/dates";

/**
 * The user's calendar "today", derived from the timezone the client reports
 * in the `tz` cookie (set by <TimezoneCookie/>). Falls back to UTC.
 */
export async function userToday(): Promise<string> {
  const tz = (await cookies()).get("tz")?.value;
  return todayISO(tz ? decodeURIComponent(tz) : null);
}
