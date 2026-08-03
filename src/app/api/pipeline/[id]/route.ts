import { getUser } from "@/lib/auth/session";
import { badRequest, json, notFound, unauthorized } from "@/lib/http";
import { pipelinePatch } from "@/lib/validation";
import { patchPipelineItem, removeFromPipeline } from "@/lib/data/pipeline";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  const user = await getUser();
  if (!user) return unauthorized();
  const { id } = await context.params;

  const parsed = pipelinePatch.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message);

  const item = patchPipelineItem(user.id, id, parsed.data);
  if (!item) return notFound();
  return json({ item });
}

export async function DELETE(_request: Request, context: Ctx) {
  const user = await getUser();
  if (!user) return unauthorized();
  const { id } = await context.params;

  if (!removeFromPipeline(user.id, id)) return notFound();
  return json({ ok: true });
}
