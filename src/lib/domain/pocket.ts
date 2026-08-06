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

/**
 * Pull "Ask next time" bullets out of interaction notes. Sources must be
 * ordered newest-first; the newest hook per contact wins, capped at `max`.
 */
export function extractPocketHooks(sources: NoteSource[], max = 3): PocketHook[] {
  const hooks: PocketHook[] = [];
  const seen = new Set<string>();

  for (const source of sources) {
    if (seen.has(source.contactId)) continue;
    const match = source.notes.match(/ask next time:\s*\n((?:\s*-\s*.+\n?)+)/i);
    if (!match?.[1]) continue;
    const first = match[1]
      .split("\n")
      .map((line) => line.replace(/^\s*-\s*/, "").trim())
      .find((line) => line.length > 0);
    if (!first) continue;
    hooks.push({ contactId: source.contactId, contactName: source.contactName, hook: first });
    seen.add(source.contactId);
    if (hooks.length >= max) break;
  }

  return hooks;
}
