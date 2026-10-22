# Spending tracker

Drop your monthly bank-statement CSVs in a folder and run:

```
python3 spending_tracker.py ~/statements
```

You get, for the latest month (or `--month YYYY-MM`):

- spending by category (food, transport, subscriptions, bills...) with month-over-month change, and a flag on big jumps
- income and net for the month
- recurring charges with monthly and yearly cost, flagged when the price has gone up, the charge has stopped, similar services overlap (e.g. two video streamers), or it is small enough to forget
- the biggest uncategorised merchants, so you can teach it

Python 3 standard library only. Nothing leaves your machine.

## Bank formats

Works with any CSV that has a date column, a description column and either one signed `Amount` column or separate `Money out` / `Money in` (or `Paid out` / `Paid in`, `Debit` / `Credit`) columns. Dates in `dd/mm/yyyy`, `yyyy-mm-dd` and similar are understood; lines above the header row are ignored. Several files can sit in the folder; duplicate rows from overlapping exports are dropped.

## Custom categories

Create a JSON file; its keywords are checked before the built-in ones:

```json
{"Pets": ["pets at home", "vets4pets"], "Subscriptions": ["my gym club"]}
```

```
python3 spending_tracker.py ~/statements --categories my-rules.json
```

Try it on the sample data: `python3 spending_tracker.py sample-statements`.

## Limits

Recurring detection needs a similar charge in 3+ months (or 2 consecutive). Rent, utilities, groceries and transport are recurring but not listed as subscriptions. Statements contain personal data, so keep them out of git.
