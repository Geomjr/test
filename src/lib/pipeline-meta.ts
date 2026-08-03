import type { PipelineStage } from "@/lib/db/schema";

export const STAGE_META: Record<PipelineStage, { label: string; color: string }> = {
  to_reach_out: { label: "To Reach Out", color: "var(--gray)" },
  contacted: { label: "Contacted", color: "var(--orange)" },
  scheduled: { label: "Scheduled", color: "var(--tint)" },
  met: { label: "Met", color: "var(--purple)" },
  thank_you_sent: { label: "Thank-You Sent", color: "var(--green)" },
  keep_warm: { label: "Keep Warm", color: "var(--teal)" },
};

export const STAGE_ORDER = [
  "to_reach_out",
  "contacted",
  "scheduled",
  "met",
  "thank_you_sent",
  "keep_warm",
] as const;
