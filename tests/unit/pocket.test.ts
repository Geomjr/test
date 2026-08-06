import { describe, expect, it } from "vitest";
import { extractPocketHooks } from "@/lib/domain/pocket";
import { pickIntroMatch, pairKey } from "@/lib/domain/intro-match";

describe("extractPocketHooks", () => {
  const note = (contactId: string, notes: string) => ({
    contactId,
    contactName: contactId,
    notes,
  });

  it("pulls the first ask-next-time bullet per contact, newest first", () => {
    const hooks = extractPocketHooks([
      note("a", "Great chat.\n\nAsk next time:\n- What team is she joining?\n- How was Lisbon?"),
      note("a", "Older note.\n\nAsk next time:\n- Stale question"),
      note("b", "No hooks here."),
    ]);
    expect(hooks).toEqual([
      { contactId: "a", contactName: "a", hook: "What team is she joining?" },
    ]);
  });

  it("a newer conversation without hooks retires the older hook", () => {
    const hooks = extractPocketHooks([
      note("a", "Caught up — she answered everything."),
      note("a", "Older.\n\nAsk next time:\n- Now-stale question"),
    ]);
    expect(hooks).toEqual([]);
  });

  it("matches inline, numbered, and bullet-dot forms", () => {
    expect(
      extractPocketHooks([note("a", "Ask next time: how did the offer negotiation go?")]),
    ).toEqual([{ contactId: "a", contactName: "a", hook: "how did the offer negotiation go?" }]);
    expect(extractPocketHooks([note("b", "Ask next time:\n1. First question\n2. Second")])).toEqual([
      { contactId: "b", contactName: "b", hook: "First question" },
    ]);
    expect(extractPocketHooks([note("c", "Ask next time:\n• Dotted question")])).toEqual([
      { contactId: "c", contactName: "c", hook: "Dotted question" },
    ]);
  });

  it("caps results and ignores malformed blocks", () => {
    const sources = ["a", "b", "c", "d"].map((id) =>
      note(id, `x\n\nAsk next time:\n- Q for ${id}`),
    );
    const hooks = extractPocketHooks(sources, 3);
    expect(hooks).toHaveLength(3);
    expect(hooks.map((h) => h.contactId)).toEqual(["a", "b", "c"]);
  });

  it("is case-insensitive about the heading", () => {
    const hooks = extractPocketHooks([note("a", "ASK NEXT TIME:\n- Question one")]);
    expect(hooks[0]?.hook).toBe("Question one");
  });
});

describe("pickIntroMatch", () => {
  const person = (id: string, industry: string | null, company: string | null) => ({
    id,
    name: id,
    industry,
    company,
  });

  it("matches two people in the same industry at different companies", () => {
    const match = pickIntroMatch(
      [person("a", "Consulting", "Bain"), person("b", "Consulting", "BCG"), person("c", "Tech", null)],
      new Set(),
      "2026-08-05",
    );
    expect(match).not.toBeNull();
    expect([match!.aId, match!.bId].sort()).toEqual(["a", "b"]);
    expect(match!.why).toBe("Consulting");
  });

  it("skips colleagues and already-introduced pairs", () => {
    expect(
      pickIntroMatch(
        [person("a", "Consulting", "Bain"), person("b", "Consulting", "bain ")],
        new Set(),
        "2026-08-05",
      ),
    ).toBeNull();
    expect(
      pickIntroMatch(
        [person("a", "Consulting", "Bain"), person("b", "Consulting", "BCG")],
        new Set([pairKey("b", "a")]),
        "2026-08-05",
      ),
    ).toBeNull();
  });

  it("is deterministic for a given day", () => {
    const contacts = [
      person("a", "PE", "X"),
      person("b", "PE", "Y"),
      person("c", "PE", "Z"),
    ];
    const first = pickIntroMatch(contacts, new Set(), "2026-08-05");
    const second = pickIntroMatch(contacts, new Set(), "2026-08-05");
    expect(first).toEqual(second);
  });
});
