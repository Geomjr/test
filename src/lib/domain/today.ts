import type { OverdueEntry } from "./overdue";
import type { ReconnectSuggestion } from "./reconnect";
import type { UpcomingEvent } from "./upcoming";

/**
 * "Today's three" — the home screen's hero module.
 *
 * Research-backed shape: cap the daily ask at three (choice overload:
 * Iyengar & Lepper 2000; Hick's law), lead with an open promise (Ovsiankina:
 * unfinished tasks pull people back), include a birthday when imminent
 * (universal module across personal CRMs), fill with cadence-due people
 * ordered by closeness tier (Dunbar: inner layers deserve the attention),
 * and fall back to a dormant tie (Levin et al. 2011: reconnections are
 * unusually valuable). Every move carries a "why now" in warm, gain-framed
 * language — never debt language (Gallagher & Updegraff 2012).
 */

export type PromiseTask = {
  id: string;
  title: string;
  contactId: string | null;
  contactName: string | null;
  dueDate: string | null;
};

export type TodayMove = {
  kind: "promise" | "birthday" | "outreach" | "reconnect";
  contactId: string;
  contactName: string;
  reason: string;
  taskId?: string;
};

const TIER_PRIORITY: Record<string, number> = {
  inner: 0,
  close: 1,
  active: 2,
  warm: 3,
  new: 4,
};

export function pickTodaysThree(input: {
  overdue: OverdueEntry[];
  upcoming: UpcomingEvent[];
  reconnects: ReconnectSuggestion[];
  promiseTasks: PromiseTask[];
}): TodayMove[] {
  const moves: TodayMove[] = [];
  const used = new Set<string>();

  // 1. The oldest open promise tied to a person.
  const promise = input.promiseTasks
    .filter((t) => t.contactId && t.contactName && t.dueDate)
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : a.dueDate! > b.dueDate! ? 1 : 0))[0];
  if (promise) {
    moves.push({
      kind: "promise",
      contactId: promise.contactId!,
      contactName: promise.contactName!,
      reason: promise.title,
      taskId: promise.id,
    });
    used.add(promise.contactId!);
  }

  // 2. A birthday within the next two days.
  const birthday = input.upcoming.find(
    (e) => e.label === "Birthday" && e.inDays <= 2 && !used.has(e.contactId),
  );
  if (birthday) {
    moves.push({
      kind: "birthday",
      contactId: birthday.contactId,
      contactName: birthday.contactName,
      reason:
        birthday.inDays === 0
          ? "Birthday today"
          : birthday.inDays === 1
            ? "Birthday tomorrow"
            : `Birthday in ${birthday.inDays} days`,
    });
    used.add(birthday.contactId);
  }

  // 3. Cadence-due people — closest tier first, then longest quiet.
  const outreach = [...input.overdue]
    .filter((e) => !used.has(e.id))
    .sort(
      (a, b) =>
        (TIER_PRIORITY[a.tier] ?? 9) - (TIER_PRIORITY[b.tier] ?? 9) ||
        b.daysSince - a.daysSince,
    );
  for (const entry of outreach) {
    if (moves.length >= 3) break;
    moves.push({
      kind: "outreach",
      contactId: entry.id,
      contactName: entry.name,
      reason: `${entry.daysSince} days since your last chat — good moment for a hello`,
    });
    used.add(entry.id);
  }

  // 4. Still short? A dormant tie.
  for (const suggestion of input.reconnects) {
    if (moves.length >= 3) break;
    if (used.has(suggestion.id)) continue;
    const weeks = Math.floor(suggestion.daysSince / 7);
    moves.push({
      kind: "reconnect",
      contactId: suggestion.id,
      contactName: suggestion.name,
      reason:
        weeks >= 2
          ? `${weeks} quiet weeks — they'd be glad to hear from you`
          : "A quick hello would land well",
    });
    used.add(suggestion.id);
  }

  return moves.slice(0, 3);
}
