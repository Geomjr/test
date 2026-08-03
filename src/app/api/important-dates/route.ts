import { getUser } from "@/lib/auth/session";
import { badRequest, json, notFound, unauthorized } from "@/lib/http";
import { importantDateInput } from "@/lib/validation";
import { createImportantDate } from "@/lib/data/important-dates";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return unauthorized();

  const parsed = importantDateInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message);

  const date = createImportantDate(user.id, parsed.data);
  if (!date) return notFound();
  return json({ date }, 201);
}
