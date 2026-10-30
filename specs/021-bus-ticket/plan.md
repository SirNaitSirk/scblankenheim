# Implementation Plan: Busticket

**Branch**: `021-bus-ticket` | **Date**: 2026-10-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/021-bus-ticket/spec.md`

## Summary

Per camp the team switches on the bus ticket and maps it to one question of the registration form
(select or checkbox) plus the answer values that mean "takes the bus". A registration is a bus
person purely by that mapping, there is no second flag. Every bus person gets a random, unguessable
ticket code stored in a new table `bus_tickets`; the QR code encodes the scan page URL with that
code. The participant page shows the QR code as inline SVG, the arrival info mail and a new
"Busticket" mail show it as a PNG served by a token protected route. Team members with a new
permission `bus` scan on `/admin/bus` with the phone camera per trip (outbound, return); the server
decides green or red and stores at most one boarding per registration and trip in `bus_boardings`.
A live list per trip shows who is missing, with manual boarding and undo. Admins block a ticket or
issue a new one from the registration dialog.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 16.4 App Router (Server Components, Server Actions,
route handlers)

**Primary Dependencies**: Clerk (admin), Supabase JS (service role), Zod, existing Resend provider.
**New**: `qrcode` (QR as SVG and PNG on the server, research R2) and `jsqr` (QR decoding in the
browser where the native `BarcodeDetector` is missing, research R3). Dev: `@types/qrcode`.

**Storage**: Migration `0016_bus_ticket.sql`: tables `camp_bus_settings`, `bus_tickets`,
`bus_boardings`; recreated `email_deliveries_once_idx` so `bus_ticket` mails may repeat.

**Testing**: Vitest unit tests: bus person matching (select, checkbox, missing answer, broken
mapping), scan decision order, list building and sorting, Zod schemas, code format, QR payload,
arrival mail with and without ticket block, bus ticket mail, mail preview.

**Target Platform**: Vercel (Node runtime). Scanning on current iOS Safari and Android Chrome over
HTTPS (camera access requires a secure context).

**Project Type**: Web application (single Next.js project)

**Performance Goals**: Scan to result under 2 s on mobile network (SC-001): one server action
with at most four small queries. List refresh every 4 s while visible.

**Constraints**: The code gives no access to private data (FR-007). Scan result shows only name,
reference, status, time and the payment hint (FR-019). Never a guessed result without server
answer (FR-020). No Wallet.

**Scale/Scope**: Up to about 100 bus persons per camp, two to four scanning phones at once.

## Constitution Check

*GATE: Must pass before Phase 0 research. Check again after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Fixed Stack, Clerk Owns Auth | Pass with justification | Scanning behind Clerk, participants through the 017 token. Two small new dependencies `qrcode` and `jsqr`, justified in Complexity Tracking. No TanStack Query in the repo yet; the list polls a Server Action like other admin pages instead of adding it. |
| II. Server Is the Security Boundary | Pass | Every decision (valid, boarded, payment hint) happens in Server Actions behind `requirePermission("bus")`, `requirePermission("registrations")` or `requirePermission("camps")`. Codes are created and compared only on the server with the service role. The browser only decodes the QR and sends the code. |
| III. Strict Scope | Pass | AGENTS.md section 4 and 5 amended on 2026-10-30 (bus ticket, `camp_bus_settings`, `bus_tickets`, `bus_boardings`). Wallet explicitly excluded. |
| IV. Single Source of Truth | Pass | Bus person derives from the one registration form's stored answer (`form_data`) through the per camp mapping; no new form, no duplicate flag. Schema via migration plus regenerated types; no CHECK constraints. |
| V. Language Separation | Pass | Copy in `lib/bus/messages.ts` (scan page, participant section), `lib/email/messages.ts` (mails), `lib/admin/messages.ts` (nav, permission, settings card, dialog panel). Code English. |
| VI. Tolerant Payment, Hidden Pricing | Pass | Ticket independent of payment (owner decision 2026-10-30); the scan only shows "Zahlung offen", no amounts. |
| VII. Simplicity and Quality Gates | Pass | Reuses `requirePermission`, `writeLog`, `deliver`, `email_deliveries`, participant token lookup and throttle, `outstandingAmount`. Limits in `lib/bus/limits.ts`. Lint, test, build at the end. |
| Writing Rules | Pass | New copy without dashes. |

Check after design: unchanged, all gates pass (research R1 to R10).

## Existing code inspected

- `lib/admin/guard.ts`, `lib/admin/access.ts`, `components/admin/nav-items.ts`,
  `lib/admin/messages.ts` (`PERMISSION_LABELS`): tab and permission model; a new tab
  `/admin/bus` and permission `bus` fit without changes to the model.
- `lib/admin/field-types.ts`, `lib/register/validation.ts`: answers are `string | boolean`;
  `select` stores the option text, `checkbox` stores a boolean.
- `lib/participant/token.ts`, `token-server.ts`, `lookup.ts`, `submit.ts`,
  `app/meine-anmeldung/[token]/befreiung/route.ts`: token lookup and miss throttle reused for the
  QR image route.
- `lib/email/templates.ts` (`EmailContext`, `schoolReleaseBlock`), `lib/email/send.ts`
  (`buildMailTarget`, `deliver`, `sendSchoolRelease`), `lib/email/info-run.ts`,
  `lib/email/info-templates.ts` (`arrivalInfoEmail`), `lib/email/deliveries.ts`,
  `lib/email/preview.ts`: the ticket block follows the release hint pattern.
- `lib/payment/eligibility.ts` (`outstandingAmount`): payment hint.
- `supabase/migrations/0015_school_release.sql`, `lib/school-release/*`,
  `components/admin/school-release-panel.tsx`, `release-settings-card.tsx`: structure for per camp
  settings, dialog panel and module layout.
- `lib/admin/data.ts` (`writeLog`, soft delete of registrations).

## Decisions and assumptions

See [research.md](./research.md). Key points:

- R1 Code: random 16 bytes, base64url, stored; no HMAC secret. Revoked rows stay so old codes
  answer "Ticket ungültig".
- R2 QR rendering on the server with `qrcode`: SVG on the participant page, PNG in mails.
- R3 Scanning: `BarcodeDetector` when present, otherwise `jsqr` on video frames.
- R4 QR payload is `<APP_URL>/admin/bus?t=<code>`, so the normal phone camera opens the scan page.
- R5 Mail image via `/meine-anmeldung/<token>/busticket` (PNG), versioned query against caching.
- R6 Tickets are created lazily on first need (page view, mail, scan list).
- R7 Scan decision order and one boarding per registration and trip via primary key.
- R8 Live list by polling a Server Action every 4 s while the tab is visible.
- R9 Settings card lives on the camp's form fields page (`/admin/camps/[campId]/felder`).
- R10 Scanning always targets the current camp; trip choice kept per device.

## Project Structure

### Documentation (this feature)

```text
specs/021-bus-ticket/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── bus-ticket.md
├── checklists/
│   └── requirements.md
└── tasks.md             (next: /speckit-tasks)
```

### Source Code (repository root)

```text
supabase/migrations/0016_bus_ticket.sql          new
lib/database.types.ts                            regenerated
lib/bus/
├── types.ts            BusSettings, BusTicket, Trip, ScanOutcome, BoardingListEntry
├── limits.ts           code bytes, poll interval, result display time, trip keys
├── messages.ts         German copy for scan page, list, participant section
├── schema.ts           Zod: settings input, scan input, manual boarding, undo
├── rules.ts            pure: isBusRegistration, answerValuesOf, mappingProblem, decideScan, buildBoardingList
├── code.ts             pure: code pattern, scan URL, parse code from URL or raw text
├── qr.ts               server only: qrSvg, qrPng (qrcode)
└── data.ts             server only: settings, ensureTicket, reissue, block, scan, boardings, list
app/admin/bus/
├── page.tsx            guardTab("/admin/bus"), trip choice, scanner and list
└── actions.ts          scanBusTicket, loadBoardingList, markBoardedManually, undoBoarding
app/admin/camps/[campId]/felder/
├── page.tsx            + BusSettingsCard
└── actions.ts          + saveBusSettings
app/admin/actions.ts    + loadBusTicket, reissueBusTicket, blockBusTicket, sendBusTicket
app/meine-anmeldung/[token]/busticket/route.ts   new PNG route
app/meine-anmeldung/[token]/page.tsx             + bus ticket section
components/admin/
├── bus-scanner.tsx           camera, decoding, result overlay
├── bus-boarding-list.tsx     counts, missing first, search, manual boarding, undo
├── bus-settings-card.tsx     switch, question, answers, counts, warnings
├── bus-ticket-panel.tsx      dialog section: status, boardings, reissue, block, send
├── nav-items.ts              + Bus
└── registration-form-dialog.tsx, registrations-manager.tsx   + panel wiring
components/participant/bus-ticket-card.tsx       QR, name, camp, hints
lib/admin/messages.ts   + nav, permission, settings card, panel copy
lib/admin/data.ts       soft delete also removes tickets and boardings
lib/email/templates.ts  + EmailContext.busTicket, busTicketBlock, busTicketEmail
lib/email/info-templates.ts   arrival mail with ticket block
lib/email/send.ts       buildMailTarget with bus context, sendBusTicket
lib/email/info-run.ts   bus settings and tickets per run
lib/email/messages.ts, preview.ts, deliveries.ts   copy, preview entry, kind
tests/unit/bus-rules.test.ts, bus-code.test.ts, bus-schema.test.ts   new
tests/unit/email-info-templates.test.ts, email-templates.test.ts, email-preview.test.ts   extended
AGENTS.md               done (section 4 and 5)
```

**Structure Decision**: Single Next.js project. A new module `lib/bus/` mirrors
`lib/school-release/`: pure rules apart from server data access, so the decision logic is unit
tested without a database.

## Security requirements

- Codes are 128 bit random, unique, created on the server; the QR never carries the participant
  token or personal data.
- Scan, list, manual boarding and undo require Clerk session plus permission `bus`; the page
  requires the tab `/admin/bus`. Without both, no ticket data is returned (FR-015, US2.9).
- Settings require `camps`; reissue, block and send require `registrations`.
- The PNG route needs a valid participant token, answers 404 for everything else and counts misses
  toward the existing participant throttle.
- Scan answers contain only first and last name, reference, outcome, boarding time and a boolean
  payment hint.
- Reissue, block, manual boarding and undo are written to `logs`.
- Tables have RLS on and no policies; only the service role reads and writes.

## Acceptance criteria

All acceptance scenarios of spec US1 to US5 and FR-001 to FR-025, SC-001 to SC-006.

## Checks to run

```bash
npm run lint
```

```bash
npm test
```

```bash
npm run build
```

## Manual test steps

See [quickstart.md](./quickstart.md).

## UI notes (impeccable, tasteskill)

- **Scan page (mobile first)**: sticky top bar with the trip as a large segmented control
  (Hinfahrt, Rückfahrt) and the count "38 von 42". Camera view fills the width with a square
  viewfinder. Result as a full width overlay: green with check icon and name in large type, red
  with cross icon and reason; payment hint as an amber pill inside the green result. Overlay
  closes after 3 s or on tap. Large touch targets (min 48 px), works one handed.
- **List**: below the scanner (tab "Liste" on narrow screens). Search field, then "Fehlen noch"
  with a button "Eingestiegen" per row, then "Eingestiegen" with time and a small "von Hand"
  badge; undo through a row menu with confirmation.
- **States**: camera permission prompt with explanation, camera denied (help text plus link to the
  list), no connection (neutral grey result "Keine Verbindung"), bus ticket off or mapping broken
  (empty state with link to the settings for users with `camps`), empty list.
- **Participant section**: card "Busticket" with QR on white background (min 240 px, quiet zone),
  name and camp below, hint to turn brightness up; blocked ticket shows a hint to contact the
  team.
- **Settings card**: switch, select for the question, checkboxes for the answers (for a checkbox
  question: "Ja" and "Nein"), counts and warnings inline.
- Colors and type follow the existing admin tokens; green and red never carry meaning alone
  (icon and text).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| New dependency `qrcode` | Generating QR matrices correctly (Reed Solomon, masking) is not something to hand write | A third party image service would leak codes to an outside host |
| New dependency `jsqr` | iOS Safari has no `BarcodeDetector`; without a decoder the scan page fails on iPhones | A native app or a hosted scanner service is far more effort and leaves the stack |
