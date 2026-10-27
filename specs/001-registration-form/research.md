# Research: Public Camp Registration

**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Date**: 2026-10-27

All Technical Context unknowns are resolved below. Each entry records the decision, why, and what
was rejected.

## R1 · Registration window rule (FR-001 to FR-004, FR-011)

**Decision**: One pure function `getRegistrationState(camp, now, activeCount)` returns
`open | countdown | closed | full` and is used by both the landing page and the register service.
Order of evaluation:

1. No current camp → `closed`.
2. `registration_closes_at` set and `now >= closes_at` → `closed`.
3. `registration_open = true` → open candidate.
4. `registration_open = false` and `registration_opens_at` set:
   `now < opens_at` → `countdown`; `now >= opens_at` → open candidate (automatic opening, Q1).
5. Otherwise → `closed`.
6. Open candidate and `capacity` set and `activeCount >= capacity` → `full`; else `open`.

The countdown no longer falls back to `start_date`. Automatic opening on the camp start date would
open registration on the first camp day, which is never intended.

**Rationale**: The rule is evaluated lazily on every request (the page is already
`force-dynamic`), so no cron job or stored flag flip is needed. Server and page cannot disagree
because they share the function.

**Consequence for admins**: once `opens_at` lies in the past, switching `registration_open` off no
longer closes registration. To close early, admins set `registration_closes_at` to now (or clear
`opens_at`). This is documented in [quickstart.md](./quickstart.md); adapting the admin camp form
copy is a separate admin feature.

**Alternatives considered**:
- Vercel Cron flips `registration_open` at `opens_at`: extra moving part, up to one cron interval of
  delay, and still needs the lazy check for correctness. Rejected.
- Treat `registration_open = false` as hard override that also blocks automatic opening: then auto
  opening would never happen for a closed camp, contradicting Q1. Rejected.

## R2 · Race free capacity checks (FR-017, FR-027 to FR-030, SC-004, SC-004a)

**Decision**: New Postgres function `public.create_public_registration(...)` in migration
`0005_public_registration_capacity.sql`. Inside one transaction it takes
`pg_advisory_xact_lock(hashtext(camp_id::text))`, counts active registrations of the camp, checks
the camp total capacity and every selected capacity limited option, and inserts the row only when
all checks pass. It returns a status code (`ok`, `camp_full`, `option_full`) plus the offending
field keys. Execute is revoked from `anon` and `authenticated` and granted only to `service_role`;
the register service calls it through `supabase.rpc`.

**Rationale**: Today the service counts in JS and inserts afterwards, so two parallel requests can
both see one free seat. A per camp advisory lock serializes only registrations of the same camp,
which is cheap at camp scale (hundreds of rows) and keeps all logic in one place.

**Alternatives considered**:
- `SERIALIZABLE` isolation with retry: supabase.js has no transaction API; would need the same RPC
  anyway plus retry logic. Rejected.
- Counter column with conditional `UPDATE ... WHERE taken < capacity`: needs a second counter per
  option, drift risk on admin deletes and edits. Rejected.
- Unique constraint tricks: not applicable to counts. Rejected.

## R3 · Definition of "active registration" (FR-030)

**Decision**: Active means `deleted = false AND status <> 'cancelled'`. Payment status does not
matter. The same definition applies to option seats; `lib/marketing/availability.ts` currently
counts cancelled rows and is aligned.

**Rationale**: Matches the spec and the existing `RegistrationStatus` union
(`confirmed | pending | cancelled`). Unpaid registrations hold a seat because no automatic
cancellation exists (constitution VI).

## R4 · Invitation link format and transport (FR-018 to FR-021a)

**Decision**: Link format `/?einladung=<token>#anmelden`. `app/page.tsx` reads the `einladung`
search param (in Next.js 16 `searchParams` is a Promise and must be awaited), passes it to
`RegistrationSection`, which resolves it server side through a new helper
`resolveInvitation(campId, token)` (service role, returns only `{ valid: boolean }`, never the
price). Only a valid token is passed to the client form; the form keeps it in component state across
"Noch jemanden anmelden" and sends it as `priceTierToken`. The server re-resolves the token on every
submit (existing `resolveAmount`, unchanged semantics: invalid falls back silently).

**Rationale**: German query name fits the German UI and the existing `#anmelden` anchor. Returning
only a boolean to the page keeps the price out of the HTML (FR-021a). Re-resolving on submit means a
manipulated client cannot get a price it is not entitled to.

**Alternatives considered**:
- Path segment `/einladung/<token>`: needs a second route that renders the same landing page, which
  edges toward the forbidden second landing page. Rejected.
- Cookie: survives across sessions and devices unexpectedly, harder to reason about. Rejected.

## R5 · Single source for German copy and validation (FR-023, FR-024, SC-005)

**Decision**: New isomorphic module `lib/register/messages.ts` (no `server-only`) holds every German
string of the public registration area, and `lib/register/validation.ts` holds the core fields
(`first_name`, `last_name`, `email`), `mergeFields` and `validateField`. Both the client form and the
server service import them; the duplicated copies in `registration-form.tsx`, `service.ts` and
`app/api/register/route.ts` are removed. While moving, every string is rewritten to follow the
writing rules (for example "Mailadresse" instead of the hyphenated form, a period instead of the
dash before "bewahre sie gut auf", and "schiefgelaufen" style compounds written as one word).

**Rationale**: Constitution IV and V. One function guarantees identical messages (SC-005).

**Alternatives considered**: Extending `lib/admin/messages.ts`: mixes admin and public copy and that
module imports admin only types. Rejected.

## R6 · react-hook-form

**Decision**: Keep the existing controlled `useState` form; do not introduce react-hook-form in this
feature. Recorded in Complexity Tracking.

**Rationale**: The form is fully dynamic (fields come from data at runtime), already works,
validates through the shared `validateField`, and react-hook-form is not installed. Migrating would
be an unrelated refactor (constitution VII) with no user visible gain.

## R7 · Countdown reaching zero

**Decision**: When the countdown reaches zero, `CountdownPanel` calls `router.refresh()` once. The
server recomputes the state (R1) and renders the form. The current "reload the page" hint becomes a
short fallback message shown only while the refresh is in flight.

**Rationale**: Delivers Q1 without asking visitors to reload manually.

## R8 · Testing

**Decision**: Add Vitest as a dev dependency with an `npm test` script, limited to unit tests for the
pure modules: `getRegistrationState` (every branch and boundary), `validateField` and `mergeFields`.
The race condition (R2) and the end to end flow are verified manually through
[quickstart.md](./quickstart.md), including a parallel request check with `curl`.

**Rationale**: The window rule has many boundaries that are cheap to test and costly to get wrong.
Vitest is dev only, needs no config for plain TypeScript, and AGENTS.md already expects `npm test`.

**Alternatives considered**: Playwright end to end tests: valuable later, but needs a seeded test
database and Clerk test setup; out of proportion for this feature. Deferred.

## R9 · Messages for new states

**Decision**: New public states and errors (German, in `lib/register/messages.ts`):
- `full` section: eyebrow "Anmeldung", heading "Das Camp ist ausgebucht", intro explaining that all
  places are taken and inviting contact.
- API error for `camp_full`: "Das Camp ist inzwischen ausgebucht."
- Invitation hint: "Du meldest dich über eine persönliche Einladung an."
- Closed after deadline reuses the existing closed copy.

HTTP status for `camp_full` is `409`, like `full` and `closed` today.
