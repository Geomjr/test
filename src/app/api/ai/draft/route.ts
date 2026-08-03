import { z } from "zod";
import { getUser } from "@/lib/auth/session";
import { apiError, badRequest, notFound, unauthorized } from "@/lib/http";
import { aiEnabled, consumeAiBudget } from "@/lib/ai/client";
import { aiTextStream } from "@/lib/ai/stream";
import { buildContactContext } from "@/lib/ai/digest";
import { draftInstruction } from "@/lib/ai/prompts";

const schema = z.object({
  contactId: z.string().min(1),
  kind: z.enum(["follow_up", "thank_you"]),
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

  return aiTextStream({
    system: [
      {
        type: "text",
        text: `${draftInstruction(parsed.data.kind)}\n\nThe user's name is ${user.name}.`,
      },
    ],
    messages: [{ role: "user", content: `<contact_record>\n${context}\n</contact_record>` }],
    maxTokens: 1024,
  });
}
