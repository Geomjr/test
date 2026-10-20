"""Reading and writing the Google Sheet.

Columns are found by their header text, so you can reorder columns or add your own.
The job only writes the columns it owns; Status, Client and Comments are yours.
"""

import gspread
from gspread.utils import rowcol_to_a1

LEADS = "Leads"
CONFERENCES = "Conferences"
SKIPPED = "Skipped"
RUN_LOG = "Run log"

LEADS_HEADERS = ["Company", "X handle", "Website", "Sector", "Token status", "Sources", "First seen", "Status", "Client", "Comments"]
CONFERENCES_HEADERS = ["Conference", "X handle", "Website", "Active", "Last checked", "Luma"]
SKIPPED_HEADERS = ["Account", "Name", "Reason", "Sources", "Date"]
RUN_LOG_HEADERS = ["Run at", "Conferences checked", "Accounts found", "Leads added", "Errors"]


def open_sheet(sheet_id):
    import google.auth

    creds, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/spreadsheets"])
    return Sheet(gspread.authorize(creds).open_by_key(sheet_id))


def lead_key(handle="", website=""):
    """The identity of a company: its X handle if known, otherwise its website domain."""
    from .web import domain

    handle = (handle or "").strip().lstrip("@").lower()
    return handle or domain(website)


class Table:
    """One tab, with rows as dicts keyed by header text."""

    def __init__(self, worksheet):
        self.ws = worksheet
        values = worksheet.get_all_values()
        self.headers = values[0] if values else []
        self.rows = [dict(zip(self.headers, row + [""] * (len(self.headers) - len(row)))) for row in values[1:]]

    def col(self, header):
        return self.headers.index(header) + 1

    def append(self, records):
        if records:
            rows = [[record.get(h, "") for h in self.headers] for record in records]
            self.ws.append_rows(rows, value_input_option="RAW", table_range="A1")

    def update_cells(self, updates):
        """updates: list of (row_number, header, value); row_number counts the header as row 1."""
        if updates:
            self.ws.batch_update(
                [{"range": rowcol_to_a1(r, self.col(h)), "values": [[v]]} for r, h, v in updates],
                value_input_option="RAW",
            )


class Sheet:
    def __init__(self, spreadsheet):
        self.leads = Table(spreadsheet.worksheet(LEADS))
        self.conferences = Table(spreadsheet.worksheet(CONFERENCES))
        self.skipped = Table(spreadsheet.worksheet(SKIPPED))
        self.run_log = Table(spreadsheet.worksheet(RUN_LOG))

    def active_conferences(self):
        """Conferences with Active not set to FALSE/No, with their row number for updates."""
        out = []
        for i, row in enumerate(self.conferences.rows, start=2):
            if not (row.get("X handle") or row.get("Website") or row.get("Luma")):
                continue
            if row.get("Active", "").strip().lower() in ("false", "no", "n", "0", "off"):
                continue
            out.append({**row, "_row": i})
        return out

    def lead_index(self):
        """lead key -> (row number, sources string)."""
        index = {}
        for i, row in enumerate(self.leads.rows, start=2):
            key = lead_key(row.get("X handle"), row.get("Website"))
            if key:
                index[key] = (i, row.get("Sources", ""))
        return index

    def skipped_keys(self):
        """The Account column holds '@handle' or a domain; handles can't contain dots, so they never clash."""
        return {row.get("Account", "").strip().lstrip("@").lower() for row in self.skipped.rows} - {""}
