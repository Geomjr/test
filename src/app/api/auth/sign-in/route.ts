import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { apiError, badRequest, json } from "@/lib/http";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

// Naive in-memory throttle: 10 failed attempts / 15 min per IP.
const attempts = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 10;
const WINDOW_MS = 15 * 60 * 1000;

function throttled(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) return false;
  return entry.count >= LIMIT;
}

function recordFailure(ip: string): void {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (throttled(ip)) {
    return apiError(429, "Too many attempts. Try again in a few minutes.", "RATE_LIMITED");
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest("Enter your email and password.");

  const user = db()
    .select()
    .from(tables.users)
    .where(eq(tables.users.email, parsed.data.email))
    .get();

  const valid = user && (await verifyPassword(user.passwordHash, parsed.data.password));
  if (!valid) {
    recordFailure(ip);
    return apiError(401, "Incorrect email or password.", "BAD_CREDENTIALS");
  }

  await setSessionCookie(createSession(user.id));
  return json({ ok: true });
}
