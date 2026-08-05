import { z } from "zod";
import { getUser } from "@/lib/auth/session";
import { apiError, badRequest, notFound, unauthorized } from "@/lib/http";
import { aiEnabled, consumeAiBudget } from "@/lib/ai/client";
import { aiTextStream } from "@/lib/ai/stream";
import { buildContactContext } from "@/lib/ai/digest";
import { DEBRIEF_PERSONA } from "@/lib/ai/debrief";
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
    .min(1)
    .max(30),
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

  const messages = [...parsed.data.messages];
  while (messages[0]?.role === "assistant") messages.shift();
  if (messages.length === 0 || messages[messages.length - 1]?.role !== "user") {
    return badRequest("The last message must be from the user.");
  }

  const context = buildContactContext(user.id, parsed.data.contactId);
  if (!context) return notFound();
  const today = await userToday();

  return aiTextStream({
    system: [
      { type: "text", text: DEBRIEF_PERSONA },
      {
        type: "text",
        text: `<contact_record>\n${context}\n</contact_record>`,
        cache_control: { type: "ephemeral" },
      },
      { type: "text", text: `The user's name is ${user.name}. Today is ${today}.` },
    ],
    messages,
    maxTokens: 400,
  });
}
