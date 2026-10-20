"""Luma (luma.com) events: the hosts and organising calendars of each event are candidate companies.

A Conferences row's Luma column can hold a calendar (luma.com/devcon), a category
(luma.com/crypto, every upcoming crypto event on Luma) or a single event URL.
"""

from urllib.parse import urlparse

import requests

BASE_URL = "https://api.luma.com"
PAGE_SIZE = 50

# Category pages (luma.com/crypto) are searched near each of these cities.
HUBS = {
    "New York": (40.7128, -74.0060), "San Francisco": (37.7749, -122.4194), "Los Angeles": (34.0522, -118.2437),
    "Miami": (25.7617, -80.1918), "Austin": (30.2672, -97.7431), "Denver": (39.7392, -104.9903),
    "Chicago": (41.8781, -87.6298), "Boston": (42.3601, -71.0589), "Toronto": (43.6532, -79.3832),
    "Mexico City": (19.4326, -99.1332), "São Paulo": (-23.5505, -46.6333), "Buenos Aires": (-34.6037, -58.3816),
    "London": (51.5074, -0.1278), "Paris": (48.8566, 2.3522), "Berlin": (52.52, 13.405),
    "Amsterdam": (52.3676, 4.9041), "Lisbon": (38.7223, -9.1393), "Zug": (47.1662, 8.5155),
    "Barcelona": (41.3874, 2.1686), "Istanbul": (41.0082, 28.9784), "Dubai": (25.2048, 55.2708),
    "Abu Dhabi": (24.4539, 54.3773), "Lagos": (6.5244, 3.3792), "Nairobi": (-1.2921, 36.8219),
    "Bangalore": (12.9716, 77.5946), "Mumbai": (19.076, 72.8777), "Singapore": (1.3521, 103.8198),
    "Hong Kong": (22.3193, 114.1694), "Seoul": (37.5665, 126.978), "Tokyo": (35.6762, 139.6503),
    "Taipei": (25.033, 121.5654), "Bangkok": (13.7563, 100.5018), "Ho Chi Minh City": (10.8231, 106.6297),
    "Jakarta": (-6.2088, 106.8456), "Manila": (14.5995, 120.9842), "Sydney": (-33.8688, 151.2093),
}


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
            # Luma only filters a category by location, so search each hub and merge.
            seen, out = set(), []
            for lat, lon in HUBS.values():
                params = {"slug": key, "latitude": lat, "longitude": lon}
                for entry in self._paginate("/discover/get-paginated-events", params, max_pages):
                    event_id = (entry.get("event") or {}).get("api_id")
                    if event_id not in seen:
                        seen.add(event_id)
                        out.append(entry)
            return out
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


def accounts(entry, include_guests=False):
    """People and organisations behind one event: its hosts, unless personal its calendar, and
    optionally the featured guests Luma shows publicly (people are later resolved to their company)."""
    people = list(entry.get("hosts") or [])
    if include_guests:
        people += entry.get("featured_guests") or []
    found = []
    for person in people:
        found.append({
            "handle": (person.get("twitter_handle") or "").lstrip("@"),
            "name": person.get("name") or "",
            "website": person.get("website") or "",
        })
    calendar = entry.get("calendar") or {}
    if calendar and not calendar.get("is_personal"):
        found.append({
            "handle": (calendar.get("twitter_handle") or "").lstrip("@"),
            "name": calendar.get("name") or "",
            "website": calendar.get("website") or "",
        })
    return [a for a in found if a["handle"] or a["website"]]
