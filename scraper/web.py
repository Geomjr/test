"""Fetching websites: company sites as plain HTTP, conference pages through a headless browser."""

from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

USER_AGENT = "Mozilla/5.0 (compatible; startup-scraper/1.0)"
SKIP_HOSTS = ("x.com", "twitter.com", "t.co", "linktr.ee", "t.me", "discord.gg", "discord.com", "youtube.com")


def domain(url):
    """'https://www.SohoPay.ai/about' -> 'sohopay.ai'."""
    if not url:
        return ""
    if "://" not in url:
        url = "https://" + url
    host = (urlparse(url).hostname or "").lower()
    return host[4:] if host.startswith("www.") else host


def site_text(url, limit=6000):
    """Visible text of a company website, or '' if it can't be fetched."""
    host = domain(url)
    if not host or any(host == h or host.endswith("." + h) for h in SKIP_HOSTS):
        return ""
    if "://" not in url:
        url = "https://" + url
    try:
        resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=15)
        resp.raise_for_status()
    except requests.RequestException:
        return ""
    soup = BeautifulSoup(resp.text, "html.parser")
    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()
    return " ".join(soup.get_text(" ").split())[:limit]


def rendered_page_text(url, limit=60000):
    """Text of a page after its JavaScript has run. Speaker lists are often loaded this way."""
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            page = browser.new_page(user_agent=USER_AGENT)
            page.goto(url, wait_until="networkidle", timeout=60000)
            page.wait_for_timeout(3000)
            text = page.inner_text("body")
        finally:
            browser.close()
    return " ".join(text.split())[:limit]
