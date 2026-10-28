# Implementation Plan: Mail Einstellungen pro Camp

**Branch**: `016-mail-settings` | **Date**: 2026-10-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/016-mail-settings/spec.md`

## Summary

Admins configure mail behaviour per camp without code changes: a switch for automatic payment
reminders, a per registration reminder pause, seven timing values (info mail stages and reminder
cadence) with the current constants as defaults, sender display name and reply address, four short
text blocks for the payment related mails, and a test send of any template to the admin's own
address. Technical approach: extend the existing `camp_mail_info` row (one row per camp, missing row
means defaults) instead of a new table, add a pause flag to `registrations`, make the
registration reference on `email_deliveries` optional so test sends share the daily quota counter, and
thread a resolved `CampMailSettings` object through the pure rule and template functions that today
read constants from `lib/email/limits.ts`.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 16 App Router (Server Components, Server Actions)

**Primary Dependencies**: Clerk (admin session), Supabase JS (service role), Zod, react-hook-form,
shadcn/ui, Resend over `fetch` (existing `lib/email/provider.ts`). No new dependency.

**Storage**: Supabase Postgres. Migration `0012_mail_settings.sql`: new columns on
`camp_mail_info` and `registrations`, `email_deliveries.registration_id` nullable.

**Testing**: Vitest unit tests in `tests/unit/` (pure rules, schema, templates, preview)

**Target Platform**: Vercel (Node runtime), Vercel Cron for the daily runs

**Project Type**: Web application (single Next.js project)

**Performance Goals**: Daily runs stay within the existing budget of 100 mails and the run cap;
loading settings adds one query per run (settings for all run camps in one `in` query).

**Constraints**: Defaults must reproduce today's behaviour exactly (SC-003). Sender address stays
`EMAIL_FROM` because the domain is verified at the provider. Test sends never displace confirmations
(`CONFIRMATION_RESERVE`).

**Scale/Scope**: One camp per year, a few hundred registrations, a handful of admins.

## Constitution Check

*GATE: Must pass before Phase 0 research. Check again after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Fixed Stack, Clerk Owns Auth | Pass | No new dependency. Admin address for test sends comes from the Clerk backed `profiles.email`. |
| II. Server Is the Security Boundary | Pass | All writes and the test send are Server Actions guarded by `requirePermission`; inputs validated with Zod; provider key stays server side. |
| III. Strict Scope | Pass after amendment | No template editor and no `email_templates` table: only short fields at fixed positions. The test send contradicts AGENTS.md section 4 ("no test send") and specs/007; task T001 amends AGENTS.md and notes the change in specs/007 before code is written, as required by this principle. |
| IV. Single Source of Truth | Pass | Schema change only via migration plus regenerated types. No CHECK constraints; ranges live in Zod and in `lib/email/limits.ts`. |
| V. Language Separation | Pass | German copy in `lib/admin/messages.ts` and `lib/email/messages.ts`; code English. |
| VI. Tolerant Payment, Hidden Pricing | Pass | Pause and switch only reduce automation; no cancellation. Test mails use sample data and the base price, never a hidden tier. Reminders still run through the cron route. |
| VII. Simplicity and Quality Gates | Pass | Reuse `camp_mail_info`, `deliver`, `email_deliveries`; limits centralized. Lint, test and build run at the end. |
| Writing Rules | Pass | New copy written without dashes. |

Check after design: unchanged, all gates pass (see research R1 to R8).

## Project Structure

### Documentation (this feature)

```text
specs/016-mail-settings/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── actions-and-mail.md
└── tasks.md            # created by /speckit-tasks
```

### Source Code (repository root)

```text
supabase/migrations/0012_mail_settings.sql        # new
lib/database.types.ts                              # regenerate
lib/email/limits.ts                                # range bounds, test cooldown
lib/email/settings.ts                              # new: CampMailSettings, defaults, resolve
lib/email/reminders.ts                             # timing parameter, pause, camp switch
lib/email/info-mails.ts                            # timing parameter for windows
lib/email/info-run.ts                              # load settings per camp, thanks query
lib/email/send.ts                                  # settings in target, sender, test send
lib/email/provider.ts                              # optional sender name and reply address
lib/email/templates.ts                             # text blocks at fixed positions
lib/email/info-templates.ts                        # sender only (no text blocks)
lib/email/preview.ts                               # previews with settings, test render
lib/email/deliveries.ts                            # nullable registration, test cooldown
lib/email/messages.ts                              # contact line copy, test subject prefix
lib/admin/camp-mail-info.ts                        # new fields, schema, ranges, order rule
lib/admin/camp-mail-info-data.ts                   # unchanged API, new columns mapped
lib/admin/types.ts, lib/admin/data.ts              # Registration.remindersPaused
lib/admin/finance.ts                               # FinanceRow.remindersPaused, filter "paused"
lib/admin/messages.ts                              # German UI copy
app/admin/camps/[campId]/infomails/page.tsx        # becomes "Mail Einstellungen"
app/admin/camps/[campId]/infomails/actions.ts      # saves the extended settings
components/admin/camp-mail-info-form.tsx           # new sections
app/admin/actions.ts                               # setReminderPauseAction (registrations)
app/admin/finanzen/actions.ts                      # setFinanceReminderPauseAction (finances)
components/admin/registration-form-dialog.tsx      # pause switch
components/admin/finance-table.tsx, finance-row-editor.tsx, finance-manager.tsx
app/admin/mail/page.tsx, app/admin/mail/actions.ts # settings aware triggers, test send
components/admin/mail-preview.tsx                  # status line, test send button
tests/unit/*.test.ts                               # new and updated tests
AGENTS.md, specs/007-transactional-emails/spec.md  # scope amendment for test send
```

**Structure Decision**: Single Next.js project, existing folders. The settings page stays at
`/admin/camps/[campId]/infomails` (route kept to avoid link churn) and is relabelled
"Mails" in the camp navigation.

## Decisions and Assumptions

- Settings extend `camp_mail_info` (research R1). Missing row: info mails off, reminders on,
  every timing null (default), no sender override, no text blocks.
- Timing columns are nullable integers; `null` means "use the constant" so a later change of a
  default reaches every camp without its own value (research R2).
- `lib/email/settings.ts` resolves a full `MailTiming` once per camp; rule functions receive it as
  a parameter and stay pure (research R3).
- Pause is a column on `registrations` with a timestamp (research R4). Two actions, one per
  permission, sharing one data helper.
- Sender: `from` becomes `"<name>" <address of EMAIL_FROM>`; reply address falls back to
  `EMAIL_REPLY_TO` (research R5).
- Text blocks appear in confirmation, payment link and reminders: greeting line replaces
  `m.greeting` when set (with first name prepended), closing replaces `m.closing`, contact line is
  added above the closing (research R6).
- Test sends are `email_deliveries` rows with `registration_id` null and `kind = 'test'`, so the
  existing quota counter includes them; cooldown per admin via `actor` and `created_at`
  (research R7).
- Duplicate migration number 0011 exists in the repo. The new file uses 0012; task T002 checks
  that the local migration history applies cleanly before the new migration is added (research R8).

## Security Requirements

- `saveCampMailInfoAction` and `sendTestMailAction`: `requirePermission("camps")`.
- `setReminderPauseAction`: `requirePermission("registrations")`;
  `setFinanceReminderPauseAction`: `requirePermission("finances")`.
- Test recipient is always `admin.email` from the server side profile; the client sends only the
  template id.
- Sender name restricted to letters, digits, spaces and `.,&'()!?` so it cannot inject header
  syntax; reply address validated as an email. Text blocks are escaped by the existing
  `renderParagraph`.
- Finance tab still receives only finance fields plus the pause flag.

## Acceptance Criteria

Spec FR-001 to FR-020 and SC-001 to SC-006. In particular a camp without its own settings sends
byte identical mails at identical days as before (unit tests compare against current output).

## Checks to Run

- `npm run lint`
- `npm test`
- `npm run build`
- Migration applied locally and `lib/database.types.ts` regenerated before tests.

## Manual Test Steps

See [quickstart.md](./quickstart.md).

## Complexity Tracking

No violations to justify. The scope amendment for the test send is handled by task T001 as the
constitution requires.
