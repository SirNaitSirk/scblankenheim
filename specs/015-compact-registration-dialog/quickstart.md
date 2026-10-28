# Quickstart: Kompakterer Anmeldedialog prüfen

## Setup

1. `npm run dev` and sign in to `/admin`.
2. In `/admin/camps` give the current camp at least 12 camp fields: several text, two selects, one date, one textarea and three checkboxes.

## Scenarios

1. Desktop 1440 × 900: open a registration in `/admin`. Expect contact in one row of four, registration in one row of four, short camp fields in three columns, the textarea over the full width, the switches in three columns at the end. The dialog needs at most one scroll.
2. Tablet 768 px: two columns everywhere.
3. Mobile 375 px: one column, no horizontal scrolling.
4. Clear a required field and save: the error appears under that field, the grid stays intact.
5. Registration with open payment: the payment link panel is fully visible and usable.
6. Create a new registration: same layout, price tier still prefills the amount.
7. Switch the admin theme to dark: layout and colors correct.
8. Open another dialog (for example invite admin): unchanged width.

## Checks

```bash
npm run lint
npm test
```
