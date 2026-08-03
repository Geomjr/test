import type { Tier } from "@/lib/db/schema";

export const TIER_META: Record<
  Tier,
  { label: string; color: string; soft: string; suggestedCadence: number | null }
> = {
  inner: { label: "Inner Circle", color: "var(--pink)", soft: "var(--pink-soft)", suggestedCadence: 14 },
  close: { label: "Close", color: "var(--purple)", soft: "var(--purple-soft)", suggestedCadence: 21 },
  active: { label: "Active", color: "var(--tint)", soft: "var(--tint-soft)", suggestedCadence: 30 },
  keep_warm: { label: "Keep Warm", color: "var(--orange)", soft: "var(--orange-soft)", suggestedCadence: 60 },
  new: { label: "New", color: "var(--gray)", soft: "var(--bg-fill)", suggestedCadence: null },
};

export const TIER_ORDER: Tier[] = ["inner", "close", "active", "keep_warm", "new"];
