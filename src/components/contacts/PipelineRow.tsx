"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client-api";
import { ActionSheet, type SheetAction } from "@/components/ui/ActionSheet";
import { ListRow, ListSection } from "@/components/ui/List";
import { useToast } from "@/components/ui/Toast";
import { ColumnsIcon } from "@/components/ui/icons";
import { STAGE_META, STAGE_ORDER } from "@/lib/pipeline-meta";
import type { PipelineStage } from "@/lib/db/schema";

export function PipelineRow({
  contactId,
  item,
}: {
  contactId: string;
  item: { id: string; stage: PipelineStage; note: string | null } | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!item) {
    return (
      <ListSection title="Recruiting">
        <ListRow
          leading={<ColumnsIcon size={22} className="text-teal" />}
          title="Add to Pipeline"
          onClick={() => {
            void api("/api/pipeline", {
              json: { contactId, stage: "to_reach_out" },
            }).then(() => {
              toast("Added to pipeline");
              router.refresh();
            });
          }}
        />
      </ListSection>
    );
  }

  const moveActions: SheetAction[] = STAGE_ORDER.filter((s) => s !== item.stage).map(
    (stage) => ({
      label: `Move to ${STAGE_META[stage].label}`,
      onSelect: () => {
        void api(`/api/pipeline/${item.id}`, {
          method: "PATCH",
          json: { stage },
        }).then(() => router.refresh());
      },
    }),
  );

  return (
    <ListSection title="Recruiting">
      <ListRow
        leading={
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ background: STAGE_META[item.stage].color }}
          />
        }
        title={STAGE_META[item.stage].label}
        subtitle={item.note ?? undefined}
        value="Move"
        chevron
        onClick={() => setMenuOpen(true)}
      />
      <ActionSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Pipeline"
        actions={[
          ...moveActions,
          {
            label: "Remove from Board",
            destructive: true,
            onSelect: () => {
              void api(`/api/pipeline/${item.id}`, { method: "DELETE" }).then(() =>
                router.refresh(),
              );
            },
          },
        ]}
      />
    </ListSection>
  );
}
