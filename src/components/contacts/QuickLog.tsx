"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client-api";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { FormCard, SelectField, TextAreaField, TextField } from "@/components/ui/fields";
import {
  BubbleIcon,
  CupIcon,
  EllipsisIcon,
  MealIcon,
  PhoneIcon,
  StarIcon,
} from "@/components/ui/icons";
import { INTERACTION_META } from "@/lib/interaction-meta";
import { INTERACTION_TYPES, type InteractionType } from "@/lib/db/schema";

const TYPE_ICONS: Record<InteractionType, React.ReactNode> = {
  coffee: <CupIcon size={22} />,
  call: <PhoneIcon size={22} />,
  meal: <MealIcon size={22} />,
  event: <StarIcon size={22} />,
  message: <BubbleIcon size={22} />,
  other: <EllipsisIcon size={22} />,
};

/**
 * The two-tap log: tap a type → sheet pre-filled with today → Save.
 */
export function QuickLog({ contactId, today }: { contactId: string; today: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<InteractionType>("coffee");
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  function openFor(t: InteractionType) {
    setType(t);
    setDate(today);
    setNotes("");
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    try {
      await api("/api/interactions", {
        json: { contactId, type, date, notes },
      });
      setOpen(false);
      toast("Logged");
      router.refresh();
    } catch {
      // sheet stays open
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="no-scrollbar -mx-4 mt-4 flex gap-2.5 overflow-x-auto px-4">
        {INTERACTION_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => openFor(t)}
            className="pressable flex shrink-0 flex-col items-center gap-1"
          >
            <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-card text-tint">
              {TYPE_ICONS[t]}
            </span>
            <span className="text-[11px] font-medium text-label-2">
              {INTERACTION_META[t].label}
            </span>
          </button>
        ))}
      </div>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={`Log ${INTERACTION_META[type].label.toLowerCase()}`}
        right={
          <button
            type="button"
            disabled={busy}
            onClick={save}
            className="pressable px-3 text-[17px] font-semibold text-tint disabled:opacity-40"
          >
            Save
          </button>
        }
      >
        <FormCard>
          <SelectField
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value as InteractionType)}
          >
            {INTERACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {INTERACTION_META[t].label}
              </option>
            ))}
          </SelectField>
          <TextField
            label="When"
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
          />
          <TextAreaField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What did you talk about? Anything to remember?"
            rows={4}
            autoFocus
          />
        </FormCard>
      </Sheet>
    </>
  );
}
