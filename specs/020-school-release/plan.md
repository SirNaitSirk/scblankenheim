# Implementation Plan: Schulbefreiung

**Branch**: `020-school-release` | **Date**: 2026-10-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/020-school-release/spec.md`

## Summary

Per camp the team switches on a school release letter (dates, signer, private signature image,
address fields). On the participant page an active registration enters teacher, school and
addresses and immediately downloads a one page A4 PDF, generated on the server with `pdf-lib`, and
receives it as a mail attachment. Admins enter, correct, download and resend it in the registration
dialog. A landing page section lets people request the link to their participant page by email
(one mail per matching registration, neutral answer, throttled). Confirmation and teaser mails carry
a hint with a deep link to `#schulbefreiung`. Release data live in a new table `school_releases`,
deleted with the registration; the PDF is never stored.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 16.4 App Router (Server Components, Server Actions,
route handlers, `after()`)

**Primary Dependencies**: Clerk (admin), Supabase JS (service role, Storage), Zod, existing Resend
provider. **New**: `pdf-lib` 1.17.1 (research R1).

**Storage**: Migration `0015_school_release.sql`: table `school_releases`, release columns on
`camp_mail_info`, private bucket `signatures`, recreated `email_deliveries_once_idx`.

**Testing**: Vitest unit tests (Zod schemas, address prefill, date validation, letter text and
WinAnsi sanitising, PDF smoke test that the output parses, mail templates, link request matching
and throttle decisions).

**Target Platform**: Vercel (Node runtime)

**Project Type**: Web application (single Next.js project)

**Performance Goals**: PDF generation under 300 ms; participant submit and link request answer
without waiting for the provider (mail in `after()`).

**Constraints**: No enumeration of registrations via the landing page (SC-005). Signature never
public (FR-018). Self service mails never displace confirmations (`CONFIRMATION_RESERVE`).

**Scale/Scope**: A few hundred registrations, a few dozen releases per camp.

## Constitution Check

*GATE: Must pass before Phase 0 research. Check again after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Fixed Stack, Clerk Owns Auth | Pass with justification | Participants act through the 017 token, admins through Clerk. New dependency `pdf-lib`, justified below. Storage is part of the stack. |
| II. Server Is the Security Boundary | Pass | PDF, upload, mail and lookups only on the server with the service role. Public actions validate with Zod and throttle per ip; admin actions behind `requireAdmin` / `requirePermission`. Signature in a private bucket, preview via short signed URL. |
| III. Strict Scope | Pass | AGENTS.md section 4 and 5 amended in this change (school release letter, participant link request, `school_releases`). No template editor: letter and mails are code defined. |
| IV. Single Source of Truth | Pass | Participant address comes from configured fields of the one registration form; no new form. Schema via migration plus regenerated types; no CHECK constraints. |
| V. Language Separation | Pass | Copy in `lib/school-release/messages.ts` (page, landing, PDF), `lib/email/messages.ts` (mails), `lib/admin/messages.ts` (admin). Code English. |
| VI. Tolerant Payment, Hidden Pricing | Pass | Registration stays valid without payment; only the self service letter waits for a first payment (owner decision 2026-10-30), admins are not gated. No prices in PDF or mails. |
| VII. Simplicity and Quality Gates | Pass | Reuses `deliver` style claiming, `email_deliveries`, `submission_attempts`, `writeLog`, 017 token lookup, 016 mail settings page. Limits in `lib/school-release/limits.ts`. Lint, test, build at the end. |
| Writing Rules | Pass | New copy without dashes. |

Check after design: unchanged, all gates pass (research R1 to R10).

## Existing code inspected

- Participant page: `app/meine-anmeldung/[token]/page.tsx`, `actions.ts`, `lib/participant/*`
  (`findRegistrationForToken`, throttles, limits), `components/participant/participant-summary.tsx`.
- Mail: `lib/email/provider.ts` (`sendEmail`, no attachments yet), `send.ts` (`deliver`,
  `buildMailTarget`, quota), `deliveries.ts` (claims, `claimTeamDelivery`), `history.ts`,
  `templates.ts` (`calendarBlock`, `participantBlock`, `confirmationEmail`),
  `info-templates.ts` (`teaserInfoEmail`), `links.ts`, `settings.ts`, `limits.ts`, `preview.ts`.
- Mail settings: `supabase/migrations/0011_camp_mail_info.sql`, `0012_mail_settings.sql`,
  `lib/admin/camp-mail-info*.ts`, `app/admin/camps/[campId]/infomails/*`.
- Admin: `lib/admin/guard.ts`, `lib/admin/data.ts` (`getCurrentCamp`, soft delete
  `setRegistrationDeleted`), `components/admin/registration-form-dialog.tsx` and its panels.
- Form: `lib/register/validation.ts`, `lib/admin/field-types.ts`, `camp_form_fields`.
- Landing: `app/page.tsx`, `components/marketing/*`. No Storage use and no PDF library so far.

## Files likely to change

```text
supabase/migrations/0015_school_release.sql                 new
lib/database.types.ts                                       new table and columns
package.json                                                pdf-lib
lib/school-release/types.ts                                 new: domain types
lib/school-release/limits.ts                                new: lengths, throttles, upload size
lib/school-release/messages.ts                              new: German copy (page, landing, PDF)
lib/school-release/schema.ts                                new: Zod input and settings schemas
lib/school-release/settings.ts                              new: map camp_mail_info, completeness, address prefill
lib/school-release/letter.ts                                new: pure letter content (lines, dates)
lib/school-release/pdf.ts                                   new: server only pdf-lib rendering, WinAnsi sanitising
lib/school-release/data.ts                                  new: server only load, upsert, delete, signature bytes
lib/school-release/link-request.ts                          new: server only matching and throttles
lib/email/provider.ts                                       attachments
lib/email/deliveries.ts                                     claimRepeatableDelivery, new kinds
lib/email/history.ts                                        participant trigger
lib/email/templates.ts                                      schoolReleaseBlock, release and link mails
lib/email/info-templates.ts                                 block in teaser
lib/email/send.ts                                           context field, sendSchoolRelease, sendParticipantLink
lib/email/messages.ts, lib/email/preview.ts                 copy, previews
lib/admin/camp-mail-info-data.ts, camp-mail-info.ts         release columns
lib/admin/data.ts                                           delete release on soft delete
lib/admin/messages.ts                                       admin copy, mail kind labels
app/meine-anmeldung/[token]/actions.ts                      saveSchoolReleaseAction
app/meine-anmeldung/[token]/befreiung/route.ts              new: participant PDF
app/actions/participant-link.ts                             new: landing Server Action
app/api/admin/school-release/[registrationId]/route.ts      new: admin PDF
app/api/admin/school-release/preview/[campId]/route.ts      new: preview PDF
app/admin/actions.ts                                        load, save, send
app/admin/camps/[campId]/infomails/actions.ts, page.tsx     settings, upload, remove
components/participant/school-release-form.tsx              new
components/participant/participant-summary.tsx              render section
components/marketing/school-release-section.tsx             new
app/page.tsx                                                render section
components/admin/school-release-panel.tsx                   new: dialog section
components/admin/registration-form-dialog.tsx               render panel
components/admin/release-settings-card.tsx                  new: settings card
tests/unit/school-release-*.test.ts                         new
AGENTS.md                                                   scope and data model (done)
```

## Security requirements

- Participant action and PDF route: token normalized and resolved on the server; registration must
  be not deleted and `active`; release on for its camp. ip throttle kind `school_release`
  (10 per 10 minutes). PDF misses count toward the participant page miss throttle.
- Landing action: Zod email, allow listed target, ip throttle 5 per 10 minutes; identical response
  for match and no match; lookup and sending in `after()`; per registration 1 link mail per
  10 minutes and 3 per Berlin day. Only active registrations of the current camp.
- Upload: permission `camps`; PNG or JPEG by magic bytes, at most 512 KB; random suffix path in a
  private bucket; previous object removed. Never served publicly.
- Admin PDF and actions: `requireAdmin` for reading, `requirePermission("registrations")` for save
  and send, `requirePermission("camps")` for settings and preview.
- Mails only to the registration's own address; no school or teacher addresses collected. Mails
  count against `DAILY_EMAIL_BUDGET - CONFIRMATION_RESERVE`.
- Logs carry kind and reference only, never names, schools or addresses.
- PDF text is drawn as plain text (no HTML); mail content escaped by the layout helpers.

## Acceptance criteria

Acceptance scenarios of User Stories 1 to 5 in [spec.md](./spec.md).

## Checks to run

- `npm run lint`, `npm test`, `npm run build`
- Migration applied by the project owner, types regenerated

## Manual test steps

See [quickstart.md](./quickstart.md).

## UI

- **Participant page**: card „Schulbefreiung“ with `id="schulbefreiung"` after the payment block.
  Short explanation with the dates, then the form: name read only, address textarea (prefilled),
  teacher, school, school address, class (optional). Primary button „Befreiung erstellen“. After
  saving: success line, prominent „PDF herunterladen“, mail status line, „Angaben ändern“ toggles
  the form. Mobile first, full width controls, inline field errors.
- **Landing**: calm section between packing teaser and payment FAQ, matching the existing marketing
  style: heading „Schule am Brückentag?“, two sentences with the dates, email field and button „Link
  zur Befreiung senden“, neutral confirmation inline. No section when off or the camp is over.
- **Admin settings card** on the Mails page: switch (disabled with reason list while incomplete),
  dates (date inputs, add up to five), signer name and role, address field multi select from the
  camp's question fields in order, signature upload with thumbnail, replace and remove, „Vorschau“
  opens the PDF in a new tab.
- **Admin dialog**: section „Schulbefreiung“ after „Nachrichten“: read view with fields and last
  change („von der Person“ or admin name, date), buttons „Bearbeiten“, „PDF herunterladen“, „Per
  Mail senden“; hidden when the release is off and no data exist.
- States: loading, empty („Noch keine Befreiung angefordert“), error, sending, disabled with reason.
- Use `impeccable` and `tasteskill` for the participant card and the landing section.

## Amendment 2026-10-30 · Payment gate (spec FR-006a)

Owner decision: the participant gets the letter only once the registration is fully or partly
paid or owes nothing. Unpaid registrations see the card with the dates and a hint „Nach der
Zahlung verfügbar“ plus the pay button.

- **Rule** (pure, `lib/school-release/settings.ts`): `isReleaseUnlocked({ paymentStatus,
  amountDue, amountPaid })` is true when the status is `paid` or `partial`, when `amountPaid > 0`
  or when `amountDue <= 0`; always false for `refunded`. `processing` and `unpaid` without a
  payment stay locked. Unit tests cover every status.
- **Participant view** (`lib/participant/view.ts`): `ParticipantRelease` gains `locked`; refunded
  registrations get no card. The lookup already loads the payment fields.
- **Card** (`components/participant/school-release-form.tsx`): locked shows dates, the hint and
  the existing pay button (`view.payHref`), no form and no download, even when data exist.
- **Server gates**: `saveSchoolReleaseAction` rejects locked registrations with a German error;
  the participant PDF route answers with the same 404; `buildReleasePdf` with `requireActive`
  checks the rule too. Admin routes and actions stay ungated.
- **Mails**: `EmailContext.schoolRelease` gains `afterPayment`. Confirmation and teaser hint and
  the participant link mail add one sentence that the letter is ready after the payment.
  `buildMailTarget` sets the flag from the registration; previews use the sample (unpaid) case.
- **Admin dialog**: the load action returns `participantLocked`; the panel shows one muted line
  „Noch unbezahlt: Die Person sieht die Befreiung erst nach einer Zahlung.“ Admin actions unchanged.
- **Docs**: AGENTS.md section 4 line on the release letter mentions the payment condition.

No schema change.

## Project Structure

```text
specs/020-school-release/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── school-release.md
└── tasks.md            (next: /speckit-tasks)
```

**Structure Decision**: single Next.js project. Domain logic in `lib/school-release/` (pure modules
plus server only data and PDF modules), participant UI in `components/participant/`, landing in
`components/marketing/`, admin in `components/admin/`, mail in `lib/email/`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| New dependency `pdf-lib` (Principle I) | A real PDF with embedded signature is the product decision | Headless browser is too heavy on Vercel; writing PDF syntax by hand is fragile and cannot embed images reliably |
