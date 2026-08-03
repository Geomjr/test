import { TIER_META } from "@/lib/tiers";
import type { Tier } from "@/lib/db/schema";

export function TierBadge({ tier }: { tier: Tier }) {
  const meta = TIER_META[tier];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-semibold whitespace-nowrap"
      style={{ color: meta.color, background: meta.soft }}
    >
      {meta.label}
    </span>
  );
}

export function TagChip({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-fill px-2 py-0.5 text-[12px] font-medium text-label-2 whitespace-nowrap">
      {name}
    </span>
  );
}
