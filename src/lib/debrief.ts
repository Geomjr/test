import { z } from "zod";
import { INTERACTION_TYPES } from "@/lib/db/schema";
import { dateStr } from "@/lib/validation";

/**
 * Shared shapes for the debrief wrap-up: the model's structured digest of an
 * AI-led post-conversation interview. Pure module — unit-testable.
 */

const rawWrap = z.object({
  summary: z.string().trim().min(1).max(4000),
  type: z.enum(INTERACTION_TYPES).catch("other"),
  date: dateStr.nullable().catch(null),
  follow_ups: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(500),
        due: dateStr.nullable().catch(null),
      }),
    )
    .max(3)
    .catch([]),
  ask_next_time: z.array(z.string().trim().min(1).max(300)).max(3).catch([]),
});

export type DebriefWrap = {
  summary: string;
  type: (typeof INTERACTION_TYPES)[number];
  date: string | null;
  followUps: { title: string; due: string | null }[];
  askNextTime: string[];
};

export function parseWrap(raw: string): DebriefWrap | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  const parsed = rawWrap.safeParse(data);
  if (!parsed.success) return null;
  return {
    summary: parsed.data.summary,
    type: parsed.data.type,
    date: parsed.data.date,
    followUps: parsed.data.follow_ups,
    askNextTime: parsed.data.ask_next_time,
  };
}

/** The note text stored on the interaction: summary + next-time hooks. */
export function composeNotes(wrap: DebriefWrap): string {
  if (wrap.askNextTime.length === 0) return wrap.summary;
  return `${wrap.summary}\n\nAsk next time:\n${wrap.askNextTime.map((q) => `- ${q}`).join("\n")}`;
}

export const WRAP_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "type", "date", "follow_ups", "ask_next_time"],
  properties: {
    summary: {
      type: "string",
      description:
        "A crisp 3-6 sentence note capturing what's worth remembering from this conversation: facts about the person, updates, specifics. Written in the user's voice ('She got the Bain offer...'). No preamble.",
    },
    type: {
      type: "string",
      enum: [...INTERACTION_TYPES],
      description: "The kind of touchpoint this was. Use 'other' when unclear.",
    },
    date: {
      description:
        "When the conversation happened as YYYY-MM-DD, only if the user said (e.g. 'yesterday'). Null means today.",
      anyOf: [{ type: "string" }, { type: "null" }],
    },
    follow_ups: {
      type: "array",
      description:
        "Concrete commitments the USER made in the conversation, as short imperative to-dos. Max 3. Empty if none.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "due"],
        properties: {
          title: { type: "string" },
          due: {
            description: "YYYY-MM-DD if a deadline is implied, else null.",
            anyOf: [{ type: "string" }, { type: "null" }],
          },
        },
      },
    },
    ask_next_time: {
      type: "array",
      description:
        "Up to 3 short, specific questions the user should ask this person next time — gaps the debrief revealed (things a curious friend would know). Empty if none stood out.",
      items: { type: "string" },
    },
  },
} as const;
