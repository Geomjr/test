import { describe, expect, it } from "vitest";
import { expandUpcoming, type DateSource } from "@/lib/domain/upcoming";

const src = (over: Partial<DateSource>): DateSource => ({
  contactId: "c1",
  contactName: "Test Person",
  label: "Birthday",
  date: "1996-08-10",
  recurring: true,
  ...over,
});

describe("expandUpcoming", () => {
  it("includes recurring dates inside the horizon", () => {
    const events = expandUpcoming([src({ date: "1996-08-10" })], "2026-08-01", 14);
    expect(events).toHaveLength(1);
    expect(events[0]?.occursOn).toBe("2026-08-10");
    expect(events[0]?.inDays).toBe(9);
  });

  it("excludes recurring dates outside the horizon", () => {
    const events = expandUpcoming([src({ date: "1996-09-20" })], "2026-08-01", 14);
    expect(events).toEqual([]);
  });

  it("rolls over the year boundary", () => {
    const events = expandUpcoming([src({ date: "1996-01-02" })], "2026-12-28", 14);
    expect(events).toHaveLength(1);
    expect(events[0]?.occursOn).toBe("2027-01-02");
    expect(events[0]?.inDays).toBe(5);
  });

  it("supports year-less --MM-DD birthdays", () => {
    const events = expandUpcoming([src({ date: "--08-05" })], "2026-08-01", 14);
    expect(events).toHaveLength(1);
    expect(events[0]?.occursOn).toBe("2026-08-05");
  });

  it("observes Feb 29 birthdays on Feb 28 in non-leap years", () => {
    const events = expandUpcoming([src({ date: "1996-02-29" })], "2026-02-20", 14);
    expect(events).toHaveLength(1);
    expect(events[0]?.occursOn).toBe("2026-02-28");
  });

  it("keeps Feb 29 in leap years", () => {
    const events = expandUpcoming([src({ date: "1996-02-29" })], "2028-02-20", 14);
    expect(events[0]?.occursOn).toBe("2028-02-29");
  });

  it("includes one-off dates only within the window", () => {
    const events = expandUpcoming(
      [
        src({ label: "Wedding", date: "2026-08-09", recurring: false }),
        src({ label: "Old thing", date: "2026-07-30", recurring: false }),
      ],
      "2026-08-01",
      14,
    );
    expect(events).toHaveLength(1);
    expect(events[0]?.label).toBe("Wedding");
  });

  it("sorts soonest first", () => {
    const events = expandUpcoming(
      [src({ contactId: "a", date: "--08-10" }), src({ contactId: "b", date: "--08-03" })],
      "2026-08-01",
      14,
    );
    expect(events.map((e) => e.contactId)).toEqual(["b", "a"]);
  });
});
