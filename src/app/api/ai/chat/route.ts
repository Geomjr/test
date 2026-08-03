import { z } from "zod";
import { getUser } from "@/lib/auth/session";
import { apiError, badRequest, unauthorized } from "@/lib/http";
import { aiEnabled, consumeAiBudget } from "@/lib/ai/client";
import { aiTextStream } from "@/lib/ai/stream";
import { buildDigest } from "@/lib/ai/digest";
import { CHAT_PERSONA } from "@/lib/ai/prompts";
import { userToday } from "@/lib/today";

const schema = z.object({
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
  if (parsed.data.messages[parsed.data.messages.length - 1]?.role !== "user") {
    return badRequest("The last message must be from the user.");
  }

  const digest = buildDigest(user.id);
  const today = await userToday();

  return aiTextStream({
    system: [
      { type: "text", text: CHAT_PERSONA },
      {
        type: "text",
        text: `<crm_data>\n${digest}\n</crm_data>`,
        // Cache breakpoint: persona + digest are stable across a chat session.
        cache_control: { type: "ephemeral" },
      },
      { type: "text", text: `The user's name is ${user.name}. Today is ${today}.` },
    ],
    messages: parsed.data.messages,
  });
}
