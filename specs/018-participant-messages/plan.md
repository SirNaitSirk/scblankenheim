# Implementation Plan: Nachricht ans Team und Änderung anfragen

**Branch**: `018-participant-messages` | **Date**: 2026-10-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/018-participant-messages/spec.md`

## Summary

The participant page (017) gets a contact block with two modes: a free text message to the team and
a change request for one of the person's own fields. Both are stored in a new table
`participant_messages` and forwarded to the camp's team address by mail (reply to the
registration's address), within the shared daily quota. Admins see open items as a count badge in the
registrations table and handle them in a new "Nachrichten" section of the registration dialog:
mark a message done, apply or dismiss a change request. Applying revalidates the value with the
registration form rules and asks for confirmation when the stored value changed in the meantime.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 16.4 App Router (Server Components, Server Actions, `after()`)

**Primary Dependencies**: Clerk (admin only), Supabase JS (service role), Zod, existing Resend
provider. No new dependency.

**Storage**: Migration `0014_participant_messages.sql`: new table `participant_messages`, the
`email_deliveries_once_idx` partial index also excludes the new kind `team_message`.

**Testing**: Vitest unit tests (input schema, change application, team mail template, limits)

**Target Platform**: Vercel (Node runtime)

**Project Type**: Web application (single Next.js project)

**Performance Goals**: Sending responds without waiting for the provider (mail in `after()`).
The registrations table adds one grouped query for open counts.

**Constraints**: Public write endpoint must be gated by a valid access token, Zod and throttles.
No chat, no reply in the app (FR-014). Team mail never displaces confirmations
(`CONFIRMATION_RESERVE`).

**Scale/Scope**: A few hundred registrations, a handful of messages per day at most.

## Constitution Check

*GATE: Must pass before Phase 0 research. Check again after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Fixed Stack, Clerk Owns Auth | Pass | Participants act through the 017 capability token, admins through Clerk. No new dependency. |
| II. Server Is the Security Boundary | Pass | The public Server Action resolves the token on the server, validates with Zod, throttles per ip and per registration. Admin actions behind `requirePermission("registrations")`. Writes with the service role only. |
| III. Strict Scope | Pass after amendment | Task T001 adds the feature to AGENTS.md section 4 and the table to section 5. No chat and no in app replies. |
| IV. Single Source of Truth | Pass | Change requests reuse `validateField` and `mergeFields` of the one registration form. Schema via migration plus regenerated types. No CHECK constraints on values. |
| V. Language Separation | Pass | Page copy in `lib/participant/messages.ts`, admin copy in `lib/admin/messages.ts`, team mail copy in `lib/email/messages.ts`. |
| VI. Tolerant Payment, Hidden Pricing | Pass | Price, tier, payment and status are not requestable. Team mail shows no tier. |
| VII. Simplicity and Quality Gates | Pass | Reuses `deliver` style claiming, `email_deliveries`, `submission_attempts`, `writeLog`, the 017 view. Limits in `lib/participant/limits.ts`. Lint, test, build at the end. |
| Writing Rules | Pass | New copy without dashes. |

Check after design: unchanged, all gates pass (research R1 to R8).

## Existing code inspected

- 017 modules: `lib/participant/*`, `app/meine-anmeldung/[token]/page.tsx`,
  `components/participant/participant-summary.tsx`.
- `lib/register/validation.ts` (`validateField`, `mergeFields`, `CORE_FIELDS`, `GENDER_OPTIONS`).
- `lib/email/send.ts` (`deliver`, `sendTestEmail` quota and reserve check), `lib/email/provider.ts`
  (`sendEmail` with sender name and reply to), `lib/email/deliveries.ts`, `lib/email/settings.ts`,
  `lib/admin/camp-mail-info-data.ts`, `supabase/migrations/0008_email_deliveries.sql`.
- `lib/admin/data.ts` (`getRegistrations`, `mapRegistration`, `writeLog`), `app/admin/actions.ts`
  (`runGuarded`), `components/admin/registration-form-dialog.tsx`, `components/admin/mail-history.tsx`,
  `components/admin/registrations-table.tsx`.

## Files likely to change

```text
supabase/migrations/0014_participant_messages.sql      new
lib/database.types.ts                                  participant_messages
lib/participant/limits.ts                              message limits
lib/participant/contact.ts                             new: pure input schema, change helpers
lib/participant/messages.ts                            page copy
lib/participant/view.ts                                editable fields, own messages in the view
lib/participant/lookup.ts                              load own messages and field options
lib/participant/submit.ts                              new: server only store and throttle
app/meine-anmeldung/[token]/actions.ts                 new: public Server Action
components/participant/participant-contact.tsx         new: client form
components/participant/participant-summary.tsx         render contact and own messages
lib/email/team-templates.ts                            new: team mail template
lib/email/team.ts                                      new: send team notification
lib/email/messages.ts                                  team mail copy
lib/email/deliveries.ts                                exclude team_message from history
lib/admin/participant-messages.ts                      new: admin data (list, counts, resolve, apply)
lib/admin/types.ts, lib/admin/data.ts                  openMessages on Registration
lib/admin/messages.ts                                  admin copy
app/admin/actions.ts                                   load, resolve, apply actions
components/admin/participant-messages-panel.tsx        new: dialog section
components/admin/registration-form-dialog.tsx          render the section
components/admin/registrations-table.tsx               open count badge
components/admin/registrations-manager.tsx             pass actions
tests/unit/participant-contact.test.ts                 new
tests/unit/email-team-templates.test.ts                new
AGENTS.md                                              scope and data model
```

## Security requirements

- Public Server Action `sendParticipantMessageAction(token, input)`: normalize token (017), resolve
  the non deleted registration by token on the server, never trust a registration id from the
  client. Zod schema per kind, text trimmed, length limits from `lib/participant/limits.ts`.
- Throttles: per ip `submission_attempts` kind `participant_message`, 10 within 10 minutes (every
  attempt counts); per registration 5 stored items per Berlin day. Duplicate of the same text and
  field within 60 seconds is answered as success without a new row.
- Change requests: field key must be one of the registration's core keys or a current question field
  of its camp; value validated with `validateField`; equal to stored value is rejected.
- Team mail: all user text escaped by the layout helpers; reply to is the registration email only
  when it passes the email regex; sent only when a team address exists and the day's count is below
  `DAILY_EMAIL_BUDGET - CONFIRMATION_RESERVE`. Claimed in `email_deliveries` with kind
  `team_message` so it counts against the quota.
- Admin actions behind `requirePermission("registrations")`; apply re-reads the registration,
  revalidates, checks the stored value against `previous_value` and requires `confirmOverwrite` on a
  mismatch. Logs carry field key and reference, never the values (they may be health data).
- No HTML rendering of user text anywhere (React escapes, `whitespace-pre-line` only).

## Acceptance criteria

Acceptance scenarios of User Stories 1 to 3 in [spec.md](./spec.md).

## Checks to run

- `npm run lint`, `npm test`, `npm run build`
- Migration applied by the project owner, types updated

## Manual test steps

See [quickstart.md](./quickstart.md).

## UI

- **Participant page**: a card "Fragen oder Korrekturen" below "Deine Angaben" with a two option
  segmented control ("Nachricht", "Änderung anfragen"). Message mode: textarea with counter, send
  button. Change mode: field select, type matched input (text, textarea, select, Ja/Nein, date,
  number, email), optional reason, send button. Success state inline ("Danke, das Team meldet sich
  per Mail."), errors inline. Below: "Deine Anliegen" list (date, kind, text or "Feld: neu", status
  badge). Mobile first, full width controls.
- **Admin table**: neutral badge "2 offen" next to the name, like the pause badge in the finance
  table.
- **Admin dialog**: section "Nachrichten" after the participant link panel: list, newest first; each
  item with kind label, date, text; change requests show "Feld: alt → neu" and buttons
  "Übernehmen" and "Ablehnen"; messages "Als erledigt markieren". Conflict state shows the current
  value and "Trotzdem übernehmen". Done items muted with result and admin.
- States: loading, empty ("Keine Nachrichten"), error, sending.
- Use `impeccable` and `tasteskill` during implementation of the participant card.

## Project Structure

```text
specs/018-participant-messages/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── actions-and-mail.md
└── tasks.md
```

**Structure Decision**: single Next.js project. Participant side in `lib/participant/` and
`components/participant/`, admin side in `lib/admin/` and `components/admin/`, mail in `lib/email/`.
