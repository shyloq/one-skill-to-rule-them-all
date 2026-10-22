#!/usr/bin/env python3
"""Spending tracker: categorise bank-statement CSVs, flag subscriptions, compare months.

Usage:
    python3 spending_tracker.py FOLDER [--categories rules.json] [--month YYYY-MM]

Reads every *.csv in FOLDER (any UK bank layout with a date, a description and
either one signed amount column or separate money-out / money-in columns).
Standard library only.
"""
import argparse
import csv
import json
import re
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

# First matching category wins, so order goes specific -> general.
CATEGORY_RULES = {
    "Subscriptions": [
        "netflix", "spotify", "disney", "prime video", "amazon prime", "apple.com/bill",
        "itunes", "icloud", "youtube", "now tv", "nowtv", "audible", "dropbox", "adobe",
        "microsoft 365", "openai", "chatgpt", "anthropic", "github", "notion", "patreon",
        "gym", "puregym", "the gym", "david lloyd", "headspace", "duolingo", "kindle unlimited",
        "times digital", "guardian", "paramount", "dazn", "tidal", "deezer", "nordvpn", "expressvpn",
    ],
    "Groceries": [
        "tesco", "sainsbury", "asda", "morrisons", "aldi", "lidl", "waitrose", "co-op",
        "coop", "ocado", "iceland", "m&s food", "marks & spencer food",
    ],
    "Eating out": [
        "deliveroo", "just eat", "uber eats", "mcdonald", "kfc", "nando", "greggs", "pret",
        "costa", "starbucks", "caffe nero", "wagamama", "pizza", "restaurant", "cafe", "coffee",
        "pub", "bar ", "wetherspoon",
    ],
    "Transport": [
        "tfl", "trainline", "uber", "bolt", "national rail", "lner", "avanti", "gwr", "shell",
        "bp ", "esso", "texaco", "petrol", "parking", "ringgo", "dvla", "ryanair", "easyjet",
        "citymapper", "oyster",
    ],
    "Bills & utilities": [
        "british gas", "octopus", "edf", "eon", "e.on", "scottish power", "thames water",
        "severn trent", "united utilities", "council tax", "bt ", "virgin media", "sky ",
        "vodafone", "ee ", "o2", "three", "giffgaff", "talktalk", "tv licence", "insurance",
    ],
    "Housing": ["rent", "mortgage", "letting", "landlord"],
    "Shopping": [
        "amazon", "argos", "ebay", "asos", "zara", "h&m", "next", "primark", "john lewis",
        "ikea", "boots", "superdrug", "currys", "b&q", "etsy",
    ],
    "Entertainment": ["cinema", "odeon", "vue", "cineworld", "ticketmaster", "steam", "playstation", "xbox", "nintendo"],
    "Health": ["pharmacy", "dentist", "optician", "specsavers", "nhs", "boots pharmacy"],
    "Cash": ["atm", "cash withdrawal", "cashpoint", "link "],
    "Transfers & savings": ["transfer", "savings", "pot", "standing order", "monzo pot", "isa"],
    "Income": ["salary", "payroll", "wages", "hmrc refund", "interest paid"],
}

DATE_FORMATS = ["%d/%m/%Y", "%d/%m/%y", "%Y-%m-%d", "%d-%m-%Y", "%d %b %Y", "%d %B %Y", "%d-%b-%Y", "%d-%b-%y"]

DATE_HEADERS = ["date", "transaction date", "posting date", "booking date"]
DESC_HEADERS = ["description", "transaction description", "narrative", "name", "details", "merchant", "reference", "memo"]
AMOUNT_HEADERS = ["amount", "value", "transaction amount"]
OUT_HEADERS = ["money out", "paid out", "debit", "debit amount", "withdrawals", "out"]
IN_HEADERS = ["money in", "paid in", "credit", "credit amount", "deposits", "in"]


def find_col(headers, candidates):
    lowered = [h.strip().lower() for h in headers]
    for cand in candidates:
        if cand in lowered:
            return lowered.index(cand)
    for cand in candidates:
        for i, h in enumerate(lowered):
            if cand in h:
                return i
    return None


def parse_money(text):
    text = (text or "").strip().replace("£", "").replace(",", "").replace(" ", "")
    if not text:
        return None
    neg = text.startswith("(") and text.endswith(")")
    text = text.strip("()")
    if text.endswith("-"):
        neg, text = True, text[:-1]
    try:
        value = float(text)
    except ValueError:
        return None
    return -abs(value) if neg else value


def parse_date(text):
    text = (text or "").strip()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    return None


def read_csv(path):
    """Return list of (date, description, amount) with spending as negative."""
    with open(path, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.reader(f))
    # Some banks put preamble lines above the header; find the row that looks like one.
    start = next((i for i, r in enumerate(rows) if find_col(r, DATE_HEADERS) is not None
                  and find_col(r, DESC_HEADERS) is not None), None)
    if start is None:
        print(f"  skipped {path.name}: no date/description header found", file=sys.stderr)
        return []
    header = rows[start]
    d_i, s_i = find_col(header, DATE_HEADERS), find_col(header, DESC_HEADERS)
    a_i = find_col(header, AMOUNT_HEADERS)
    o_i, n_i = find_col(header, OUT_HEADERS), find_col(header, IN_HEADERS)
    if a_i is None and o_i is None and n_i is None:
        print(f"  skipped {path.name}: no amount columns found", file=sys.stderr)
        return []
    out = []
    for r in rows[start + 1:]:
        if len(r) <= max(i for i in (d_i, s_i) if i is not None):
            continue
        date = parse_date(r[d_i])
        if not date:
            continue
        amount = parse_money(r[a_i]) if a_i is not None and a_i < len(r) else None
        if amount is None:
            money_out = parse_money(r[o_i]) if o_i is not None and o_i < len(r) else None
            money_in = parse_money(r[n_i]) if n_i is not None and n_i < len(r) else None
            amount = (money_in or 0) - abs(money_out or 0)
        out.append((date, r[s_i].strip(), amount))
    return out


def load_rules(extra_path):
    rules = {k: list(v) for k, v in CATEGORY_RULES.items()}
    if extra_path:
        extra = json.loads(Path(extra_path).read_text())
        # User rules go first so they override the built-ins.
        for cat, words in extra.items():
            rules = {cat: [w.lower() for w in words] + rules.pop(cat, []), **rules}
    return rules


def categorise(desc, amount, rules):
    d = desc.lower() + " "
    for cat, words in rules.items():
        if any(w in d for w in words):
            return cat
    return "Income" if amount > 0 else "Other"


def merchant_key(desc):
    """Normalise a description so 'NETFLIX.COM 8812' and 'NETFLIX.COM 4471' match."""
    d = re.sub(r"\b(card|payment|pos|dd|direct debit|visa|recurring|ref|to|the)\b", " ", desc.lower())
    d = re.sub(r"[0-9*#]+", " ", d)
    d = re.sub(r"[^a-z&. ]", " ", d)
    return " ".join(d.split()[:3]) or desc.lower()


def month_key(date):
    return date.strftime("%Y-%m")


# Recurring, but not something you'd cancel like a subscription.
NOT_SUBSCRIPTIONS = {"Housing", "Bills & utilities", "Groceries", "Transport", "Cash", "Health"}


def find_subscriptions(spend):
    """Merchants charged in 3+ months (or 2 consecutive) with a near-constant amount."""
    by_merchant = defaultdict(list)
    for date, desc, amount, cat in spend:
        if cat in NOT_SUBSCRIPTIONS:
            continue
        by_merchant[merchant_key(desc)].append((date, amount, desc))
    found = []
    for key, items in by_merchant.items():
        months = sorted({month_key(d) for d, _, _ in items})
        if len(months) < 2:
            continue
        items.sort()
        # Judge steadiness on recent charges so one past price rise doesn't hide a subscription.
        recent = [abs(a) for _, a, _ in items[-3:]]
        latest = recent[-1]
        steady = sum(1 for a in recent if abs(a - latest) <= 0.2 * latest) / len(recent)
        if steady < 0.6 or latest < 0.5:
            continue
        idx = [int(m[:4]) * 12 + int(m[5:]) for m in months]
        consecutive = any(b - a == 1 for a, b in zip(idx, idx[1:]))
        if len(months) < 3 and not consecutive:
            continue
        first, last = items[0][1], items[-1][1]
        found.append({
            "name": items[-1][2], "key": key, "months": len(months), "last_month": months[-1],
            "monthly": abs(last), "annual": abs(last) * 12,
            "price_change": abs(last) - abs(first) if abs(abs(last) - abs(first)) >= 0.01 else 0.0,
        })
    return sorted(found, key=lambda s: -s["annual"])


def gbp(x):
    return f"£{x:,.2f}"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("folder", help="folder containing bank statement CSVs")
    ap.add_argument("--categories", help="JSON file: {\"Category\": [\"keyword\", ...]} to add/override rules")
    ap.add_argument("--month", help="month to report on as YYYY-MM (default: latest in the data)")
    args = ap.parse_args()

    folder = Path(args.folder)
    files = sorted(folder.glob("*.csv"))
    if not files:
        sys.exit(f"No .csv files found in {folder}")
    rules = load_rules(args.categories)

    txns, seen = [], set()
    for f in files:
        for t in read_csv(f):
            if t not in seen:  # overlapping exports shouldn't double count
                seen.add(t)
                txns.append(t)
    if not txns:
        sys.exit("No transactions could be read.")

    cat_month = defaultdict(lambda: defaultdict(float))
    income = defaultdict(float)
    spend = []
    other = defaultdict(float)
    for date, desc, amount in txns:
        cat = categorise(desc, amount, rules)
        m = month_key(date)
        if amount > 0 or cat in ("Income", "Transfers & savings"):
            if amount > 0 and cat in ("Income", "Other"):
                income[m] += amount
            continue
        cat_month[m][cat] += -amount
        spend.append((date, desc, amount, cat))
        if cat == "Other":
            other[merchant_key(desc)] += -amount

    months = sorted(cat_month)
    if not months:
        sys.exit("No spending found.")
    cur = args.month or months[-1]
    if cur not in cat_month:
        sys.exit(f"No data for {cur}. Months available: {', '.join(months)}")
    prev = months[months.index(cur) - 1] if months.index(cur) > 0 else None

    print(f"\nSpending report: {cur}" + (f" vs {prev}" if prev else " (no earlier month to compare)"))
    print(f"{len(txns)} transactions across {len(files)} file(s), {months[0]} to {months[-1]}\n")
    cats = sorted(cat_month[cur].keys() | (cat_month[prev].keys() if prev else set()),
                  key=lambda c: -cat_month[cur].get(c, 0))
    print(f"{'Category':<22}{cur:>12}" + (f"{prev:>12}{'Change':>12}{'%':>8}" if prev else ""))
    print("-" * (22 + 12 + (32 if prev else 0)))
    for c in cats:
        now = cat_month[cur].get(c, 0)
        line = f"{c:<22}{gbp(now):>12}"
        if prev:
            before = cat_month[prev].get(c, 0)
            diff = now - before
            pct = f"{diff / before * 100:+.0f}%" if before else "new"
            flag = "  <-- up" if before and diff / before > 0.25 and diff > 20 else ""
            line += f"{gbp(before):>12}{diff:>+12.2f}{pct:>8}{flag}"
        print(line)
    total_now = sum(cat_month[cur].values())
    total_line = f"{'TOTAL':<22}{gbp(total_now):>12}"
    if prev:
        total_prev = sum(cat_month[prev].values())
        total_line += f"{gbp(total_prev):>12}{total_now - total_prev:>+12.2f}{(total_now - total_prev) / total_prev * 100:>+7.0f}%"
    print("-" * (22 + 12 + (32 if prev else 0)))
    print(total_line)
    if income.get(cur):
        print(f"\nIncome in {cur}: {gbp(income[cur])}  |  net: {gbp(income[cur] - total_now)}")

    subs = find_subscriptions(spend)
    print("\nRecurring charges / subscriptions")
    if not subs:
        print("  None detected (needs a steady charge in 3+ months, or 2 consecutive).")
    else:
        names = [s["name"].lower() for s in subs]
        video = [s for s in subs if any(w in s["name"].lower() for w in ("netflix", "disney", "prime video", "now tv", "nowtv", "paramount", "dazn"))]
        music = [s for s in subs if any(w in s["name"].lower() for w in ("spotify", "tidal", "deezer", "apple music", "youtube music"))]
        overlaps = {id(s) for grp in (video, music) if len(grp) > 1 for s in grp}
        for s in subs:
            notes = []
            if s["last_month"] < cur:
                notes.append(f"last seen {s['last_month']} (cancelled?)")
            if s["price_change"] > 0:
                notes.append(f"price up {gbp(s['price_change'])}")
            if id(s) in overlaps:
                notes.append("overlaps with another similar service")
            if s["last_month"] == cur and s["monthly"] < 15 and s["months"] >= 3 and not notes:
                notes.append("small & easy to forget - still using it?")
            print(f"  {s['name'][:34]:<36}{gbp(s['monthly']):>9}/mo {gbp(s['annual']):>11}/yr  {s['months']} mths"
                  + (f"  [{'; '.join(notes)}]" if notes else ""))
        active = [s for s in subs if s["last_month"] == cur]
        print(f"\n  Active recurring total: {gbp(sum(s['monthly'] for s in active))}/month "
              f"({gbp(sum(s['annual'] for s in active))}/year)")
        print("  Review each line: anything you don't recognise or don't use is worth cancelling.")

    if other:
        top = sorted(other.items(), key=lambda kv: -kv[1])[:5]
        print("\nBiggest uncategorised merchants (add them via --categories):")
        for k, v in top:
            print(f"  {k:<30}{gbp(v):>10}")
    print()


if __name__ == "__main__":
    main()
