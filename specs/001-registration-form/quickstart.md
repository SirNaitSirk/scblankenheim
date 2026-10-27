# Quickstart: Validate Public Camp Registration

**Contracts**: [register-api](./contracts/register-api.md) ·
[RPC](./contracts/create-public-registration.md) · [UI](./contracts/landing-registration-ui.md)

## Prerequisites

- `.env.local` with Supabase URL, anon key and service role key, plus Clerk keys.
- Migration `0005_public_registration_capacity.sql` applied, types regenerated.
- A current camp with a few questions, one `select` with `config.capacity`, and one hidden price tier
  with an `invitation_token`.

## Automated checks

```bash
npm run lint
```

```bash
npm test
```

```bash
npm run build
```

Expected: all three pass; `npm test` covers every branch of the window rule and the field
validation.

## Manual scenarios

Start the app with `npm run dev` and open http://localhost:3000.

| # | Setup (admin camp settings) | Action | Expected |
|---|-----------------------------|--------|----------|
| 1 | open, no deadline, no capacity | fill and submit | reference shown; row `pending` / `unpaid` with base price |
| 2 | same | submit with empty required field | inline error, nothing stored |
| 3 | switch off, opens in 2 minutes | wait at `#anmelden` | countdown, then form appears without manual reload |
| 4 | open, deadline in the past | load page; also `curl` a POST | closed notice; API answers 409 |
| 5 | capacity = current active count | load page; also `curl` a POST | "ausgebucht" notice; API answers 409 |
| 6 | capacity = active count + 1 | send two POSTs in parallel (below) | exactly one 200, one 409 |
| 7 | option limit with one seat left | two parallel POSTs selecting that option | exactly one 200, one 409 with field error |
| 8 | valid invitation token | open `/?einladung=<token>#anmelden`, register, then "Noch jemanden anmelden" and register again | hint without amount visible; both rows carry tier price and `price_tier_id` |
| 9 | expired or foreign token | open link and register | no hint; base price |
| 10 | no token | view page source | no tier names, prices or tokens in the HTML |
| 11 | any | trigger each error in browser and via `curl` | identical German wording; no dashes in any text |
| 12 | any | 320 px wide viewport | no horizontal scroll, all fields usable |

Parallel request for scenarios 6 and 7 (replace values as needed):

```bash
for i in 1 2; do curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/register -H "Content-Type: application/json" -d "{\"values\":{\"first_name\":\"Test$i\",\"last_name\":\"Race\",\"email\":\"race$i@example.com\"}}" & done; wait
```

## Admin note

Once `registration_opens_at` lies in the past, the manual switch alone no longer closes
registration (automatic opening). To close early, set `registration_closes_at` to now or clear the
opening time.
