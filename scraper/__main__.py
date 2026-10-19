"""Entry point: `python -m scraper`."""

import sys
from datetime import datetime, timezone

from . import config
from .classify import Classifier
from .pipeline import Run
from .sheets import open_sheet
from .tokens import load_defillama_index
from .xapi import XClient


def main():
    missing = [name for name in ("TWITTERAPI_KEY", "SHEET_ID") if not getattr(config, name)]
    if missing:
        sys.exit(f"Missing environment variables: {', '.join(missing)}")

    run = Run(
        sheet=open_sheet(config.SHEET_ID),
        x=XClient(config.TWITTERAPI_KEY),
        classifier=Classifier(),
        defillama=load_defillama_index(),
        now=datetime.now(timezone.utc),
    )
    summary = run.execute()
    print(summary)


if __name__ == "__main__":
    main()
