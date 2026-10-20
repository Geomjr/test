"""Luma (luma.com) events: the hosts and organising calendars of each event are candidate companies.

A Conferences row's Luma column can hold a calendar (luma.com/devcon), a category
(luma.com/crypto, every upcoming crypto event on Luma) or a single event URL.
"""

from urllib.parse import urlparse

import requests

BASE_URL = "https://api.lu.ma"
PAGE_SIZE = 50


class LumaClient:
    def __init__(self, session=None):
        self.session = session or requests.Session()

    def _get(self, path, params):
        resp = self.session.get(BASE_URL + path, params=params, timeout=30)
        resp.raise_for_status()
        return resp.json()

    def _paginate(self, path, params, max_pages):
        cursor = None
        for _ in range(max_pages):
            page = self._get(path, {**params, "pagination_limit": PAGE_SIZE, **({"pagination_cursor": cursor} if cursor else {})})
            yield from page.get("entries") or []
            cursor = page.get("next_cursor")
            if not page.get("has_more") or not cursor:
                return

    def entries(self, ref, max_pages=20):
        """Upcoming event entries (each with 'event', 'hosts' and 'calendar') for a Luma URL or slug."""
        key = slug(ref)
        if key.startswith("cal-"):  # luma.com/calendar/cal-... links name the calendar directly
            return list(self._paginate("/calendar/get-items", {"calendar_api_id": key, "period": "future"}, max_pages))
        resolved = self._get("/url", {"url": key})
        kind, data = resolved.get("kind"), resolved.get("data") or {}
        if kind == "calendar":
            cal_id = data["calendar"]["api_id"]
            return list(self._paginate("/calendar/get-items", {"calendar_api_id": cal_id, "period": "future"}, max_pages))
        if kind == "category":
            cat_id = data["category"]["api_id"]
            return list(self._paginate("/discover/get-paginated-events", {"category_api_id": cat_id}, max_pages))
        if kind == "event":
            return [data]
        raise ValueError(f"Unsupported Luma page {ref!r} (kind {kind!r})")


def slug(ref):
    """'https://luma.com/devcon?k=c' -> 'devcon', 'luma.com/calendar/cal-abc' -> 'cal-abc'; a bare slug is unchanged."""
    ref = ref.strip()
    if "://" in ref:
        ref = urlparse(ref).path
    parts = [p for p in ref.strip("/").split("/") if p]
    if len(parts) >= 2 and parts[0] == "calendar":
        return parts[1]
    return parts[0] if parts else ""


def accounts(entry):
    """People and organisations behind one event: its hosts and, unless personal, its calendar."""
    found = []
    for host in entry.get("hosts") or []:
        found.append({
            "handle": (host.get("twitter_handle") or "").lstrip("@"),
            "name": host.get("name") or "",
            "website": host.get("website") or "",
        })
    calendar = entry.get("calendar") or {}
    if calendar and not calendar.get("is_personal"):
        found.append({
            "handle": (calendar.get("twitter_handle") or "").lstrip("@"),
            "name": calendar.get("name") or "",
            "website": calendar.get("website") or "",
        })
    return [a for a in found if a["handle"] or a["website"]]
