"""One daily run: collect companies from conferences, screen them, and update the sheet."""

from dataclasses import dataclass, field
from datetime import timedelta

from . import config, luma, web
from .sheets import lead_key
from .xapi import image_urls, mentioned_handles, parse_x_date, profile_website

TOKEN_LABELS = {"none": "None", "planned": "Planned", "has_token": "Has token", "unknown": "Unknown"}


@dataclass
class Candidate:
    handle: str = ""
    name: str = ""
    website: str = ""
    sources: list = field(default_factory=list)

    @property
    def key(self):
        return lead_key(self.handle, self.website)

    @property
    def account(self):
        return f"@{self.handle}" if self.handle else web.domain(self.website)


def merge_sources(existing, new):
    names = [s.strip() for s in existing.split(";") if s.strip()]
    for source in new:
        if source not in names:
            names.append(source)
    return "; ".join(names)


class Run:
    def __init__(self, sheet, x, classifier, defillama, now, log=print, luma=None):
        self.sheet, self.x, self.classifier, self.defillama = sheet, x, classifier, defillama
        self.luma = luma
        self.now, self.log = now, log
        self.errors = []
        self.classified = 0

    # Step 1: collect candidate companies from every active conference.

    def collect(self, conferences):
        candidates, checked = {}, []
        images_left = config.MAX_IMAGES_PER_RUN

        def add(handle, name, website, source):
            cand = Candidate(handle.strip().lstrip("@"), name.strip(), website.strip(), [source])
            if not cand.key:
                return
            if cand.key in candidates:
                existing = candidates[cand.key]
                if source not in existing.sources:
                    existing.sources.append(source)
                existing.name = existing.name or cand.name
                existing.website = existing.website or cand.website
            else:
                candidates[cand.key] = cand

        for conf in conferences:
            source = conf.get("Conference") or conf.get("X handle")
            handle = conf.get("X handle", "").strip().lstrip("@")
            try:
                if handle:
                    since = parse_x_date(conf.get("Last checked")) or self.now - timedelta(days=config.BACKFILL_DAYS)
                    for tweet in self.x.tweets_since(handle, since, config.MAX_PAGES_PER_CONFERENCE):
                        for mention in mentioned_handles(tweet):
                            add(mention, "", "", source)
                        for url in image_urls(tweet):
                            if images_left <= 0:
                                break
                            images_left -= 1
                            for found in self.classifier.handles_in_image(url):
                                add(found, "", "", source)
                if conf.get("Website", "").strip():
                    page_text = web.rendered_page_text(conf["Website"].strip())
                    for company in self.classifier.companies_on_page(source, page_text):
                        add(company["x_handle"], company["name"], company["website"], source)
                if conf.get("Luma", "").strip() and self.luma:
                    for entry in self.luma.entries(conf["Luma"].strip(), config.MAX_LUMA_PAGES):
                        for account in luma.accounts(entry):
                            add(account["handle"], account["name"], account["website"], source)
                checked.append(conf)
            except Exception as exc:  # one broken conference shouldn't stop the others
                self.errors.append(f"{source}: {exc}")
                self.log(f"Error collecting from {source}: {exc}")
        return list(candidates.values()), checked

    # Step 2: screen one candidate.

    def evaluate(self, cand):
        """Return ('lead', record), ('skip', reason, name) or ('person', employer_handle, name)."""
        profile, website = None, cand.website
        if cand.handle:
            profile = self.x.user_info(cand.handle)
            if profile is None:
                return ("skip", "Account not found or suspended", cand.name)
            followers = profile.get("followers") or 0
            if followers > config.MAX_FOLLOWERS:
                return ("skip", f"Large account ({followers:,} followers)", profile.get("name", ""))
            website = website or profile_website(profile)

        listing = self.defillama.get(cand.handle.lower()) if cand.handle else None
        result = self.classifier.classify(cand.handle, profile, website, web.site_text(website), listing)
        self.classified += 1
        name = (result or {}).get("company_name") or (profile or {}).get("name") or cand.name
        if result is None:
            return ("skip", "Could not classify", name)

        token = "has_token" if listing and listing["has_token"] else result["token_status"]
        kind = result["account_type"]
        if kind == "person":
            return ("person", result["employer_handle"].strip().lstrip("@"), (profile or {}).get("name", ""))
        if kind != "company":
            return ("skip", {"event_or_media": "Event or media", "other": "Not a company"}[kind], name)
        if not result["is_early_stage_startup"]:
            return ("skip", "Not an early-stage startup", name)
        if not result["crypto_related"]:
            return ("skip", "Not crypto-related", name)
        if token == "has_token":
            return ("skip", "Has a token", name)

        return (
            "lead",
            {
                "Company": name,
                "X handle": f"@{cand.handle}" if cand.handle else "",
                "Website": website,
                "Sector": result["sector"],
                "Token status": TOKEN_LABELS[token],
                "Sources": merge_sources("", cand.sources),
                "First seen": self.now.date().isoformat(),
                "Status": "New",
            },
        )

    # The whole run.

    def execute(self):
        conferences = self.sheet.active_conferences()
        leads = self.sheet.lead_index()
        skipped = self.sheet.skipped_keys()
        conference_handles = {c.get("X handle", "").strip().lstrip("@").lower() for c in conferences} - {""}

        candidates, checked = self.collect(conferences)
        self.log(f"Found {len(candidates)} accounts across {len(checked)} conferences")

        new_leads, skipped_rows, source_updates = [], [], []
        seen, queue = set(), list(candidates)
        while queue:
            cand = queue.pop(0)
            key = cand.key
            if key in seen or key in conference_handles:
                continue
            seen.add(key)

            if key in leads:
                row, sources = leads[key]
                merged = merge_sources(sources, cand.sources)
                if merged != sources:
                    source_updates.append((row, "Sources", merged))
                    leads[key] = (row, merged)
                continue
            if key in skipped:
                continue
            if self.classified >= config.MAX_CLASSIFICATIONS_PER_RUN:
                self.errors.append(f"Stopped after {self.classified} classifications; the rest wait for the next run")
                break

            try:
                outcome = self.evaluate(cand)
            except Exception as exc:  # leave it unrecorded so a later mention retries it
                self.errors.append(f"{cand.account}: {exc}")
                self.log(f"Error screening {cand.account}: {exc}")
                continue

            if outcome[0] == "lead":
                new_leads.append(outcome[1])
                leads[key] = (None, outcome[1]["Sources"])
                self.log(f"New lead: {outcome[1]['Company']} ({cand.account})")
                continue
            if outcome[0] == "person":
                employer, name = outcome[1], outcome[2]
                reason = f"Person (works at @{employer})" if employer else "Person"
                if employer:
                    queue.append(Candidate(handle=employer, sources=list(cand.sources)))
            else:
                reason, name = outcome[1], outcome[2]
            skipped.add(key)
            skipped_rows.append(
                {
                    "Account": cand.account,
                    "Name": name,
                    "Reason": reason,
                    "Sources": merge_sources("", cand.sources),
                    "Date": self.now.date().isoformat(),
                }
            )

        summary = {
            "Run at": self.now.strftime("%Y-%m-%d %H:%M UTC"),
            "Conferences checked": str(len(checked)),
            "Accounts found": str(len(candidates)),
            "Leads added": str(len(new_leads)),
            "Errors": " | ".join(self.errors)[:1000],
        }
        if config.DRY_RUN:
            self.log(f"Dry run, not writing. Leads: {new_leads}\nSkipped: {skipped_rows}\nSummary: {summary}")
            return summary

        self.sheet.leads.append(new_leads)
        self.sheet.leads.update_cells(source_updates)
        self.sheet.skipped.append(skipped_rows)
        stamp = self.now.isoformat(timespec="seconds")
        self.sheet.conferences.update_cells([(c["_row"], "Last checked", stamp) for c in checked])
        self.sheet.run_log.append([summary])
        return summary
