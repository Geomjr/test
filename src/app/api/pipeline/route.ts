import { getUser } from "@/lib/auth/session";
import { apiError, badRequest, json, unauthorized } from "@/lib/http";
import { pipelineAdd } from "@/lib/validation";
import { addToPipeline, listPipeline } from "@/lib/data/pipeline";

export async function GET() {
  const user = await getUser();
  if (!user) return unauthorized();
  return json({ items: listPipeline(user.id) });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return unauthorized();

  const parsed = pipelineAdd.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message);

  const item = addToPipeline(user.id, parsed.data);
  if (!item) {
    return apiError(409, "This person is already on the pipeline board.", "ALREADY_ON_BOARD");
  }
  return json({ item }, 201);
}
