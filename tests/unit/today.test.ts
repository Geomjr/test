import { describe, expect, it } from "vitest";
import { pickTodaysThree } from "@/lib/domain/today";
import type { OverdueEntry } from "@/lib/domain/overdue";
import type { UpcomingEvent } from "@/lib/domain/upcoming";
import type { ReconnectSuggestion } from "@/lib/domain/reconnect";

const overdueEntry = (id: string, tier: string, daysSince: number): OverdueEntry => ({
  id,
  name: id,
  tier,
  cadenceDays: 30,
  lastInteractionDate: "2026-07-01",
  daysSince,
  daysOverdue: daysSince - 30,
});

const birthday = (contactId: string, inDays: number): UpcomingEvent => ({
  contactId,
  contactName: contactId,
  label: "Birthday",
  date: "--08-06",
  recurring: true,
  occursOn: "2026-08-06",
  inDays,
});

const reconnect = (id: string, daysSince: number): ReconnectSuggestion => ({
  id,
  name: id,
  tier: "warm",
  daysSince,
  lastInteractionDate: "2026-05-01",
});

const promiseTask = (id: string, contactId: string, dueDate: string) => ({
  id,
  title: `Do the thing for ${contactId}`,
  contactId,
  contactName: contactId,
  dueDate,
});

describe("pickTodaysThree", () => {
  it("leads with the oldest open promise", () => {
    const moves = pickTodaysThree({
      overdue: [overdueEntry("a", "inner", 40)],
      upcoming: [],
      reconnects: [],
      promiseTasks: [promiseTask("t2", "b", "2026-08-06"), promiseTask("t1", "c", "2026-08-04")],
    });
    expect(moves[0]).toMatchObject({ kind: "promise", contactId: "c", taskId: "t1" });
  });

  it("includes an imminent birthday but not a distant one", () => {
    const near = pickTodaysThree({
      overdue: [],
      upcoming: [birthday("b", 2)],
      reconnects: [],
      promiseTasks: [],
    });
    expect(near[0]).toMatchObject({ kind: "birthday", contactId: "b" });

    const far = pickTodaysThree({
      overdue: [],
      upcoming: [birthday("b", 3)],
      reconnects: [],
      promiseTasks: [],
    });
    expect(far).toHaveLength(0);
  });

  it("orders outreach by closeness tier before quiet length", () => {
    const moves = pickTodaysThree({
      overdue: [
        overdueEntry("warm-long", "warm", 200),
        overdueEntry("inner-short", "inner", 35),
        overdueEntry("close-mid", "close", 60),
      ],
      upcoming: [],
      reconnects: [],
      promiseTasks: [],
    });
    expect(moves.map((m) => m.contactId)).toEqual(["inner-short", "close-mid", "warm-long"]);
  });

  it("never repeats a contact across slots", () => {
    const moves = pickTodaysThree({
      overdue: [overdueEntry("dup", "inner", 40)],
      upcoming: [birthday("dup", 1)],
      reconnects: [reconnect("dup", 90)],
      promiseTasks: [promiseTask("t1", "dup", "2026-08-04")],
    });
    expect(moves).toHaveLength(1);
    expect(moves[0]!.kind).toBe("promise");
  });

  it("falls back to dormant ties and caps at three", () => {
    const moves = pickTodaysThree({
      overdue: [],
      upcoming: [],
      reconnects: [reconnect("r1", 70), reconnect("r2", 80), reconnect("r3", 90), reconnect("r4", 100)],
      promiseTasks: [],
    });
    expect(moves).toHaveLength(3);
    expect(moves.every((m) => m.kind === "reconnect")).toBe(true);
    expect(moves[0]!.reason).toContain("10 quiet weeks");
  });

  it("uses gain-framed language, never debt language", () => {
    const moves = pickTodaysThree({
      overdue: [overdueEntry("a", "inner", 44)],
      upcoming: [],
      reconnects: [],
      promiseTasks: [],
    });
    expect(moves[0]!.reason).toMatch(/good moment/i);
    expect(moves[0]!.reason).not.toMatch(/late|overdue|behind/i);
  });
});
