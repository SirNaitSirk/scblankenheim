# Implementation Plan: Persönliche Teilnehmerseite

**Branch**: `017-participant-page` | **Date**: 2026-10-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/017-participant-page/spec.md`

## Summary

Every registration gets a private, unguessable access token. The public page
`/meine-anmeldung/<token>` shows the registration status, total, paid and outstanding amount, a pay
button into the existing `/bezahlen` flow, the person's own form answers, camp name, dates and
location, and a link to the packing list. Nothing is editable. Unknown, renewed or deleted tokens
render one neutral notice. The link is added to every mail sent to a registration (confirmation,
payment link, reminders, info mails). Admins with the `registrations` permission can copy and renew
the link in the registration dialog; renewing invalidates the old link at once and is logged.

Technical approach: one new column `registrations.access_token` (64 hex characters, unique, filled
by a column default so existing rows are backfilled by the migration), a server only lookup module in
`lib/participant/`, a pure view builder that turns a registration plus its camp form fields into
display rows (unit tested), the link threaded through the existing `EmailContext`, and two Server
Actions behind `runGuarded` for copy and renew. Room and tent circle data are deliberately not read.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 16.4 App Router (Server Components, Server Actions)

**Primary Dependencies**: Clerk (admin session only), Supabase JS (service role), Zod, shadcn/ui,
Node `crypto` for token renewal. No new dependency.

**Storage**: Supabase Postgres. Migration `0013_participant_access.sql` adds
`registrations.access_token` with a unique index. No new table.

**Testing**: Vitest unit tests in `tests/unit/` (view builder, token format, templates, preview)

**Target Platform**: Vercel (Node runtime)

**Project Type**: Web application (single Next.js project)

**Performance Goals**: The page loads with three small queries (registration by token, camp, form
fields) and renders on the server; no client JavaScript beyond the shared shell.

**Constraints**: The page must never reveal whether a token exists (FR-011), never show price tier
names, admin notes, mail history or the pause flag (FR-007, FR-019), and must not leak the token via
referrer or indexing (FR-013).

**Scale/Scope**: One camp per year, a few hundred registrations, a handful of admins.

## Constitution Check

*GATE: Must pass before Phase 0 research. Check again after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Fixed Stack, Clerk Owns Auth | Pass | No accounts for participants and no Supabase Auth. Access is a capability link, admins stay on Clerk. |
| II. Server Is the Security Boundary | Pass | Lookup runs in a Server Component with the service role client; the token is validated by format before any query. Copy and renew are Server Actions behind `requirePermission("registrations")`. The token is never part of the bulk admin table data. |
| III. Strict Scope | Pass after amendment | The participant page is not yet listed in AGENTS.md section 4. Task T001 adds it (and the new column to section 5) before code is written. No chat, no self service edits, no room or tent circle data. |
| IV. Single Source of Truth | Pass | Schema change only via migration plus regenerated types. Answers are shown through the same `camp_form_fields` that drive the one registration form. No CHECK constraint; the token format is validated in Zod. |
| V. Language Separation | Pass | German copy in a new `lib/participant/messages.ts`, admin copy in `lib/admin/messages.ts`, mail copy in `lib/email/messages.ts`. Code English. Route segment `meine-anmeldung` follows the existing German public routes (`/bezahlen`, `/packzettel`). |
| VI. Tolerant Payment, Hidden Pricing | Pass | The page only shows the own amount, never the tier. Payment still runs through the existing checkout; nothing is cancelled automatically. |
| VII. Simplicity and Quality Gates | Pass | Reuses `checkoutEligibility`, `outstandingAmount`, `PaymentShell`, `submission_attempts` throttling and `writeLog`. Limits in `lib/participant/limits.ts`. Lint, test and build run at the end. |
| Writing Rules | Pass | New copy written without dashes. |

Check after design: unchanged, all gates pass (see research R1 to R9).

## Existing code inspected

- `app/bezahlen/page.tsx`, `lib/payment/lookup.ts`, `lib/payment/eligibility.ts`,
  `lib/payment/limits.ts`: reference lookup, neutral notice, per ip throttle on
  `submission_attempts` with `kind`, eligibility rules reused for the pay button.
- `components/payment/payment-shell.tsx`: narrow public frame with `PaymentNotice`, reused.
- `lib/email/links.ts`, `lib/email/send.ts` (`buildMailTarget`, `REGISTRATION_COLUMNS`),
  `lib/email/templates.ts`, `lib/email/info-templates.ts`, `lib/email/info-run.ts`,
  `lib/email/preview.ts`: every mail context is built in `buildMailTarget`, so one change there
  reaches all senders; the preview uses `sampleContext`.
- `app/admin/actions.ts` (`runGuarded`, `writeLog`, `referenceSchema`),
  `components/admin/registration-form-dialog.tsx`, `components/admin/payment-link-panel.tsx`:
  pattern for dialog panels with copy and feedback.
- `components/admin/registration-columns.ts` (`formatFieldValue`, `CORE_FIELD_KEYS`): admin
  formatting of answers; the public page gets its own small pure formatter so admin copy does not
  leak into public messages.
- `supabase/migrations/0001_init_schema.sql`, `0011_simplify_registration_status.sql`,
  `0012_mail_settings.sql`: `registrations` columns and the insert function (unchanged, the column
  default fills new rows).
- `proxy.ts`: only `/admin(.*)` is protected, the new public route needs no change.

## Files likely to change

```text
supabase/migrations/0013_participant_access.sql   new: access_token column, unique index
lib/database.types.ts                             regenerated
lib/participant/limits.ts                         new: token format, throttle window and max
lib/participant/token.ts                          new: pure format check, server token generator
lib/participant/view.ts                           new: pure view builder (rows, amounts, state)
lib/participant/lookup.ts                         new: server only lookup and miss throttle
lib/participant/messages.ts                       new: German copy of the page
app/meine-anmeldung/[token]/page.tsx              new: public page
components/participant/participant-summary.tsx    new: presentational sections
lib/email/links.ts                                participantPath, participantUrl
lib/email/send.ts                                 select access_token, add participantUrl
lib/email/templates.ts                            participantUrl in EmailContext, link block
lib/email/info-templates.ts                       link block in info mails
lib/email/messages.ts                             link copy
lib/email/preview.ts                              sample participant link
lib/admin/data.ts                                 getAccessToken, renewAccessToken
lib/admin/messages.ts                             panel copy
app/admin/actions.ts                              getParticipantLinkAction, renewParticipantLinkAction
components/admin/participant-link-panel.tsx       new: copy and renew in the dialog
components/admin/registration-form-dialog.tsx     render the panel in edit mode
components/admin/registrations-manager.tsx        pass the two actions
tests/unit/participant-view.test.ts               new
tests/unit/participant-token.test.ts              new
tests/unit/email-templates.test.ts                link present in every template
tests/unit/email-preview.test.ts                  sample link
AGENTS.md                                         scope, data model, quick reference
```

## Security requirements

- Token: 32 random bytes as 64 lowercase hex characters (256 bit). Generated by the database
  default for new and existing rows and by `crypto.randomBytes` on renewal. Validated against
  `^[0-9a-f]{64}$` before any query; anything else renders the neutral notice without a query.
- Lookup by unique index, service role client, server only module. Deleted registrations resolve
  to "not found".
- Same response body and status for unknown, malformed, renewed and deleted tokens (FR-011). The
  page returns HTTP 200 with the notice so status codes reveal nothing.
- Throttle: misses per ip in `submission_attempts` (`kind = 'participant'`), checked before the
  lookup. At the limit the throttle notice is shown and no lookup runs (FR-012).
- `robots: { index: false, follow: false }` and `referrer: "no-referrer"` in the page metadata
  (FR-013). External links (none planned) would carry `rel="noreferrer"`.
- Only whitelisted data reaches the HTML: first and last name, email, gender, answers of current
  question fields, status, amounts, camp name, dates, location. Never `price_tier_id`, tier name,
  `reminders_paused`, notes, mail history, room or tent circle (FR-007, FR-019).
- Admin copy and renew: Server Actions behind `requirePermission("registrations")`, input reference
  validated with the existing `referenceSchema`. Renew writes a `logs` entry
  (`registration.access_renewed`) with actor and reference (FR-017). The token is fetched on demand
  per dialog and is not added to the `Registration` type sent with the table.

## Acceptance criteria

The acceptance scenarios of User Stories 1 to 6 in [spec.md](./spec.md), plus:

- All four mail kinds and the admin preview contain the participant link (SC-002).
- No room, tent circle or price tier string appears in the page HTML for a registration that has
  them.

## Checks to run

- `npm run lint`
- `npm test`
- `npm run build` (new route, Server Actions and server modules change)
- Apply the migration and regenerate `lib/database.types.ts` before testing.

## Manual test steps

See [quickstart.md](./quickstart.md).

## UI

- **Layout**: `PaymentShell` (max width 40rem, centered). Order: heading with first name and camp,
  status card (status badge, total, paid, outstanding, pay button or "Alles bezahlt"), camp block
  (name, dates, location), answers block as a definition list, packing list link, change hint with
  the camp's reply address when configured.
- **Typography and spacing**: same scale as `/bezahlen` (`PaymentNotice` heading sizes, `text-sm`
  muted labels, `gap-6` between sections). Amounts in tabular numbers.
- **Colors**: existing tokens only. Status badge: success tone for active and fully paid, muted for
  active and open, danger tone for cancelled.
- **Responsiveness**: single column; definition list stacks label over value under `sm`. No
  horizontal scroll at 360px (SC-006).
- **States**: neutral notice (unknown link), throttle notice, cancelled state, paid state, free
  registration. Loading is server rendered, no spinner. Admin panel: copy feedback, renew confirm
  dialog, error feedback.
- Use `impeccable` and `tasteskill` during implementation of the page.

## Project Structure

### Documentation (this feature)

```text
specs/017-participant-page/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── page-actions-mail.md
└── tasks.md
```

### Source Code (repository root)

```text
app/meine-anmeldung/[token]/page.tsx
components/participant/
components/admin/participant-link-panel.tsx
lib/participant/
lib/email/
lib/admin/
supabase/migrations/
tests/unit/
```

**Structure Decision**: single Next.js project, existing layout. The participant domain gets its own
`lib/participant/` folder next to `lib/payment/`, mirroring how payment is organized.
