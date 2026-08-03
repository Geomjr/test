"use client";

import { useEffect } from "react";

export type SheetAction = {
  label: string;
  destructive?: boolean;
  onSelect: () => void;
};

export function ActionSheet({
  open,
  onClose,
  title,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  actions: SheetAction[];
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
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
        className="relative w-full px-2 pb-2 animate-sheet-up sm:w-[320px] sm:animate-scale-in"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
      >
        <div className="material-sheet overflow-hidden rounded-[14px]">
          {title ? (
            <p className="hairline-b px-4 py-3 text-center text-[13px] text-label-2">{title}</p>
          ) : null}
          {actions.map((action, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                onClose();
                action.onSelect();
              }}
              className={`hairline-b last:after:hidden pressable-bg block w-full px-4 py-3.5 text-center text-[19px] ${
                action.destructive ? "text-red" : "text-tint"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="material-sheet pressable mt-2 block w-full rounded-[14px] px-4 py-3.5 text-center text-[19px] font-semibold text-tint"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
