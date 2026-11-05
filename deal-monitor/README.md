# Crypto deal flow monitor

Tracks new crypto funding rounds from https://crypto-fundraising.info/deal-flow/ and groups them by investment thesis.

**Sheet:** [Crypto Deal Flow Monitor](https://docs.google.com/spreadsheets/d/19GzOFc2mGGtyhhouGFnO67VORtd-nOMy2AN4DLninUA/edit)

## Tabs

- **Deals**: one row per funding round. Columns A to J come from the site. Column K (Thesis) is assigned by Claude and can be changed from the dropdown.
- **Thesis**: one row per thesis, with deal count, share, last-30-day count and amount raised, all calculated from Deals. Below that are two tables: how often each site category gets funded, and an investor watchlist. Blue cells are inputs: thesis names and definitions, "Our view", conviction, and the category and investor lists.

## How it updates

A Claude scheduled task, "Crypto deal flow sheet refresh", runs at 05:47 and 19:47 UTC. Each run fetches the public page, skips rounds already in Deals (matched on project page and round), tags each new round with the best-fitting thesis from the Thesis tab, and appends it. The full instructions are in [refresh-prompt.md](refresh-prompt.md).

The task needs the **Google Sheets** and **TinyFish** connectors attached in claude.ai.

## Limits

- The public page shows only the 10 latest rounds, so there is no history before 2026-11-05. If more than 10 rounds are posted between two runs, some will be missed; the run summary warns when that may have happened.
- "Month listed" is the site's month. "First seen" is when the row was added here, not when the round closed.
- The site's terms do not allow reselling its data. Keep the sheet for internal use.

## Changing the theses

Edit names or definitions in Thesis!A6:B13. The refresh reads them on every run, and the Deals dropdown follows that range. If you rename a thesis, rename it in existing Deals rows too, or their counts drop out.
