"""Client for twitterapi.io, the third-party X data API."""

import re
from datetime import datetime, timezone

import requests

BASE_URL = "https://api.twitterapi.io"
HANDLE_RE = re.compile(r"(?<![\w@])@([A-Za-z0-9_]{1,15})\b")


class XClient:
    def __init__(self, api_key, session=None):
        self.session = session or requests.Session()
        self.session.headers["X-API-Key"] = api_key

    def _get(self, path, params):
        resp = self.session.get(BASE_URL + path, params=params, timeout=30)
        resp.raise_for_status()
        return resp.json()

    def user_info(self, handle):
        """Return the profile dict, or None if the account doesn't exist or is unavailable."""
        body = self._get("/twitter/user/info", {"userName": handle})
        data = body.get("data") or {}
        if body.get("status") != "success" or data.get("unavailable") or not data.get("userName"):
            return None
        return data

    def tweets_since(self, handle, since, max_pages):
        """Yield the account's posts newer than `since`, newest first."""
        cursor = ""
        for _ in range(max_pages):
            body = self._get(
                "/twitter/user/last_tweets",
                {"userName": handle, "cursor": cursor, "includeReplies": "false"},
            )
            if body.get("status") != "success":
                raise RuntimeError(f"twitterapi.io error for @{handle}: {body.get('msg')}")
            tweets = (body.get("data") or {}).get("tweets") or []
            for tweet in tweets:
                created = parse_x_date(tweet.get("createdAt"))
                if created and created <= since:
                    return
                yield tweet
            if not body.get("has_next_page") or not body.get("next_cursor"):
                return
            cursor = body["next_cursor"]


def parse_x_date(value):
    """X dates look like 'Tue Dec 10 07:00:30 +0000 2024'; accept ISO as well."""
    if not value:
        return None
    try:
        return datetime.strptime(value, "%a %b %d %H:%M:%S %z %Y")
    except ValueError:
        pass
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def mentioned_handles(tweet):
    """Handles tagged in a post, from the structured entities plus the text as a fallback."""
    handles = []
    for mention in (tweet.get("entities") or {}).get("user_mentions") or []:
        if mention.get("screen_name"):
            handles.append(mention["screen_name"])
    handles.extend(HANDLE_RE.findall(tweet.get("text") or ""))
    seen, unique = set(), []
    for handle in handles:
        if handle.lower() not in seen:
            seen.add(handle.lower())
            unique.append(handle)
    return unique


def image_urls(tweet):
    """Photo URLs attached to a post. The response format isn't documented, so check the usual keys."""
    urls = []
    for key in ("extendedEntities", "extended_entities", "entities"):
        for media in (tweet.get(key) or {}).get("media") or []:
            if media.get("type", "photo") == "photo":
                url = media.get("media_url_https") or media.get("media_url")
                if url and url not in urls:
                    urls.append(url)
    return urls


def profile_website(profile):
    """The website linked on a profile, expanded from X's t.co short link."""
    entities = (profile.get("profile_bio") or {}).get("entities") or {}
    for url in (entities.get("url") or {}).get("urls") or []:
        if url.get("expanded_url"):
            return url["expanded_url"]
    return ""
