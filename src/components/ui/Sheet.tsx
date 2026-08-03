"use client";

import { useEffect, type ReactNode } from "react";

/**
 * iOS-style slide-up sheet on mobile; centered dialog on larger screens.
 */
export function Sheet({
  open,
  onClose,
  title,
  right,
  children,
  cancelLabel = "Cancel",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  right?: ReactNode;
  children: ReactNode;
  cancelLabel?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 animate-fade-in"
        style={{ background: "var(--material-scrim)" }}
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="material-sheet relative flex w-full flex-col overflow-hidden rounded-t-[16px] animate-sheet-up sm:w-[560px] sm:rounded-[16px] sm:animate-scale-in"
        style={{ maxHeight: "min(92dvh, 760px)" }}
      >
        <div className="mx-auto mt-2 h-[5px] w-9 shrink-0 rounded-full bg-label-4 sm:hidden" />
        <div className="hairline-b flex h-[52px] shrink-0 items-center justify-between px-2">
          <button
            type="button"
            onClick={onClose}
            className="pressable min-h-[44px] px-3 text-[17px] text-tint"
          >
            {cancelLabel}
          </button>
          <p className="absolute left-1/2 max-w-[50%] -translate-x-1/2 truncate text-[17px] font-semibold">
            {title}
          </p>
          <div className="flex min-h-[44px] items-center px-1">{right}</div>
        </div>
        <div
          className="flex-1 overflow-y-auto overscroll-contain px-4 py-4"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
