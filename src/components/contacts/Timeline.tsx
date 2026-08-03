"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client-api";
import { ActionSheet } from "@/components/ui/ActionSheet";
import { ListSection } from "@/components/ui/List";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  BubbleIcon,
  CupIcon,
  EllipsisIcon,
  MealIcon,
  PhoneIcon,
  StarIcon,
} from "@/components/ui/icons";
import { INTERACTION_META } from "@/lib/interaction-meta";
import { formatDate, relativePast } from "@/lib/dates";
import type { InteractionType } from "@/lib/db/schema";

export type TimelineEntry = {
  id: string;
  type: InteractionType;
  date: string;
  notes: string | null;
};

const TYPE_ICONS: Record<InteractionType, React.ReactNode> = {
  coffee: <CupIcon size={18} />,
  call: <PhoneIcon size={18} />,
  meal: <MealIcon size={18} />,
  event: <StarIcon size={18} />,
  message: <BubbleIcon size={18} />,
  other: <EllipsisIcon size={18} />,
};

export function Timeline({
  interactions,
  today,
}: {
  interactions: TimelineEntry[];
  today: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<TimelineEntry | null>(null);

  return (
    <ListSection title="History">
      {interactions.length === 0 ? (
        <EmptyState
          title="Nothing logged yet"
          subtitle="Use the buttons above to log your first coffee, call, or meal."
        />
      ) : (
        interactions.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setSelected(entry)}
            className="hairline-b last:after:hidden pressable-bg flex w-full items-start gap-3 px-4 py-3 text-left"
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tint-soft text-tint">
              {TYPE_ICONS[entry.type]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-[16px] font-medium">
                  {INTERACTION_META[entry.type].label}
                </span>
                <span
                  className="tnum shrink-0 text-[13px] text-label-2"
                  title={formatDate(entry.date)}
                >
                  {relativePast(entry.date, today)}
                </span>
              </span>
              {entry.notes ? (
                <span className="mt-0.5 block whitespace-pre-wrap text-[14px] leading-snug text-label-2">
                  {entry.notes}
                </span>
              ) : null}
            </span>
          </button>
        ))
      )}

      <ActionSheet
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? `${INTERACTION_META[selected.type].label} · ${formatDate(selected.date)}` : undefined}
        actions={[
          {
            label: "Delete Interaction",
            destructive: true,
            onSelect: () => {
              if (!selected) return;
              void api(`/api/interactions/${selected.id}`, { method: "DELETE" }).then(() =>
                router.refresh(),
              );
            },
          },
        ]}
      />
    </ListSection>
  );
}
