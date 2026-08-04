import "server-only";
import { AI_MODEL, anthropic } from "./client";
import { listContacts } from "@/lib/data/contacts";
import {
  parseResolution,
  RESOLUTION_JSON_SCHEMA,
  type CaptureResolution,
} from "@/lib/capture";

const INSTRUCTION = `You file quick notes into a personal CRM. The user jotted (or dictated) a note about a conversation they had. Given their contact roster, work out who the note is about and what it says.

Rules:
- Match against the roster by name, nickname, company, role, or unambiguous context. First-name-only mentions match a roster contact when only one plausibly fits.
- If nobody in the roster fits but the note clearly names a new person, propose them under new_person instead of forcing a bad match.
- Never invent contact ids; copy them verbatim from the roster.
- follow_ups are only commitments the USER made ("I'll send…", "need to intro…"), not things the other person said.`;

/**
 * One non-streaming structured-output call: note text in, resolution out.
 * Returns null on refusal or an unusable reply — callers fall back to the
 * manual person picker, so this is best-effort by design.
 */
export async function resolveCapture(
  userId: string,
  text: string,
  today: string,
): Promise<CaptureResolution | null> {
  const contacts = listContacts(userId);
  if (contacts.length === 0) return null;

  const roster = contacts
    .map((c) =>
      [
        c.id,
        c.name,
        [c.role, c.company].filter(Boolean).join(" at "),
        c.tags.length ? `tags: ${c.tags.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join(" | "),
    )
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
          schema: RESOLUTION_JSON_SCHEMA as unknown as Record<string, unknown>,
        },
      },
      system: [
        { type: "text", text: INSTRUCTION },
        {
          type: "text",
          text: `<roster>\n${roster}\n</roster>`,
          cache_control: { type: "ephemeral" },
        },
        { type: "text", text: `Today is ${today}.` },
      ],
      messages: [{ role: "user", content: text }],
    });

    if (response.stop_reason === "refusal") return null;
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;

    return parseResolution(textBlock.text, new Set(contacts.map((c) => c.id)));
  } catch {
    return null;
  }
}
