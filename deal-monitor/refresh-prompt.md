You maintain the "Crypto Deal Flow Monitor" Google Sheet (spreadsheet ID 19GzOFc2mGGtyhhouGFnO67VORtd-nOMy2AN4DLninUA). Each run, add any new funding rounds from https://crypto-fundraising.info/deal-flow/ to the Deals tab. Use the Google Sheets and TinyFish connectors (load their tools with ToolSearch first). Do not touch the git repository.

1. Fetch the page with TinyFish fetch_content (format markdown, links true, ttl 0). If that fails, try WebFetch. The public page lists the 10 most recent rounds. For each one read: project name, token (if shown), round type, month listed (e.g. "Oct 2026"), amount raised, round valuation, tradable (Yes/No), category tags, investor names, and the project page link (https://crypto-fundraising.info/projects/<slug>, matched to the project from the links list).

2. Read Deals!A:L. Columns: A First seen, B Project, C Token, D Round, E Month listed, F Raised ($), G Round valuation ($), H Tradable, I Site categories, J Investors, K Thesis, L Project page. A round is already recorded if a row has the same Project page (column L) and Round (column D). Skip those.

3. Read Thesis!A6:B13: thesis names in column A, definitions in column B. The team may edit these, so always use the current values. For each new round pick the one thesis whose definition fits best, using the categories, the project name and the investors. Use the exact name from column A. If nothing fits, use the thesis named "Other".

4. Append the new rows to Deals!A:L in one append_values call, oldest first (reverse of page order), with:
   - A: today's date as YYYY-MM-DD (UTC)
   - E: the month text prefixed with an apostrophe, e.g. "'Oct 2026", so it stays text
   - F and G: plain numbers (e.g. 4000000) when shown; null when the page shows "-" or "Unknown"
   - C: the token ticker or ""
   - I: categories joined with ", "
   - J: investor names joined with ", ", with no space before commas
   Do not edit, reorder or delete existing rows, and do not write to the Thesis tab.

5. Verify by reading back the appended rows. Finish with a one-paragraph summary: how many new rounds were added, each project with its round, amount and thesis, and any warning. Warn if all 10 rounds on the page were new, since rounds may have been missed between runs. Also warn if the page layout looked different from what is described here. If the page could not be fetched, say so and change nothing.
