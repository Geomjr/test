import "server-only";
import { cookies } from "next/headers";
import { todayISO } from "@/lib/dates";

/**
 * The user's calendar "today", derived from the timezone the client reports
 * in the `tz` cookie (set by <TimezoneCookie/>). Falls back to UTC.
 */
export async function userToday(): Promise<string> {
  const tz = (await cookies()).get("tz")?.value;
  let decoded: string | null = null;
  if (tz) {
    try {
      decoded = decodeURIComponent(tz);
    } catch {
      decoded = null; // malformed cookie — fall back to UTC rather than 500
    }
  }
  return todayISO(decoded);
}

/** Time-of-day greeting in the user's timezone: "Good morning", etc. */
export async function userGreeting(firstName?: string): Promise<string> {
  const tz = (await cookies()).get("tz")?.value;
  let hour = new Date().getUTCHours();
  if (tz) {
    try {
      const formatted = new Intl.DateTimeFormat("en-US", {
        timeZone: decodeURIComponent(tz),
        hour: "numeric",
        hour12: false,
      }).format(new Date());
      const parsed = Number.parseInt(formatted, 10);
      if (Number.isFinite(parsed)) hour = parsed % 24;
    } catch {
      // unknown timezone — keep UTC hour
    }
  }
  const base = hour < 5 ? "Good evening" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return firstName ? `${base}, ${firstName}` : base;
}
