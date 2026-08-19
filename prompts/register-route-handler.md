# Prompt: Public `register` route handler + wire the registration form

## Goal

Make the public registration form actually persist a registration. Today
[registration-form.tsx](../components/marketing/registration-form.tsx) validates
client-side and then deliberately dead-ends (`setSubmitted(true)`, no network
call — see lines 145-148). Build the missing server route handler
`app/api/register` (in-scope per AGENTS.md §4/§6) that writes a row to
`registrations`, and wire the form to call it and reflect the real result.

Scope is **registration only** — no Stripe/checkout here. A new registration is
created as `status: "pending"`, `payment_status: "unpaid"` (the intentional
tolerant fallback: registered-but-unpaid is valid; admins reconcile later).

## Existing code inspected

- [registration-form.tsx](../components/marketing/registration-form.tsx) — client form. Core fields (`first_name`, `last_name`, `email`) + dynamic `camp_form_fields`. Per-field Zod rules: required, email regex, numeric. Currently no network submit.
- [registration-section.tsx](../components/marketing/registration-section.tsx) — Server Component; only renders the form when `state === "open"`.
- [lib/marketing/current-camp.ts](../lib/marketing/current-camp.ts) — anon read of current camp + fields + `getRegistrationState`.
- [lib/admin/data.ts](../lib/admin/data.ts) — server-only, service-role. Reuse:
  - `createRegistration(campId, input: RegistrationInput)` — inserts + retries on reference collision (lines 289-305).
  - `isUniqueViolation` (553), `generateReference` pattern (280).
- [lib/supabase/server.ts](../lib/supabase/server.ts) — `getServiceClient()` (service-role, RLS-bypassing, server-only).
- [supabase/migrations/0001_init_schema.sql](../supabase/migrations/0001_init_schema.sql) — `registrations`, `price_tiers` (hidden via `invitation_token`, `valid_from/until`), `submission_attempts`, `camps.base_price`.
- [proxy.ts](../proxy.ts) — only `/admin(.*)` is protected; `/api/register` is public. Good (public endpoint).
- Types: `RegistrationInput`, `RegistrationStatus`, `PaymentStatus`, `CampFormField` in [lib/admin/types.ts](../lib/admin/types.ts).

## Decisions / assumptions

- **No new migration.** Schema already has everything (`registrations`, `submission_attempts`, `price_tiers`). No DB types regen needed.
- **Server is the gate.** Re-validate everything server-side against the *current camp's* `camp_form_fields` (never trust the client). Reject a submit if the camp's registration state is not `open`.
- **Amount:** `amount_due` = camp `base_price` by default. If a valid hidden/visible price-tier `invitation_token` is supplied, use that tier's `price` + link `price_tier_id`. `amount_paid` = 0. (Money = integer whole euros, per schema.) Invitation token is read from the request body (`priceTierToken`, optional); tiers are resolved server-side with the service-role client so hidden prices never reach the browser.
- **Throttle** via `submission_attempts`: record every attempt (email + IP + camp_id); before insert, reject with `429` if the same email OR IP already has ≥ 5 attempts in the last 10 minutes. Centralize the limits as named constants.
- **Reference** returned to the client for the success screen.
- Keep the route thin; business logic in a new server-only lib module.

## Files to change

- **NEW** `app/api/register/route.ts` — `POST` handler. Parse JSON, Zod-parse the envelope, delegate to the lib helper, map result → `200 { reference }` / `400 { error, fieldErrors }` / `409 closed` / `429` / `500 { error }`. `export const runtime = "nodejs"`.
- **NEW** `lib/register/service.ts` — `"server-only"`. Exports `submitRegistration(payload)`:
  1. Load current camp id + `base_price` + registration state (service-role); if not `open` → `{ ok: false, reason: "closed" }`.
  2. Load `camp_form_fields`; build the field set = CORE (`first_name`, `last_name`, `email`, all required) + dynamic (deduped by key), mirroring the client's `mergeFields`.
  3. Validate submitted `values` against those fields (required / email / number rules matching the client). Collect `fieldErrors: Record<key,message>`; if any → `{ ok:false, reason:"invalid", fieldErrors }`.
  4. Resolve optional `priceTierToken` → tier (must belong to camp, within validity window) → `amountDue` + `priceTierId`; else `base_price` + `null`.
  5. Throttle check + record `submission_attempts`.
  6. Split values into core columns vs `form_data` (dynamic keys), build `RegistrationInput` (`status:"pending"`, `payment:"unpaid"`, `amountPaid:0`), call `createRegistration`.
  7. Best-effort `logs` insert (`level:"info"`, `action:"registration.created"`); never fail the request if logging fails.
  8. Return `{ ok:true, reference }`.
- **EDIT** [components/marketing/registration-form.tsx](../components/marketing/registration-form.tsx) — `handleSubmit` becomes async: after client-side validation passes, `POST /api/register`; add `submitting`/`serverError` state; disable button + show "Wird gesendet …" while pending; on `200` show success (with reference); on `400` merge `fieldErrors` into `errors`; on `409`/`429`/`500` show a German error notice (add `tone="danger"` or reuse muted). Success copy references the real registration; drop the "wird gerade finalisiert" deferred wording.
- German copy stays in the component's `copy` object (UI is 100% German).

## Implementation requirements

- TypeScript throughout, explicit types, no `any`. Small functions.
- Zod validates the request envelope (`values: Record<string,string|boolean>`, optional `priceTierToken: string`).
- Reuse `createRegistration`, `isUniqueViolation`, `getServiceClient`; do **not** duplicate the insert/retry logic.
- Do not read/write anything with the anon client in the route; all server work uses the service-role client.
- Named constants for throttle window/limit.

## Security requirements

- Service-role key, secrets never reach the browser; all privileged work in the route/lib (server-only).
- Never render or return hidden price-tier prices except as the resolved `amount_due` of the caller's own registration.
- Server re-validates all fields and the open/closed state — client validation is not trusted.
- Capture client IP from `x-forwarded-for` (first hop) defensively; tolerate its absence.
- No auth required (public endpoint) — but the endpoint must be safe under abuse (throttle).

## Acceptance criteria

- Submitting a valid form when registration is **open** inserts one `registrations` row (`status pending`, `payment unpaid`, correct `amount_due`, core columns + `form_data`) and the UI shows a German success state with the reference.
- Missing/invalid required fields → `400` with `fieldErrors`, shown inline in German; no row inserted.
- Registration not open → `409`; UI shows a German "closed" message; no row.
- > 5 attempts / 10 min for same email or IP → `429`; UI shows a German rate-limit message.
- A valid `priceTierToken` sets `amount_due` to the tier price and links `price_tier_id`; an invalid/expired token falls back to `base_price` (still succeeds).
- No hidden price leaks to the client.

## Checks to run

- `npm run lint`
- `npm run build` (new route + client change can affect the build)

## Manual test steps

1. `npm run dev`, open http://localhost:3000/#anmelden (current camp is `open`).
2. Submit empty → inline "Pflichtfeld" errors, no request succeeds.
3. Fill valid data, submit → success screen with a `REG-XXXXXXXX` reference.
4. Verify in Supabase: one new `registrations` row with the entered core fields, dynamic answers in `form_data`, `status=pending`, `payment_status=unpaid`, `amount_due=base_price`.
5. Rapidly submit 6× with the same email → 6th returns the German rate-limit message.
6. (If a hidden tier exists) submit with its `priceTierToken` → row's `amount_due` = tier price, `price_tier_id` set.
