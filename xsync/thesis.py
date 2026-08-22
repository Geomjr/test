"""Thesis layer: organize the corpus into investable themes.

Two inputs, one table:
- seeds.json  - hand-curated keystone posts with a stance (support/counter/
  evidence) and a note saying why the post matters. basis='curated'.
- themes.json - per-theme term lists; posts matching a theme's terms are
  auto-assigned with basis='auto' so future syncs keep sorting themselves.

Conflicting takes are the point: stances let a theme hold its bull case and
its bear case side by side.
"""

import json
from pathlib import Path

from xsync import config
from xsync.tagging import _compile

THEME_SCHEMA = """
CREATE TABLE IF NOT EXISTS theme_posts (
    tweet_id TEXT NOT NULL,
    theme    TEXT NOT NULL,
    stance   TEXT,
    basis    TEXT NOT NULL DEFAULT 'auto',
    note     TEXT,
    score    INTEGER,
    PRIMARY KEY (tweet_id, theme)
);
CREATE INDEX IF NOT EXISTS idx_theme_posts_theme ON theme_posts(theme);
"""


def themes_path() -> Path:
    return Path(__file__).with_name("themes.json")


def seeds_path() -> Path:
    return Path(__file__).with_name("seeds.json")


def load_themes(path: Path | None = None) -> dict:
    data = json.loads((path or themes_path()).read_text())
    return {k: v for k, v in data.items() if not k.startswith("_")}


def load_seeds(path: Path | None = None) -> dict:
    data = json.loads((path or seeds_path()).read_text())
    return {k: v for k, v in data.items() if not k.startswith("_")}


class ThemeIndex:
    def __init__(self, themes: dict | None = None, seeds: dict | None = None):
        self.themes = themes if themes is not None else load_themes()
        self.seeds = seeds if seeds is not None else load_seeds()
        self.rules = {
            name: [_compile(t) for t in spec.get("terms", [])]
            for name, spec in self.themes.items()
        }

    def match(self, text: str) -> dict[str, int]:
        out = {}
        for theme, patterns in self.rules.items():
            hits = sum(1 for _, pattern in patterns if pattern.search(text))
            if hits:
                out[theme] = hits
        return out

    def apply(self, store, min_score: int = 2) -> dict:
        """Rebuild theme_posts: curated seeds first, then term matches.

        min_score=2 for auto rows keeps single-word coincidences out; curated
        rows are exempt - a human already judged them.
        """
        conn = store.conn
        conn.executescript(THEME_SCHEMA)
        conn.execute("DELETE FROM theme_posts")

        curated = missing = 0
        for tweet_id, spec in self.seeds.items():
            row = conn.execute("SELECT 1 FROM tweets WHERE id = ?", (tweet_id,)).fetchone()
            if not row:
                missing += 1
                continue
            conn.execute(
                """INSERT INTO theme_posts (tweet_id, theme, stance, basis, note, score)
                   VALUES (?,?,?,?,?,NULL)""",
                (tweet_id, spec["theme"], spec.get("stance"), "curated", spec.get("note")),
            )
            curated += 1

        auto = 0
        rows = conn.execute(
            """SELECT t.id, coalesce(t.full_text, t.text) AS body FROM tweets t
               JOIN tags g ON g.tweet_id = t.id GROUP BY t.id"""
        ).fetchall()
        for row in rows:
            for theme, score in self.match(row["body"] or "").items():
                if score < min_score:
                    continue
                cur = conn.execute(
                    """INSERT INTO theme_posts (tweet_id, theme, stance, basis, note, score)
                       VALUES (?,?,NULL,'auto',NULL,?)
                       ON CONFLICT(tweet_id, theme) DO NOTHING""",
                    (row["id"], theme, score),
                )
                auto += cur.rowcount if cur.rowcount > 0 else 0
        conn.commit()
        return {"curated": curated, "auto": auto, "missing_seeds": missing,
                "scanned": len(rows)}

    def report(self, store) -> list[dict]:
        """Per-theme digest: thesis, drivers, keystones by stance, auto posts."""
        conn = store.conn
        out = []
        for name, spec in self.themes.items():
            rows = conn.execute(
                """SELECT tp.*, coalesce(t.full_text, t.text) AS body, t.created_at,
                          t.like_count, a.username
                   FROM theme_posts tp
                   JOIN tweets t ON t.id = tp.tweet_id
                   LEFT JOIN authors a ON a.id = t.author_id
                   WHERE tp.theme = ?
                   ORDER BY tp.basis, t.created_at DESC""",
                (name,),
            ).fetchall()
            out.append({
                "theme": name,
                "title": spec.get("title", name),
                "thesis": spec.get("thesis", ""),
                "drivers": spec.get("drivers", []),
                "curated": [r for r in rows if r["basis"] == "curated"],
                "auto": [r for r in rows if r["basis"] == "auto"],
            })
        return out
