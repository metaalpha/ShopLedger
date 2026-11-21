# AGENTS.md

## Stack

- Node.js CommonJS application using Express 4 and body-parser.
- Browser UI is static HTML/CSS/JavaScript served from `public/`.
- Persistence is synchronous JSON file storage in `data/db.json`.

## Module map

- `routes/customers.js` — customer listing and Khata settlement endpoints.
- `routes/orders.js` — order listing, creation, retrieval, and cancellation endpoints.
- `routes/products.js` — product and active-coupon endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — coupon normalization, validation, discount calculation, and listing.
- `lib/dates.js` — today, date-key normalization, and fiscal-year helpers.
- `lib/inventory.js` — product lookup, sellable stock checks, stock changes, and summaries.
- `lib/invoice.js` — printable HTML invoice calculation and rendering.
- `lib/ledger.js` — customer lookup, Khata charges/reversals, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and filtered listing.
- `lib/pricing.js` — subtotals, proportional discounts, GST totals, and CGST/SGST split.
- `lib/reports.js` — dashboard metrics and invoice-versus-ledger reconciliation.
- `lib/store.js` — read, write, structure initialization, and audit-log persistence.
- `lib/tax.js` — item GST-rate resolution, slab percentages, and CGST/SGST splitting.

## Commands

- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test`.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed.
Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
