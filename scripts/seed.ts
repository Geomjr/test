/* Seeds a demo account with a realistic MBA network so every screen has life.
 *
 *   npm run seed            → demo@orbit.app / orbit-demo
 *
 * Idempotent: re-running wipes and recreates the demo account only.
 * Deliberately self-contained (own DB handle) so it runs outside Next.js.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import Database from "better-sqlite3";
import { hash } from "@node-rs/argon2";
import { migrate } from "../src/lib/db/migrate";

const DEMO_EMAIL = "demo@orbit.app";
const DEMO_PASSWORD = "orbit-demo";
const DEMO_NAME = "George Mercer";

const DAY = 86_400_000;
const id = () => crypto.randomBytes(12).toString("hex");
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const daysAgo = (n: number) => iso(Date.now() - n * DAY);
const daysAhead = (n: number) => iso(Date.now() + n * DAY);
/** A yearly date whose next occurrence is `n` days from now (year set to 1996). */
const birthdayIn = (n: number) => `1996-${daysAhead(n).slice(5)}`;

type SeedInteraction = { type: string; daysAgo: number; notes?: string };
type SeedContact = {
  name: string;
  company?: string;
  role?: string;
  industry?: string;
  city?: string;
  email?: string;
  tier: string;
  cadenceDays?: number;
  howWeMet?: string;
  tags?: string[];
  birthday?: string;
  notes?: string;
  pipeline?: { stage: string; note?: string };
  interactions?: SeedInteraction[];
  tasks?: { title: string; dueInDays: number }[];
  importantDates?: { label: string; inDays: number; recurring?: boolean }[];
  transcriptNote?: string;
};

const CONTACTS: SeedContact[] = [
  {
    name: "Priya Raman", company: "Bain & Company", role: "Consultant (pre-MBA)",
    industry: "Consulting", city: "Boston", tier: "close", cadenceDays: 21,
    email: "priya.raman@example.com",
    howWeMet: "Section A — sat together on the first day of orientation",
    tags: ["Section A", "Consulting Club"], birthday: birthdayIn(3),
    notes: "Recruiting for consulting post-MBA. Loves trail running. Partner relocating with her.",
    interactions: [
      { type: "coffee", daysAgo: 5, notes: "Caught up before OB class. She got a second round with Bain Boston — send her the case prep doc." },
      { type: "meal", daysAgo: 19, notes: "Dinner with section friends at Giulia." },
      { type: "event", daysAgo: 40, notes: "Consulting club kickoff — she introduced me to two second-years." },
    ],
    tasks: [{ title: "Send Priya the case prep doc", dueInDays: 2 }],
  },
  {
    name: "Marcus Webb", company: "Goldman Sachs", role: "VP, TMT",
    industry: "Investment Banking", city: "New York", tier: "keep_warm", cadenceDays: 60,
    email: "marcus.webb@example.com",
    howWeMet: "Alumni coffee chat during banking recruiting",
    tags: ["Alumni", "Banking"],
    notes: "Class of 2016. Prefers 20-minute calls over coffee. Said to ping him again before internship apps open.",
    pipeline: { stage: "thank_you_sent", note: "Great chat — follow up when apps open in December" },
    interactions: [
      { type: "call", daysAgo: 32, notes: "20-min call. Advice: focus the story on operating experience. His analyst Sofia might chat too." },
    ],
  },
  {
    name: "Sofia Delgado", company: "Goldman Sachs", role: "Analyst, TMT",
    industry: "Investment Banking", city: "New York", tier: "new",
    email: "sofia.delgado@example.com",
    howWeMet: "Intro from Marcus Webb", tags: ["Banking"],
    pipeline: { stage: "contacted", note: "Emailed 3 days ago, waiting on reply" },
  },
  {
    name: "Jenny Park", company: "Stripe", role: "Product Manager (pre-MBA)",
    industry: "Tech", city: "San Francisco", tier: "inner", cadenceDays: 14,
    email: "jenny.park@example.com",
    howWeMet: "Roommate — matched on the housing portal",
    tags: ["Roommate", "Tech Club", "Section A"], birthday: birthdayIn(10),
    notes: "Best friend at school. Wants VC after graduation. Allergic to shellfish. Her mom visits in November.",
    interactions: [
      { type: "meal", daysAgo: 1, notes: "Cooked dinner at the apartment, talked through her VC networking list." },
      { type: "event", daysAgo: 8, notes: "Tech club panel — she moderated, killed it." },
      { type: "coffee", daysAgo: 12, notes: "Sunday planning coffee." },
    ],
    tasks: [{ title: "Intro Jenny to Daniel (a16z)", dueInDays: 5 }],
    transcriptNote:
      "Memo after dinner with Jenny — she wants intros to consumer VCs before spring break, and she'd kill it at a16z. Remember to connect her with Daniel Osei. Also she's planning a Tahoe ski trip in February and wants a headcount by Friday.",
  },
  {
    name: "Daniel Osei", company: "Andreessen Horowitz", role: "Partner",
    industry: "Venture Capital", city: "Menlo Park", tier: "keep_warm", cadenceDays: 90,
    email: "daniel.osei@example.com",
    howWeMet: "Guest speaker in Entrepreneurial Finance — stayed after to ask about consumer investing",
    tags: ["VC", "Speaker"],
    notes: "Invests in consumer + fintech. Told me to send interesting student startups. Big Arsenal fan.",
    interactions: [
      { type: "message", daysAgo: 75, notes: "LinkedIn follow-up after his talk — he replied with his email." },
    ],
  },
  {
    name: "Aisha Khan", company: "McKinsey & Company", role: "Engagement Manager",
    industry: "Consulting", city: "Chicago", tier: "active", cadenceDays: 45,
    email: "aisha.khan@example.com",
    howWeMet: "Women in Business conference — table 7", tags: ["Consulting", "Conference"],
    notes: "Offered to do a mock case with me. Considering an MBA-sponsored track herself.",
    pipeline: { stage: "scheduled", note: "Mock case scheduled for next Tuesday" },
    interactions: [
      { type: "coffee", daysAgo: 15, notes: "Coffee at the conference. She walked me through EM life at McKinsey." },
    ],
    tasks: [{ title: "Prep profitability framework before mock case", dueInDays: 4 }],
  },
  {
    name: "Tom Alvarez", company: "Delta Air Lines", role: "Strategy Manager (pre-MBA)",
    industry: "Aviation", city: "Atlanta", tier: "close", cadenceDays: 30,
    email: "tom.alvarez@example.com",
    howWeMet: "Learning team — the 6am problem set sessions",
    tags: ["Learning Team", "Section A"], birthday: "1995-01-27",
    notes: "Learning team anchor. Getting married in June — save the date received. Wants to pivot to PE.",
    interactions: [
      { type: "meal", daysAgo: 9, notes: "Learning team dinner after the finance midterm." },
      { type: "other", daysAgo: 23, notes: "Helped each other through the accounting problem set." },
    ],
    importantDates: [{ label: "Wedding", inDays: 45, recurring: false }],
  },
  {
    name: "Rachel Goldman", company: "Blackstone", role: "Principal, PE",
    industry: "Private Equity", city: "New York", tier: "new",
    email: "rachel.goldman@example.com",
    howWeMet: "PE club trek to NYC", tags: ["PE", "Trek"],
    notes: "Spoke on the panel about operating-partner tracks. Said cold emails are fine if they're specific.",
    pipeline: { stage: "to_reach_out", note: "Email her re: operating partner track — mention the Delta angle" },
  },
  {
    name: "Kwame Boateng", company: "Nike", role: "Senior Brand Manager",
    industry: "Consumer Goods", city: "Portland", tier: "active", cadenceDays: 45,
    email: "kwame.boateng@example.com",
    howWeMet: "Marketing club mentor program", tags: ["Marketing Club", "Mentor"],
    birthday: "1988-09-03",
    notes: "My assigned mentor. Monthly calls. Pushing me to take brand management internships seriously.",
    interactions: [
      { type: "call", daysAgo: 28, notes: "Monthly mentor call — reviewed my internship target list, said to add Adidas and On." },
    ],
    tasks: [{ title: "Add Adidas + On to internship tracker, send Kwame the list", dueInDays: 7 }],
  },
  {
    name: "Elena Vasquez", company: "HBS Class of 2027", role: "MBA Candidate",
    industry: "Healthcare", city: "Boston", tier: "close", cadenceDays: 21,
    email: "elena.vasquez@example.com",
    howWeMet: "Healthcare club co-VP elections — we both lost, became friends",
    tags: ["Healthcare Club", "Section C"], birthday: "1998-12-02",
    notes: "Former nurse, wants healthcare VC. Planning a Peru trek for spring break — invited me.",
    interactions: [
      { type: "coffee", daysAgo: 26, notes: "Coffee after the healthcare club meeting — talked spring break plans." },
    ],
  },
  {
    name: "James Chen", company: "Amazon", role: "Senior PM, AWS",
    industry: "Tech", city: "Seattle", tier: "keep_warm", cadenceDays: 60,
    email: "james.chen@example.com",
    howWeMet: "Cold LinkedIn outreach during tech recruiting", tags: ["Tech", "Cold Outreach"],
    notes: "Alum, class of 2019. Great breakdown of L6 vs L7 PM roles. Reapply for the summer cohort in January.",
    pipeline: { stage: "keep_warm", note: "Re-ping in January when the summer cohort opens" },
    interactions: [
      { type: "call", daysAgo: 55, notes: "30-min Zoom. AWS PM internship advice — apply early, mention his name to the recruiter." },
    ],
  },
  {
    name: "Nina Petrova", company: "HBS Class of 2027", role: "MBA Candidate",
    industry: "Fintech", city: "Boston", tier: "active", cadenceDays: 30,
    email: "nina.petrova@example.com",
    howWeMet: "Startup weekend — built a payments prototype together",
    tags: ["Entrepreneurship Club", "Section B"],
    notes: "Ex-Revolut. We keep half-joking about starting something after graduation. Strong technical chops.",
    interactions: [
      { type: "coffee", daysAgo: 35, notes: "Debriefed startup weekend — she's serious about the payments idea." },
    ],
    tasks: [{ title: "Write one-pager on the payments idea before next coffee", dueInDays: 10 }],
  },
  {
    name: "David Okonkwo", company: "Bain Capital", role: "Vice President",
    industry: "Private Equity", city: "Boston", tier: "new",
    email: "david.okonkwo@example.com",
    howWeMet: "Intro from Tom Alvarez (they worked together at Delta)", tags: ["PE"],
    pipeline: { stage: "met", note: "Coffee chat done — send thank-you note today" },
    interactions: [
      { type: "coffee", daysAgo: 2, notes: "Coffee near his office. Walked through a live deal (anonymized). Very sharp, very kind. Thank-you note owed." },
    ],
    tasks: [{ title: "Send David a thank-you note", dueInDays: 1 }],
  },
  {
    name: "Hannah Kim", company: "HBS Class of 2026", role: "MBA Candidate (2nd year)",
    industry: "Consulting", city: "Boston", tier: "active", cadenceDays: 30,
    email: "hannah.kim@example.com",
    howWeMet: "Assigned second-year mentor in the consulting club",
    tags: ["Consulting Club", "Mentor", "Second-Year"],
    notes: "Interned at BCG, returning full-time. Has the full case-prep vault and shares generously.",
    interactions: [
      { type: "coffee", daysAgo: 44, notes: "First mentor coffee — she shared the club case vault and her interview timeline.\n\nAsk next time:\n- How did her BCG return offer negotiation go?\n- Which second-years run the mock-case pool this year?" },
    ],
  },
  {
    name: "Leo Fontaine", company: "LVMH", role: "Strategy Director",
    industry: "Luxury & Retail", city: "Paris", tier: "keep_warm", cadenceDays: 90,
    email: "leo.fontaine@example.com",
    howWeMet: "Sat next to each other on the Paris trek flight", tags: ["Trek", "International"],
    birthday: "1985-07-30",
    notes: "Offered to host coffee if I'm ever in Paris. Fascinating on luxury brand strategy. Speaks four languages.",
    interactions: [
      { type: "event", daysAgo: 95, notes: "Paris trek — dinner conversation about LVMH's watch strategy." },
    ],
  },
];

const INTROS: { kind: "received" | "made"; from: string; to: string }[] = [
  { kind: "received", from: "Marcus Webb", to: "Sofia Delgado" },
  { kind: "received", from: "Tom Alvarez", to: "David Okonkwo" },
];

async function main() {
  const dataDir = path.resolve(process.env.DATA_DIR ?? "./data");
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new Database(path.join(dataDir, "orbit.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(DEMO_EMAIL) as
    | { id: string }
    | undefined;
  if (existing) {
    db.prepare("DELETE FROM search_index WHERE user_id = ?").run(existing.id);
    db.prepare("DELETE FROM users WHERE id = ?").run(existing.id);
    console.log("Removed previous demo account.");
  }

  const userId = id();
  const now = Date.now();
  db.prepare(
    "INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(userId, DEMO_EMAIL, await hash(DEMO_PASSWORD), DEMO_NAME, now);

  const insertContact = db.prepare(`
    INSERT INTO contacts (id, user_id, name, company, role, industry, city, email,
      how_we_met, tier, cadence_days, birthday, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertTag = db.prepare("INSERT OR IGNORE INTO tags (id, user_id, name) VALUES (?, ?, ?)");
  const getTag = db.prepare("SELECT id FROM tags WHERE user_id = ? AND name = ?");
  const linkTag = db.prepare("INSERT INTO contact_tags (contact_id, tag_id) VALUES (?, ?)");
  const insertInteraction = db.prepare(`
    INSERT INTO interactions (id, user_id, contact_id, type, date, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const insertPipeline = db.prepare(`
    INSERT INTO pipeline_items (id, user_id, contact_id, stage, note, position, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertTask = db.prepare(`
    INSERT INTO tasks (id, user_id, contact_id, title, due_date, completed_at, created_at)
    VALUES (?, ?, ?, ?, ?, NULL, ?)`);
  const insertDate = db.prepare(`
    INSERT INTO important_dates (id, user_id, contact_id, label, date, recurring)
    VALUES (?, ?, ?, ?, ?, ?)`);
  const insertIntro = db.prepare(`
    INSERT INTO intros (id, user_id, kind, from_contact_id, to_contact_id, date, note, created_at)
    VALUES (?, ?, ?, ?, ?, NULL, NULL, ?)`);
  const insertVoice = db.prepare(`
    INSERT INTO voice_notes (id, user_id, contact_id, file_path, mime_type, duration_sec, transcript, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  const idsByName = new Map<string, string>();
  let position = 0;

  for (const contact of CONTACTS) {
    const contactId = id();
    idsByName.set(contact.name, contactId);
    // Stagger created_at so "never contacted" baselines look organic.
    const createdAt = now - 120 * DAY + position * DAY;
    insertContact.run(
      contactId, userId, contact.name, contact.company ?? null, contact.role ?? null,
      contact.industry ?? null, contact.city ?? null, contact.email ?? null,
      contact.howWeMet ?? null, contact.tier, contact.cadenceDays ?? null,
      contact.birthday ?? null, contact.notes ?? null, createdAt, createdAt,
    );

    for (const tagName of contact.tags ?? []) {
      insertTag.run(id(), userId, tagName);
      const tag = getTag.get(userId, tagName) as { id: string };
      linkTag.run(contactId, tag.id);
    }

    for (const interaction of contact.interactions ?? []) {
      insertInteraction.run(
        id(), userId, contactId, interaction.type, daysAgo(interaction.daysAgo),
        interaction.notes ?? null, now - interaction.daysAgo * DAY,
      );
    }

    if (contact.pipeline) {
      insertPipeline.run(
        id(), userId, contactId, contact.pipeline.stage, contact.pipeline.note ?? null,
        position, now - 10 * DAY, now - (contact.pipeline.stage === "to_reach_out" ? 9 : 2) * DAY,
      );
    }

    for (const task of contact.tasks ?? []) {
      insertTask.run(id(), userId, contactId, task.title, daysAhead(task.dueInDays), now);
    }

    for (const date of contact.importantDates ?? []) {
      insertDate.run(
        id(), userId, contactId, date.label,
        daysAhead(date.inDays), date.recurring === false ? 0 : 1,
      );
    }

    if (contact.transcriptNote) {
      // Transcript-only memo (no audio file on disk); still searchable + in AI context.
      insertVoice.run(
        id(), userId, contactId, `${userId}/voice/seed-placeholder.m4a`, "audio/mp4",
        42, contact.transcriptNote, now - 1 * DAY,
      );
    }

    position += 1;
  }

  for (const intro of INTROS) {
    const fromId = idsByName.get(intro.from);
    const toId = idsByName.get(intro.to);
    if (fromId && toId) insertIntro.run(id(), userId, intro.kind, fromId, toId, now);
  }

  const counts = {
    contacts: CONTACTS.length,
    interactions: CONTACTS.reduce((n, c) => n + (c.interactions?.length ?? 0), 0),
    pipeline: CONTACTS.filter((c) => c.pipeline).length,
    tasks: CONTACTS.reduce((n, c) => n + (c.tasks?.length ?? 0), 0),
  };
  console.log(
    `Seeded demo account: ${DEMO_EMAIL} / ${DEMO_PASSWORD}\n` +
      `  ${counts.contacts} contacts, ${counts.interactions} interactions, ` +
      `${counts.pipeline} pipeline cards, ${counts.tasks} tasks`,
  );
  db.close();
}

void main();
