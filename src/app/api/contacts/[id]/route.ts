import { getUser } from "@/lib/auth/session";
import { badRequest, json, notFound, unauthorized } from "@/lib/http";
import { contactInput } from "@/lib/validation";
import { deleteContact, getContactDetail, updateContact } from "@/lib/data/contacts";
import { deleteFile } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  const user = await getUser();
  if (!user) return unauthorized();
  const { id } = await context.params;

  const detail = getContactDetail(user.id, id);
  if (!detail) return notFound();
  return json(detail);
}

export async function PATCH(request: Request, context: Ctx) {
  const user = await getUser();
  if (!user) return unauthorized();
  const { id } = await context.params;

  const parsed = contactInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message);

  const contact = updateContact(user.id, id, parsed.data);
  if (!contact) return notFound();
  return json({ contact });
}

export async function DELETE(_request: Request, context: Ctx) {
  const user = await getUser();
  if (!user) return unauthorized();
  const { id } = await context.params;

  const files = deleteContact(user.id, id);
  if (files === null) return notFound();
  await Promise.all(files.map((f) => deleteFile(f)));
  return json({ ok: true });
}
