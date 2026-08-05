"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client-api";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { CheckIcon } from "@/components/ui/icons";
import type { TodayMove } from "@/lib/domain/today";

/**
 * The home hero: today's suggested moves, each completable in place.
 * Row tap opens the person; the trailing chip does the move in one tap
 * (interaction-cost research: don't force a detail-screen round trip).
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
      toast("One down");
      // Let the check land visually before the list re-picks.
      setTimeout(() => router.refresh(), 650);
    } catch {
      toast("Couldn't check that off — try again");
    } finally {
      setBusy(null);
    }
  }

  function sayHiHref(move: TodayMove): string {
    if (!aiOn) return `/contacts/${move.contactId}`;
    const ask =
      move.kind === "birthday"
        ? `Draft a short birthday note to ${move.contactName}.`
        : `Draft a quick, warm hello to ${move.contactName}. Context: ${move.reason}.`;
    return `/assistant?q=${encodeURIComponent(ask)}`;
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
            ) : (
              <Link
                href={sayHiHref(move)}
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
