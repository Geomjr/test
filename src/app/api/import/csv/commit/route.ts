import { z } from "zod";
import { getUser } from "@/lib/auth/session";
import { badRequest, json, unauthorized } from "@/lib/http";
import { createContact } from "@/lib/data/contacts";
import { formatDate } from "@/lib/dates";
import { sanitizeHttpUrl } from "@/lib/urls";
import { rawDb } from "@/lib/db";

const rowSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().max(254).nullish(),
  company: z.string().trim().max(200).nullish(),
  role: z.string().trim().max(200).nullish(),
  linkedinUrl: z.string().trim().max(500).nullish(),
  city: z.string().trim().max(120).nullish(),
  phone: z.string().trim().max(50).nullish(),
  connectedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullish(),
});

const schema = z.object({ rows: z.array(rowSchema).min(1).max(2000) });

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return unauthorized();

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid import payload.");

  // Atomic: either the whole batch imports or none of it does, so a mid-loop
  // failure never leaves a partial import that a retry would duplicate.
  let created = 0;
  rawDb().transaction(() => {
    for (const row of parsed.data.rows) {
      createContact(user.id, {
        name: row.name,
        email: row.email?.toLowerCase() || null,
        company: row.company || null,
        role: row.role || null,
        linkedinUrl: sanitizeHttpUrl(row.linkedinUrl),
        city: row.city || null,
        phone: row.phone || null,
        industry: null,
        howWeMet: row.connectedOn
          ? `Connected on LinkedIn (${formatDate(row.connectedOn)})`
          : null,
        tier: "new",
        cadenceDays: null,
        birthday: null,
        notes: null,
        tags: ["Imported"],
      });
      created += 1;
    }
  })();

  return json({ created });
}
