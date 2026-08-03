import Papa from "papaparse";
import { getUser } from "@/lib/auth/session";
import { unauthorized } from "@/lib/http";
import { listContacts } from "@/lib/data/contacts";
import { TIER_META } from "@/lib/tiers";

export async function GET() {
  const user = await getUser();
  if (!user) return unauthorized();

  const contacts = listContacts(user.id);
  const csv = Papa.unparse(
    contacts.map((c) => ({
      Name: c.name,
      Company: c.company ?? "",
      Role: c.role ?? "",
      Industry: c.industry ?? "",
      City: c.city ?? "",
      Email: c.email ?? "",
      Phone: c.phone ?? "",
      LinkedIn: c.linkedinUrl ?? "",
      Tier: TIER_META[c.tier].label,
      "Cadence (days)": c.cadenceDays ?? "",
      Birthday: c.birthday ?? "",
      "How We Met": c.howWeMet ?? "",
      Tags: c.tags.join("; "),
      Notes: c.notes ?? "",
      "Last Interaction": c.lastInteractionDate ?? "",
    })),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="orbit-contacts.csv"',
    },
  });
}
