# Multi-currency schema guidance (Travel Planner)

This app currently treats all budget values as a single currency (implicitly USD in the frontend). To support multi-currency end-to-end, add:

1) a **trip base currency** (used as the default for all planned budgets and as the default display currency)
2) an optional **expense currency** (so individual expenses can be logged in a different currency than the trip base currency)

> Note: This guidance is intentionally lightweight and compatible with the current “create tables on startup” approach in the backend. If you use migrations, apply these as migrations.

---

## Recommended fields

### trips
Add a base currency code to each trip.

- `currency_code` (TEXT, NOT NULL, default `'USD'`)

Suggested SQL (apply **one statement at a time**):

```sql
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS currency_code TEXT NOT NULL DEFAULT 'USD';
```

### budget_expenses
Allow each expense to record which currency it was paid in.

- `currency_code` (TEXT, NULL) — if NULL, treat as the trip currency
- Optional future-proofing:
  - `amount_in_trip_currency` (NUMERIC(12,2), NULL) — if you later add conversion

Suggested SQL:

```sql
ALTER TABLE budget_expenses
ADD COLUMN IF NOT EXISTS currency_code TEXT;
```

---

## Behavior rules

- **Trip currency (`trips.currency_code`)**
  - Default: `USD`
  - Must be a 3-letter ISO-4217 code (e.g., `USD`, `EUR`, `JPY`)
- **Expense currency (`budget_expenses.currency_code`)**
  - If omitted/null: treat as the trip’s currency
  - If provided: store as uppercase ISO-4217 code
- **Budget summary**
  - In this template, summary totals should be computed **in trip currency only**.
  - If an expense has a different currency than the trip currency, the backend should reject it for now (no conversion rates service is implemented).

---

## Optional: add a supported currencies reference list

Not required for functionality, but helpful:

- Maintain a small allowlist in backend code (USD/EUR/GBP/JPY/CAD/AUD/CHF/CNY/INR etc.)
- Validate inputs and return 422 with a clear message.
