"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client-api";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { CheckIcon } from "@/components/ui/icons";
import { DraftChip } from "./DraftChip";
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
  const [done, setDone] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  async function completePromise(move: TodayMove) {
    if (!move.taskId || busy) return;
    setBusy(move.taskId);
    try {
      await api(`/api/tasks/${move.taskId}`, {
        method: "PATCH",
        json: { completed: true },
      });
      setDone((prev) => new Set(prev).add(move.taskId!));
      toast(`Done — ${move.reason}`);
      // Let the check land visually before the list re-picks.
      setTimeout(() => router.refresh(), 650);
    } catch {
      toast("Couldn't check that off — try again");
    } finally {
      setBusy(null);
    }
  }

  return (
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
                <span
                  role="status"
                  aria-label={`Done: ${move.reason}`}
                  className="animate-scale-in flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-accent text-on-accent"
                >
                  <CheckIcon size={18} strokeWidth={2.6} />
                </span>
              ) : (
                <button
                  type="button"
                  aria-label={`Mark done: ${move.reason}`}
                  aria-busy={busy === move.taskId}
                  onClick={() => void completePromise(move)}
                  disabled={busy !== null}
                  className="pressable shrink-0 rounded-full bg-fill px-3.5 py-2 text-[13px] font-semibold disabled:opacity-40"
                >
                  Done
                </button>
              )
            ) : aiOn ? (
              <DraftChip
                contactId={move.contactId}
                contactName={move.contactName}
                kind="follow_up"
                label="Say hi"
                sheetTitle={`Hello for ${move.contactName.split(" ")[0]}`}
                microcopy="However long it's been, no explanation needed — people are gladder to hear from you than you'd expect."
              />
            ) : (
              <Link
                href={`/contacts/${move.contactId}`}
                aria-label={`Say hi to ${move.contactName}`}
                className="pressable shrink-0 rounded-full bg-fill px-3.5 py-2 text-[13px] font-semibold text-label"
              >
                Say hi
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
