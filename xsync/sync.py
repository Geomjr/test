"""Pull loop.

Both endpoints return newest-first and neither accepts since_id, so an
incremental run pages from the top and stops once it has seen `overlap`
consecutive posts already recorded for that source. That keeps a daily sync
billing a handful of resources instead of your whole history.
"""

from dataclasses import dataclass, field

from xsync import api, config, db


@dataclass
class SyncResult:
    source: str
    pages: int = 0
    new_tweets: int = 0
    seen_tweets: int = 0
    resources: int = 0
    stopped_reason: str = "exhausted"
    new_ids: list = field(default_factory=list)

    @property
    def cost(self) -> float:
        return api.estimate_cost(self.resources)


def sync_source(client, store, user_id: str, source: str, full: bool = False,
                page_size: int = 100, max_pages: int | None = None,
                max_resources: int | None = None, overlap: int = 25,
                expansions: bool = True, progress=None) -> SyncResult:
    if source not in config.SOURCES:
        raise ValueError(f"Unknown source {source!r}; expected one of {list(config.SOURCES)}")

    path = config.SOURCES[source].format(user_id=user_id)
    # `full` only disables the early stop - accounting still needs the real
    # known set, or a full re-sync reports everything as new.
    known = store.known_ids(source)
    result = SyncResult(source=source)
    started = db.now()
    # Snapshot: the client counter is cumulative across sources in one run.
    resources_at_start = client.resources_used
    rank = 0
    consecutive_known = 0

    for payload in client.pages(path, page_size=page_size, max_pages=max_pages,
                                expansions=expansions):
        result.pages += 1
        result.resources = client.resources_used - resources_at_start

        for user in (payload.get("includes") or {}).get("users") or []:
            store.upsert_author(user)

        rows = payload.get("data") or []
        if not rows:
            result.stopped_reason = "empty_page"
            break

        for tweet in rows:
            rank += 1
            is_new_globally = store.upsert_tweet(tweet)
            already_linked = tweet["id"] in known
            store.link_source(tweet["id"], source, rank)
            if already_linked:
                result.seen_tweets += 1
                consecutive_known += 1
            else:
                result.new_tweets += 1
                result.new_ids.append(tweet["id"])
                consecutive_known = 0
                known.add(tweet["id"])
            # is_new_globally is informational: a post can be new to `sources`
            # while already present via the other source.
            del is_new_globally

        store.commit()
        if progress:
            progress(result)

        if not full and consecutive_known >= overlap:
            result.stopped_reason = "caught_up"
            break
        if max_resources is not None and result.resources >= max_resources:
            result.stopped_reason = "resource_budget"
            break
    else:
        if max_pages is not None and result.pages >= max_pages:
            result.stopped_reason = "page_limit"

    store.record_run(
        source=source, started_at=started, finished_at=db.now(), pages=result.pages,
        new_tweets=result.new_tweets, seen_tweets=result.seen_tweets,
        resources=result.resources, stopped_reason=result.stopped_reason,
    )
    store.commit()
    return result
