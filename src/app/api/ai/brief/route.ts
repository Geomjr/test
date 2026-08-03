import { z } from "zod";
import { getUser } from "@/lib/auth/session";
import { apiError, badRequest, notFound, unauthorized } from "@/lib/http";
import { aiEnabled, consumeAiBudget } from "@/lib/ai/client";
import { aiTextStream } from "@/lib/ai/stream";
import { buildContactContext } from "@/lib/ai/digest";
import { BRIEF_INSTRUCTION } from "@/lib/ai/prompts";
import { userToday } from "@/lib/today";

const schema = z.object({ contactId: z.string().min(1) });

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
  return aiTextStream({
    system: [{ type: "text", text: `${BRIEF_INSTRUCTION}\n\nToday is ${today}.` }],
    messages: [{ role: "user", content: `<contact_record>\n${context}\n</contact_record>` }],
    maxTokens: 2048,
  });
}
