import { describe, expect, it } from "vitest";
import { composeNotes, parseWrap } from "@/lib/debrief";

const valid = {
  summary: "She got the Bain offer and starts in Boston in September.",
  type: "coffee",
  date: "2026-08-04",
  follow_ups: [{ title: "Send the case prep doc", due: null }],
  ask_next_time: ["What team is she hoping to join?"],
};

describe("parseWrap", () => {
  it("parses a well-formed wrap", () => {
    const wrap = parseWrap(JSON.stringify(valid));
    expect(wrap).not.toBeNull();
    expect(wrap!.summary).toContain("Bain offer");
    expect(wrap!.type).toBe("coffee");
    expect(wrap!.followUps).toHaveLength(1);
    expect(wrap!.askNextTime).toHaveLength(1);
  });

  it("rejects junk and missing summaries", () => {
    expect(parseWrap("not json")).toBeNull();
    expect(parseWrap(JSON.stringify({ ...valid, summary: "" }))).toBeNull();
  });

  it("defaults malformed optional fields instead of failing", () => {
    const wrap = parseWrap(
      JSON.stringify({
        summary: "Short note.",
        type: "brunch",
        date: "sometime",
        follow_ups: "nope",
        ask_next_time: [""],
      }),
    );
    expect(wrap).not.toBeNull();
    expect(wrap!.type).toBe("other");
    expect(wrap!.date).toBeNull();
    expect(wrap!.followUps).toEqual([]);
    expect(wrap!.askNextTime).toEqual([]);
  });
});

describe("composeNotes", () => {
  it("appends ask-next-time hooks when present", () => {
    const wrap = parseWrap(JSON.stringify(valid))!;
    const notes = composeNotes(wrap);
    expect(notes).toContain("Ask next time:");
    expect(notes).toContain("- What team is she hoping to join?");
  });

  it("returns the bare summary when there are no hooks", () => {
    const wrap = parseWrap(JSON.stringify({ ...valid, ask_next_time: [] }))!;
    expect(composeNotes(wrap)).toBe(valid.summary);
  });
});
