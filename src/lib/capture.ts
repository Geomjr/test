import { z } from "zod";
import { INTERACTION_TYPES } from "@/lib/db/schema";
import { dateStr } from "@/lib/validation";

/**
 * Shared shapes for the Capture flow: the model's structured resolution of a
 * free-form note ("who is this about, what kind of touch, any promises made").
 * Pure module — no server-only imports — so parsing is unit-testable.
 */

const rawResolution = z.object({
  matches: z
    .array(z.object({ id: z.string().min(1), confidence: z.number() }))
    .max(5)
    .catch([]),
  new_person: z
    .object({
      name: z.string().trim().min(1).max(200),
      company: z.string().trim().max(200).nullable().catch(null),
      role: z.string().trim().max(200).nullable().catch(null),
    })
    .nullable()
    .catch(null),
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
});

export type CaptureResolution = {
  matches: { id: string; confidence: number }[];
  newPerson: { name: string; company: string | null; role: string | null } | null;
  type: (typeof INTERACTION_TYPES)[number];
  date: string | null;
  followUps: { title: string; due: string | null }[];
};

/**
 * Parse the model's JSON reply into a resolution, dropping anything invalid:
 * match ids that aren't real contacts of this user, out-of-range confidences,
 * malformed sub-objects. Returns null only if the payload isn't usable at all.
 */
export function parseResolution(
  raw: string,
  validContactIds: ReadonlySet<string>,
): CaptureResolution | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  const parsed = rawResolution.safeParse(data);
  if (!parsed.success) return null;

  const seen = new Set<string>();
  const matches = parsed.data.matches
    .filter((m) => validContactIds.has(m.id) && !seen.has(m.id) && seen.add(m.id))
    .map((m) => ({ id: m.id, confidence: Math.min(1, Math.max(0, m.confidence)) }))
    .sort((a, b) => b.confidence - a.confidence);

  return {
    matches,
    newPerson: parsed.data.new_person,
    type: parsed.data.type,
    date: parsed.data.date,
    followUps: parsed.data.follow_ups,
  };
}

/** JSON Schema handed to the API as `output_config.format`. */
export const RESOLUTION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["matches", "new_person", "type", "date", "follow_ups"],
  properties: {
    matches: {
      type: "array",
      description:
        "Existing contacts this note is plausibly about, best match first. Empty if nobody in the roster fits.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "confidence"],
        properties: {
          id: {
            type: "string",
            description: "A contact id copied verbatim from the roster.",
          },
          confidence: {
            type: "number",
            description: "How confident you are, from 0 to 1.",
          },
        },
      },
    },
    new_person: {
      description:
        "If the note is clearly about a specific person who is NOT in the roster, their details so a contact can be created. Otherwise null.",
      anyOf: [
        { type: "null" },
        {
          type: "object",
          additionalProperties: false,
          required: ["name", "company", "role"],
          properties: {
            name: { type: "string" },
            company: { anyOf: [{ type: "string" }, { type: "null" }] },
            role: { anyOf: [{ type: "string" }, { type: "null" }] },
          },
        },
      ],
    },
    type: {
      type: "string",
      enum: [...INTERACTION_TYPES],
      description: "What kind of touchpoint the note describes. Use 'other' when unclear.",
    },
    date: {
      description:
        "The date the interaction happened as YYYY-MM-DD, only if the note says or implies it (e.g. 'yesterday'). Null means today.",
      anyOf: [{ type: "string" }, { type: "null" }],
    },
    follow_ups: {
      type: "array",
      description:
        "Concrete commitments the user made in the note ('send her the deck', 'intro him to Sarah'), phrased as short imperative to-dos. At most 3. Empty if none.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "due"],
        properties: {
          title: { type: "string" },
          due: {
            description: "YYYY-MM-DD if the note implies a deadline, else null.",
            anyOf: [{ type: "string" }, { type: "null" }],
          },
        },
      },
    },
  },
} as const;
