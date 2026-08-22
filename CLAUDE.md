# Personal context — George

This repo doubles as George's central context store for Claude sessions.
This file auto-loads at session start; the imports below pull in the core
context files. Deeper material lives in `context/reference/` — read it
on demand when relevant, don't assume it's loaded.

## Core facts

- Name: George (email: george@geomj.com, GitHub: geomjr)
- Works with Claude exclusively through web sessions (claude.ai/code) —
  no persistent local machine, so anything durable must be committed here.

## Core context (auto-loaded)

@context/about-me.md
@context/preferences.md
@context/projects.md
@context/people.md

## Deeper reference (fetch on demand)

- `context/reference/` — long-form docs, one topic per file. Check the
  directory listing when a task touches a topic that might have a doc.

## Maintenance rules for Claude

- When George states a durable fact, preference, or decision in a session,
  offer to record it: edit the right file under `context/`, commit with a
  message like `context: <what changed>`, and push.
- Keep this file and the four core files short and curated — stable,
  decision-relevant facts only. Anything long-form or rarely needed goes
  in `context/reference/` with a one-line pointer.
- Remove stale facts rather than piling on corrections.
- Never store secrets, credentials, or tokens anywhere in this repo.
