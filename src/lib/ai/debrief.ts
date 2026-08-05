import "server-only";
import { AI_MODEL, anthropic } from "./client";
import { parseWrap, WRAP_JSON_SCHEMA, type DebriefWrap } from "@/lib/debrief";

export const DEBRIEF_PERSONA = `You are Orbit's debrief coach. The user just had a conversation with someone in their network; your job is to interview them about it — and quietly make them better at these conversations over time.

Style: ONE short question at a time. Warm, direct, zero corporate speak. React to what they share in a brief clause, then ask the next thing. Keep every turn under 40 words.

Dig for, in rough order:
1. What the conversation was about.
2. What's new in the person's work or life.
3. Something personal or specific worth remembering (names, plans, worries, wins).
4. Whether the user offered or promised anything — and whether the person asked for anything.

Coach lightly: when the user clearly doesn't know something a curious friend would have asked (what she's actually excited about, how the search is really going, what he needs help with), say so kindly in one sentence and note you'll flag it for next time — then move on. Never scold, never lecture.

Ground questions in the person's record when it helps ("Last time she was prepping Bain second rounds — did that come up?"). Never invent facts that aren't in the record or the user's answers.

After 4-5 exchanges — or sooner if answers run thin — say you have what you need and tell them to tap "Wrap up".`;

/** Structured wrap-up of a finished debrief transcript. */
export async function wrapDebrief(params: {
  context: string;
  today: string;
  transcript: { role: "user" | "assistant"; content: string }[];
}): Promise<DebriefWrap | null> {
  const conversation = params.transcript
    .map((m) => `${m.role === "user" ? "User" : "Coach"}: ${m.content}`)
    .join("\n");

  try {
    const response = await anthropic().beta.messages.create({
      model: AI_MODEL,
      max_tokens: 1500,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        format: {
          type: "json_schema",
          schema: WRAP_JSON_SCHEMA as unknown as Record<string, unknown>,
        },
      },
      system: [
        {
          type: "text",
          text: "Digest this post-conversation debrief into a structured note for the user's personal CRM. Base it only on the transcript and the contact record.",
        },
        { type: "text", text: `<contact_record>\n${params.context}\n</contact_record>` },
        { type: "text", text: `Today is ${params.today}.` },
      ],
      messages: [{ role: "user", content: `<debrief_transcript>\n${conversation}\n</debrief_transcript>` }],
    });

    if (response.stop_reason === "refusal") return null;
    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") return null;
    return parseWrap(block.text);
  } catch {
    return null;
  }
}
