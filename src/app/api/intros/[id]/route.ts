import { getUser } from "@/lib/auth/session";
import { json, notFound, unauthorized } from "@/lib/http";
import { deleteIntro } from "@/lib/data/intros";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: Ctx) {
  const user = await getUser();
  if (!user) return unauthorized();
  const { id } = await context.params;

  if (!deleteIntro(user.id, id)) return notFound();
  return json({ ok: true });
}
