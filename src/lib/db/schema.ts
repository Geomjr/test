import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const TIERS = ["inner", "close", "active", "keep_warm", "new"] as const;
export type Tier = (typeof TIERS)[number];

export const INTERACTION_TYPES = [
  "coffee",
  "call",
  "meal",
  "event",
  "message",
  "other",
] as const;
export type InteractionType = (typeof INTERACTION_TYPES)[number];

export const PIPELINE_STAGES = [
  "to_reach_out",
  "contacted",
  "scheduled",
  "met",
  "thank_you_sent",
  "keep_warm",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(), // SHA-256 hex of the raw cookie token
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("idx_sessions_user").on(t.userId)],
);

export const contacts = sqliteTable(
  "contacts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    photoPath: text("photo_path"),
    company: text("company"),
    role: text("role"),
    industry: text("industry"),
    city: text("city"),
    email: text("email"),
    phone: text("phone"),
    linkedinUrl: text("linkedin_url"),
    howWeMet: text("how_we_met"),
    tier: text("tier").$type<Tier>().notNull().default("new"),
    cadenceDays: integer("cadence_days"),
    birthday: text("birthday"), // YYYY-MM-DD or --MM-DD (year unknown)
    notes: text("notes"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [
    index("idx_contacts_user").on(t.userId),
    index("idx_contacts_user_tier").on(t.userId, t.tier),
    index("idx_contacts_user_email").on(t.userId, t.email),
  ],
);

export const tags = sqliteTable(
  "tags",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
  },
  (t) => [uniqueIndex("uq_tags_user_name").on(t.userId, t.name)],
);

export const contactTags = sqliteTable(
  "contact_tags",
  {
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.contactId, t.tagId] })],
);

export const importantDates = sqliteTable(
  "important_dates",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    date: text("date").notNull(), // YYYY-MM-DD
    recurring: integer("recurring").notNull().default(0),
  },
  (t) => [index("idx_dates_user").on(t.userId)],
);

export const interactions = sqliteTable(
  "interactions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    type: text("type").$type<InteractionType>().notNull(),
    date: text("date").notNull(), // YYYY-MM-DD
    notes: text("notes"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    index("idx_interactions_contact_date").on(t.contactId, t.date),
    index("idx_interactions_user_date").on(t.userId, t.date),
  ],
);

export const voiceNotes = sqliteTable(
  "voice_notes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    filePath: text("file_path").notNull(), // relative to DATA_DIR/uploads
    mimeType: text("mime_type").notNull(),
    durationSec: real("duration_sec"),
    transcript: text("transcript"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("idx_voice_contact").on(t.contactId)],
);

export const pipelineItems = sqliteTable(
  "pipeline_items",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    stage: text("stage").$type<PipelineStage>().notNull(),
    note: text("note"),
    position: integer("position").notNull().default(0),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [
    uniqueIndex("uq_pipeline_user_contact").on(t.userId, t.contactId),
    index("idx_pipeline_user_stage").on(t.userId, t.stage, t.position),
  ],
);

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    contactId: text("contact_id").references(() => contacts.id, {
      onDelete: "cascade",
    }),
    title: text("title").notNull(),
    dueDate: text("due_date"), // YYYY-MM-DD, NULL = someday
    completedAt: integer("completed_at"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("idx_tasks_user_due").on(t.userId, t.dueDate)],
);

export const intros = sqliteTable(
  "intros",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").$type<"received" | "made">().notNull(),
    // received: from = the introducer, to = who I met.
    // made: from = person A, to = person B (I connected them).
    fromContactId: text("from_contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    toContactId: text("to_contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    date: text("date"),
    note: text("note"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    index("idx_intros_from").on(t.fromContactId),
    index("idx_intros_to").on(t.toContactId),
  ],
);

export type User = typeof users.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type ImportantDate = typeof importantDates.$inferSelect;
export type Interaction = typeof interactions.$inferSelect;
export type VoiceNote = typeof voiceNotes.$inferSelect;
export type PipelineItem = typeof pipelineItems.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Intro = typeof intros.$inferSelect;
