"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client-api";
import { useAIStream } from "@/lib/useAIStream";
import { Avatar } from "@/components/ui/Avatar";
import { Sheet } from "@/components/ui/Sheet";
import { Spinner } from "@/components/ui/Spinner";
import { StreamedText } from "@/components/ui/StreamedText";
import { useToast } from "@/components/ui/Toast";
import { CheckIcon } from "@/components/ui/icons";
import type { TodayMove } from "@/lib/domain/today";

/**
 * The home hero: today's suggested moves, each completable in place.
 * "Say hi" opens a drafted opener right here — X-discourse research says
 * the blank message after a long silence, not the reminder, is what
 * actually blocks people from reaching out.
 */
export function TodaysThree({ moves, aiOn }: { moves: TodayMove[]; aiOn: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const stream = useAIStream();
  const [done, setDone] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [openerFor, setOpenerFor] = useState<TodayMove | null>(null);

  async function completePromise(move: TodayMove) {
    if (!move.taskId || busy) return;
    setBusy(move.taskId);
    try {
      await api(`/api/tasks/${move.taskId}`, {
        method: "PATCH",
        json: { completed: true },
      });
      setDone((prev) => new Set(prev).add(move.taskId!));
      toast("One down");
      // Let the check land visually before the list re-picks.
      setTimeout(() => router.refresh(), 650);
    } catch {
      toast("Couldn't check that off — try again");
    } finally {
      setBusy(null);
    }
  }

  function openOpener(move: TodayMove) {
    setOpenerFor(move);
    void stream.start("/api/ai/draft", {
      contactId: move.contactId,
      kind: "follow_up",
    });
  }

  function closeOpener() {
    stream.stop();
    setOpenerFor(null);
  }

  return (
    <>
      <div className="card overflow-hidden">
        {moves.map((move) => {
          const checked = move.taskId ? done.has(move.taskId) : false;
          return (
            <div
              key={`${move.kind}-${move.contactId}`}
              className={`hairline-b last:after:hidden flex min-h-[64px] items-center gap-3.5 px-4 py-2.5 transition-opacity duration-300 ${
                checked ? "opacity-45" : ""
              }`}
            >
              <Link
                href={`/contacts/${move.contactId}`}
                className="pressable flex min-w-0 flex-1 items-center gap-3.5"
              >
                <Avatar name={move.contactName} size={44} />
                <span className="min-w-0 flex-1 py-[2px]">
                  <span
                    className={`block truncate text-[17px] font-medium leading-snug ${
                      checked ? "line-through" : ""
                    }`}
                  >
                    {move.contactName}
                  </span>
                  <span className="mt-[1px] line-clamp-2 block text-[13.5px] leading-snug text-label-2">
                    {move.reason}
                  </span>
                </span>
              </Link>
              {move.kind === "promise" ? (
                checked ? (
                  <span className="animate-scale-in flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
                    <CheckIcon size={18} strokeWidth={2.6} />
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => void completePromise(move)}
                    disabled={busy !== null}
                    className="pressable shrink-0 rounded-full bg-fill px-3.5 py-2 text-[13px] font-semibold disabled:opacity-40"
                  >
                    Done
                  </button>
                )
              ) : aiOn ? (
                <button
                  type="button"
                  onClick={() => openOpener(move)}
                  className="pressable shrink-0 rounded-full bg-fill px-3.5 py-2 text-[13px] font-semibold text-label"
                >
                  Say hi
                </button>
              ) : (
                <Link
                  href={`/contacts/${move.contactId}`}
                  className="pressable shrink-0 rounded-full bg-fill px-3.5 py-2 text-[13px] font-semibold text-label"
                >
                  Say hi
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* In-place opener: a ready-to-send message, no blank page. */}
      <Sheet
        open={openerFor !== null}
        onClose={closeOpener}
        title={openerFor ? `Hello for ${openerFor.contactName.split(" ")[0]}` : "Opener"}
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
        <div className="card min-h-[120px] px-4 py-3.5 text-[16px] leading-relaxed">
          {stream.text ? (
            <StreamedText text={stream.text} />
          ) : (
            <span className="flex items-center gap-2 py-1 text-label-2">
              <Spinner size={15} />
              <span className="text-[14px]">Writing an opener…</span>
            </span>
          )}
        </div>
        <p className="px-1.5 pb-3 pt-2.5 text-[13px] leading-snug text-label-2">
          However long it&apos;s been, no explanation needed — people are gladder to hear
          from you than you&apos;d expect.
        </p>
      </Sheet>
    </>
  );
}
