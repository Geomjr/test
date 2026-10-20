"""Settings, read from environment variables so the GitHub Actions job can set them."""

import os

TWITTERAPI_KEY = os.environ.get("TWITTERAPI_KEY", "")
SHEET_ID = os.environ.get("SHEET_ID", "")

CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL", "claude-opus-5-5")

# First run for a conference looks back this far; later runs start from "Last checked".
BACKFILL_DAYS = int(os.environ.get("BACKFILL_DAYS", "120"))
# Each page is up to 20 posts.
MAX_PAGES_PER_CONFERENCE = int(os.environ.get("MAX_PAGES_PER_CONFERENCE", "10"))
# Accounts with more followers than this are treated as established companies and skipped.
MAX_FOLLOWERS = int(os.environ.get("MAX_FOLLOWERS", "100000"))
# Cap on accounts classified per run, to bound cost if a conference posts a huge list.
MAX_CLASSIFICATIONS_PER_RUN = int(os.environ.get("MAX_CLASSIFICATIONS_PER_RUN", "300"))
# Pages of 50 upcoming events read per Luma calendar or category.
MAX_LUMA_PAGES = int(os.environ.get("MAX_LUMA_PAGES", "20"))
# Also screen the up-to-10 featured guests Luma shows publicly on each event.
LUMA_INCLUDE_GUESTS = os.environ.get("LUMA_INCLUDE_GUESTS", "").lower() in ("1", "true", "yes")
# Speaker cards are often images; read up to this many per run.
MAX_IMAGES_PER_RUN = int(os.environ.get("MAX_IMAGES_PER_RUN", "40"))

DRY_RUN = os.environ.get("DRY_RUN", "").lower() in ("1", "true", "yes")
