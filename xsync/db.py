"""SQLite store. One row per post, with source/tag join tables so a post that is
both bookmarked and liked is stored once."""

import json
import sqlite3
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS tweets (
    id             TEXT PRIMARY KEY,
    text           TEXT NOT NULL,
    full_text      TEXT,
    author_id      TEXT,
    created_at     TEXT,
    lang           TEXT,
    conversation_id TEXT,
    like_count     INTEGER, retweet_count INTEGER, reply_count INTEGER,
    quote_count    INTEGER, bookmark_count INTEGER, impression_count INTEGER,
    urls           TEXT,
    domains        TEXT,
    referenced     TEXT,
    raw            TEXT,
    first_seen_at  TEXT,
    updated_at     TEXT
);
CREATE TABLE IF NOT EXISTS authors (
    id          TEXT PRIMARY KEY,
    username    TEXT, name TEXT, description TEXT,
    followers   INTEGER, verified INTEGER,
    raw         TEXT, updated_at TEXT
);
CREATE TABLE IF NOT EXISTS sources (
    tweet_id      TEXT NOT NULL,
    source        TEXT NOT NULL,
    rank          INTEGER,
    first_seen_at TEXT,
    PRIMARY KEY (tweet_id, source)
);
CREATE TABLE IF NOT EXISTS tags (
    tweet_id  TEXT NOT NULL,
    tag       TEXT NOT NULL,
    score     INTEGER,
    terms     TEXT,
    tagged_at TEXT,
    PRIMARY KEY (tweet_id, tag)
);
CREATE TABLE IF NOT EXISTS sync_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT, started_at TEXT, finished_at TEXT,
    pages INTEGER, new_tweets INTEGER, seen_tweets INTEGER,
    resources INTEGER, stopped_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_sources_source ON sources(source);
CREATE INDEX IF NOT EXISTS idx_tags_tag ON tags(tag);
CREATE INDEX IF NOT EXISTS idx_tweets_created ON tweets(created_at);
CREATE INDEX IF NOT EXISTS idx_tweets_author ON tweets(author_id);
"""

FTS_SCHEMA = """
CREATE VIRTUAL TABLE IF NOT EXISTS tweets_fts USING fts5(
    id UNINDEXED, body, tokenize='porter unicode61'
);
"""


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class Store:
    def __init__(self, path: Path | str):
        self.path = str(path)
        if self.path != ":memory:":
            Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(self.path)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA journal_mode=WAL")
        self.conn.execute("PRAGMA foreign_keys=ON")
        self.conn.executescript(SCHEMA)
        self.has_fts = True
        try:
            self.conn.executescript(FTS_SCHEMA)
        except sqlite3.OperationalError:
            # FTS5 is not compiled into every Python's sqlite; fall back to LIKE.
            self.has_fts = False
        self.conn.commit()

    def close(self):
        self.conn.close()

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.close()

    # ---------- writes ----------

    def known_ids(self, source: str) -> set[str]:
        rows = self.conn.execute("SELECT tweet_id FROM sources WHERE source = ?", (source,))
        return {r[0] for r in rows}

    def upsert_author(self, user: dict):
        metrics = user.get("public_metrics") or {}
        self.conn.execute(
            """INSERT INTO authors (id, username, name, description, followers, verified, raw, updated_at)
               VALUES (?,?,?,?,?,?,?,?)
               ON CONFLICT(id) DO UPDATE SET
                 username=excluded.username, name=excluded.name,
                 description=excluded.description, followers=excluded.followers,
                 verified=excluded.verified, raw=excluded.raw, updated_at=excluded.updated_at""",
            (
                user["id"], user.get("username"), user.get("name"), user.get("description"),
                metrics.get("followers_count"), int(bool(user.get("verified"))),
                json.dumps(user, sort_keys=True), now(),
            ),
        )

    def upsert_tweet(self, tweet: dict) -> bool:
        """Insert or refresh a post. Returns True if this is the first time we see it."""
        metrics = tweet.get("public_metrics") or {}
        note = (tweet.get("note_tweet") or {}).get("text")
        urls = extract_urls(tweet)
        stamp = now()
        cur = self.conn.execute("SELECT 1 FROM tweets WHERE id = ?", (tweet["id"],))
        is_new = cur.fetchone() is None
        self.conn.execute(
            """INSERT INTO tweets (id, text, full_text, author_id, created_at, lang,
                   conversation_id, like_count, retweet_count, reply_count, quote_count,
                   bookmark_count, impression_count, urls, domains, referenced, raw,
                   first_seen_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
               ON CONFLICT(id) DO UPDATE SET
                 text=excluded.text, full_text=excluded.full_text,
                 like_count=excluded.like_count, retweet_count=excluded.retweet_count,
                 reply_count=excluded.reply_count, quote_count=excluded.quote_count,
                 bookmark_count=excluded.bookmark_count,
                 impression_count=excluded.impression_count,
                 urls=excluded.urls, domains=excluded.domains, raw=excluded.raw,
                 updated_at=excluded.updated_at""",
            (
                tweet["id"], tweet.get("text", ""), note, tweet.get("author_id"),
                tweet.get("created_at"), tweet.get("lang"), tweet.get("conversation_id"),
                metrics.get("like_count"), metrics.get("retweet_count"),
                metrics.get("reply_count"), metrics.get("quote_count"),
                metrics.get("bookmark_count"), metrics.get("impression_count"),
                json.dumps(urls), json.dumps(sorted({u["domain"] for u in urls if u["domain"]})),
                json.dumps(tweet.get("referenced_tweets") or []),
                json.dumps(tweet, sort_keys=True), stamp, stamp,
            ),
        )
        if self.has_fts:
            body = note or tweet.get("text", "")
            self.conn.execute("DELETE FROM tweets_fts WHERE id = ?", (tweet["id"],))
            self.conn.execute("INSERT INTO tweets_fts (id, body) VALUES (?,?)", (tweet["id"], body))
        return is_new

    def link_source(self, tweet_id: str, source: str, rank: int):
        self.conn.execute(
            """INSERT INTO sources (tweet_id, source, rank, first_seen_at) VALUES (?,?,?,?)
               ON CONFLICT(tweet_id, source) DO NOTHING""",
            (tweet_id, source, rank, now()),
        )

    def set_tags(self, tweet_id: str, matches: dict):
        self.conn.execute("DELETE FROM tags WHERE tweet_id = ?", (tweet_id,))
        stamp = now()
        for tag, (score, terms) in matches.items():
            self.conn.execute(
                "INSERT INTO tags (tweet_id, tag, score, terms, tagged_at) VALUES (?,?,?,?,?)",
                (tweet_id, tag, score, json.dumps(sorted(terms)), stamp),
            )

    def record_run(self, **fields):
        cols = ", ".join(fields)
        marks = ", ".join("?" for _ in fields)
        self.conn.execute(f"INSERT INTO sync_runs ({cols}) VALUES ({marks})", tuple(fields.values()))

    def commit(self):
        self.conn.commit()

    # ---------- reads ----------

    def untagged_or_all(self, retag: bool) -> list[sqlite3.Row]:
        if retag:
            return list(self.conn.execute("SELECT id, text, full_text FROM tweets"))
        return list(
            self.conn.execute(
                """SELECT t.id, t.text, t.full_text FROM tweets t
                   LEFT JOIN tags g ON g.tweet_id = t.id
                   WHERE g.tweet_id IS NULL"""
            )
        )

    def select(self, tag=None, source=None, author=None, since=None, min_score=0,
               limit=50, order="created_at") -> list[sqlite3.Row]:
        sql = [
            """SELECT t.*, a.username, a.name AS author_name,
                      (SELECT group_concat(tag) FROM tags WHERE tweet_id = t.id) AS tag_list,
                      (SELECT max(score) FROM tags WHERE tweet_id = t.id) AS top_score
               FROM tweets t LEFT JOIN authors a ON a.id = t.author_id"""
        ]
        where, args = [], []
        if tag:
            where.append("t.id IN (SELECT tweet_id FROM tags WHERE tag = ? AND score >= ?)")
            args += [tag, min_score]
        if source:
            where.append("t.id IN (SELECT tweet_id FROM sources WHERE source = ?)")
            args.append(source)
        if author:
            where.append("lower(a.username) = lower(?)")
            args.append(author.lstrip("@"))
        if since:
            where.append("t.created_at >= ?")
            args.append(since)
        if where:
            sql.append("WHERE " + " AND ".join(where))
        column = {"created_at": "t.created_at", "likes": "t.like_count", "score": "top_score"}
        sql.append(f"ORDER BY {column.get(order, 't.created_at')} DESC")
        sql.append("LIMIT ?")
        args.append(limit)
        return list(self.conn.execute(" ".join(sql), args))

    def search(self, query: str, limit: int = 50) -> list[sqlite3.Row]:
        if self.has_fts:
            return list(
                self.conn.execute(
                    """SELECT t.*, a.username FROM tweets_fts f
                       JOIN tweets t ON t.id = f.id
                       LEFT JOIN authors a ON a.id = t.author_id
                       WHERE tweets_fts MATCH ? ORDER BY rank LIMIT ?""",
                    (query, limit),
                )
            )
        like = f"%{query}%"
        return list(
            self.conn.execute(
                """SELECT t.*, a.username FROM tweets t LEFT JOIN authors a ON a.id = t.author_id
                   WHERE t.text LIKE ? OR ifnull(t.full_text,'') LIKE ?
                   ORDER BY t.created_at DESC LIMIT ?""",
                (like, like, limit),
            )
        )

    def counts(self) -> dict:
        one = lambda sql, *a: self.conn.execute(sql, a).fetchone()[0]  # noqa: E731
        return {
            "tweets": one("SELECT count(*) FROM tweets"),
            "authors": one("SELECT count(*) FROM authors"),
            "bookmarks": one("SELECT count(*) FROM sources WHERE source='bookmarks'"),
            "likes": one("SELECT count(*) FROM sources WHERE source='likes'"),
            "tagged": one("SELECT count(DISTINCT tweet_id) FROM tags"),
        }

    def tag_breakdown(self) -> list[sqlite3.Row]:
        return list(
            self.conn.execute(
                """SELECT tag, count(*) AS n, round(avg(score),2) AS avg_score
                   FROM tags GROUP BY tag ORDER BY n DESC"""
            )
        )

    def top_authors(self, tag=None, limit=15) -> list[sqlite3.Row]:
        sql = """SELECT a.username, a.name, count(*) AS n FROM tweets t
                 JOIN authors a ON a.id = t.author_id"""
        args = []
        if tag:
            sql += " WHERE t.id IN (SELECT tweet_id FROM tags WHERE tag = ?)"
            args.append(tag)
        sql += " GROUP BY a.id ORDER BY n DESC LIMIT ?"
        args.append(limit)
        return list(self.conn.execute(sql, args))

    def top_domains(self, tag=None, limit=15) -> list[tuple[str, int]]:
        sql = "SELECT domains FROM tweets t"
        args = []
        if tag:
            sql += " WHERE t.id IN (SELECT tweet_id FROM tags WHERE tag = ?)"
            args.append(tag)
        tally: dict[str, int] = {}
        for (blob,) in self.conn.execute(sql, args):
            for domain in json.loads(blob or "[]"):
                tally[domain] = tally.get(domain, 0) + 1
        return sorted(tally.items(), key=lambda kv: -kv[1])[:limit]


def extract_urls(tweet: dict) -> list[dict]:
    out, seen = [], set()
    entities = tweet.get("entities") or {}
    for url in entities.get("urls") or []:
        expanded = url.get("unwound_url") or url.get("expanded_url") or url.get("url")
        if not expanded or expanded in seen:
            continue
        seen.add(expanded)
        host = urllib.parse.urlparse(expanded).netloc.lower()
        if host.startswith("www."):
            host = host[4:]
        # t.co self-links and quote-post permalinks are noise in a link index.
        if host in {"t.co", "twitter.com", "x.com"}:
            host = ""
        out.append({
            "url": expanded,
            "domain": host,
            "title": url.get("title"),
            "description": url.get("description"),
        })
    return out
