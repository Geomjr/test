import type { Tier } from "@/lib/db/schema";

export const TIER_META: Record<
  Tier,
  { label: string; color: string; soft: string; suggestedCadence: number | null }
> = {
  inner: { label: "Inner Circle", color: "var(--tier-inner)", soft: "var(--tier-inner-soft)", suggestedCadence: 14 },
  close: { label: "Close", color: "var(--tier-close)", soft: "var(--tier-close-soft)", suggestedCadence: 21 },
  active: { label: "Active", color: "var(--tier-active)", soft: "var(--tier-active-soft)", suggestedCadence: 30 },
  keep_warm: { label: "Keep Warm", color: "var(--tier-warm)", soft: "var(--tier-warm-soft)", suggestedCadence: 60 },
  new: { label: "New", color: "var(--tier-new)", soft: "var(--tier-new-soft)", suggestedCadence: null },
};

export const TIER_ORDER: Tier[] = ["inner", "close", "active", "keep_warm", "new"];
