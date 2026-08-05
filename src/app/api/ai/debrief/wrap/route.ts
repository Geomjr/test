import { z } from "zod";
import { getUser } from "@/lib/auth/session";
import { apiError, badRequest, json, notFound, unauthorized } from "@/lib/http";
import { aiEnabled, consumeAiBudget } from "@/lib/ai/client";
import { buildContactContext } from "@/lib/ai/digest";
import { wrapDebrief } from "@/lib/ai/debrief";
import { userToday } from "@/lib/today";

const schema = z.object({
  contactId: z.string().min(1),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(2)
    .max(40),
});

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return unauthorized();
  if (!aiEnabled()) return apiError(503, "AI is not configured.", "AI_DISABLED");
  if (!consumeAiBudget(user.id)) {
    return apiError(429, "Daily AI limit reached — try again tomorrow.", "AI_LIMIT");
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest();

  const context = buildContactContext(user.id, parsed.data.contactId);
  if (!context) return notFound();

  const today = await userToday();
  const wrap = await wrapDebrief({
    context,
    today,
    transcript: parsed.data.messages,
  });
  if (!wrap) return apiError(502, "Couldn't digest the debrief — try again.", "AI_WRAP_FAILED");

  return json({ wrap });
}
