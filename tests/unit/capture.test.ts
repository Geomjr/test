import { describe, expect, it } from "vitest";
import { parseResolution } from "@/lib/capture";

const IDS = new Set(["c1", "c2"]);

const valid = {
  matches: [
    { id: "c1", confidence: 0.9 },
    { id: "c2", confidence: 0.4 },
  ],
  new_person: null,
  type: "coffee",
  date: "2026-08-03",
  follow_ups: [{ title: "Send the deck", due: null }],
};

describe("parseResolution", () => {
  it("parses a well-formed resolution", () => {
    const result = parseResolution(JSON.stringify(valid), IDS);
    expect(result).not.toBeNull();
    expect(result!.matches.map((m) => m.id)).toEqual(["c1", "c2"]);
    expect(result!.type).toBe("coffee");
    expect(result!.date).toBe("2026-08-03");
    expect(result!.followUps).toHaveLength(1);
  });

  it("rejects non-JSON and non-object payloads", () => {
    expect(parseResolution("not json", IDS)).toBeNull();
    expect(parseResolution('"just a string"', IDS)).toBeNull();
  });

  it("drops hallucinated and duplicate contact ids", () => {
    const result = parseResolution(
      JSON.stringify({
        ...valid,
        matches: [
          { id: "c1", confidence: 0.9 },
          { id: "made-up", confidence: 0.99 },
          { id: "c1", confidence: 0.2 },
        ],
      }),
      IDS,
    );
    expect(result!.matches).toEqual([{ id: "c1", confidence: 0.9 }]);
  });

  it("clamps confidence into [0, 1] and sorts best-first", () => {
    const result = parseResolution(
      JSON.stringify({
        ...valid,
        matches: [
          { id: "c2", confidence: -3 },
          { id: "c1", confidence: 42 },
        ],
      }),
      IDS,
    );
    expect(result!.matches[0]).toEqual({ id: "c1", confidence: 1 });
    expect(result!.matches[1]).toEqual({ id: "c2", confidence: 0 });
  });

  it("falls back to safe defaults for malformed fields", () => {
    const result = parseResolution(
      JSON.stringify({
        matches: "nope",
        new_person: { name: "" },
        type: "brunch",
        date: "yesterday",
        follow_ups: [{ title: "" }],
      }),
      IDS,
    );
    expect(result).not.toBeNull();
    expect(result!.matches).toEqual([]);
    expect(result!.newPerson).toBeNull();
    expect(result!.type).toBe("other");
    expect(result!.date).toBeNull();
    expect(result!.followUps).toEqual([]);
  });

  it("keeps a proposed new person", () => {
    const result = parseResolution(
      JSON.stringify({
        ...valid,
        matches: [],
        new_person: { name: "Marcus Webb", company: "Bain", role: null },
      }),
      IDS,
    );
    expect(result!.newPerson).toEqual({ name: "Marcus Webb", company: "Bain", role: null });
  });
});
