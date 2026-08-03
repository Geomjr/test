/**
 * Builds a safe FTS5 MATCH expression from raw user input.
 *
 * Raw input must never reach MATCH directly: apostrophes, dashes, `AND`/`OR`,
 * and stray quotes are all FTS5 syntax (or syntax errors). We split into plain
 * word tokens, double-quote each, and give the final token a `*` prefix so
 * results feel instant while typing.
 */
export function toMatchQuery(input: string): string | null {
  const tokens = input
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .slice(0, 8);
  if (tokens.length === 0) return null;

  return tokens
    .map((token, i) => {
      const quoted = `"${token.replaceAll('"', '""')}"`;
      return i === tokens.length - 1 ? `${quoted}*` : quoted;
    })
    .join(" ");
}

/** Markers used by snippet() and replaced with <mark> on the client. */
export const SNIPPET_OPEN = "";
export const SNIPPET_CLOSE = "";
