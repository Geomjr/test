"use client";

import Link from "next/link";
import { useState } from "react";
import { useAIStream } from "@/lib/useAIStream";
import { ActionSheet } from "@/components/ui/ActionSheet";
import { Sheet } from "@/components/ui/Sheet";
import { Spinner } from "@/components/ui/Spinner";
import { StreamedText } from "@/components/ui/StreamedText";
import { useToast } from "@/components/ui/Toast";
import { BubbleIcon, PencilIcon, SparklesIcon } from "@/components/ui/icons";

export function AIPanel({ contactId, aiOn }: { contactId: string; aiOn: boolean }) {
  const toast = useToast();
  const stream = useAIStream();
  const [sheet, setSheet] = useState<"brief" | "draft" | null>(null);
  const [draftPicker, setDraftPicker] = useState(false);

  if (!aiOn) return null;

  function openBrief() {
    setSheet("brief");
    void stream.start("/api/ai/brief", { contactId });
  }

  function openDraft(kind: "follow_up" | "thank_you") {
    setSheet("draft");
    void stream.start("/api/ai/draft", { contactId, kind });
  }

  function close() {
    stream.stop();
    setSheet(null);
  }

  return (
    <>
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={openBrief}
          className="card pressable flex items-center justify-center gap-1.5 py-3.5 text-[14px] font-semibold text-tint"
        >
          <SparklesIcon size={16} /> Brief
        </button>
        <Link
          href={`/contacts/${contactId}/debrief`}
          className="card pressable flex items-center justify-center gap-1.5 py-3.5 text-[14px] font-semibold text-tint"
        >
          <BubbleIcon size={16} /> Debrief
        </Link>
        <button
          type="button"
          onClick={() => setDraftPicker(true)}
          className="card pressable flex items-center justify-center gap-1.5 py-3.5 text-[14px] font-semibold text-tint"
        >
          <PencilIcon size={16} /> Draft
        </button>
      </div>

      <ActionSheet
        open={draftPicker}
        onClose={() => setDraftPicker(false)}
        title="What kind of message?"
        actions={[
          { label: "Follow-up / Reconnect", onSelect: () => openDraft("follow_up") },
          { label: "Thank-You Note", onSelect: () => openDraft("thank_you") },
        ]}
      />

      <Sheet
        open={sheet !== null}
        onClose={close}
        title={sheet === "brief" ? "Pre-Meeting Brief" : "Draft"}
        cancelLabel="Done"
        right={
          sheet === "draft" && !stream.streaming && stream.text ? (
            <button
              type="button"
              className="pressable px-3 text-[17px] font-semibold text-tint"
              onClick={() => {
                void navigator.clipboard.writeText(stream.text).then(() => toast("Copied"));
              }}
            >
              Copy
            </button>
          ) : null
        }
      >
        {stream.error ? (
          <p className="py-6 text-center text-[15px] text-label-2">{stream.error}</p>
        ) : stream.text ? (
          <StreamedText text={stream.text} />
        ) : (
          <div className="flex items-center justify-center gap-2 py-10 text-label-2">
            <Spinner size={18} />
            <span className="text-[15px]">Thinking…</span>
          </div>
        )}
      </Sheet>
    </>
  );
}
