"""OAuth 2.0 Authorization Code + PKCE flow against X, plus token storage.

The bookmarks and liked_tweets endpoints only accept user-context tokens, so
app-only bearer auth is not an option - you have to authorise your own app once
and then ride the refresh token.
"""

import base64
import hashlib
import json
import os
import secrets
import threading
import time
import urllib.parse
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

from xsync import config
from xsync.http import form_post


class AuthError(Exception):
    pass


def _b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def make_pkce_pair() -> tuple[str, str]:
    verifier = _b64url(secrets.token_bytes(64))
    challenge = _b64url(hashlib.sha256(verifier.encode()).digest())
    return verifier, challenge


def load_tokens(path: Path | str | None = None) -> dict:
    path = Path(path) if path else config.token_path()
    if not path.exists():
        raise AuthError(f"No credentials at {path}. Run: python -m xsync login")
    return json.loads(path.read_text())


def save_tokens(tokens: dict, path: Path | str | None = None) -> Path:
    path = Path(path) if path else config.token_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    # Written before the chmod, so create it closed rather than world-readable.
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as fh:
        json.dump(tokens, fh, indent=2)
    os.chmod(path, 0o600)
    return path


class _CallbackHandler(BaseHTTPRequestHandler):
    result: dict = {}

    def do_GET(self):  # noqa: N802 - stdlib naming
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        if "code" not in params and "error" not in params:
            self.send_response(404)
            self.end_headers()
            return
        type(self).result = {k: v[0] for k, v in params.items()}
        ok = "code" in params
        body = (
            b"<h2>Authorised.</h2><p>You can close this tab and return to the terminal.</p>"
            if ok
            else b"<h2>Authorisation failed.</h2><p>Check the terminal for details.</p>"
        )
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):  # silence the default stderr access log
        pass


def _await_callback(redirect_uri: str, timeout: int) -> dict:
    parsed = urllib.parse.urlparse(redirect_uri)
    server = HTTPServer((parsed.hostname or "127.0.0.1", parsed.port or 80), _CallbackHandler)
    server.timeout = 1
    _CallbackHandler.result = {}
    thread = threading.Thread(target=server.serve_forever, kwargs={"poll_interval": 0.2}, daemon=True)
    thread.start()
    deadline = time.time() + timeout
    try:
        while time.time() < deadline:
            if _CallbackHandler.result:
                return _CallbackHandler.result
            time.sleep(0.2)
    finally:
        server.shutdown()
        server.server_close()
    raise AuthError(f"Timed out after {timeout}s waiting for the OAuth redirect.")


def _basic_header(client_id: str, client_secret: str) -> dict:
    raw = f"{client_id}:{client_secret}".encode()
    return {"Authorization": "Basic " + base64.b64encode(raw).decode()}


def _exchange(payload: dict, client_id: str, client_secret: str | None) -> dict:
    headers = {}
    if client_secret:
        # Confidential clients authenticate the token call with HTTP Basic.
        headers.update(_basic_header(client_id, client_secret))
    status, _, body = form_post(config.TOKEN_URL, payload, headers)
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        raise AuthError(f"Token endpoint returned HTTP {status}: {body[:400]!r}") from None
    if status != 200 or "access_token" not in data:
        raise AuthError(f"Token endpoint returned HTTP {status}: {data}")
    data["obtained_at"] = int(time.time())
    data["client_id"] = client_id
    if client_secret:
        data["confidential"] = True
    return data


def build_authorize_url(client_id: str, redirect_uri: str, challenge: str, state: str) -> str:
    query = urllib.parse.urlencode(
        {
            "response_type": "code",
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "scope": " ".join(config.SCOPES),
            "state": state,
            "code_challenge": challenge,
            "code_challenge_method": "S256",
        }
    )
    return f"{config.AUTHORIZE_URL}?{query}"


def login(
    client_id: str,
    client_secret: str | None = None,
    redirect_uri: str = config.DEFAULT_REDIRECT_URI,
    open_browser: bool = True,
    timeout: int = 300,
) -> dict:
    verifier, challenge = make_pkce_pair()
    state = secrets.token_urlsafe(24)
    url = build_authorize_url(client_id, redirect_uri, challenge, state)

    print("Open this URL to authorise the app:\n")
    print(f"  {url}\n")
    if open_browser:
        try:
            webbrowser.open(url)
        except Exception:
            pass
    print(f"Waiting for the redirect to {redirect_uri} ...")

    params = _await_callback(redirect_uri, timeout)
    if "error" in params:
        raise AuthError(f"Authorisation denied: {params.get('error_description', params['error'])}")
    if params.get("state") != state:
        raise AuthError("State mismatch on the OAuth callback - aborting.")

    tokens = _exchange(
        {
            "grant_type": "authorization_code",
            "code": params["code"],
            "redirect_uri": redirect_uri,
            "code_verifier": verifier,
            "client_id": client_id,
        },
        client_id,
        client_secret,
    )
    tokens["redirect_uri"] = redirect_uri
    return tokens


def refresh(tokens: dict, client_secret: str | None = None) -> dict:
    if not tokens.get("refresh_token"):
        raise AuthError("No refresh token stored - run: python -m xsync login")
    client_id = tokens["client_id"]
    secret = client_secret or os.environ.get("X_CLIENT_SECRET")
    if tokens.get("confidential") and not secret:
        raise AuthError("This app is a confidential client; set X_CLIENT_SECRET to refresh.")
    fresh = _exchange(
        {
            "grant_type": "refresh_token",
            "refresh_token": tokens["refresh_token"],
            "client_id": client_id,
        },
        client_id,
        secret,
    )
    # X does not always return a new refresh token; keep the old one if so.
    fresh.setdefault("refresh_token", tokens["refresh_token"])
    fresh.setdefault("redirect_uri", tokens.get("redirect_uri"))
    return fresh


def start_manual_login(client_id: str, redirect_uri: str = config.DEFAULT_REDIRECT_URI) -> str:
    """Headless step 1: stash the PKCE verifier and return the authorize URL."""
    verifier, challenge = make_pkce_pair()
    state = secrets.token_urlsafe(24)
    pending = config.config_dir() / "pending_login.json"
    save_tokens(  # reuse the 0600 writer; these are secrets too
        {"verifier": verifier, "state": state, "client_id": client_id,
         "redirect_uri": redirect_uri},
        pending,
    )
    return build_authorize_url(client_id, redirect_uri, challenge, state)


def finish_manual_login(redirect_url: str, client_secret: str | None = None) -> dict:
    """Headless step 2: exchange the code from the pasted redirect URL."""
    pending_path = config.config_dir() / "pending_login.json"
    if not pending_path.exists():
        raise AuthError("No pending login. Run: python -m xsync login --manual first.")
    pending = json.loads(pending_path.read_text())
    params = urllib.parse.parse_qs(urllib.parse.urlparse(redirect_url.strip()).query)
    flat = {k: v[0] for k, v in params.items()}
    if "error" in flat:
        raise AuthError(f"Authorisation denied: {flat.get('error_description', flat['error'])}")
    if flat.get("state") != pending["state"]:
        raise AuthError("State mismatch - paste the full URL from THIS login attempt.")
    if "code" not in flat:
        raise AuthError("No ?code= in that URL - paste the full redirect URL from the address bar.")
    tokens = _exchange(
        {
            "grant_type": "authorization_code",
            "code": flat["code"],
            "redirect_uri": pending["redirect_uri"],
            "code_verifier": pending["verifier"],
            "client_id": pending["client_id"],
        },
        pending["client_id"],
        client_secret,
    )
    tokens["redirect_uri"] = pending["redirect_uri"]
    pending_path.unlink(missing_ok=True)
    return tokens


class TokenProvider:
    """Hands out a valid access token, refreshing and re-persisting as needed."""

    def __init__(self, path: Path | str | None = None, tokens: dict | None = None, skew: int = 120):
        self.path = Path(path) if path else config.token_path()
        self.skew = skew
        self._tokens = tokens

    @property
    def tokens(self) -> dict:
        if self._tokens is None:
            self._tokens = load_tokens(self.path)
        return self._tokens

    def _expired(self) -> bool:
        expires_in = self.tokens.get("expires_in")
        obtained = self.tokens.get("obtained_at")
        if not expires_in or not obtained:
            return False
        return time.time() >= obtained + expires_in - self.skew

    def access_token(self, force_refresh: bool = False) -> str:
        if force_refresh or self._expired():
            self._tokens = refresh(self.tokens)
            save_tokens(self._tokens, self.path)
        return self.tokens["access_token"]
