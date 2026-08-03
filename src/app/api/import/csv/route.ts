import { getUser } from "@/lib/auth/session";
import { badRequest, json, unauthorized } from "@/lib/http";
import { db, tables } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  autoMapColumns,
  buildImportRows,
  dedupeRows,
  parseCsv,
} from "@/lib/csv/linkedin";

const MAX_CSV_BYTES = 5 * 1024 * 1024;

/** Parses + previews an uploaded CSV. Performs no writes. */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return unauthorized();

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return badRequest("Attach a CSV file.");
  if (file.size > MAX_CSV_BYTES) return badRequest("CSV files are capped at 5 MB.");

  const parsed = parseCsv(await file.text());
  if (parsed.headers.length === 0 || parsed.rows.length === 0) {
    return badRequest("Couldn't find any rows in that file.");
  }

  const mapping = autoMapColumns(parsed.headers);
  if (mapping.name === undefined && mapping.firstName === undefined) {
    return badRequest(
      "Couldn't find a name column. Expected a “Name” or “First Name” header.",
    );
  }

  const rows = buildImportRows(parsed, mapping);
  const existing = db()
    .select({
      id: tables.contacts.id,
      name: tables.contacts.name,
      email: tables.contacts.email,
    })
    .from(tables.contacts)
    .where(eq(tables.contacts.userId, user.id))
    .all();
  const statuses = dedupeRows(existing, rows);

  return json({
    headers: parsed.headers,
    skippedPreamble: parsed.skippedPreamble,
    total: rows.length,
    rows: rows.slice(0, 500).map((row, i) => ({ ...row, ...statuses[i] })),
  });
}
