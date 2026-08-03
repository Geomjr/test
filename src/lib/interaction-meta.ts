import type { InteractionType } from "@/lib/db/schema";

export const INTERACTION_META: Record<
  InteractionType,
  { label: string; verb: string }
> = {
  coffee: { label: "Coffee", verb: "Coffee with" },
  call: { label: "Call", verb: "Call with" },
  meal: { label: "Meal", verb: "Meal with" },
  event: { label: "Event", verb: "Event with" },
  message: { label: "Message", verb: "Messaged" },
  other: { label: "Other", verb: "Caught up with" },
};
