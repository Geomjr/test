"""Calls to Claude: classify an account, read handles off speaker cards, pull companies from a web page."""

import json

import anthropic

from . import config

FALLBACK_BETA = "server-side-fallback-2026-07-01"

CLASSIFY_SYSTEM = """You screen accounts for a venture scout who sources pre-seed and seed startups in crypto and web3 for VC funds.

The scout wants early-stage startups that build on crypto rails (blockchains, stablecoins, onchain payments, wallets, DeFi, crypto infrastructure, AI agents that transact onchain) and that have not launched a token. They do not want large established companies, conferences, media, funds, or individual people.

You are given an X profile and, when available, text from the website it links to and a token-database lookup. Judge from that evidence only.

Field guidance:
- account_type: "company" for a company or project account, "person" for an individual, "event_or_media" for conferences, podcasts, newsletters and news outlets, "other" for funds, DAOs without a product, communities and anything else.
- is_early_stage_startup: true only for a young company plausibly at pre-seed, seed or Series A. False for well-known or large companies, public companies, big protocols, and anything with clear signs of later-stage scale.
- crypto_related: true if the product uses blockchains, stablecoins or other crypto rails.
- sector: a few words, such as "Agent payments", "Stablecoin infrastructure", "Wallet infrastructure".
- token_status: "has_token" if a token is live (ticker or cashtag in the profile, token listed, trading links); "planned" if there are points programs, airdrops, a TGE or tokenomics announced; "none" if the evidence suggests no token; "unknown" if there is no evidence either way.
- employer_handle: for a person, the X handle (without @) of the company they currently work at or founded, taken from their bio; otherwise an empty string."""

CLASSIFY_SCHEMA = {
    "type": "object",
    "properties": {
        "account_type": {"type": "string", "enum": ["company", "person", "event_or_media", "other"]},
        "company_name": {"type": "string"},
        "is_early_stage_startup": {"type": "boolean"},
        "crypto_related": {"type": "boolean"},
        "sector": {"type": "string"},
        "token_status": {"type": "string", "enum": ["none", "planned", "has_token", "unknown"]},
        "employer_handle": {"type": "string"},
    },
    "required": [
        "account_type",
        "company_name",
        "is_early_stage_startup",
        "crypto_related",
        "sector",
        "token_status",
        "employer_handle",
    ],
    "additionalProperties": False,
}

HANDLES_SCHEMA = {
    "type": "object",
    "properties": {"handles": {"type": "array", "items": {"type": "string"}}},
    "required": ["handles"],
    "additionalProperties": False,
}

PAGE_SCHEMA = {
    "type": "object",
    "properties": {
        "companies": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "x_handle": {"type": "string"},
                    "website": {"type": "string"},
                },
                "required": ["name", "x_handle", "website"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["companies"],
    "additionalProperties": False,
}


class Classifier:
    def __init__(self, client=None):
        self.client = client or anthropic.Anthropic()

    def _ask(self, system, content, schema, max_tokens=4000):
        """Send one request and return the parsed JSON, or None if Claude declined."""
        response = self.client.beta.messages.create(
            model=config.CLAUDE_MODEL,
            max_tokens=max_tokens,
            betas=[FALLBACK_BETA],
            fallbacks="default",
            system=system,
            messages=[{"role": "user", "content": content}],
            output_config={"effort": "low", "format": {"type": "json_schema", "schema": schema}},
        )
        if response.stop_reason in ("refusal", "max_tokens"):
            return None
        text = next((b.text for b in response.content if b.type == "text"), None)
        return json.loads(text) if text else None

    def classify(self, handle, profile, website, site_text, defillama):
        evidence = {
            "handle": handle,
            "name": (profile or {}).get("name", ""),
            "bio": (profile or {}).get("description", ""),
            "followers": (profile or {}).get("followers"),
            "account_created": (profile or {}).get("createdAt", ""),
            "location": (profile or {}).get("location", ""),
            "website": website,
            "defillama_listing": defillama or "not listed",
        }
        content = "X profile:\n" + json.dumps(evidence, indent=2)
        if site_text:
            content += "\n\nWebsite text (truncated):\n" + site_text
        return self._ask(CLASSIFY_SYSTEM, content, CLASSIFY_SCHEMA)

    def handles_in_image(self, image_url):
        content = [
            {"type": "image", "source": {"type": "url", "url": image_url}},
            {
                "type": "text",
                "text": "This image was posted by a conference account, often a speaker or sponsor card. "
                "List every X handle shown in it (text starting with @), without the @. "
                "Return an empty list if there are none.",
            },
        ]
        result = self._ask("You read text from images accurately.", content, HANDLES_SCHEMA, max_tokens=2000)
        return [h.lstrip("@") for h in (result or {}).get("handles", []) if h.strip("@ ")]

    def companies_on_page(self, conference, page_text):
        content = (
            f"Below is the text of a web page for the conference '{conference}', such as its speakers, "
            "sponsors or agenda page. List every company or project named on it: the company a speaker "
            "works for, sponsors, partners, exhibitors. For each, give its X handle and website only if "
            "they appear on the page; otherwise use an empty string. Do not list the conference itself.\n\n"
            + page_text
        )
        result = self._ask("You extract structured data from web pages accurately.", content, PAGE_SCHEMA, 16000)
        return (result or {}).get("companies", [])
