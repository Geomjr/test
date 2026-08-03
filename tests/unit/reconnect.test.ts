import { describe, expect, it } from "vitest";
import { pickReconnects } from "@/lib/domain/reconnect";
import type { CadenceContact } from "@/lib/domain/overdue";

const person = (id: string, over: Partial<CadenceContact> = {}): CadenceContact => ({
  id,
  name: `Person ${id}`,
  tier: "active",
  cadenceDays: null,
  lastInteractionDate: "2026-05-01",
  createdAt: Date.UTC(2026, 0, 1),
  ...over,
});

describe("pickReconnects", () => {
  it("excludes ids already surfaced as overdue", () => {
    const picks = pickReconnects(
      [person("a"), person("b")],
      "2026-08-01",
      new Set(["a"]),
    );
    expect(picks.every((p) => p.id !== "a")).toBe(true);
  });

  it("excludes recently-contacted people", () => {
    const picks = pickReconnects(
      [person("fresh", { lastInteractionDate: "2026-07-25" })],
      "2026-08-01",
      new Set(),
    );
    expect(picks).toEqual([]);
  });

  it("returns at most the requested count", () => {
    const contacts = Array.from({ length: 10 }, (_, i) => person(`p${i}`));
    expect(pickReconnects(contacts, "2026-08-01", new Set(), 3)).toHaveLength(3);
  });

  it("is deterministic for a given day", () => {
    const contacts = Array.from({ length: 10 }, (_, i) => person(`p${i}`));
    const first = pickReconnects(contacts, "2026-08-01", new Set());
    const second = pickReconnects(contacts, "2026-08-01", new Set());
    expect(first.map((p) => p.id)).toEqual(second.map((p) => p.id));
  });

  it("prefers a mix of tiers when available", () => {
    const contacts = [
      person("i1", { tier: "inner" }),
      person("i2", { tier: "inner" }),
      person("k1", { tier: "keep_warm" }),
      person("c1", { tier: "close" }),
    ];
    const picks = pickReconnects(contacts, "2026-08-01", new Set(), 3);
    expect(new Set(picks.map((p) => p.tier)).size).toBe(3);
  });
});
