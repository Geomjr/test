import { z } from "zod";
import { INTERACTION_TYPES, PIPELINE_STAGES, TIERS } from "@/lib/db/schema";
import { sanitizeHttpUrl } from "@/lib/urls";

export const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

/** Birthday accepts a year-less form ("--MM-DD") for people whose year you don't know. */
export const birthdayStr = z
  .string()
  .regex(/^(?:\d{4}|-)-\d{2}-\d{2}$/, "Expected YYYY-MM-DD or --MM-DD");

const optStr = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullish()
    .transform((v) => v ?? null);

export const contactInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  company: optStr(200),
  role: optStr(200),
  industry: optStr(120),
  city: optStr(120),
  email: optStr(254),
  phone: optStr(50),
  linkedinUrl: optStr(500).transform((v) => sanitizeHttpUrl(v)),
  howWeMet: optStr(1000),
  tier: z.enum(TIERS).default("new"),
  cadenceDays: z.number().int().min(1).max(730).nullish().transform((v) => v ?? null),
  birthday: birthdayStr.nullish().transform((v) => v ?? null),
  notes: optStr(10_000),
  tags: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
});
export type ContactInput = z.infer<typeof contactInput>;

export const interactionInput = z.object({
  contactId: z.string().min(1),
  type: z.enum(INTERACTION_TYPES),
  date: dateStr,
  notes: optStr(10_000),
});

export const interactionPatch = z.object({
  type: z.enum(INTERACTION_TYPES).optional(),
  date: dateStr.optional(),
  notes: optStr(10_000).optional(),
});

export const taskInput = z.object({
  title: z.string().trim().min(1).max(500),
  contactId: z.string().min(1).nullish().transform((v) => v ?? null),
  dueDate: dateStr.nullish().transform((v) => v ?? null),
});

export const taskPatch = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  dueDate: dateStr.nullable().optional(),
  completed: z.boolean().optional(),
});

export const importantDateInput = z.object({
  contactId: z.string().min(1),
  label: z.string().trim().min(1).max(120),
  date: dateStr,
  recurring: z.boolean().default(false),
});

export const introInput = z.object({
  kind: z.enum(["received", "made"]),
  fromContactId: z.string().min(1),
  toContactId: z.string().min(1),
  date: dateStr.nullish().transform((v) => v ?? null),
  note: optStr(1000),
});

export const pipelineAdd = z.object({
  contactId: z.string().min(1),
  stage: z.enum(PIPELINE_STAGES).default("to_reach_out"),
  note: optStr(1000),
});

export const pipelinePatch = z.object({
  stage: z.enum(PIPELINE_STAGES).optional(),
  position: z.number().int().optional(),
  note: optStr(1000).optional(),
});

export const voicePatch = z.object({
  transcript: z.string().max(50_000).nullable(),
});
