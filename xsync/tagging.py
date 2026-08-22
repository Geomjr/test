"""Keyword tagging over the stored posts.

Deliberately transparent rather than clever: every hit records which terms
fired, so you can see why a post landed in a bucket and tune lexicon.json.
"""

import json
import re
from pathlib import Path

from xsync import config


def _compile(term: str) -> tuple[str, re.Pattern]:
    if term.startswith("re:"):
        return term, re.compile(term[3:])
    escaped = re.escape(term).replace(r"\ ", r"\s+")
    # \b fails on terms ending in a symbol (m&a, 2 and 20), so guard on
    # non-word neighbours instead of asserting a word boundary.
    left = r"(?<![\w-])" if term[0].isalnum() else r"(?<!\S)"
    right = r"(?![\w-])" if term[-1].isalnum() else r"(?!\S)"
    return term, re.compile(left + escaped + right, re.IGNORECASE)


class Tagger:
    def __init__(self, lexicon: dict[str, list[str]]):
        self.rules = {
            tag: [_compile(t) for t in terms]
            for tag, terms in lexicon.items()
            if not tag.startswith("_")
        }

    @classmethod
    def load(cls, path: Path | str | None = None) -> "Tagger":
        path = Path(path) if path else config.default_lexicon_path()
        return cls(json.loads(path.read_text()))

    def match(self, text: str) -> dict[str, tuple[int, set[str]]]:
        """Return {tag: (score, matched_terms)}. Score is distinct terms hit."""
        out = {}
        for tag, patterns in self.rules.items():
            hits = {term for term, pattern in patterns if pattern.search(text)}
            if hits:
                out[tag] = (len(hits), hits)
        return out

    def tag_store(self, store, retag: bool = False, min_score: int = 1) -> dict:
        rows = store.untagged_or_all(retag)
        tagged = 0
        totals: dict[str, int] = {}
        for row in rows:
            body = row["full_text"] or row["text"] or ""
            matches = {t: v for t, v in self.match(body).items() if v[0] >= min_score}
            store.set_tags(row["id"], matches)
            if matches:
                tagged += 1
                for tag in matches:
                    totals[tag] = totals.get(tag, 0) + 1
        store.commit()
        return {"scanned": len(rows), "tagged": tagged, "by_tag": totals}
