import { getUser } from "@/lib/auth/session";
import { badRequest, json, notFound, unauthorized } from "@/lib/http";
import { interactionInput } from "@/lib/validation";
import { createInteraction } from "@/lib/data/interactions";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return unauthorized();

  const parsed = interactionInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message);

  const interaction = createInteraction(user.id, parsed.data);
  if (!interaction) return notFound();
  return json({ interaction }, 201);
}
