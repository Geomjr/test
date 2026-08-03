import { describe, expect, it } from "vitest";
import { toMatchQuery } from "@/lib/search";

describe("toMatchQuery", () => {
  it("quotes tokens and adds a prefix star to the last", () => {
    expect(toMatchQuery("jane acm")).toBe('"jane" "acm"*');
  });

  it("splits on apostrophes instead of breaking FTS syntax", () => {
    expect(toMatchQuery("O'Brien")).toBe('"O" "Brien"*');
  });

  it("neutralizes FTS operators by quoting them", () => {
    expect(toMatchQuery("cats AND dogs")).toBe('"cats" "AND" "dogs"*');
    expect(toMatchQuery("a - b")).toBe('"a" "b"*');
  });

  it("returns null for empty or symbol-only input", () => {
    expect(toMatchQuery("")).toBeNull();
    expect(toMatchQuery("  --- !!! ")).toBeNull();
  });

  it("keeps unicode letters", () => {
    expect(toMatchQuery("José")).toBe('"José"*');
  });

  it("caps the number of tokens", () => {
    const query = toMatchQuery("a b c d e f g h i j k");
    expect(query?.split(" ")).toHaveLength(8);
  });
});
