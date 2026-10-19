# Startup scraper

Finds pre-seed and seed crypto startups without a live token by watching conference X accounts and speaker pages, and adds them to the [Startup Leads](https://docs.google.com/spreadsheets/d/1WQCdweYgo9BasoBTy0zsNTztH29PbMl-acrmZngaXmg/edit) Google Sheet every morning.

## How a run works

1. Reads the **Conferences** tab. For each active conference it:
   - pulls the conference's X posts since its **Last checked** time (the first run looks back 120 days) and collects every tagged @handle, plus handles shown on speaker-card images;
   - if a **Website** is set, opens it in a headless browser and lists the companies named on it.
2. Screens each new account:
   - skips accounts with over 100,000 followers;
   - checks DefiLlama for a listed token;
   - asks Claude to classify the account from its X profile and website: company or person, early-stage or not, crypto or not, token status, sector;
   - for a person, follows the company named in their bio.
3. Adds startups that are early-stage, crypto-related and have no live token to **Leads** (token status None, Planned or Unknown). Everything else goes to **Skipped** with the reason, so it isn't re-checked or charged for again.
4. A company already in Leads gets the new conference added to its **Sources**.
5. Writes one line to **Run log**.

The job only writes Company, X handle, Website, Sector, Token status, Sources and First seen. **Status, Client and Comments are never touched**, and columns are matched by header name, so you can reorder them or add your own.

To watch another conference, add a row to the Conferences tab. Set Active to No to pause one. To re-check a skipped account, delete its row from Skipped.

## Setup

Already done:
- Google Cloud project `startup-scraper-geomj`, with a service account that GitHub Actions in `geomjr/test` can act as through Workload Identity Federation (no key file).
- The Google Sheet, with the Leads, Conferences, Skipped and Run log tabs.

Still needed:
1. Share the sheet with `startup-scraper@startup-scraper-geomj.iam.gserviceaccount.com` as **Editor**.
2. Add two repository secrets under **Settings → Secrets and variables → Actions**:
   - `TWITTERAPI_KEY`, from [twitterapi.io](https://twitterapi.io)
   - `ANTHROPIC_API_KEY`, from [console.anthropic.com](https://console.anthropic.com)
3. Merge this branch into `main`. GitHub only runs scheduled workflows from the default branch.
4. Run it once by hand: **Actions → Daily startup scrape → Run workflow**. Tick "dry run" to see results in the log without writing to the sheet.

## Settings

Set these as `env:` entries in `.github/workflows/daily-scrape.yml` to change them.

| Variable | Default | Meaning |
|---|---|---|
| `BACKFILL_DAYS` | 120 | How far back the first run for a conference looks |
| `MAX_PAGES_PER_CONFERENCE` | 10 | Pages of 20 posts read per conference per run |
| `MAX_FOLLOWERS` | 100000 | Accounts above this are treated as established and skipped |
| `MAX_CLASSIFICATIONS_PER_RUN` | 300 | Cap on Claude calls per run |
| `MAX_IMAGES_PER_RUN` | 40 | Cap on speaker-card images read per run |
| `CLAUDE_MODEL` | claude-opus-5-5 | Model used for classification |

## Running locally

```bash
pip install -r requirements-dev.txt
python -m pytest -q
```
