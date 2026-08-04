import { z } from "zod";
import { getUser } from "@/lib/auth/session";
import { apiError, badRequest, json, unauthorized } from "@/lib/http";
import { aiEnabled, consumeAiBudget } from "@/lib/ai/client";
import { resolveCapture } from "@/lib/ai/resolve";
import { listContacts } from "@/lib/data/contacts";
import { userToday } from "@/lib/today";

const schema = z.object({ text: z.string().trim().min(1).max(10_000) });

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return unauthorized();
  if (!aiEnabled()) return json({ ai: false });
  if (!consumeAiBudget(user.id)) {
    return apiError(429, "Daily AI limit reached — try again tomorrow.", "AI_LIMIT");
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest();

  const today = await userToday();
  const resolution = await resolveCapture(user.id, parsed.data.text, today);
  if (!resolution) return json({ ai: false });

  // Attach display fields so the client can render candidates directly.
  const byId = new Map(listContacts(user.id).map((c) => [c.id, c]));
  const matches = resolution.matches.flatMap((m) => {
    const contact = byId.get(m.id);
    if (!contact) return [];
    return [
      {
        id: contact.id,
        name: contact.name,
        detail: [contact.role, contact.company].filter(Boolean).join(" · "),
        confidence: m.confidence,
      },
    ];
  });

  return json({
    ai: true,
    matches,
    newPerson: resolution.newPerson,
    type: resolution.type,
    date: resolution.date,
    followUps: resolution.followUps,
  });
}
