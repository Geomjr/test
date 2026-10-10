#!/usr/bin/env python3
"""Download every post on an X account's timeline via the official X API v2.

Usage:
    X_BEARER_TOKEN=... python3 download_tweets.py philip0x
    python3 download_tweets.py philip0x --out data/ --with-context

Writes <out>/<username>.jsonl (one post per line, newest first) and
<out>/<username>.csv. Re-running resumes from the saved pagination token.

The user-timeline endpoint returns at most the 3,200 most recent posts
(replies and reposts included). Reads are billed per post returned.
Standard library only.
"""

import argparse
import csv
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

API = os.environ.get("X_API_BASE", "https://api.x.com/2")

TWEET_FIELDS = ",".join([
    "created_at", "public_metrics", "conversation_id", "in_reply_to_user_id",
    "referenced_tweets", "entities", "lang", "note_tweet",
])


def get(path, token, params=None):
    url = f"{API}{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    while True:
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.load(resp)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                reset = int(e.headers.get("x-rate-limit-reset", time.time() + 60))
                wait = max(reset - int(time.time()), 1) + 1
                print(f"rate limited, sleeping {wait}s", file=sys.stderr)
                time.sleep(wait)
                continue
            sys.exit(f"HTTP {e.code} on {path}: {e.read().decode(errors='replace')}")


def full_text(tweet):
    # Long posts carry their full text in note_tweet; `text` is truncated.
    return (tweet.get("note_tweet") or {}).get("text") or tweet["text"]


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("username")
    ap.add_argument("--out", default="tweets")
    ap.add_argument("--with-context", action="store_true",
                    help="also fetch the posts he replied to or quoted (billed as extra reads)")
    args = ap.parse_args()

    token = os.environ.get("X_BEARER_TOKEN")
    if not token:
        sys.exit("set X_BEARER_TOKEN")

    os.makedirs(args.out, exist_ok=True)
    jsonl_path = os.path.join(args.out, f"{args.username}.jsonl")
    state_path = os.path.join(args.out, f"{args.username}.state.json")

    state = {}
    if os.path.exists(state_path):
        with open(state_path) as f:
            state = json.load(f)

    if "user_id" not in state:
        user = get(f"/users/by/username/{args.username}", token,
                   {"user.fields": "public_metrics,pinned_tweet_id"})["data"]
        state = {"user_id": user["id"], "pinned_tweet_id": user.get("pinned_tweet_id"),
                 "next_token": None, "count": 0}
        print(f"@{args.username}: {user['public_metrics']['tweet_count']} posts on profile",
              file=sys.stderr)
        open(jsonl_path, "w").close()
    elif state.get("done"):
        print("already complete; delete the .state.json file to start over", file=sys.stderr)
    else:
        print(f"resuming after {state['count']} posts", file=sys.stderr)

    params = {"max_results": 100, "tweet.fields": TWEET_FIELDS}
    if args.with_context:
        params["expansions"] = "referenced_tweets.id,referenced_tweets.id.author_id"
        params["user.fields"] = "username"

    while not state.get("done"):
        page_params = dict(params)
        if state["next_token"]:
            page_params["pagination_token"] = state["next_token"]
        page = get(f"/users/{state['user_id']}/tweets", token, page_params)

        context = {t["id"]: t for t in page.get("includes", {}).get("tweets", [])}
        with open(jsonl_path, "a") as f:
            for t in page.get("data", []):
                t["full_text"] = full_text(t)
                t["url"] = f"https://x.com/{args.username}/status/{t['id']}"
                t["pinned"] = t["id"] == state["pinned_tweet_id"]
                if context:
                    t["context"] = [context[r["id"]] for r in t.get("referenced_tweets", [])
                                    if r["id"] in context]
                f.write(json.dumps(t, ensure_ascii=False) + "\n")
                state["count"] += 1

        state["next_token"] = page.get("meta", {}).get("next_token")
        state["done"] = state["next_token"] is None
        with open(state_path, "w") as f:
            json.dump(state, f)
        print(f"{state['count']} posts saved", file=sys.stderr)

    with open(jsonl_path) as f:
        tweets = [json.loads(line) for line in f]
    csv_path = os.path.join(args.out, f"{args.username}.csv")
    with open(csv_path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["id", "created_at", "type", "text", "likes", "reposts", "replies",
                    "views", "url"])
        for t in tweets:
            kinds = [r["type"] for r in t.get("referenced_tweets", [])]
            m = t.get("public_metrics", {})
            w.writerow([t["id"], t.get("created_at"), "/".join(kinds) or "post",
                        t["full_text"], m.get("like_count"), m.get("retweet_count"),
                        m.get("reply_count"), m.get("impression_count"), t["url"]])
    print(f"done: {len(tweets)} posts -> {jsonl_path}, {csv_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
