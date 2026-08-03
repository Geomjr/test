import { getUser } from "@/lib/auth/session";
import { badRequest, json, notFound, unauthorized } from "@/lib/http";
import { interactionPatch } from "@/lib/validation";
import { deleteInteraction, updateInteraction } from "@/lib/data/interactions";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  const user = await getUser();
  if (!user) return unauthorized();
  const { id } = await context.params;

  const parsed = interactionPatch.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message);

  const interaction = updateInteraction(user.id, id, parsed.data);
  if (!interaction) return notFound();
  return json({ interaction });
}

export async function DELETE(_request: Request, context: Ctx) {
  const user = await getUser();
  if (!user) return unauthorized();
  const { id } = await context.params;

  if (!deleteInteraction(user.id, id)) return notFound();
  return json({ ok: true });
}
