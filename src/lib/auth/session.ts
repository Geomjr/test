import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { eq, lt } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { SESSION_COOKIE } from "./cookie";
import type { User } from "@/lib/db/schema";

const SESSION_DAYS = 30;
const RENEW_BELOW_DAYS = 15;
const DAY_MS = 86_400_000;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Creates a session row and returns the raw token for the cookie. */
export function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString("base64url");
  const now = Date.now();
  // Opportunistic purge so abandoned sessions don't accumulate forever.
  db().delete(tables.sessions).where(lt(tables.sessions.expiresAt, now)).run();
  db()
    .insert(tables.sessions)
    .values({
      id: hashToken(token),
      userId,
      createdAt: now,
      expiresAt: now + SESSION_DAYS * DAY_MS,
    })
    .run();
  return token;
}

export async function setSessionCookie(token: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    db().delete(tables.sessions).where(eq(tables.sessions.id, hashToken(token))).run();
  }
  store.delete(SESSION_COOKIE);
}

/**
 * Resolves the signed-in user from the session cookie, or null.
 * Safe to call from Server Components and Route Handlers.
 */
export async function getUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const id = hashToken(token);
  const row = db()
    .select({ session: tables.sessions, user: tables.users })
    .from(tables.sessions)
    .innerJoin(tables.users, eq(tables.sessions.userId, tables.users.id))
    .where(eq(tables.sessions.id, id))
    .get();
  if (!row) return null;

  const now = Date.now();
  if (row.session.expiresAt <= now) {
    db().delete(tables.sessions).where(eq(tables.sessions.id, id)).run();
    return null;
  }

  // Sliding expiry: quietly extend active sessions nearing their end.
  if (row.session.expiresAt - now < RENEW_BELOW_DAYS * DAY_MS) {
    db()
      .update(tables.sessions)
      .set({ expiresAt: now + SESSION_DAYS * DAY_MS })
      .where(eq(tables.sessions.id, id))
      .run();
  }

  return row.user;
}
