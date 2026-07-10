#!/usr/bin/env python3
"""
Build VAT-return working listings for Domain Manage Dot Com Ltd (DMDC)
from the bookkeeping workbook DMDC__2526_20260603_Repaired.xlsx.

Produces DMDC_VAT_Listings_Jun2025-Apr2026.xlsx with:
  - Sales listing
  - Purchases, Expenses & Capex listing
  - Excluded items (out of scope / adjustments / contra), with reasons
  - Summary totals by currency
  - Notes & assumptions

Period covered: 1 June 2025 - 30 April 2026 (per instruction, pre-June 2025 ignored).
Amounts are gross cash amounts in original currency. Wise TxnID / Paypal TxnID
retained on every line for invoice matching.
"""
import datetime
import sys
import openpyxl
from openpyxl.utils import get_column_letter

SRC = sys.argv[1] if len(sys.argv) > 1 else (
    "/root/.claude/uploads/b0c5e2b7-fa16-5224-a499-4fb9ba39fe8a/"
    "a5b930f6-DMDC__2526_20260603_Repaired.xlsx")
OUT = sys.argv[2] if len(sys.argv) > 2 else "DMDC_VAT_Listings_Jun2025-Apr2026.xlsx"

PERIOD_START = datetime.datetime(2025, 6, 1)
PERIOD_END = datetime.datetime(2026, 4, 30)

# PayPal legs that net to nil against each other (the real charge is the Wise card leg)
CONTRA_TXNIDS = {
    "5TS86553UN922594D", "4LW59398EB434145S",            # NameSilo 315 +/-
    "653141866W404564J", "3SN58705HP083113J",            # ayoub attari 2 +/-
    "0RG90182UG451945E", "6305056788244511X",            # ayoub attari 2 +/-
    "6NT815494A286042C", "8WE36497YP206763U",            # ayoub attari 2 +/-
    "TRANSFER-1893844896", "TRANSFER-1893842470",        # Ryan Ewen contra (marked "Contra Entry")
}

SUPPLIER_COUNTRY = {
    # supplier -> (country, uk_or_overseas)   draft classifications, to verify vs invoices
    "GoDaddy": ("United States", "Overseas"),
    "Nominet Uk": ("United Kingdom", "UK"),
    "Fabulous Domains": ("Australia", "Overseas"),
    "Digital Ocean": ("United States", "Overseas"),
    "Ovhcloud": ("France (verify billing entity)", "Overseas"),
    "Cloudflare": ("United States", "Overseas"),
    "Mullvad VPN": ("Sweden", "Overseas"),
    "Sinch Mailgun": ("United States", "Overseas"),
    "Brevo": ("France", "Overseas"),
    "Xero": ("United Kingdom", "UK"),
    "Airtable": ("United States", "Overseas"),
    "AVAST SOFTWARE B.V.": ("Netherlands", "Overseas"),
    "PayPal": ("Luxembourg", "Overseas"),
    "Typeform": ("Spain", "Overseas"),
    "Anthropic PBC": ("United States", "Overseas"),
    "Open AI LLC": ("United States", "Overseas"),
    "LinkedIn": ("Ireland", "Overseas"),
    "CP Web Solutions Pte Ltd": ("Singapore", "Overseas"),
    "Microsoft": ("Ireland (verify billing entity)", "Overseas"),
    "Apple Store": ("United Kingdom", "UK"),
    "Amazon": ("United Kingdom (verify)", "UK"),
    "Sedo GmbH": ("Germany", "Overseas"),
    "Hire CFO Ltd": ("United Kingdom", "UK"),
    "PB Supercars": ("United Kingdom", "UK"),
    "R&T Turnaround and Recovery Ltd": ("United Kingdom", "UK"),
    "247 Creative Ltd": ("United Kingdom", "UK"),
    "Atom.com": ("United States", "Overseas"),
    "ICO": ("United Kingdom", "UK"),
    "Alex Ewen": ("United Kingdom", "UK"),
    "Angus Ewen": ("United Kingdom", "UK"),
    "Ryan Ewen": ("United Kingdom", "UK"),
    "EW3N Ltd": ("United Kingdom", "UK"),
    "Domain Capital": ("United States", "Overseas"),
    "xyz Invest LLC": ("United States", "Overseas"),
    "Greenberg & Lieberman": ("United States", "Overseas"),
    "NameSilo, LLC": ("United States", "Overseas"),
    "Booking.com": ("Netherlands", "Overseas"),
    "Easyjet": ("United Kingdom", "UK"),
    "Hotel Grandior": ("Czech Republic", "Overseas"),
    "British Airways": ("United Kingdom", "UK"),
    "Wizz Air": ("Hungary", "Overseas"),
    "Gumroad Jordi Bruin.": ("United States (verify)", "Overseas"),
    "Domain Sherpa": ("United States", "Overseas"),
    "Matthew Miller": ("", ""),
}

EMPLOYEES = {"Alex Ewen", "Angus Ewen", "Ryan Ewen"}

CUSTOMER_COUNTRY = {
    # customer -> (country, sale type)  draft, to verify
    "Name Properties Pte Ltd": ("Singapore", "Non-UK B2B"),
    "Sedo GmbH": ("Germany", "Non-UK B2B (marketplace remittance)"),
    "Bauer Consulting Group, Inc.": ("United States (TBC)", "Non-UK B2B (TBC)"),
    "xyz Invest LLC": ("United States (TBC)", "Non-UK B2B (TBC)"),
    "Domain Consultant Ltd": ("United Kingdom (TBC)", "UK B2B (TBC)"),
    "EW3N Ltd": ("United Kingdom (intercompany conduit)", "TBC"),
    "Lloyds EW3N Ltd": ("United Kingdom (intercompany conduit)", "TBC"),
    "Blockdag": ("TBC (paid via Bridge Arx)", "Non-UK B2B (TBC)"),
    "Bridge Arx": ("TBC (payment processor for BlockDAG)", "Non-UK B2B (TBC)"),
    "GoDaddy": ("TBC - GoDaddy settlement batch, underlying buyer(s) unknown", "TBC"),
}

# Main-sheet cost categories -> expense type bucket
EXPENSE_BUCKET = {
    "Advertising & Marketing": "General business expenses",
    "Audit & Accountancy fees": "General business expenses",
    "Business Entertainment": "General business expenses",
    "Travel & Accommodation": "General business expenses",
    "Cloud Hosting & Services": "Registrar & hosting fees",
    "Domain Renewal": "Registrar & hosting fees",
    "Domain Parking": "Registrar & hosting fees",
    "Commission Cost": "Commission & marketplace fees",
    "Company Domains - Not Stock": "Domain purchases",
    "Computer Equipment": "Capital expenditure",
    "Computer Equipment - Non-Tax Deductible": "Capital expenditure",
    "Software Subscriptions": "Software subscriptions & other digital services",
    "Website Development": "Software subscriptions & other digital services",
}

EXCLUDE_REASON = {
    "FX Conversion - GBP to USD": "FX conversion between own accounts - outside scope",
    "FX Conversion - USD to GBP": "FX conversion between own accounts - outside scope",
    "Loan - Agreement 1805 - Amortization": "Loan repayment - outside scope",
    "Loan - Agreement 1805 - Interest": "Loan interest - exempt/outside scope",
    "Loan - DC003 - Amortization": "Loan repayment - outside scope",
    "Loan - DC003 - Interest": "Loan interest - exempt/outside scope",
    "Loan - Tim Bevan 1 - Amortization": "Loan repayment - outside scope",
    "Loan - J McLeod": "Loan received - outside scope",
    "Loan to Falbros": "Related-party loan - outside scope",
    "Salaries": "Payroll - outside scope of VAT",
    "Dividends - EW3N": "Dividend - outside scope",
    "Inter-Co Transfer - EW3N": "Intercompany transfer - outside scope",
    "Withdraw Paypal to Wise": "Transfer between own accounts - outside scope",
    "Withdrawal Paypal to Wise - GBP": "Transfer between own accounts - outside scope",
    "Expense Recoveries": "Expense recovery - review separately",
}

sales, purchases, excluded, agency = [], [], [], []
seen_txnids = set()


def fmt_paypal(v):
    if v is None:
        return ""
    if isinstance(v, float):
        return format(int(v), "d")
    return str(v)


def wise_id(v):
    s = str(v) if v is not None else ""
    return "" if s in ("-", "None", "n/a") else s


def dedupe_key(wtx, ptx, date, amount, ccy):
    # TxnID alone is not unique: one card TxnID can cover a charge and its refund,
    # or a multi-currency split. Only identical (id, date, amount, ccy) is a true duplicate.
    tid = wtx or (("PP:" + ptx) if ptx else None)
    if not tid:
        return None
    return (tid, date, round(amount, 2), ccy)


def in_period(d):
    return isinstance(d, datetime.datetime) and PERIOD_START <= d <= PERIOD_END


def add_sale(date, customer, desc, currency, amount, category, wtx, ptx, bank, src_sheet, src_cat, note=""):
    country, stype = CUSTOMER_COUNTRY.get(customer, ("TBC", "TBC"))
    key = dedupe_key(wtx, ptx, date, amount, currency)
    if key:
        if key in seen_txnids:
            return
        seen_txnids.add(key)
    sales.append([date, "", customer, country, desc, stype, category, currency,
                  round(amount, 2), "", "", "TBC - confirm customer location/status",
                  wtx, ptx, bank, src_sheet, src_cat, note])


def add_purchase(date, supplier, desc, currency, amount, bucket, wtx, ptx, bank, src_sheet, src_cat, note=""):
    country, ukov = SUPPLIER_COUNTRY.get(supplier, ("TBC", "TBC"))
    cost = round(-amount, 2)  # bank debits negative -> show cost positive
    if supplier in EMPLOYEES:
        rc = "No - staff reimbursement (VAT per underlying receipts)"
        vat_t = "Per underlying receipts (TBC)"
        net, vat = "", ""
    elif ukov == "UK":
        rc = "No - UK supplier"
        vat_t = "UK VAT per invoice (TBC)"
        net, vat = "", ""  # gross may include UK VAT - split from invoice
    elif ukov == "Overseas":
        rc = "Yes - reverse charge (review)"
        vat_t = "Reverse charge - overseas supplier (draft)"
        net, vat = cost, 0
    else:
        rc = "TBC"
        vat_t = "TBC"
        net, vat = "", ""
    key = dedupe_key(wtx, ptx, date, amount, currency)
    if key:
        if key in seen_txnids:
            return
        seen_txnids.add(key)
    purchases.append([date, "", supplier, country, desc, bucket, ukov, rc, currency,
                      cost, net, vat, vat_t, wtx, ptx, bank, src_sheet, src_cat, note])


def extract_domain(desc):
    import re
    m = re.search(r"\(([^)]*)", str(desc or ""))
    if m and m.group(1).strip():
        return m.group(1).strip()
    return "(unspecified)"


def add_agency(date, name, desc, currency, amount, wtx, ptx, bank, src_sheet, note=""):
    desc = str(desc or "")
    is_sale_leg = "Sale" in desc
    is_payout_leg = "Purchase" in desc
    if is_sale_leg:
        leg = "Sale receipt (from buyer)" if amount >= 0 else "Sale refund (to buyer)"
    elif is_payout_leg:
        leg = "Payout to domain owner" if amount < 0 else "Payout returned/refunded"
    else:
        leg = "Sale receipt (from buyer)" if amount >= 0 else "Payout to domain owner"
    key = dedupe_key(wtx, ptx, date, amount, currency)
    if key:
        if key in seen_txnids:
            return
        seen_txnids.add(key)
    agency.append([date, extract_domain(desc), leg, name, desc, currency, round(amount, 2),
                   wtx, ptx, bank, src_sheet, note])


def add_excluded(date, name, desc, currency, amount, wtx, ptx, bank, src_sheet, src_cat, reason):
    excluded.append([date, name, desc, currency, round(amount, 2) if isinstance(amount, (int, float)) else amount,
                     wtx, ptx, bank, src_sheet, src_cat, reason])


wb = openpyxl.load_workbook(SRC, data_only=True)

# ---------------- Agency (DNWE marketplace) pre-pass ----------------
# Agency legs live in several tabs: Main ('Revenue - Domain Name Agency') and rows
# marked 'DNWE (Marketplace)' on the removed tabs. Collected first, across ALL dates,
# so that pairs straddling the 1 Jun 25 cutoff (buyer paid late May, owner paid out
# early June) can be completed instead of showing as one-sided.


def leg_side(desc, amount):
    d = str(desc or "")
    if "Sale" in d:
        return "sale"
    if "Purchase" in d:
        return "payout"
    return "sale" if amount >= 0 else "payout"


agency_candidates = []
for r in wb["Main - Cash"].iter_rows(min_row=2, values_only=True):
    if not any(v is not None for v in r):
        continue
    if r[0] == "Revenue - Domain Name Agency" and isinstance(r[2], datetime.datetime) and isinstance(r[3], (int, float)):
        agency_candidates.append((r[2], r[6] or "", r[7] or "", r[4], r[3], wise_id(r[10]),
                                  fmt_paypal(r[15]), r[1], "Main - Cash", ""))
DOMAIN_TXN_CATS = {"Domain Name Sale", "Domain Name Sale Refund", "Domain Name Purchase",
                   "Domain Purchase", "Domain Sale", "Bulk Domain name Sale"}


def is_dnwe_marked(r):
    # NB: on 'Removed - Different Period' the marker column also carries junk
    # 'DNWE (Marketplace)' values on hosting/salary rows - the category filter guards that.
    return (r[0] in DOMAIN_TXN_CATS and r[16] and "DNWE" in str(r[16]))


for sheet in ("Removed - Adj", "Removed - Different Period"):
    for r in wb[sheet].iter_rows(min_row=3, values_only=True):
        if not any(v is not None for v in r):
            continue
        if is_dnwe_marked(r) and isinstance(r[2], datetime.datetime) and isinstance(r[3], (int, float)):
            agency_candidates.append((r[2], r[6] or "", r[7] or "", r[4], r[3], wise_id(r[10]),
                                      fmt_paypal(r[15]), r[1], sheet,
                                      "Ledger-marked '" + str(r[16]) + "'"))

in_period_legs = [c for c in agency_candidates if in_period(c[0])]
pre_period_legs = [c for c in agency_candidates if c[0] < PERIOD_START]

# domains one-sided within the period -> pull the missing opposite leg from pre-period
sides_in_period = {}
for c in in_period_legs:
    d = extract_domain(c[2]).lower()
    if d != "(unspecified)":
        sides_in_period.setdefault(d, set()).add(leg_side(c[2], c[4]))
completion_legs = []
for c in pre_period_legs:
    d = extract_domain(c[2]).lower()
    if d in sides_in_period and len(sides_in_period[d]) == 1 and leg_side(c[2], c[4]) not in sides_in_period[d]:
        completion_legs.append(c)

for c in in_period_legs + completion_legs:
    date, name, desc, ccy, amount, wtx, ptx, bank, src_sheet, note = c
    if wtx in CONTRA_TXNIDS or ptx in CONTRA_TXNIDS:
        add_excluded(date, name, desc, ccy, amount, wtx, ptx, bank, src_sheet,
                     "DNWE agency", "Contra pair - nets to nil")
        continue
    if date < PERIOD_START:
        note = (note + "; " if note else "") + \
            "Dated pre-01/06/2025 - included to complete this domain's pair (matching leg is in period)"
    add_agency(date, name, desc, ccy, amount, wtx, ptx, bank, src_sheet, note)

# ---------------- Main - Cash ----------------
for r in wb["Main - Cash"].iter_rows(min_row=2, values_only=True):
    if not any(v is not None for v in r):
        continue
    cat, bank, date, amount, ccy, ttype, name, desc = r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]
    wtx, ptx = wise_id(r[10]), fmt_paypal(r[15])
    desc = desc or ""
    name = name or ""
    if not in_period(date):
        continue
    src = "Main - Cash"

    if cat in EXCLUDE_REASON:
        add_excluded(date, name, desc, ccy, amount, wtx, ptx, bank, src, cat, EXCLUDE_REASON[cat])
        continue

    # accounting adjustments / hard-coded lines (no bank transaction)
    if "[Adjustment]" in str(desc) or "[Hard Coded]" in str(desc) or bank in ("Stock / Domain Inventory", "Inter-Co Transfer - DMDC"):
        add_excluded(date, name, desc, ccy, amount, wtx, ptx, bank, src, cat,
                     "Accounting adjustment (no bank transaction). Underlying bank transactions are listed individually in this workbook.")
        continue

    if wtx in CONTRA_TXNIDS or ptx in CONTRA_TXNIDS:
        add_excluded(date, name, desc, ccy, amount, wtx, ptx, bank, src, cat, "Contra pair - nets to nil")
        continue

    if cat == "Revenue - Domain Name Agency":
        continue  # handled by the agency pre-pass above

    if cat == "Revenue - Domain Portfolio Management - DC004":
        if "Repayment" in str(desc) and "Loan" in str(desc):
            add_excluded(date, name, desc, ccy, amount, wtx, ptx, bank, src, cat, "Loan repayment (Funding Circle) - outside scope")
        elif amount < 0:
            add_purchase(date, name, desc, ccy, amount, "Registrar & hosting fees", wtx, ptx, bank, src, cat,
                         "DC004 managed-portfolio renewal - netted against DC004 management revenue in accounts")
        else:
            add_sale(date, name, desc, ccy, amount, "DC004 portfolio management", wtx, ptx, bank, src, cat)
        continue

    if cat in ("Revenue - Domain Sold", "Revenue - Domain Sold  - Blockdag"):
        # any non-adjustment row (adjustments already caught above)
        add_sale(date, name, desc, ccy, amount, "Domain sale", wtx, ptx, bank, src, cat)
        continue

    if cat == "Other Income/Costs":
        if "Cashback" in str(desc) or "cashback" in str(desc):
            add_excluded(date, name, desc, ccy, amount, wtx, ptx, bank, src, cat, "Bank cashback/reward - outside scope")
        elif name == "Atom.com":
            add_purchase(date, name, desc, ccy, amount, "Commission & marketplace fees", wtx, ptx, bank, src, cat)
        else:
            add_purchase(date, name, desc, ccy, amount, "General business expenses", wtx, ptx, bank, src, cat)
        continue

    if cat in EXPENSE_BUCKET:
        add_purchase(date, name, desc, ccy, amount, EXPENSE_BUCKET[cat], wtx, ptx, bank, src, cat,
                     "Credit/refund" if amount > 0 else "")
        continue

    if cat in ("Cost - Domain Sold (Aquired Previous year)", "Cost - Domain Sold (Aquired this year)",
               "Cost - Domain Sold (Aquired this year) - Blockdag", "Domain Aquired - Increase Stock"):
        # real (non-adjustment) stock purchases, if any
        add_purchase(date, name, desc, ccy, amount, "Domain purchases", wtx, ptx, bank, src, cat)
        continue

    add_excluded(date, name, desc, ccy, amount, wtx, ptx, bank, src, cat, "Unmapped category - REVIEW")

# ---------------- Blockdag (detail behind the two Blockdag adjustment lines) ----------------
for r in wb["Blockdag"].iter_rows(min_row=3, values_only=True):
    if not any(v is not None for v in r):
        continue
    cat, bank, date, amount, ccy, ttype, name, desc = r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]
    if not in_period(date) or not isinstance(amount, (int, float)):
        continue
    if "[Adjustment]" in str(desc or ""):
        continue  # lump lines already captured from Main as excluded adjustments
    wtx, ptx = wise_id(r[10]), fmt_paypal(r[15])
    note = "Blockdag transaction - detail behind the '[Adjustment] Blockdag' lines in Main"
    if "EW3N" in str(name):
        note += "; paid via EW3N Ltd (intercompany) - review"
    if amount >= 0:
        add_sale(date, name, desc or "Blockdag domain sale", ccy, amount, "Blockdag domain sale",
                 wtx, ptx, bank, "Blockdag", cat, note)
    else:
        add_purchase(date, name, desc or "Blockdag domain purchase", ccy, amount, "Domain purchases",
                     wtx, ptx, bank, "Blockdag", cat, note)

# ---------------- Removed - Adj (detail behind the 31 Jan 26 revenue/stock substitution adjustments) ----------------
for r in wb["Removed - Adj"].iter_rows(min_row=3, values_only=True):
    if not any(v is not None for v in r):
        continue
    cat, bank, date, amount, ccy, ttype, name, desc = r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]
    if not in_period(date) or not isinstance(amount, (int, float)):
        continue
    if is_dnwe_marked(r):
        continue  # marketplace agency leg - handled by the agency pre-pass
    wtx, ptx = wise_id(r[10]), fmt_paypal(r[15])
    note = "From 'Removed - Adj' tab: removed from P&L detail and substituted by 31 Jan 26 adjustment lines"
    if wtx in CONTRA_TXNIDS or ptx in CONTRA_TXNIDS:
        add_excluded(date, name, desc, ccy, amount, wtx, ptx, bank, "Removed - Adj", cat, "Contra pair - nets to nil")
        continue
    if cat in ("Domain Name Sale", "Bulk Domain name Sale", "Domain Sale"):
        label = "Bulk domain sale" if "Bulk" in cat else "Domain sale"
        add_sale(date, name, desc, ccy, amount, label, wtx, ptx, bank, "Removed - Adj", cat, note)
    elif cat == "Domain Name Sale Refund":
        add_sale(date, name, desc, ccy, amount, "Domain sale refund", wtx, ptx, bank, "Removed - Adj", cat, note)
    elif cat in ("Domain Name Purchase", "Domain Purchase"):
        add_purchase(date, name, desc, ccy, amount, "Domain purchases", wtx, ptx, bank, "Removed - Adj", cat, note)

# ---------------- Removed - Different Period (Feb-Apr 2026, inside the VAT period) ----------------
for r in wb["Removed - Different Period"].iter_rows(min_row=3, values_only=True):
    if not any(v is not None for v in r):
        continue
    cat, bank, date, amount, ccy, ttype, name, desc = r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]
    if not in_period(date) or not isinstance(amount, (int, float)):
        continue
    if is_dnwe_marked(r):
        continue  # marketplace agency leg - handled by the agency pre-pass
    wtx, ptx = wise_id(r[10]), fmt_paypal(r[15])
    reason_removed = str(r[16]) if r[16] else ""
    src = "Removed - Different Period"
    note = "Feb-Apr 26 transaction (after 31 Jan 26 year-end; bookkeeping may be incomplete)"
    if reason_removed and reason_removed not in ("None", "n/a"):
        note += "; ledger note: " + reason_removed

    if wtx in CONTRA_TXNIDS or ptx in CONTRA_TXNIDS:
        add_excluded(date, name, desc, ccy, amount, wtx, ptx, bank, src, cat, "Contra pair - nets to nil")
        continue
    if "Cashback" in str(desc or "") or "cashback" in str(desc or ""):
        add_excluded(date, name, desc, ccy, amount, wtx, ptx, bank, src, cat, "Bank cashback/reward - outside scope")
        continue
    if cat == "Withdraw Paypal to Wise" and "Domain Name - Purchase" in str(desc or ""):
        add_purchase(date, name, desc, ccy, amount, "Domain purchases", wtx, ptx, bank, src, cat,
                     note + "; miscategorised as PayPal withdrawal in ledger - actual card purchase")
        continue
    if cat in EXCLUDE_REASON or str(cat).startswith("Loan") or str(cat).startswith("Inter-Co") or cat == "Dividends - EW3N":
        add_excluded(date, name, desc, ccy, amount, wtx, ptx, bank, src, cat,
                     EXCLUDE_REASON.get(cat, "Outside scope of VAT"))
        continue
    if cat in ("Domain Name Sale", "Domain Sale"):
        add_sale(date, name, desc, ccy, amount, "Domain sale (GoDaddy settlement batch)", wtx, ptx, bank, src, cat, note)
        continue
    if cat in ("Domain Name Purchase", "Domain Purchase"):
        n2 = note
        if "EW3N" in str(name):
            n2 += "; paid via EW3N Ltd (intercompany) - review"
        if "[Don't Know]" in str(desc or ""):
            n2 += "; description unknown in ledger - REVIEW"
        add_purchase(date, name, desc, ccy, amount, "Domain purchases", wtx, ptx, bank, src, cat, n2)
        continue
    if cat == "Revenue - Domain Portfolio Management - DC004":
        add_purchase(date, name, desc, ccy, amount, "Registrar & hosting fees", wtx, ptx, bank, src, cat,
                     note + "; DC004 managed-portfolio renewal")
        continue
    if cat == "Other Income/Costs":
        add_purchase(date, name, desc, ccy, amount, "General business expenses", wtx, ptx, bank, src, cat, note)
        continue
    if cat in EXPENSE_BUCKET:
        add_purchase(date, name, desc, ccy, amount, EXPENSE_BUCKET[cat], wtx, ptx, bank, src, cat, note)
        continue
    add_excluded(date, name, desc, ccy, amount, wtx, ptx, bank, src, cat, "Unmapped category - REVIEW")

# ---------------- DC004 (managed portfolio - gross sale receipts & portfolio purchase) ----------------
for r in wb["DC004"].iter_rows(min_row=4, values_only=True):
    if not any(v is not None for v in r):
        continue
    cat, bank, date, amount, ccy, ttype, name, desc = r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]
    if not in_period(date) or not isinstance(amount, (int, float)):
        continue
    if "[Hard Coded]" in str(desc or ""):
        add_excluded(date, name, desc, ccy, amount, wise_id(r[10]), "", bank, "DC004", cat,
                     "Hard-coded DMDC share of DC004 revenue (accounting figure, no bank transaction). "
                     "Gross DC004 sale receipts are listed individually in the Sales tab.")
        continue
    wtx, ptx = wise_id(r[10]), ""
    if cat == "Domain Purchase - DC004":
        add_purchase(date, name, desc, ccy, amount, "Domain purchases", wtx, ptx, bank, "DC004", cat,
                     "Purchase of remaining DC004 portfolio")
    elif cat == "Domain Name Management - DC004" and amount >= 0:
        note = ("DC004 managed-portfolio sale - gross receipt; DMDC's commission share is hard-coded "
                "in the accounts (agent vs principal VAT treatment to confirm)")
        if "EW3N" in str(name):
            note += "; funds received via EW3N Ltd (intercompany) - review"
        add_sale(date, name, desc, ccy, amount, "DC004 portfolio sale (gross receipt)", wtx, ptx, bank, "DC004", cat, note)
    # renewals etc. in this tab are already in Main (dedupe by TxnID protects anyway)

# ---------------- Sheet7 (Synagogue.com sale received via EW3N) ----------------
for r in wb["Sheet7"].iter_rows(min_row=2, values_only=True):
    if not any(v is not None for v in r):
        continue
    cat, bank, date, amount, ccy, ttype, name, desc = r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]
    if not in_period(date) or not isinstance(amount, (int, float)):
        continue
    wtx, ptx = wise_id(r[10]), fmt_paypal(r[15])
    if cat == "Domain Name Sale" and amount >= 0:
        add_sale(date, name, desc, ccy, amount, "Domain sale", wtx, ptx, bank, "Sheet7", cat,
                 "Removed from accounts as EW3N intercompany (buyer paid Escrow.com -> EW3N in error). "
                 "Genuine DMDC domain sale - confirm inclusion in VAT return")
    elif cat == "Domain Name Purchase":
        add_purchase(date, name, desc, ccy, amount, "Domain purchases", wtx, ptx, bank, "Sheet7", cat,
                     "From Sheet7 (adjustment tab) - review")

# ---------------- flag possible ledger duplicates ----------------
# Same TxnID + amount + currency appearing on more than one line (different dates)
# is almost certainly the same real-world transaction entered twice.
from collections import Counter as _Counter
_ids = _Counter()
for row in sales:
    if row[12] or row[13]:
        _ids[(row[12], row[13], row[8], row[7])] += 1
for row in purchases:
    if row[13] or row[14]:
        _ids[(row[13], row[14], row[9], row[8])] += 1
for row in agency:
    if row[7] or row[8]:
        _ids[(row[7], row[8], row[6], row[5])] += 1
for row in agency:
    if (row[7] or row[8]) and _ids[(row[7], row[8], row[6], row[5])] > 1:
        row[11] = (row[11] + "; " if row[11] else "") + "DUPLICATE TxnID+amount in ledger - possible double entry, VERIFY"
for row in sales:
    if (row[12] or row[13]) and _ids[(row[12], row[13], row[8], row[7])] > 1:
        row[17] = (row[17] + "; " if row[17] else "") + "DUPLICATE TxnID+amount in ledger - possible double entry, VERIFY"
for row in purchases:
    if (row[13] or row[14]) and _ids[(row[13], row[14], row[9], row[8])] > 1:
        row[18] = (row[18] + "; " if row[18] else "") + "DUPLICATE TxnID+amount in ledger - possible double entry, VERIFY"

# ---------------- write output ----------------
sales.sort(key=lambda x: x[0])
purchases.sort(key=lambda x: x[0])
excluded.sort(key=lambda x: (x[0] is None, x[0]))
agency.sort(key=lambda x: (x[1].lower(), x[0]))  # by domain, then date

out = openpyxl.Workbook()

SALES_HDR = ["Invoice Date", "Invoice Number", "Customer Name", "Customer Country", "Description",
             "Sale Type (UK / Non-UK B2B / Non-UK B2C)", "Sale Category", "Currency", "Gross Amount",
             "Net Amount", "VAT Amount", "VAT Treatment", "Wise TxnID", "Paypal TxnID", "Bank Account",
             "Source Sheet", "Source Category", "Notes / Flags"]
PURCH_HDR = ["Invoice Date", "Invoice Number", "Supplier Name", "Supplier Country", "Description",
             "Expense Type", "UK / Overseas", "Reverse Charge?", "Currency", "Gross Amount",
             "Net Amount", "VAT Amount", "VAT Treatment", "Wise TxnID", "Paypal TxnID", "Bank Account",
             "Source Sheet", "Source Category", "Notes / Flags"]
EXCL_HDR = ["Date", "Name", "Description", "Currency", "Amount", "Wise TxnID", "Paypal TxnID",
            "Bank Account", "Source Sheet", "Source Category", "Reason Excluded"]


def write_sheet(ws, header, rows, date_col=1):
    ws.append(header)
    for c in ws[1]:
        c.font = openpyxl.styles.Font(bold=True)
    for row in rows:
        ws.append(row)
    for row in ws.iter_rows(min_row=2, min_col=date_col, max_col=date_col):
        for c in row:
            c.number_format = "dd/mm/yyyy"
    widths = {1: 12}
    for i, h in enumerate(header, 1):
        w = max(len(str(h)) + 2, 12)
        ws.column_dimensions[get_column_letter(i)].width = min(w, 40)
    ws.column_dimensions["E"].width = 50
    ws.freeze_panes = "A2"


AGENCY_HDR = ["Date", "Domain", "Leg", "Counterparty", "Description", "Currency",
              "Amount (receipts +, payouts -)", "Wise TxnID", "Paypal TxnID", "Bank Account",
              "Source Sheet", "Notes / Flags"]
AGENCY_REV_HDR = ["Invoice Date", "Invoice Number", "Domain", "Buyer (paid DMDC)", "Domain Owner (paid out)",
                  "Description", "Currency", "Sale Receipts (net of refunds)", "Payouts to Owner (net of returns)",
                  "NET AGENCY REVENUE", "VAT Amount", "VAT Treatment", "Wise/Paypal TxnIDs (all legs)",
                  "# Legs", "Notes / Flags"]

ws = out.active
ws.title = "Sales"
write_sheet(ws, SALES_HDR, sales)
ws2 = out.create_sheet("Purchases Expenses Capex")
write_sheet(ws2, PURCH_HDR, purchases)

wsA = out.create_sheet("Agency - DNWE Workings")
write_sheet(wsA, AGENCY_HDR, agency)

# One revenue entry per domain: DMDC's revenue = sale receipts less payout to the domain owner
net_by_domain = {}
for row in agency:
    date, domain, leg, cpty, ccy, amt, wtx, ptx, note = row[0], row[1], row[2], row[3], row[5], row[6], row[7], row[8], row[11]
    k = (domain.lower(), ccy)
    e = net_by_domain.setdefault(k, {"domain": domain, "ccy": ccy, "recv": 0.0, "paid": 0.0,
                                     "n": 0, "recv_date": None, "last": date,
                                     "buyers": [], "owners": [], "ids": [], "flags": []})
    e.setdefault("sale_pos", 0.0)
    e.setdefault("sale_neg", 0.0)
    if leg.startswith("Sale"):
        e["recv"] += amt
        if amt >= 0:
            e["sale_pos"] += amt
        else:
            e["sale_neg"] += amt
        if cpty and cpty not in e["buyers"]:
            e["buyers"].append(cpty)
        if e["recv_date"] is None or date > e["recv_date"]:
            e["recv_date"] = date
    else:
        e["paid"] += amt
        if cpty and cpty not in e["owners"]:
            e["owners"].append(cpty)
    e["n"] += 1
    e["last"] = max(e["last"], date)
    tid = wtx or ptx
    if tid and tid not in e["ids"]:
        e["ids"].append(tid)
    if "DUPLICATE" in str(note) and "Duplicate leg in ledger - VERIFY" not in e["flags"]:
        e["flags"].append("Duplicate leg in ledger - VERIFY")

wsN = out.create_sheet("Agency Revenue Entries")
net_rows = []
for e in sorted(net_by_domain.values(), key=lambda x: x["domain"].lower()):
    flags = list(e["flags"])
    if e["recv"] and not e["paid"]:
        if e.get("sale_pos") and e.get("sale_neg"):
            flags.append("Sale refunded to buyer - no owner payout due (net = payment fees lost)")
        else:
            flags.append("Receipt only - owner payout may be outside period or not yet made")
    elif e["paid"] and not e["recv"]:
        flags.append("Payout only - matching sale receipt outside the period or settled via another channel")
    net_rows.append([e["recv_date"] or e["last"], "", e["domain"],
                     "; ".join(e["buyers"]), "; ".join(e["owners"]),
                     f"Agency sale of {e['domain']} - net commission (buyer receipts less owner payout)",
                     e["ccy"], round(e["recv"], 2), round(e["paid"], 2),
                     round(e["recv"] + e["paid"], 2), "", "TBC - agency commission",
                     "; ".join(e["ids"]), e["n"], "; ".join(flags)])
net_rows.sort(key=lambda x: x[0])
write_sheet(wsN, AGENCY_REV_HDR, net_rows)
tot_recv, tot_paid = {}, {}
for row in net_rows:
    tot_recv[row[6]] = tot_recv.get(row[6], 0) + row[7]
    tot_paid[row[6]] = tot_paid.get(row[6], 0) + row[8]
for ccy in sorted(tot_recv):
    wsN.append(["", "", "TOTAL", "", "", "", ccy, round(tot_recv[ccy], 2), round(tot_paid[ccy], 2),
                round(tot_recv[ccy] + tot_paid[ccy], 2), "", "", "", "", ""])
wsN.column_dimensions["C"].width = 30
wsN.column_dimensions["F"].width = 55
wsN.column_dimensions["M"].width = 45

ws3 = out.create_sheet("Excluded - Out of Scope")
write_sheet(ws3, EXCL_HDR, excluded)

# Summary
ws4 = out.create_sheet("Summary")
ws4.append(["Summary - gross cash amounts by currency (period 01/06/2025 - 30/04/2026)"])
ws4.append([])
ws4.append(["SALES", "Currency", "Count", "Gross Total"])
agg = {}
for row in sales:
    agg.setdefault((row[6], row[7]), [0, 0.0])
    agg[(row[6], row[7])][0] += 1
    agg[(row[6], row[7])][1] += row[8]
for (catg, ccy), (n, tot) in sorted(agg.items()):
    ws4.append([catg, ccy, n, round(tot, 2)])
tot_by_ccy = {}
for row in sales:
    tot_by_ccy[row[7]] = tot_by_ccy.get(row[7], 0) + row[8]
for ccy, tot in sorted(tot_by_ccy.items()):
    ws4.append(["TOTAL SALES (excl. agency)", ccy, "", round(tot, 2)])
ws4.append([])
ws4.append(["AGENCY - DNWE MARKETPLACE (net = DMDC revenue)", "Currency", "Count", "Total"])
a_recv, a_paid, a_n = {}, {}, {}
for row in agency:
    ccy, amt = row[5], row[6]
    a_n[ccy] = a_n.get(ccy, 0) + 1
    if row[2].startswith("Sale"):
        a_recv[ccy] = a_recv.get(ccy, 0) + amt
    else:
        a_paid[ccy] = a_paid.get(ccy, 0) + amt
for ccy in sorted(a_n):
    ws4.append(["Agency sale receipts (net of refunds)", ccy, "", round(a_recv.get(ccy, 0), 2)])
    ws4.append(["Agency payouts to domain owners (net of returns)", ccy, "", round(a_paid.get(ccy, 0), 2)])
    ws4.append(["NET AGENCY REVENUE", ccy, a_n[ccy], round(a_recv.get(ccy, 0) + a_paid.get(ccy, 0), 2)])
ws4.append([])
ws4.append(["PURCHASES / EXPENSES / CAPEX", "Currency", "Count", "Gross Total"])
agg = {}
for row in purchases:
    agg.setdefault((row[5], row[8]), [0, 0.0])
    agg[(row[5], row[8])][0] += 1
    agg[(row[5], row[8])][1] += row[9]
for (catg, ccy), (n, tot) in sorted(agg.items()):
    ws4.append([catg, ccy, n, round(tot, 2)])
tot_by_ccy = {}
for row in purchases:
    tot_by_ccy[row[8]] = tot_by_ccy.get(row[8], 0) + row[9]
for ccy, tot in sorted(tot_by_ccy.items()):
    ws4.append(["TOTAL PURCHASES", ccy, "", round(tot, 2)])
for col, w in {"A": 45, "B": 10, "C": 8, "D": 16}.items():
    ws4.column_dimensions[col].width = w

# Notes
ws5 = out.create_sheet("Notes & Assumptions")
notes = [
    "VAT return working listings - Domain Manage Dot Com Ltd (DMDC) - VAT period ended April 2026",
    "Source: DMDC__2526_20260603_Repaired.xlsx (bookkeeping workbook). Prepared from cash/bank transaction data.",
    "",
    "PERIOD: transactions dated 01/06/2025 to 30/04/2026, per instruction. Pre-June 2025 transactions ignored.",
    "Transactions to 31/01/2026 come from 'Main - Cash' (plus its supporting tabs).",
    "Transactions 01/02/2026 - 30/04/2026 come from the 'Removed - Different Period' tab (removed from the FY25/26",
    "accounts as after year-end). Bookkeeping for Feb-Apr 2026 may be incomplete - to be confirmed.",
    "",
    "AMOUNTS: all amounts are GROSS CASH amounts in the original transaction currency (GBP/USD/EUR).",
    "Convert to GBP at HMRC-approved rates when preparing the return. Sales shown positive (refunds negative);",
    "purchases shown positive as costs (refunds/credits negative).",
    "",
    "INVOICE NUMBERS: left blank; Wise TxnID / Paypal TxnID retained on every line for matching to invoices.",
    "",
    "NET / VAT / TREATMENT COLUMNS: draft only. For overseas suppliers, Net = amount paid and VAT = 0 with",
    "reverse charge flagged for review. For UK suppliers, gross may include UK VAT - split to be taken from the",
    "purchase invoices, so Net/VAT left blank. Customer country / B2B-B2C status is not recorded in the",
    "bookkeeping data - marked TBC except where the customer name identifies the entity. Supplier countries are",
    "draft classifications from supplier names - verify against invoices (billing entity matters, e.g. Microsoft/",
    "Amazon/OVHcloud may bill from UK/IE/EU entities).",
    "",
    "ADJUSTMENT LINES: the workbook's '[Adjustment]' and '[Hard Coded]' lines (Blockdag lump sale/purchase,",
    "31 Jan 26 revenue substitution, stock movements, DC004 hard-coded revenue) are EXCLUDED from these listings",
    "and shown on the 'Excluded - Out of Scope' tab, because the underlying bank transactions are listed",
    "individually (Blockdag tab, 'Removed - Adj' tab, DC004 tab). Note: the removed detail does not reconcile",
    "1:1 to the 31 Jan 26 substitution adjustments - accountant to confirm the revenue recognition basis for VAT.",
    "",
    "DC004: receipts from sales of managed DC004 portfolio domains are shown GROSS; DMDC's commission share is",
    "hard-coded in the accounts. Agent vs principal VAT treatment to be confirmed. DC004 renewal costs paid by",
    "DMDC are listed under Registrar & hosting fees.",
    "",
    "AGENCY (DNWE MARKETPLACE): all 'Revenue - Domain Name Agency' transactions are on the",
    "'Agency - DNWE Workings' tab, NOT in Sales/Purchases. Although the ledger descriptions read 'Sale' and",
    "'Purchase', DMDC does not acquire these domains: the buyer pays DMDC (sale receipt leg) and DMDC then",
    "remits the price less its commission to the domain owner (payout leg). DMDC's revenue is the NET of the",
    "two legs. The 'Agency Revenue Entries' tab pairs the legs by domain and creates ONE REVENUE LINE PER",
    "DOMAIN (net commission) - these lines are the agency revenue for the VAT return; the workings tab shows",
    "how each is made up, with all Wise/Paypal TxnIDs. Agency legs are identified across ALL tabs by their",
    "'DNWE (Marketplace)' ledger marking (Main + removed tabs). Where a domain's pair straddles 1 Jun 25 (buyer",
    "paid late May, owner paid early June: KeepAchieving.com, Syncthetic.com, zabux.com) the pre-period leg is",
    "included and flagged so the pair completes. 'Sale refunded to buyer' entries had the sale reversed - no",
    "owner payout was due and the small negative net is payment fees lost. VAT treatment of the commission",
    "(agent basis) to be confirmed by the accountant.",
    "",
    "FLAGGED ITEMS: (1) Synagogue.com sale USD 40,000 (21/11/2025) received via EW3N Ltd - removed from accounts",
    "as intercompany but appears to be a genuine DMDC domain sale; (2) domain purchases funded via EW3N Ltd",
    "(invest.net, spartans.us, jmy.com); (3) Anthony Dancaster payment 24/03/2026 marked [Don't Know] in ledger.",
    "",
    "BOOKKEEPING / RECONCILIATION CONFIRMATION: cannot be confirmed from this file. The workbook's own note says",
    "domain revenue does not fully match bank statements due to the DC004 revenue split. Client to confirm",
    "bookkeeping completion and bank reconciliations to the accountant.",
]
for n in notes:
    ws5.append([n])
ws5.column_dimensions["A"].width = 115

out.save(OUT)
print(f"Wrote {OUT}")
print(f"Sales rows: {len(sales)} | Purchase rows: {len(purchases)} | Excluded rows: {len(excluded)}")
