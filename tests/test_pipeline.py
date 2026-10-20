from datetime import datetime, timedelta, timezone

import pytest

from scraper import config, web
from scraper.pipeline import Run, merge_sources
from scraper.sheets import (
    CONFERENCES_HEADERS,
    LEADS_HEADERS,
    RUN_LOG_HEADERS,
    SKIPPED_HEADERS,
    Sheet,
)
from scraper.tokens import build_index
from scraper.xapi import image_urls, mentioned_handles, parse_x_date, profile_website

NOW = datetime(2026, 10, 19, 11, 0, tzinfo=timezone.utc)


class FakeWorksheet:
    def __init__(self, rows):
        self.values = [list(r) for r in rows]

    def get_all_values(self):
        return [list(r) for r in self.values]

    def append_rows(self, rows, value_input_option=None, table_range=None):
        self.values.extend(list(r) for r in rows)

    def batch_update(self, data, value_input_option=None):
        from gspread.utils import a1_to_rowcol

        for item in data:
            r, c = a1_to_rowcol(item["range"])
            while len(self.values) < r:
                self.values.append([])
            row = self.values[r - 1]
            row.extend([""] * (c - len(row)))
            row[c - 1] = item["values"][0][0]


class FakeSpreadsheet:
    def __init__(self, tabs):
        self.tabs = {name: FakeWorksheet(rows) for name, rows in tabs.items()}

    def worksheet(self, name):
        return self.tabs[name]


def make_sheet(conferences, leads=(), skipped=()):
    book = FakeSpreadsheet(
        {
            "Leads": [LEADS_HEADERS, *leads],
            "Conferences": [CONFERENCES_HEADERS, *conferences],
            "Skipped": [SKIPPED_HEADERS, *skipped],
            "Run log": [RUN_LOG_HEADERS],
        }
    )
    return Sheet(book), book


def tweet(text, mentions=(), days_ago=1, media=()):
    created = (NOW - timedelta(days=days_ago)).strftime("%a %b %d %H:%M:%S %z %Y")
    t = {"text": text, "createdAt": created, "entities": {"user_mentions": [{"screen_name": m} for m in mentions]}}
    if media:
        t["extendedEntities"] = {"media": [{"type": "photo", "media_url_https": u} for u in media]}
    return t


class FakeX:
    def __init__(self, timelines, profiles):
        self.timelines, self.profiles = timelines, profiles
        self.since_seen = {}

    def tweets_since(self, handle, since, max_pages):
        self.since_seen[handle] = since
        for t in self.timelines.get(handle, []):
            if parse_x_date(t["createdAt"]) > since:
                yield t

    def user_info(self, handle):
        return self.profiles.get(handle.lower())


class FakeClassifier:
    def __init__(self, verdicts, image_handles=None):
        self.verdicts, self.image_handles = verdicts, image_handles or {}
        self.classified = []

    def classify(self, handle, profile, website, site_text, defillama):
        self.classified.append(handle)
        return self.verdicts[handle.lower()]

    def handles_in_image(self, url):
        return self.image_handles.get(url, [])

    def companies_on_page(self, conference, text):
        return []


def verdict(kind="company", name="", startup=True, crypto=True, sector="Payments", token="none", employer=""):
    return {
        "account_type": kind,
        "company_name": name,
        "is_early_stage_startup": startup,
        "crypto_related": crypto,
        "sector": sector,
        "token_status": token,
        "employer_handle": employer,
    }


def profile(handle, name, followers=150, url=""):
    p = {"userName": handle, "name": name, "followers": followers, "description": ""}
    if url:
        p["profile_bio"] = {"entities": {"url": {"urls": [{"expanded_url": url}]}}}
    return p


@pytest.fixture(autouse=True)
def no_network(monkeypatch):
    monkeypatch.setattr(web, "site_text", lambda url, limit=6000: "")
    monkeypatch.setattr(config, "DRY_RUN", False)


def test_soho_pay_from_stable_summit_becomes_a_lead():
    sheet, book = make_sheet([["Stable Summit", "stable_summit", "", "TRUE", ""]])
    x = FakeX(
        timelines={
            "stable_summit": [
                tweet(
                    "When Machines Hold Stablecoins: @soho_pay is building USDC micro-credit for AI agents, "
                    "with @coinbase and our host @stable_summit",
                    mentions=["soho_pay", "coinbase", "stable_summit"],
                )
            ]
        },
        profiles={
            "soho_pay": profile("soho_pay", "Soho Pay", 174, "https://sohopay.ai"),
            "coinbase": profile("coinbase", "Coinbase", 6_000_000),
        },
    )
    classifier = FakeClassifier({"soho_pay": verdict(name="Soho Pay", sector="Agent payments")})

    summary = Run(sheet, x, classifier, {}, NOW, log=lambda *_: None).execute()

    leads = book.tabs["Leads"].values
    assert leads[1][:8] == [
        "Soho Pay", "@soho_pay", "https://sohopay.ai", "Agent payments", "None", "Stable Summit", "2026-10-19", "New",
    ]
    skipped = {row[0]: row[2] for row in book.tabs["Skipped"].values[1:]}
    assert skipped == {"@coinbase": "Large account (6,000,000 followers)"}
    assert classifier.classified == ["soho_pay"]  # Coinbase never reaches Claude; the conference itself is ignored
    assert book.tabs["Conferences"].values[1][4] == "2026-10-19T11:00:00+00:00"
    assert summary["Leads added"] == "1"


def test_existing_lead_gets_new_source_and_user_columns_are_untouched():
    existing = ["Soho Pay", "@soho_pay", "https://sohopay.ai", "Agent payments", "None", "Stable Summit",
                "2026-06-01", "Sent to client", "Fund A", "Met founder in June"]
    sheet, book = make_sheet([["Agentic Finance Summit", "AgenticSummit", "", "", ""]], leads=[existing])
    x = FakeX({"AgenticSummit": [tweet("Welcome @Soho_Pay", ["Soho_Pay"])]}, {})
    classifier = FakeClassifier({})

    Run(sheet, x, classifier, {}, NOW, log=lambda *_: None).execute()

    row = book.tabs["Leads"].values[1]
    assert row[5] == "Stable Summit; Agentic Finance Summit"
    assert row[7:] == ["Sent to client", "Fund A", "Met founder in June"]
    assert classifier.classified == []


def test_person_is_followed_to_their_employer():
    sheet, book = make_sheet([["Agentic Finance Summit", "AgenticSummit", "", "", ""]])
    x = FakeX(
        {"AgenticSummit": [tweet("Speaker: @philip0x", ["philip0x"])]},
        {"philip0x": profile("philip0x", "Philip"), "soho_pay": profile("soho_pay", "Soho Pay")},
    )
    classifier = FakeClassifier(
        {"philip0x": verdict(kind="person", employer="soho_pay"), "soho_pay": verdict(name="Soho Pay")}
    )

    Run(sheet, x, classifier, {}, NOW, log=lambda *_: None).execute()

    assert [r[1] for r in book.tabs["Leads"].values[1:]] == ["@soho_pay"]
    assert book.tabs["Skipped"].values[1][:3] == ["@philip0x", "Philip", "Person (works at @soho_pay)"]


def test_token_companies_and_previously_skipped_are_filtered():
    sheet, book = make_sheet(
        [["ETHGlobal", "ETHGlobal", "", "TRUE", ""]],
        skipped=[["@oldnews", "Old", "Not a company", "ETHGlobal", "2026-01-01"]],
    )
    x = FakeX(
        {"ETHGlobal": [tweet("Finalists @tokenco @pointsco @oldnews", ["tokenco", "pointsco", "oldnews"])]},
        {"tokenco": profile("tokenco", "TokenCo"), "pointsco": profile("pointsco", "PointsCo")},
    )
    classifier = FakeClassifier({"tokenco": verdict(name="TokenCo"), "pointsco": verdict(name="PointsCo", token="planned")})
    defillama = build_index([{"twitter": "TokenCo", "symbol": "TOK", "gecko_id": "tokenco"}])

    Run(sheet, x, classifier, defillama, NOW, log=lambda *_: None).execute()

    leads = book.tabs["Leads"].values[1:]
    assert [(r[0], r[4]) for r in leads] == [("PointsCo", "Planned")]
    assert book.tabs["Skipped"].values[2][:3] == ["@tokenco", "TokenCo", "Has a token"]
    assert "oldnews" not in classifier.classified


def test_inactive_conferences_are_skipped_and_last_checked_limits_lookback():
    last = "2026-10-18T11:00:00+00:00"
    sheet, book = make_sheet([["A", "conf_a", "", "TRUE", last], ["B", "conf_b", "", "FALSE", ""]])
    x = FakeX({"conf_a": [tweet("old @oldco", ["oldco"], days_ago=3)]}, {})

    summary = Run(sheet, x, FakeClassifier({}), {}, NOW, log=lambda *_: None).execute()

    assert list(x.since_seen) == ["conf_a"]
    assert x.since_seen["conf_a"] == datetime(2026, 10, 18, 11, 0, tzinfo=timezone.utc)
    assert summary["Accounts found"] == "0"


def test_handles_read_from_speaker_card_images():
    sheet, book = make_sheet([["Devcon", "EFDevcon", "", "", ""]])
    x = FakeX(
        {"EFDevcon": [tweet("Our next speaker!", media=["https://img/card.png"])]},
        {"newco": profile("newco", "NewCo")},
    )
    classifier = FakeClassifier({"newco": verdict(name="NewCo")}, image_handles={"https://img/card.png": ["@newco"]})

    Run(sheet, x, classifier, {}, NOW, log=lambda *_: None).execute()

    assert [r[1] for r in book.tabs["Leads"].values[1:]] == ["@newco"]


def test_one_failing_conference_does_not_stop_the_run():
    class BrokenX(FakeX):
        def tweets_since(self, handle, since, max_pages):
            if handle == "broken":
                raise RuntimeError("rate limited")
            return super().tweets_since(handle, since, max_pages)

    sheet, book = make_sheet([["Broken", "broken", "", "", ""], ["Good", "good", "", "", ""]])
    x = BrokenX({"good": [tweet("@newco", ["newco"])]}, {"newco": profile("newco", "NewCo")})

    summary = Run(sheet, x, FakeClassifier({"newco": verdict(name="NewCo")}), {}, NOW, log=lambda *_: None).execute()

    assert summary["Leads added"] == "1"
    assert "Broken: rate limited" in summary["Errors"]
    conf_rows = book.tabs["Conferences"].values
    assert len(conf_rows[1]) < 5 or conf_rows[1][4] == ""  # broken one is retried next time
    assert conf_rows[2][4] == "2026-10-19T11:00:00+00:00"


def test_helpers():
    assert mentioned_handles({"text": "hi @A_b and @a_B, email me@x.com", "entities": {}}) == ["A_b"]
    assert parse_x_date("Tue Dec 10 07:00:30 +0000 2024") == datetime(2024, 12, 10, 7, 0, 30, tzinfo=timezone.utc)
    assert image_urls({"extendedEntities": {"media": [{"type": "video", "media_url_https": "v"}]}}) == []
    assert profile_website(profile("a", "A", url="https://a.xyz")) == "https://a.xyz"
    assert web.domain("https://www.SohoPay.ai/about") == "sohopay.ai"
    assert merge_sources("A; B", ["B", "C"]) == "A; B; C"
    assert build_index([{"twitter": "@x", "symbol": "-", "gecko_id": None}])["x"]["has_token"] is False


def luma_entry(name, hosts, calendar=None):
    return {
        "event": {"name": name},
        "hosts": [{"name": n, "twitter_handle": h, "website": w} for n, h, w in hosts],
        "calendar": calendar or {"name": "", "is_personal": True},
    }


class FakeLuma:
    def __init__(self, entries):
        self.by_ref = entries
        self.calls = []

    def entries(self, ref, max_pages):
        self.calls.append(ref)
        return self.by_ref.get(ref, [])


def test_luma_hosts_and_calendars_become_candidates():
    from scraper import luma

    entry = luma_entry(
        "Agentic payments night",
        [("Philip", "philip0x", ""), ("No socials", None, ""), ("Site only", None, "https://siteonly.xyz")],
        calendar={"name": "Soho Pay", "twitter_handle": "soho_pay", "website": "https://sohopay.ai", "is_personal": False},
    )
    assert [a["handle"] or a["website"] for a in luma.accounts(entry)] == ["philip0x", "https://siteonly.xyz", "soho_pay"]
    assert luma.slug("https://luma.com/devcon?k=c") == "devcon"
    assert luma.slug("crypto") == "crypto"
    assert luma.slug("https://luma.com/calendar/cal-J8WZ4jDbwzD9TWi") == "cal-J8WZ4jDbwzD9TWi"

    sheet, book = make_sheet([["Devcon side events", "", "", "Yes", "", "https://luma.com/devcon"]])
    x = FakeX({}, {"philip0x": profile("philip0x", "Philip"), "soho_pay": profile("soho_pay", "Soho Pay")})
    classifier = FakeClassifier({
        "philip0x": verdict(kind="person", employer="soho_pay"),
        "soho_pay": verdict(name="Soho Pay"),
        "": verdict(kind="other"),
    })
    fake_luma = FakeLuma({"https://luma.com/devcon": [entry]})

    Run(sheet, x, classifier, {}, NOW, log=lambda *_: None, luma=fake_luma).execute()

    assert fake_luma.calls == ["https://luma.com/devcon"]
    assert [r[1] for r in book.tabs["Leads"].values[1:]] == ["@soho_pay"]
    assert book.tabs["Leads"].values[1][5] == "Devcon side events"
    assert {r[0] for r in book.tabs["Skipped"].values[1:]} == {"@philip0x", "siteonly.xyz"}
