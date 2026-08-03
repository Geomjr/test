import { getUser } from "@/lib/auth/session";
import { badRequest, json, unauthorized } from "@/lib/http";
import { contactInput } from "@/lib/validation";
import { createContact, listContacts } from "@/lib/data/contacts";

export async function GET() {
  const user = await getUser();
  if (!user) return unauthorized();
  return json({ contacts: listContacts(user.id) });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return unauthorized();

  const parsed = contactInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message);

  const contact = createContact(user.id, parsed.data);
  return json({ contact }, 201);
}
