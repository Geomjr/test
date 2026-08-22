# xsync — X bookmarks & likes → local thesis database

Pulls **your own** bookmarks and liked posts from the X API v2 into a local
SQLite database, auto-tags them against a crypto / VC / thesis lexicon, and
gives you search, filtering, reports and exports on top. Python 3.10+,
**zero dependencies** (stdlib only).

```
python -m xsync login          # one-time OAuth (browser flow)
python -m xsync sync           # pull bookmarks + likes, tag them
python -m xsync report         # tag counts, top authors, top linked domains
python -m xsync list --tag crypto --order likes
python -m xsync search "stablecoin rails"
python -m xsync export --tag vc --format md --out vc-notes.md
```

## One-time setup

1. Create an app at <https://developer.x.com> (Developer Console). There is no
   free tier for new accounts — the API is pay-per-usage, so buy a small credit
   pack (a few dollars covers a full personal history).
2. In the app's **User authentication settings**, enable **OAuth 2.0**,
   set type to *Native app* (public client), and add
   `http://127.0.0.1:8723/callback` as a callback URI.
3. Run:

   ```
   export X_CLIENT_ID="your-client-id"
   python -m xsync login
   ```

   On a remote or headless machine, use the manual flow instead:
   `python -m xsync login --manual` prints the authorise URL; open it anywhere,
   approve, then paste the (failed-to-load) redirect URL back with
   `python -m xsync login --redirect-url "<url>"`.

   Your browser opens, you authorise, and tokens land in
   `~/.config/xsync/tokens.json` (mode 0600). Refresh is automatic afterwards
   thanks to the `offline.access` scope. For confidential clients also export
   `X_CLIENT_SECRET`.

## Syncing and what it costs

The bookmarks (`GET /2/users/:id/bookmarks`) and likes
(`GET /2/users/:id/liked_tweets`) endpoints only accept OAuth 2.0
**user-context** tokens — that's why the login flow exists. Reading your own
data through your own app bills at the "Owned Reads" rate (**$0.001 per
resource**; standard reads are $0.005). Each post *and* each expanded author
object counts as a resource, deduplicated per 24h UTC day.

- First run: `python -m xsync sync --full` pages your whole history.
  5,000 bookmarks ≈ $5–6 with author expansions, roughly half that with
  `--no-expansions`.
- After that, plain `python -m xsync sync` pages from the newest post and
  stops after `--overlap` (default 25) consecutive already-known posts, so a
  daily sync costs a fraction of a cent.
- `--max-resources N` puts a hard budget on a run; every run prints its
  resource count and estimated cost, and runs are logged in the `sync_runs`
  table so you can audit spend.

Note: X has been billing some Owned-Read-eligible endpoints at the standard
rate ([known issue](https://devcommunity.x.com/t/owned-reads-0-001-rate-not-applied-to-bookmarks-endpoint-billed-at-0-005-instead/263311)) — check your first invoice.

## Thesis themes

On top of the tags sits a curated thesis layer (`python -m xsync themes`):

- `xsync/themes.json` - 11 investable themes, each with a working thesis
  statement, drivers to watch, and auto-match terms for future syncs.
- `xsync/seeds.json` - hand-curated keystone posts, each with a **stance**
  (`support` / `counter` / `evidence`) and a note on why it matters.
  Conflicting takes are stored deliberately: every theme keeps its bull case
  and bear case side by side.

```
python -m xsync themes                          # apply + per-theme summary
python -m xsync themes --out thesis-drivers.md  # full report with permalinks
```

Full post bodies and raw API JSON always stay in the `tweets` table - themes
are a lens, not a replacement.

## Tagging

`xsync/lexicon.json` maps tags (`crypto`, `vc`, `thesis`, `ai`) to term lists.
Terms match case-insensitively on word boundaries; multi-word terms match as
phrases; `re:`-prefixed entries are raw regex (the default set includes a
`$TICKER` cashtag pattern). The score is the number of distinct terms hit, and
each tag row records *which* terms fired, so you can tune the lexicon and
re-run `python -m xsync tag --retag` — no API calls needed.

Long posts are stored with their full `note_tweet` body, so tagging and search
see the whole essay, not the truncated preview.

## Database

Default path `~/.config/xsync/xsync.db` (override with `--db`). Tables:
`tweets` (one row per post — text, metrics, extracted URLs/domains, raw JSON),
`authors`, `sources` (bookmark/like links, so a post that is both is stored
once), `tags` (tag, score, matched terms), `sync_runs`. A post's provenance,
engagement and matched terms are all queryable with plain SQL, and
`tweets_fts` gives FTS5 full-text search where available.

## Tests

```
python -m unittest discover -s tests
```

25 tests run the whole pipeline (auth, pagination, incremental catch-up,
dedupe across sources, tagging, cost accounting) against a canned transport —
no network, no credentials.
