import { TIER_META } from "@/lib/tiers";
import type { Tier } from "@/lib/db/schema";

export function TierBadge({ tier }: { tier: Tier }) {
  const meta = TIER_META[tier];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full py-[3px] pl-2 pr-2.5 text-[12px] font-semibold whitespace-nowrap"
      style={{ color: meta.color, background: meta.soft }}
    >
      <span
        aria-hidden
        className="h-[6px] w-[6px] rounded-full"
        style={{ background: meta.color }}
      />
      {meta.label}
    </span>
  );
}

export function TagChip({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-fill px-2.5 py-[3px] text-[12px] font-medium text-label-2 whitespace-nowrap">
      {name}
    </span>
  );
}
