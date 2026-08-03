# Orbit

**Your people, in orbit.** A personal CRM for your professional network *and* your friendships — built for MBA life (coffee chats, recruiting pipelines, sections, treks) but designed as a real, multi-user product.

Orbit is a mobile-first PWA that looks and feels like a native Apple app: iOS tab bar, large collapsing titles, grouped inset lists, frosted-glass bars, slide-up sheets, automatic dark mode, safe-area aware. Install it to your iPhone home screen and it opens full-screen like a native app.

## Features

- **People** — rich contact profiles: company, role, industry, city, tags, relationship tier (Inner Circle → New), birthday, how-you-met, notes, photo.
- **Keep-in-touch cadences** — set "every 3 weeks" per person; the **Today** screen surfaces whoever has lapsed, sorted by most overdue.
- **Interaction log** — two taps to log a coffee, call, meal, event, or message; a per-person timeline you can skim before you meet them.
- **Voice notes** — tap-record a memo right after a chat (works on iPhone via the mic), with live transcription where the browser supports it. Transcripts are editable and searchable.
- **Recruiting pipeline** — a kanban board: To Reach Out → Contacted → Scheduled → Met → Thank-You Sent → Keep Warm. Drag on desktop, tap-to-move on mobile.
- **Tasks** — follow-ups with due dates, standalone or attached to a person.
- **Important dates** — birthdays and one-offs (weddings, internship starts) surfaced up to two weeks ahead.
- **Reconnect suggestions** — gentle daily serendipity beyond hard cadences.
- **Introductions** — track who opened doors for you and the intros you've made.
- **Global search** — SQLite FTS5 across names, notes, interactions, and voice transcripts. "Who mentioned Patagonia?"
- **Analytics** — network by industry/company/tier, interactions per week, most contacted, who's drifting away.
- **CSV import/export** — LinkedIn connections export supported out of the box (preamble skipping, `Connected On` parsing, duplicate detection).
- **AI (Claude)** — optional: natural-language questions over your own data ("who do I know in PE?"), pre-meeting briefs, drafted follow-up/thank-you messages, and a weekly review narrative. Streams token-by-token. The app is fully functional without it.
- **Weekly review** — a ten-minute Sunday ritual screen.

## Quick start

```bash
npm install
npm run seed        # optional: demo account with a realistic network
npm run dev         # http://localhost:3000
```

Demo account: **demo@orbit.app** / **orbit-demo**

### Enable AI (optional)

```bash
cp .env.example .env
# set ANTHROPIC_API_KEY=sk-ant-...
```

The model defaults to `claude-opus-5` (override with `ANTHROPIC_MODEL`). Without a key, AI surfaces show a setup hint and everything else works.

### Environment

| Variable | Default | Purpose |
|---|---|---|
| `DATA_DIR` | `./data` | SQLite database + uploaded photos/audio |
| `ANTHROPIC_API_KEY` | — | Enables AI features (server-side only; never sent to clients) |
| `ANTHROPIC_MODEL` | `claude-opus-5` | Claude model for AI features |

## Testing

```bash
npm test        # vitest — domain logic, CSV engine, FTS triggers, search sanitizer
npm run build   # production build (TS strict)
npm run e2e     # Playwright — sign-up→log→pipeline→search flows, cross-user
                # isolation, and screenshot tours (iPhone + desktop, light + dark)
```

E2E runs seed a throwaway database (`.e2e-data`) and store screenshots under `e2e/screenshots/`.

## Architecture

- **Next.js 16** (App Router, TypeScript strict, Tailwind v4) — one repo, explicit HTTP API surface (route handlers, not server actions) so a future Capacitor wrapper or mobile client can consume the same API.
- **SQLite via better-sqlite3 + Drizzle** — synchronous, zero-ops, FTS5 full-text search with trigger-maintained indexing. Column types are conservative (text ids, ms-epoch integers, ISO date strings) so a Postgres migration is mechanical when scale demands it.
- **Hand-rolled session auth** — argon2id password hashing (`@node-rs/argon2`), 256-bit tokens stored as SHA-256, httpOnly cookies, sliding 30-day expiry, per-IP sign-in throttling. Every query is scoped by `user_id`; cross-user access is covered by an e2e test.
- **Uploads** live under `DATA_DIR/uploads/{userId}/…` (never `public/`), served through auth-checked routes; voice audio supports HTTP Range so iOS `<audio>` scrubs properly. The storage module is a four-function interface — swapping in S3 is a drop-in.
- **AI** — server-side `@anthropic-ai/sdk` streaming with prompt caching on the CRM digest, a per-user daily budget, a graceful `AI_DISABLED` state, and server-side fallback (`fallbacks: "default"`) so a safety-classifier decline transparently retries on Anthropic's recommended fallback model.
- **PWA** — manifest + icons + a deliberately conservative service worker: app-shell caching only, network-always for data, an offline fallback page. No stale data, no broken App Router navigations.

## Deploying

Any Node 22 host with a persistent disk works:

```bash
npm ci && npm run build
DATA_DIR=/var/lib/orbit npm start
```

Or with Docker (volume-mount the data dir):

```bash
docker build -t orbit .
docker run -p 3000:3000 -v orbit-data:/app/data orbit
```

Put it behind HTTPS — required for microphone access, PWA install, and secure cookies. Fly.io / Railway / a small VPS with Caddy all work; serverless hosts (Vercel) need the Postgres swap below first.

## Roadmap to commercial

Deliberately deferred, with the seams already in place:

- **Password reset + email verification** (schema needs only a tokens table).
- **Postgres** — swap `drizzle-orm/better-sqlite3` for the pg driver; FTS5 is isolated behind `src/lib/data/search.ts` (becomes `tsvector`).
- **Object storage** — reimplement `src/lib/storage.ts` against S3.
- **Billing** — gate AI + contact counts on a `plan` column; Stripe.
- **App Store** — wrap with Capacitor; the client already avoids Node APIs, uses standard web APIs only, and talks to an explicit HTTP API.
