"use client";

import { useState } from "react";
import { useAIStream } from "@/lib/useAIStream";
import { Sheet } from "@/components/ui/Sheet";
import { Spinner } from "@/components/ui/Spinner";
import { StreamedText } from "@/components/ui/StreamedText";
import { useToast } from "@/components/ui/Toast";

/**
 * A chip that opens an in-place AI draft (grounded by contactId, so the
 * right record is used even when two contacts share a name). Renders the
 * stream's error state with a retry — never a dead spinner.
 */
export function DraftChip({
  contactId,
  contactName,
  kind,
  label,
  sheetTitle,
  microcopy,
}: {
  contactId: string;
  contactName: string;
  kind: "follow_up" | "thank_you";
  label: string;
  sheetTitle: string;
  microcopy?: string;
}) {
  const stream = useAIStream();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  function start() {
    setOpen(true);
    void stream.start("/api/ai/draft", { contactId, kind });
  }

  function close() {
    stream.stop();
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        aria-label={`${label} — ${contactName}`}
        onClick={start}
        className="pressable shrink-0 rounded-full bg-fill px-3.5 py-2 text-[13px] font-semibold text-label"
      >
        {label}
      </button>

      <Sheet
        open={open}
        onClose={close}
        title={sheetTitle}
        cancelLabel="Done"
        right={
          !stream.streaming && stream.text ? (
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
        <div
          className="card min-h-[120px] px-4 py-3.5 text-[16px] leading-relaxed"
          role="status"
        >
          {stream.error ? (
            <span className="block py-1">
              <span className="block text-[15px] text-red">{stream.error}</span>
              <button
                type="button"
                onClick={() => void stream.start("/api/ai/draft", { contactId, kind })}
                className="pressable mt-2 rounded-full bg-fill px-3.5 py-1.5 text-[13px] font-semibold"
              >
                Try again
              </button>
            </span>
          ) : stream.text ? (
            <StreamedText text={stream.text} />
          ) : stream.streaming ? (
            <span className="flex items-center gap-2 py-1 text-label-2">
              <Spinner size={15} />
              <span className="text-[14px]">Writing…</span>
            </span>
          ) : (
            <span className="block py-1 text-[14px] text-label-2">
              Nothing came back — try again.
            </span>
          )}
        </div>
        {microcopy ? (
          <p className="px-1.5 pb-3 pt-2.5 text-[13px] leading-snug text-label-2">{microcopy}</p>
        ) : null}
      </Sheet>
    </>
  );
}
