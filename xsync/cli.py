"""Command line interface: python -m xsync <command>"""

import argparse
import csv
import json
import os
import sys
import textwrap

from xsync import api, auth, config, db, sync, tagging


def _client(args) -> tuple[api.XClient, str]:
    provider = auth.TokenProvider(path=args.tokens)
    client = api.XClient(provider)
    user_id = args.user_id or provider.tokens.get("user_id")
    if not user_id:
        me = client.verify_credentials()
        user_id = me["id"]
        provider.tokens["user_id"] = user_id
        provider.tokens["username"] = me.get("username")
        auth.save_tokens(provider.tokens, args.tokens)
    return client, user_id


def _store(args) -> db.Store:
    return db.Store(args.db)


def _body(row) -> str:
    return (row["full_text"] or row["text"] or "").replace("\n", " ").strip()


def _permalink(row) -> str:
    keys = row.keys()
    handle = row["username"] if "username" in keys and row["username"] else "i"
    return f"https://x.com/{handle}/status/{row['id']}"


# ---------------------------------------------------------------- commands


def cmd_login(args) -> int:
    secret = args.client_secret or os.environ.get("X_CLIENT_SECRET")
    if args.redirect_url:
        # Manual step 2: exchange the pasted redirect URL.
        tokens = auth.finish_manual_login(args.redirect_url, secret)
        return _finish_login(tokens, args)
    client_id = args.client_id or os.environ.get("X_CLIENT_ID")
    if not client_id:
        print(
            "Missing client id. Create an app at https://developer.x.com, enable OAuth 2.0,\n"
            f"add {args.redirect_uri} as a callback URI, then either pass --client-id or\n"
            "export X_CLIENT_ID=...",
            file=sys.stderr,
        )
        return 2
    if args.manual:
        # Manual step 1: print the URL; the user pastes the redirect back via
        # `login --redirect-url "<url>"`. For remote/headless machines.
        url = auth.start_manual_login(client_id, args.redirect_uri)
        print("1. Open this URL in a browser and authorise the app:\n")
        print(f"   {url}\n")
        print("2. The browser will land on a 127.0.0.1 page that fails to load - that is")
        print("   expected. Copy the FULL URL from the address bar and run, quickly")
        print("   (the code expires in ~30s):\n")
        print('   python -m xsync login --redirect-url "<pasted url>"')
        return 0
    tokens = auth.login(
        client_id, secret, redirect_uri=args.redirect_uri,
        open_browser=not args.no_browser, timeout=args.timeout,
    )
    return _finish_login(tokens, args)


def _finish_login(tokens: dict, args) -> int:
    provider = auth.TokenProvider(path=args.tokens, tokens=tokens)
    client = api.XClient(provider)
    me = client.verify_credentials()
    tokens["user_id"] = me["id"]
    tokens["username"] = me.get("username")
    path = auth.save_tokens(tokens, args.tokens)
    print(f"Authorised as @{me.get('username')} (id {me['id']}). Credentials saved to {path}")
    return 0


def cmd_whoami(args) -> int:
    client, user_id = _client(args)
    me = client.verify_credentials()
    print(f"@{me.get('username')} - {me.get('name')} (id {me['id']})")
    return 0


def cmd_sync(args) -> int:
    sources = ["bookmarks", "likes"] if args.source == "all" else [args.source]
    client, user_id = _client(args)
    total_new = total_resources = 0

    with _store(args) as store:
        for source in sources:
            def progress(result, _source=source):
                print(
                    f"  {_source}: page {result.pages} - "
                    f"{result.new_tweets} new, {result.seen_tweets} already stored",
                    file=sys.stderr,
                )

            print(f"Syncing {source} ...", file=sys.stderr)
            result = sync.sync_source(
                client, store, user_id, source,
                full=args.full, page_size=args.page_size, max_pages=args.max_pages,
                max_resources=args.max_resources, overlap=args.overlap,
                expansions=not args.no_expansions, progress=progress if args.verbose else None,
            )
            total_new += result.new_tweets
            total_resources += result.resources
            print(
                f"{source}: +{result.new_tweets} new, {result.seen_tweets} known, "
                f"{result.pages} pages, {result.resources} resources "
                f"(~${result.cost:.3f}) - stopped: {result.stopped_reason}"
            )

        if not args.no_tag:
            stats = tagging.Tagger.load(args.lexicon).tag_store(store, retag=args.retag)
            summary = ", ".join(f"{k}={v}" for k, v in sorted(stats["by_tag"].items()))
            print(f"Tagged {stats['tagged']}/{stats['scanned']} scanned" + (f" ({summary})" if summary else ""))

        counts = store.counts()
    print(
        f"Total: +{total_new} new this run, {total_resources} resources "
        f"(~${api.estimate_cost(total_resources):.3f} at the owned-read rate). "
        f"DB now holds {counts['tweets']} posts."
    )
    return 0


def cmd_tag(args) -> int:
    with _store(args) as store:
        stats = tagging.Tagger.load(args.lexicon).tag_store(store, retag=args.retag,
                                                            min_score=args.min_score)
    print(f"Scanned {stats['scanned']}, tagged {stats['tagged']}")
    for tag, count in sorted(stats["by_tag"].items(), key=lambda kv: -kv[1]):
        print(f"  {tag:<10} {count}")
    return 0


def cmd_list(args) -> int:
    with _store(args) as store:
        rows = store.select(tag=args.tag, source=args.source, author=args.author,
                            since=args.since, min_score=args.min_score,
                            limit=args.limit, order=args.order)
    if not rows:
        print("No matching posts.")
        return 0
    for row in rows:
        head = f"@{row['username'] or '?'}  {(row['created_at'] or '')[:10]}"
        tags = row["tag_list"] or "-"
        print(f"\n{head}  [{tags}]  {_permalink(row)}")
        print(textwrap.fill(_body(row), width=96, initial_indent="  ", subsequent_indent="  "))
    print(f"\n{len(rows)} post(s).")
    return 0


def cmd_search(args) -> int:
    with _store(args) as store:
        rows = store.search(args.query, limit=args.limit)
        if not store.has_fts:
            print("(FTS5 unavailable in this Python's sqlite - using substring match)", file=sys.stderr)
    for row in rows:
        print(f"\n@{row['username'] or '?'}  {(row['created_at'] or '')[:10]}  {_permalink(row)}")
        print(textwrap.fill(_body(row), width=96, initial_indent="  ", subsequent_indent="  "))
    print(f"\n{len(rows)} match(es).")
    return 0


def cmd_report(args) -> int:
    with _store(args) as store:
        counts = store.counts()
        print("Corpus")
        for key, value in counts.items():
            print(f"  {key:<10} {value}")
        print("\nTags")
        for row in store.tag_breakdown():
            print(f"  {row['tag']:<10} {row['n']:<6} avg score {row['avg_score']}")
        print(f"\nTop authors{f' for #{args.tag}' if args.tag else ''}")
        for row in store.top_authors(tag=args.tag):
            print(f"  @{row['username']:<20} {row['n']}")
        print(f"\nTop linked domains{f' for #{args.tag}' if args.tag else ''}")
        for domain, count in store.top_domains(tag=args.tag):
            print(f"  {domain:<28} {count}")
    return 0


def cmd_export(args) -> int:
    with _store(args) as store:
        rows = store.select(tag=args.tag, source=args.source, author=args.author,
                            since=args.since, min_score=args.min_score,
                            limit=args.limit, order=args.order)
    out = open(args.out, "w", newline="", encoding="utf-8") if args.out else sys.stdout
    try:
        if args.format == "jsonl":
            for row in rows:
                record = dict(row)
                record["raw"] = json.loads(record["raw"]) if record.get("raw") else None
                record["urls"] = json.loads(record["urls"] or "[]")
                record["permalink"] = _permalink(row)
                out.write(json.dumps(record, ensure_ascii=False) + "\n")
        elif args.format == "csv":
            fields = ["id", "created_at", "username", "tag_list", "like_count", "text", "permalink"]
            writer = csv.DictWriter(out, fieldnames=fields, extrasaction="ignore")
            writer.writeheader()
            for row in rows:
                record = dict(row)
                record["text"] = _body(row)
                record["permalink"] = _permalink(row)
                writer.writerow(record)
        else:  # markdown
            title = f"# {args.tag or 'All'} - {len(rows)} posts\n"
            out.write(title)
            for row in rows:
                out.write(
                    f"\n## @{row['username'] or '?'} - {(row['created_at'] or '')[:10]}\n\n"
                    f"{(row['full_text'] or row['text'] or '').strip()}\n\n"
                    f"Tags: {row['tag_list'] or '-'} | [permalink]({_permalink(row)})\n"
                )
                for url in json.loads(row["urls"] or "[]"):
                    out.write(f"- {url['url']}\n")
    finally:
        if args.out:
            out.close()
            print(f"Wrote {len(rows)} post(s) to {args.out}", file=sys.stderr)
    return 0


# ---------------------------------------------------------------- wiring


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="xsync",
        description="Pull your X bookmarks and likes into a local SQLite thesis database.",
    )
    parser.add_argument("--db", default=str(config.default_db_path()), help="SQLite path")
    parser.add_argument("--tokens", default=None, help="credentials path")
    parser.add_argument("--lexicon", default=None, help="tagging lexicon JSON")
    parser.add_argument("--user-id", default=None, help="override the authenticated user id")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("login", help="run the OAuth 2.0 PKCE flow once")
    p.add_argument("--client-id", default=None)
    p.add_argument("--client-secret", default=None, help="only for confidential apps")
    p.add_argument("--redirect-uri", default=config.DEFAULT_REDIRECT_URI)
    p.add_argument("--manual", action="store_true",
                   help="headless flow: print the URL, then finish with --redirect-url")
    p.add_argument("--redirect-url", default=None,
                   help="the full redirect URL pasted from the browser (manual step 2)")
    p.add_argument("--no-browser", action="store_true")
    p.add_argument("--timeout", type=int, default=300)
    p.set_defaults(func=cmd_login)

    p = sub.add_parser("whoami", help="check the stored credentials")
    p.set_defaults(func=cmd_whoami)

    p = sub.add_parser("sync", help="pull new bookmarks/likes into the database")
    p.add_argument("source", nargs="?", default="all", choices=["all", "bookmarks", "likes"])
    p.add_argument("--full", action="store_true", help="page the whole history, not just new items")
    p.add_argument("--page-size", type=int, default=100)
    p.add_argument("--max-pages", type=int, default=None)
    p.add_argument("--max-resources", type=int, default=None,
                   help="stop after roughly this many billable resources")
    p.add_argument("--overlap", type=int, default=25,
                   help="consecutive known posts that mean we have caught up")
    p.add_argument("--no-expansions", action="store_true",
                   help="skip author expansion (cheaper, but no handles)")
    p.add_argument("--no-tag", action="store_true")
    p.add_argument("--retag", action="store_true")
    p.add_argument("-v", "--verbose", action="store_true")
    p.set_defaults(func=cmd_sync)

    p = sub.add_parser("tag", help="apply the lexicon to stored posts")
    p.add_argument("--retag", action="store_true", help="re-tag everything, not just untagged")
    p.add_argument("--min-score", type=int, default=1)
    p.set_defaults(func=cmd_tag)

    for name, func, helptext in (("list", cmd_list, "browse stored posts"),
                                 ("export", cmd_export, "export stored posts")):
        p = sub.add_parser(name, help=helptext)
        p.add_argument("--tag", default=None)
        p.add_argument("--source", default=None, choices=["bookmarks", "likes"])
        p.add_argument("--author", default=None)
        p.add_argument("--since", default=None, help="ISO date, e.g. 2026-01-01")
        p.add_argument("--min-score", type=int, default=1)
        p.add_argument("--limit", type=int, default=50)
        p.add_argument("--order", default="created_at", choices=["created_at", "likes", "score"])
        if name == "export":
            p.add_argument("--format", default="md", choices=["md", "jsonl", "csv"])
            p.add_argument("--out", default=None)
        p.set_defaults(func=func)

    p = sub.add_parser("search", help="full-text search the stored posts")
    p.add_argument("query")
    p.add_argument("--limit", type=int, default=25)
    p.set_defaults(func=cmd_search)

    p = sub.add_parser("report", help="corpus overview: tags, authors, linked domains")
    p.add_argument("--tag", default=None)
    p.set_defaults(func=cmd_report)

    return parser


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)
    try:
        return args.func(args)
    except auth.AuthError as exc:
        print(f"auth error: {exc}", file=sys.stderr)
        return 3
    except api.XApiError as exc:
        print(f"api error: {exc}", file=sys.stderr)
        if exc.status == 403:
            print(
                "403 usually means the app is missing a scope (bookmark.read / like.read)\n"
                "or the project has no credits. Re-run `login` after fixing scopes.",
                file=sys.stderr,
            )
        return 4
    except KeyboardInterrupt:
        print("\ninterrupted", file=sys.stderr)
        return 130
