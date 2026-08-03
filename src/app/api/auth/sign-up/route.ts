import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { newId } from "@/lib/ids";
import { hashPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { apiError, badRequest, json } from "@/lib/http";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(200),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return badRequest("Enter your name, a valid email, and a password of at least 8 characters.");
  }
  const { name, email, password } = parsed.data;

  const existing = db()
    .select({ id: tables.users.id })
    .from(tables.users)
    .where(eq(tables.users.email, email))
    .get();
  if (existing) {
    return apiError(409, "An account with this email already exists.", "EMAIL_TAKEN");
  }

  const user = {
    id: newId(),
    email,
    name,
    passwordHash: await hashPassword(password),
    createdAt: Date.now(),
  };
  db().insert(tables.users).values(user).run();

  await setSessionCookie(createSession(user.id));
  return json({ ok: true });
}
