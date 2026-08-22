"""Thin urllib wrapper so the whole tool stays dependency-free.

Everything network-facing funnels through `request`, which the tests swap out
for a canned transport.
"""

import urllib.error
import urllib.parse
import urllib.request

USER_AGENT = "xsync/0.1 (+https://github.com/Geomjr/test)"


def request(method: str, url: str, headers: dict | None = None, body: bytes | None = None,
            timeout: int = 30) -> tuple[int, dict, str]:
    """Return (status, headers, text). HTTP errors are returned, not raised."""
    headers = dict(headers or {})
    headers.setdefault("User-Agent", USER_AGENT)
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, dict(resp.headers), resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as exc:
        return exc.code, dict(exc.headers or {}), exc.read().decode("utf-8", "replace")


def form_post(url: str, fields: dict, headers: dict | None = None) -> tuple[int, dict, str]:
    headers = dict(headers or {})
    headers["Content-Type"] = "application/x-www-form-urlencoded"
    return request("POST", url, headers, urllib.parse.urlencode(fields).encode())
