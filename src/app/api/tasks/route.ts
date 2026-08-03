import { getUser } from "@/lib/auth/session";
import { badRequest, json, notFound, unauthorized } from "@/lib/http";
import { taskInput } from "@/lib/validation";
import { createTask, listTasks } from "@/lib/data/tasks";

export async function GET() {
  const user = await getUser();
  if (!user) return unauthorized();
  return json({ tasks: listTasks(user.id) });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return unauthorized();

  const parsed = taskInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message);

  const task = createTask(user.id, parsed.data);
  if (!task) return notFound();
  return json({ task }, 201);
}
