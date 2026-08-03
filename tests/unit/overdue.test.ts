import { describe, expect, it } from "vitest";
import { computeOverdue, type CadenceContact } from "@/lib/domain/overdue";

const base = (over: Partial<CadenceContact>): CadenceContact => ({
  id: "c1",
  name: "Test Person",
  tier: "close",
  cadenceDays: 21,
  lastInteractionDate: null,
  createdAt: Date.UTC(2026, 0, 1),
  ...over,
});

describe("computeOverdue", () => {
  it("never flags contacts without a cadence", () => {
    const result = computeOverdue(
      [base({ cadenceDays: null, lastInteractionDate: "2020-01-01" })],
      "2026-08-01",
    );
    expect(result).toEqual([]);
  });

  it("flags exactly-on-cadence contacts as due today (daysOverdue 0)", () => {
    const result = computeOverdue(
      [base({ cadenceDays: 21, lastInteractionDate: "2026-07-11" })],
      "2026-08-01",
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.daysOverdue).toBe(0);
    expect(result[0]?.daysSince).toBe(21);
  });

  it("does not flag contacts inside their cadence", () => {
    const result = computeOverdue(
      [base({ cadenceDays: 21, lastInteractionDate: "2026-07-12" })],
      "2026-08-01",
    );
    expect(result).toEqual([]);
  });

  it("uses creation date as the baseline when never contacted", () => {
    const result = computeOverdue(
      [base({ cadenceDays: 30, lastInteractionDate: null, createdAt: Date.UTC(2026, 5, 1) })],
      "2026-08-01",
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.daysSince).toBe(61);
    expect(result[0]?.daysOverdue).toBe(31);
  });

  it("sorts most-overdue first", () => {
    const result = computeOverdue(
      [
        base({ id: "a", lastInteractionDate: "2026-07-01" }), // 31 since, 10 overdue
        base({ id: "b", lastInteractionDate: "2026-06-01" }), // 61 since, 40 overdue
      ],
      "2026-08-01",
    );
    expect(result.map((r) => r.id)).toEqual(["b", "a"]);
  });
});
