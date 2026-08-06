/**
 * "In your pocket" — resurfaces the debrief coach's "Ask next time" hooks
 * for people you're about to talk to. X-discourse grounding: remembering
 * small details is repeatedly described as a social superpower, and its
 * absence ("who introduced me to this person again?") as a top pain.
 */

export type NoteSource = {
  contactId: string;
  contactName: string;
  notes: string;
};

export type PocketHook = {
  contactId: string;
  contactName: string;
  hook: string;
};

/** Block form ("Ask next time:\n- q" with -, •, or numbered bullets) or inline form. */
const BLOCK_RE = /ask next time:\s*\n((?:[ \t]*(?:-|•|\d+[.)])[ \t]*.+\n?)+)/i;
const INLINE_RE = /ask next time:[ \t]*(\S.*)/i;

function firstHook(notes: string): string | null {
  const block = notes.match(BLOCK_RE);
  if (block?.[1]) {
    const first = block[1]
      .split("\n")
      .map((line) => line.replace(/^[ \t]*(?:-|•|\d+[.)])[ \t]*/, "").trim())
      .find((line) => line.length > 0);
    if (first) return first;
  }
  const inline = notes.match(INLINE_RE);
  return inline?.[1]?.trim() || null;
}

/**
 * Pull "Ask next time" hooks out of interaction notes. Sources must be
 * ordered newest-first; only each contact's NEWEST note is eligible — a
 * newer conversation without hooks means the old question had its moment.
 */
export function extractPocketHooks(sources: NoteSource[], max = 3): PocketHook[] {
  const hooks: PocketHook[] = [];
  const seen = new Set<string>();

  for (const source of sources) {
    if (seen.has(source.contactId)) continue;
    seen.add(source.contactId);
    const hook = firstHook(source.notes);
    if (!hook) continue;
    hooks.push({ contactId: source.contactId, contactName: source.contactName, hook });
    if (hooks.length >= max) break;
  }

  return hooks;
}
