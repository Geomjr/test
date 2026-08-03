import { getUser } from "@/lib/auth/session";
import { badRequest, json, notFound, unauthorized } from "@/lib/http";
import { taskPatch } from "@/lib/validation";
import { deleteTask, patchTask } from "@/lib/data/tasks";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  const user = await getUser();
  if (!user) return unauthorized();
  const { id } = await context.params;

  const parsed = taskPatch.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message);

  const task = patchTask(user.id, id, parsed.data);
  if (!task) return notFound();
  return json({ task });
}

export async function DELETE(_request: Request, context: Ctx) {
  const user = await getUser();
  if (!user) return unauthorized();
  const { id } = await context.params;

  if (!deleteTask(user.id, id)) return notFound();
  return json({ ok: true });
}
