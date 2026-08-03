import { getUser } from "@/lib/auth/session";
import { json, notFound, unauthorized } from "@/lib/http";
import { deleteImportantDate } from "@/lib/data/important-dates";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: Ctx) {
  const user = await getUser();
  if (!user) return unauthorized();
  const { id } = await context.params;

  if (!deleteImportantDate(user.id, id)) return notFound();
  return json({ ok: true });
}
