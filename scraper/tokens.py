"""Token lookup against DefiLlama's protocol list, matched by X handle."""

import requests

PROTOCOLS_URL = "https://api.llama.fi/protocols"


def load_defillama_index():
    """Map lowercase X handle -> {'name', 'symbol', 'has_token'}. Empty if DefiLlama is unreachable."""
    try:
        resp = requests.get(PROTOCOLS_URL, timeout=60)
        resp.raise_for_status()
        protocols = resp.json()
    except (requests.RequestException, ValueError):
        return {}
    return build_index(protocols)


def build_index(protocols):
    index = {}
    for protocol in protocols:
        handle = (protocol.get("twitter") or "").strip().lstrip("@").lower()
        if not handle:
            continue
        symbol = (protocol.get("symbol") or "").strip()
        has_token = bool(protocol.get("gecko_id")) or (symbol not in ("", "-"))
        index[handle] = {"name": protocol.get("name", ""), "symbol": symbol, "has_token": has_token}
    return index
