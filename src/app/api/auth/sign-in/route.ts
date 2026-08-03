import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { apiError, badRequest, json } from "@/lib/http";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

/**
 * Naive in-process throttle (documented limitation: per-process; use a shared
 * store when running multiple instances). Keyed by BOTH the client IP (best
 * effort — X-Forwarded-For is spoofable) and the target email (not spoofable),
 * so per-account brute force is limited even behind forged headers.
 */
const attempts = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 10;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ENTRIES = 5000;

function prune(now: number): void {
  if (attempts.size <= MAX_ENTRIES) return;
  for (const [key, entry] of attempts) {
    if (entry.resetAt < now) attempts.delete(key);
  }
  if (attempts.size > MAX_ENTRIES) attempts.clear();
}

function throttled(key: string): boolean {
  const entry = attempts.get(key);
  return Boolean(entry && entry.resetAt >= Date.now() && entry.count >= LIMIT);
}

function recordFailure(key: string): void {
  const now = Date.now();
  prune(now);
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

// Verified against when the account doesn't exist, so response timing doesn't
// reveal which emails are registered.
const dummyHashPromise = hashPassword("dummy-password-for-timing");

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest("Enter your email and password.");

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const keys = [`ip:${ip}`, `email:${parsed.data.email}`];
  if (keys.some(throttled)) {
    return apiError(429, "Too many attempts. Try again in a few minutes.", "RATE_LIMITED");
  }

  const user = db()
    .select()
    .from(tables.users)
    .where(eq(tables.users.email, parsed.data.email))
    .get();

  const valid = user
    ? await verifyPassword(user.passwordHash, parsed.data.password)
    : await verifyPassword(await dummyHashPromise, parsed.data.password);

  if (!user || !valid) {
    keys.forEach(recordFailure);
    return apiError(401, "Incorrect email or password.", "BAD_CREDENTIALS");
  }

  await setSessionCookie(createSession(user.id));
  return json({ ok: true });
}
