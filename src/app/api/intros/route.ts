import { getUser } from "@/lib/auth/session";
import { badRequest, json, unauthorized } from "@/lib/http";
import { introInput } from "@/lib/validation";
import { createIntro } from "@/lib/data/intros";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return unauthorized();

  const parsed = introInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message);

  const intro = createIntro(user.id, parsed.data);
  if (!intro) return badRequest("Both people must be your own (distinct) contacts.");
  return json({ intro }, 201);
}
