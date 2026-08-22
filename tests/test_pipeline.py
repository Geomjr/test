"""End-to-end coverage with a canned transport - no network, no credentials."""

import json
import sys
import unittest
import urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from xsync import api, db, sync, tagging  # noqa: E402


def tweet(tid, text, author="1", **extra):
    base = {
        "id": tid, "text": text, "author_id": author,
        "created_at": "2026-08-01T12:00:00.000Z", "lang": "en",
        "public_metrics": {"like_count": 10, "retweet_count": 2, "reply_count": 1,
                           "quote_count": 0, "bookmark_count": 3, "impression_count": 999},
    }
    base.update(extra)
    return base


USERS = [{"id": "1", "username": "vc_person", "name": "VC Person",
          "public_metrics": {"followers_count": 5000}, "verified": True}]


class FakeTransport:
    """Serves pre-baked pages keyed by pagination_token, and records calls."""

    def __init__(self, pages_by_path, statuses=None):
        self.pages_by_path = pages_by_path
        self.statuses = list(statuses or [])
        self.calls = []

    def __call__(self, method, url, headers=None, body=None):
        self.calls.append(url)
        if self.statuses:
            status, payload, hdrs = self.statuses.pop(0)
            return status, hdrs or {}, json.dumps(payload)
        parsed = urllib.parse.urlparse(url)
        params = urllib.parse.parse_qs(parsed.query)
        pages = self.pages_by_path[parsed.path]
        token = params.get("pagination_token", [None])[0]
        index = 0 if token is None else int(token)
        return 200, {}, json.dumps(pages[index])


class StubTokens:
    def __init__(self):
        self.refreshes = 0

    def access_token(self, force_refresh=False):
        if force_refresh:
            self.refreshes += 1
        return "stub-token"


def page(tweets, next_token=None, users=USERS):
    payload = {"data": tweets, "includes": {"users": users}, "meta": {"result_count": len(tweets)}}
    if next_token is not None:
        payload["meta"]["next_token"] = str(next_token)
    return payload


BOOKMARKS_PATH = "/2/users/42/bookmarks"
LIKES_PATH = "/2/users/42/liked_tweets"


class TaggerTest(unittest.TestCase):
    def setUp(self):
        self.tagger = tagging.Tagger.load()

    def test_crypto_and_vc_tags_fire(self):
        hits = self.tagger.match("Our thesis on L2 rollups and stablecoin rails, raised a seed round")
        self.assertIn("crypto", hits)
        self.assertIn("vc", hits)
        self.assertIn("thesis", hits)

    def test_no_false_positive_on_unrelated_text(self):
        self.assertEqual(self.tagger.match("Made a great risotto tonight, recipe below"), {})

    def test_score_counts_distinct_terms(self):
        score, terms = self.tagger.match("defi and mev and restaking on solana")["crypto"]
        self.assertEqual(score, len(terms))
        self.assertGreaterEqual(score, 4)

    def test_word_boundaries_are_respected(self):
        # "eth" must not match inside "ethics"; "sol" must not match "solar".
        self.assertEqual(self.tagger.match("a discussion of ethics and solar power"), {})

    def test_ticker_regex_matches_cashtags(self):
        _, terms = self.tagger.match("long $SOL into the halving")["crypto"]
        self.assertIn("re:\\$[A-Z]{2,6}\\b", terms)

    def test_symbol_terms_match(self):
        self.assertIn("vc", self.tagger.match("a wave of m&a in the sector"))


class SyncTest(unittest.TestCase):
    def setUp(self):
        self.store = db.Store(":memory:")

    def tearDown(self):
        self.store.close()

    def _client(self, transport):
        return api.XClient(StubTokens(), transport=transport, sleeper=lambda _: None)

    def test_paginates_and_stores(self):
        transport = FakeTransport({
            BOOKMARKS_PATH: [
                page([tweet("3", "zk rollup thesis"), tweet("2", "seed round closed")], next_token=1),
                page([tweet("1", "risotto recipe")]),
            ]
        })
        result = sync.sync_source(self._client(transport), self.store, "42", "bookmarks")
        self.assertEqual(result.pages, 2)
        self.assertEqual(result.new_tweets, 3)
        self.assertEqual(result.stopped_reason, "exhausted")
        self.assertEqual(self.store.counts()["tweets"], 3)
        self.assertEqual(self.store.counts()["bookmarks"], 3)
        self.assertEqual(self.store.counts()["authors"], 1)

    def test_incremental_run_stops_once_caught_up(self):
        pages = [page([tweet("3", "a"), tweet("2", "b")], next_token=1), page([tweet("1", "c")])]
        client = self._client(FakeTransport({BOOKMARKS_PATH: pages}))
        sync.sync_source(client, self.store, "42", "bookmarks")

        # Second run: one genuinely new post on top of the known ones.
        pages2 = [page([tweet("4", "new"), tweet("3", "a")], next_token=1), page([tweet("2", "b")])]
        transport2 = FakeTransport({BOOKMARKS_PATH: pages2})
        result = sync.sync_source(
            self._client(transport2), self.store, "42", "bookmarks", overlap=1
        )
        self.assertEqual(result.new_tweets, 1)
        self.assertEqual(result.stopped_reason, "caught_up")
        self.assertEqual(len(transport2.calls), 1, "should not have fetched page two")

    def test_full_run_ignores_the_catch_up_shortcut(self):
        pages = [page([tweet("2", "a")], next_token=1), page([tweet("1", "b")])]
        sync.sync_source(self._client(FakeTransport({BOOKMARKS_PATH: pages})), self.store,
                         "42", "bookmarks")
        transport = FakeTransport({BOOKMARKS_PATH: pages})
        result = sync.sync_source(self._client(transport), self.store, "42", "bookmarks",
                                  full=True, overlap=1)
        self.assertEqual(result.pages, 2)
        self.assertEqual(result.new_tweets, 0)
        self.assertEqual(result.seen_tweets, 2)

    def test_same_post_in_both_sources_is_stored_once(self):
        transport = FakeTransport({
            BOOKMARKS_PATH: [page([tweet("9", "onchain thesis")])],
            LIKES_PATH: [page([tweet("9", "onchain thesis")])],
        })
        client = self._client(transport)
        sync.sync_source(client, self.store, "42", "bookmarks")
        sync.sync_source(client, self.store, "42", "likes")
        counts = self.store.counts()
        self.assertEqual(counts["tweets"], 1)
        self.assertEqual(counts["bookmarks"], 1)
        self.assertEqual(counts["likes"], 1)

    def test_resource_budget_halts_the_run(self):
        pages = [page([tweet(str(i), "x") for i in range(10, 20)], next_token=1),
                 page([tweet(str(i), "y") for i in range(20, 30)])]
        result = sync.sync_source(self._client(FakeTransport({BOOKMARKS_PATH: pages})),
                                  self.store, "42", "bookmarks", max_resources=5)
        self.assertEqual(result.stopped_reason, "resource_budget")
        self.assertEqual(result.pages, 1)

    def test_resource_count_is_per_source_not_cumulative(self):
        transport = FakeTransport({
            BOOKMARKS_PATH: [page([tweet("1", "a")])],
            LIKES_PATH: [page([tweet("2", "b")])],
        })
        client = self._client(transport)
        first = sync.sync_source(client, self.store, "42", "bookmarks")
        second = sync.sync_source(client, self.store, "42", "likes")
        self.assertEqual(first.resources, second.resources)
        self.assertEqual(client.resources_used, first.resources + second.resources)

    def test_long_posts_keep_their_full_body(self):
        long_body = "Full thesis: " + "why now " * 50
        transport = FakeTransport({
            BOOKMARKS_PATH: [page([tweet("5", "truncated…", note_tweet={"text": long_body})])]
        })
        sync.sync_source(self._client(transport), self.store, "42", "bookmarks")
        row = self.store.select(limit=1)[0]
        self.assertEqual(row["full_text"], long_body)

    def test_urls_are_extracted_and_self_links_dropped(self):
        entities = {"urls": [
            {"url": "https://t.co/abc", "expanded_url": "https://paradigm.xyz/2026/thesis"},
            {"url": "https://t.co/def", "expanded_url": "https://x.com/foo/status/1"},
        ]}
        transport = FakeTransport({BOOKMARKS_PATH: [page([tweet("6", "link", entities=entities)])]})
        sync.sync_source(self._client(transport), self.store, "42", "bookmarks")
        self.assertEqual(self.store.top_domains(), [("paradigm.xyz", 1)])

    def test_tagging_and_querying_round_trip(self):
        transport = FakeTransport({BOOKMARKS_PATH: [page([
            tweet("1", "Our thesis on restaking and MEV"),
            tweet("2", "Closed our Series A, term sheet signed"),
            tweet("3", "Made risotto"),
        ])]})
        sync.sync_source(self._client(transport), self.store, "42", "bookmarks")
        stats = tagging.Tagger.load().tag_store(self.store)
        self.assertEqual(stats["scanned"], 3)
        self.assertEqual(stats["tagged"], 2)
        self.assertEqual({r["id"] for r in self.store.select(tag="crypto")}, {"1"})
        self.assertEqual({r["id"] for r in self.store.select(tag="vc")}, {"2"})
        self.assertEqual(self.store.select(tag="crypto")[0]["username"], "vc_person")

    def test_retag_is_needed_to_revisit_tagged_rows(self):
        transport = FakeTransport({BOOKMARKS_PATH: [page([tweet("1", "restaking thesis")])]})
        sync.sync_source(self._client(transport), self.store, "42", "bookmarks")
        tagging.Tagger.load().tag_store(self.store)
        self.assertEqual(tagging.Tagger.load().tag_store(self.store)["scanned"], 0)
        self.assertEqual(tagging.Tagger.load().tag_store(self.store, retag=True)["scanned"], 1)

    def test_metrics_refresh_on_a_later_sync(self):
        first = tweet("1", "a")
        transport = FakeTransport({BOOKMARKS_PATH: [page([first])]})
        client = self._client(transport)
        sync.sync_source(client, self.store, "42", "bookmarks")
        bumped = tweet("1", "a")
        bumped["public_metrics"]["like_count"] = 4321
        sync.sync_source(self._client(FakeTransport({BOOKMARKS_PATH: [page([bumped])]})),
                         self.store, "42", "bookmarks", full=True)
        self.assertEqual(self.store.select(limit=1)[0]["like_count"], 4321)

    def test_search_finds_stored_text(self):
        transport = FakeTransport({BOOKMARKS_PATH: [page([tweet("1", "stablecoin settlement rails")])]})
        sync.sync_source(self._client(transport), self.store, "42", "bookmarks")
        self.assertEqual(len(self.store.search("stablecoin")), 1)
        self.assertEqual(len(self.store.search("zzzznotpresent")), 0)


class ClientTest(unittest.TestCase):
    def test_401_triggers_exactly_one_refresh_then_succeeds(self):
        tokens = StubTokens()
        transport = FakeTransport({}, statuses=[
            (401, {"title": "Unauthorized"}, {}),
            (200, {"data": {"id": "42", "username": "me"}}, {}),
        ])
        client = api.XClient(tokens, transport=transport, sleeper=lambda _: None)
        self.assertEqual(client.verify_credentials()["id"], "42")
        self.assertEqual(tokens.refreshes, 1)

    def test_429_waits_then_retries(self):
        waits = []
        transport = FakeTransport({}, statuses=[
            (429, {"title": "Too Many Requests"}, {"x-rate-limit-reset": "1"}),
            (200, {"data": {"id": "42"}}, {}),
        ])
        client = api.XClient(StubTokens(), transport=transport, sleeper=waits.append)
        client.verify_credentials()
        self.assertEqual(len(waits), 1)

    def test_403_surfaces_as_an_error(self):
        transport = FakeTransport({}, statuses=[(403, {"title": "Forbidden"}, {})])
        client = api.XClient(StubTokens(), transport=transport, sleeper=lambda _: None)
        with self.assertRaises(api.XApiError) as ctx:
            client.verify_credentials()
        self.assertEqual(ctx.exception.status, 403)

    def test_resource_counting_includes_expansions(self):
        payload = {"data": [{"id": "1"}, {"id": "2"}], "includes": {"users": [{"id": "9"}]}}
        self.assertEqual(api.count_resources(payload), 3)
        self.assertAlmostEqual(api.estimate_cost(1000), 1.0)
        self.assertAlmostEqual(api.estimate_cost(1000, "standard"), 5.0)


class AuthTest(unittest.TestCase):
    def test_pkce_challenge_is_derived_from_the_verifier(self):
        import base64
        import hashlib

        from xsync import auth
        verifier, challenge = auth.make_pkce_pair()
        expected = base64.urlsafe_b64encode(
            hashlib.sha256(verifier.encode()).digest()
        ).decode().rstrip("=")
        self.assertEqual(challenge, expected)
        self.assertNotIn("=", challenge)

    def test_authorize_url_carries_the_required_scopes(self):
        from xsync import auth, config
        url = auth.build_authorize_url("cid", "http://127.0.0.1:8723/callback", "chal", "state")
        query = urllib.parse.parse_qs(urllib.parse.urlparse(url).query)
        self.assertEqual(query["code_challenge_method"], ["S256"])
        scopes = query["scope"][0].split()
        for required in ("bookmark.read", "like.read", "offline.access"):
            self.assertIn(required, scopes)
        self.assertEqual(set(scopes), set(config.SCOPES))

    def test_tokens_are_written_private(self):
        import tempfile

        from xsync import auth
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "nested" / "tokens.json"
            auth.save_tokens({"access_token": "secret"}, path)
            self.assertEqual(path.stat().st_mode & 0o777, 0o600)
            self.assertEqual(auth.load_tokens(path)["access_token"], "secret")


if __name__ == "__main__":
    unittest.main(verbosity=2)


class ManualLoginTest(unittest.TestCase):
    def setUp(self):
        import tempfile
        self._tmp = tempfile.TemporaryDirectory()
        import os
        os.environ["XSYNC_HOME"] = self._tmp.name

    def tearDown(self):
        import os
        del os.environ["XSYNC_HOME"]
        self._tmp.cleanup()

    def test_manual_round_trip(self):
        from unittest import mock

        from xsync import auth
        url = auth.start_manual_login("cid")
        state = urllib.parse.parse_qs(urllib.parse.urlparse(url).query)["state"][0]
        redirect = f"http://127.0.0.1:8723/callback?state={state}&code=thecode"
        fake = (200, {}, json.dumps({"access_token": "at", "refresh_token": "rt",
                                     "expires_in": 7200}))
        with mock.patch("xsync.auth.form_post", return_value=fake) as post:
            tokens = auth.finish_manual_login(redirect)
        sent = post.call_args[0][1]
        self.assertEqual(sent["code"], "thecode")
        self.assertEqual(sent["grant_type"], "authorization_code")
        self.assertEqual(tokens["access_token"], "at")
        # The pending verifier must be cleaned up after use.
        from xsync import config
        self.assertFalse((config.config_dir() / "pending_login.json").exists())

    def test_manual_rejects_state_mismatch(self):
        from xsync import auth
        auth.start_manual_login("cid")
        with self.assertRaises(auth.AuthError):
            auth.finish_manual_login("http://127.0.0.1:8723/callback?state=WRONG&code=x")
