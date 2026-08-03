import { getUser } from "@/lib/auth/session";
import { apiError, unauthorized } from "@/lib/http";
import { aiEnabled, consumeAiBudget } from "@/lib/ai/client";
import { aiTextStream } from "@/lib/ai/stream";
import { WEEKLY_INSTRUCTION } from "@/lib/ai/prompts";
import { getDashboardData } from "@/lib/data/dashboard";
import { userToday } from "@/lib/today";
import { STAGE_META } from "@/lib/pipeline-meta";
import { TIER_META } from "@/lib/tiers";
import type { Tier } from "@/lib/db/schema";

export async function POST() {
  const user = await getUser();
  if (!user) return unauthorized();
  if (!aiEnabled()) return apiError(503, "AI is not configured.", "AI_DISABLED");
  if (!consumeAiBudget(user.id)) {
    return apiError(429, "Daily AI limit reached — try again tomorrow.", "AI_LIMIT");
  }

  const today = await userToday();
  const data = getDashboardData(user.id, today);

  const lines: string[] = [
    `Network size: ${data.contactCount} people.`,
    "",
    "Overdue follow-ups:",
    ...(data.overdue.length
      ? data.overdue.map(
          (o) =>
            `- ${o.name} (${TIER_META[o.tier as Tier]?.label ?? o.tier}) — ${o.daysSince} days since last contact, cadence every ${o.cadenceDays}`,
        )
      : ["- none"]),
    "",
    "Upcoming dates (14 days):",
    ...(data.upcoming.length
      ? data.upcoming.map((u) => `- ${u.occursOn}: ${u.contactName} — ${u.label}`)
      : ["- none"]),
    "",
    "Pipeline needing action (stuck 7+ days):",
    ...(data.stalePipeline.length
      ? data.stalePipeline.map(
          (p) => `- ${p.contact.name} in "${STAGE_META[p.stage].label}"${p.note ? ` (${p.note})` : ""}`,
        )
      : ["- none"]),
    "",
    "Tasks due within a week:",
    ...(data.dueTasks.length
      ? data.dueTasks.map(
          (t) => `- ${t.title}${t.contactName ? ` (${t.contactName})` : ""} — due ${t.dueDate}`,
        )
      : ["- none"]),
  ];

  return aiTextStream({
    system: [
      {
        type: "text",
        text: `${WEEKLY_INSTRUCTION}\n\nThe user's name is ${user.name}. Today is ${today}.`,
      },
    ],
    messages: [{ role: "user", content: `<weekly_data>\n${lines.join("\n")}\n</weekly_data>` }],
    maxTokens: 2048,
  });
}
