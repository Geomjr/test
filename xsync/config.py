"""Paths, endpoints and field selection for the X API v2."""

import os
from pathlib import Path

API_BASE = os.environ.get("XSYNC_API_BASE", "https://api.x.com")
AUTHORIZE_URL = "https://x.com/i/oauth2/authorize"
TOKEN_URL = f"{API_BASE}/2/oauth2/token"

# bookmark.read / like.read are what actually gate the two endpoints we use.
# offline.access is what gets us a refresh token so login is a one-time thing.
SCOPES = ["tweet.read", "users.read", "bookmark.read", "like.read", "offline.access"]

DEFAULT_REDIRECT_URI = "http://127.0.0.1:8723/callback"

SOURCES = {
    "bookmarks": "/2/users/{user_id}/bookmarks",
    "likes": "/2/users/{user_id}/liked_tweets",
}

# note_tweet carries the full body of long posts, which is where most of the
# actual thesis content lives - without it long posts arrive truncated.
TWEET_FIELDS = [
    "created_at",
    "author_id",
    "conversation_id",
    "lang",
    "public_metrics",
    "entities",
    "referenced_tweets",
    "note_tweet",
    "possibly_sensitive",
]
USER_FIELDS = ["username", "name", "description", "verified", "public_metrics"]
EXPANSIONS = ["author_id"]

# Pay-per-usage rates, effective 2026-04-20. "Owned reads" is the discounted
# rate for reading your own data through your own app.
PRICE_PER_RESOURCE = {"owned": 0.001, "standard": 0.005}


def config_dir() -> Path:
    override = os.environ.get("XSYNC_HOME")
    if override:
        return Path(override).expanduser()
    base = os.environ.get("XDG_CONFIG_HOME", "~/.config")
    return Path(base).expanduser() / "xsync"


def token_path() -> Path:
    return config_dir() / "tokens.json"


def default_db_path() -> Path:
    return config_dir() / "xsync.db"


def default_lexicon_path() -> Path:
    return Path(__file__).with_name("lexicon.json")
