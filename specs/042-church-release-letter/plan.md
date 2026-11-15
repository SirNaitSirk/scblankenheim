# Implementation Plan: Schulbefreiung im Gemeindebriefkopf

**Branch**: `042-church-release-letter` | **Date**: 2026-11-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/042-church-release-letter/spec.md`, template `template-2026.pdf`

## Summary

The school release letter of specs/020-school-release is rebuilt as the church's "Teilnehmer
Bescheinigung" from `template-2026.pdf`. Participants and admins enter only school name and school
location. The letter names the full camp period and the camp location, words the request by the
registration's gender, and is laid out on the church letterhead: logo with green line (image
extracted from the template into `public/`), small sender line, footer with four columns, stamp
with signature from the existing upload. A migration adds `school_location`, backfills it from the
old school address and drops teacher, addresses, class, signer and address prefill columns. The
release dates stay for website hints only. Everything else of 020 (payment gate, mail only to the
registration, throttling, landing link request, admin resend) is untouched.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 16 App Router

**Primary Dependencies**: existing `pdf-lib` 1.17.1, Zod, Supabase service role client. No new
dependency (research R1).

**Storage**: Migration `0020_church_release_letter.sql` on `school_releases` and `camp_mail_info`
(data-model.md). Logo as static file `lib/school-release/assets/church-logo.png`, read on the
server only (research R2).

**Testing**: Vitest: schema (two fields), `buildLetter` text (gender variants, period formats,
missing location), location backfill helper, PDF smoke test (one page, parses, with and without
stamp), updated participant view and mail preview tests.

**Target Platform**: Vercel, Node runtime

**Project Type**: Web application (single Next.js project)

**Performance Goals**: PDF under 300 ms as before; the logo is read once per process and cached.

**Constraints**: One A4 page at maximum input lengths; WinAnsi fonts (Helvetica) as before.

**Scale/Scope**: A few dozen letters per camp.

## Constitution Check

*GATE: Must pass before Phase 0 research. Check again after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Fixed Stack, Clerk Owns Auth | Pass | No new dependency, no auth change. |
| II. Server Is the Security Boundary | Pass | Same actions and routes, same token and permission checks; fewer personal fields stored. Logo is not secret, stamp stays in the private bucket. |
| III. Strict Scope | Pass | Change of an existing in scope feature. AGENTS.md section 4 (School release letter) and section 5 (`school_releases` fields) are amended in this change. |
| IV. Single Source of Truth | Pass | Letter wording only in `lib/school-release/messages.ts`; church letterhead data only in `lib/school-release/letterhead.ts`, overlapping values read from `lib/legal/operator.ts`. Schema via migration plus regenerated types. |
| V. Language Separation | Pass | German copy in message modules, code English (`schoolLocation`, `letterhead`). |
| VI. Tolerant Payment, Hidden Pricing | Pass | Payment gate unchanged, no prices in the letter. |
| VII. Simplicity and Quality Gates | Pass | Removes fields and settings (address prefill, signer), net less code. Lint, test, build at the end. |
| Writing Rules | Pass | New copy without dashes. The template's own text is quoted verbatim; it contains no dash. |

Check after design: unchanged, all gates pass.

## Project Structure

### Documentation (this feature)

```text
specs/042-church-release-letter/
├── spec.md
├── template-2026.pdf      # reference letter from the church
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── letter-layout.md
├── checklists/requirements.md
└── tasks.md               # /speckit-tasks
```

### Source Code (repository root)

```text
supabase/migrations/0020_church_release_letter.sql   # new
lib/database.types.ts                                # regenerated
lib/school-release/
├── assets/church-logo.png      # new, extracted from the template
├── letterhead.ts               # new: church data for header and footer
├── messages.ts                 # new letter text, two field form copy, sample
├── letter.ts                   # new ReleaseLetter shape (title, subject, gendered request)
├── pdf.ts                      # letterhead layout, logo, stamp, footer columns
├── schema.ts                   # schoolName + schoolLocation; settings without signer, address keys
├── settings.ts                 # drop prefill and signer, missing period check
├── types.ts                    # SchoolReleaseData { schoolName, schoolLocation }
└── data.ts                     # columns, camp location and gender passed to letter
app/meine-anmeldung/[token]/actions.ts               # two fields
app/admin/actions.ts                                 # two fields
app/admin/camps/[campId]/infomails/{page,actions}.ts # settings without signer and address fields
components/participant/school-release-form.tsx       # two fields
components/admin/school-release-panel.tsx            # two fields
components/admin/release-settings-card.tsx           # drop signer and address fields, stamp hint
lib/participant/{lookup,view}.ts                     # no address prefill
lib/admin/messages.ts                                # admin copy
lib/email/messages.ts                                # release mail: period, "an deine Schule"
lib/legal/messages.ts                                # privacy text: school name and location only
AGENTS.md                                            # section 4 and 5
tests/unit/school-release-core.test.ts, participant-view.test.ts, email-preview.test.ts
```

**Structure Decision**: Existing single Next.js project; all changes stay inside the school release
module and its callers.

## Security requirements

- Same gates as 020: token lookup plus payment check for participants, `registrations` permission
  for admins, `camps` permission for settings. Zod on every input (two lines, max lengths).
- Data minimisation: teacher name and both addresses are deleted from the database by the migration.
- PDF drawn as plain text; logo is a fixed file from the repo, never a user upload.

## Acceptance criteria

See spec User Stories 1 to 4 and SC-001 to SC-004; layout details in contracts/letter-layout.md.

## Checks to run

`npm run lint`, `npm test`, `npm run build`; migration applied to the Supabase project and types
regenerated before testing.

## Manual test steps

See quickstart.md.

## Complexity Tracking

None.
