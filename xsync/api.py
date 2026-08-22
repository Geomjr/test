"""X API v2 client: auth header, retries, rate-limit handling, pagination."""

import json
import time
import urllib.parse

from xsync import config, http


class XApiError(Exception):
    def __init__(self, status: int, payload):
        self.status = status
        self.payload = payload
        super().__init__(f"HTTP {status}: {payload}")


class XClient:
    def __init__(self, token_provider, base: str | None = None, transport=None,
                 sleeper=time.sleep, max_retries: int = 4):
        self.tokens = token_provider
        # Resolved lazily so tests and XSYNC_API_BASE can repoint it.
        self.base = (base or config.API_BASE).rstrip("/")
        self.transport = transport or http.request
        self.sleeper = sleeper
        self.max_retries = max_retries
        self.resources_used = 0

    def _url(self, path: str, params: dict | None) -> str:
        url = f"{self.base}{path}"
        if params:
            url += "?" + urllib.parse.urlencode(params)
        return url

    def get(self, path: str, params: dict | None = None) -> dict:
        url = self._url(path, params)
        refreshed = False
        for attempt in range(self.max_retries + 1):
            token = self.tokens.access_token()
            status, headers, body = self.transport(
                "GET", url, {"Authorization": f"Bearer {token}", "Accept": "application/json"}, None
            )
            if status == 200:
                return json.loads(body)

            if status == 401 and not refreshed:
                # Access token died early; force one refresh before giving up.
                self.tokens.access_token(force_refresh=True)
                refreshed = True
                continue

            if status == 429:
                self.sleeper(self._rate_limit_wait(headers, attempt))
                continue

            if status >= 500 and attempt < self.max_retries:
                self.sleeper(min(2 ** attempt, 16))
                continue

            try:
                payload = json.loads(body)
            except json.JSONDecodeError:
                payload = body[:500]
            raise XApiError(status, payload)
        raise XApiError(429, "Rate limit did not clear within the retry budget.")

    @staticmethod
    def _rate_limit_wait(headers: dict, attempt: int) -> float:
        lowered = {k.lower(): v for k, v in headers.items()}
        reset = lowered.get("x-rate-limit-reset")
        if reset:
            try:
                # Header is an absolute epoch second, not a delta.
                return max(1.0, min(float(reset) - time.time() + 1, 900.0))
            except ValueError:
                pass
        return min(2 ** attempt * 5, 120)

    def verify_credentials(self) -> dict:
        return self.get("/2/users/me", {"user.fields": "username,name"})["data"]

    def pages(self, path: str, page_size: int = 100, max_pages: int | None = None,
              expansions: bool = True):
        """Yield raw response pages, newest first, following pagination_token."""
        params = {
            "max_results": page_size,
            "tweet.fields": ",".join(config.TWEET_FIELDS),
        }
        if expansions:
            params["expansions"] = ",".join(config.EXPANSIONS)
            params["user.fields"] = ",".join(config.USER_FIELDS)

        token = None
        page_no = 0
        while max_pages is None or page_no < max_pages:
            if token:
                params["pagination_token"] = token
            payload = self.get(path, params)
            page_no += 1
            self.resources_used += count_resources(payload)
            yield payload
            token = (payload.get("meta") or {}).get("next_token")
            if not token:
                return


def count_resources(payload: dict) -> int:
    """Billable resources in a page: each post plus each expanded object."""
    includes = payload.get("includes") or {}
    return (
        len(payload.get("data") or [])
        + len(includes.get("users") or [])
        + len(includes.get("tweets") or [])
    )


def estimate_cost(resources: int, rate: str = "owned") -> float:
    return resources * config.PRICE_PER_RESOURCE[rate]
