# Research: Nachricht ans Team und Änderung anfragen

## R1 · One table for messages and change requests

- **Decision**: `participant_messages` with `kind` `message` or `change_request`; change fields are
  nullable columns on the same row.
- **Rationale**: Same lifecycle (open, done), same list in the dialog and on the page, same team
  mail. Two tables would duplicate queries and UI.
- **Alternatives considered**: storing items in `logs` (not queryable per registration, no status);
  a jsonb array on `registrations` (concurrent writes, no index).

## R2 · Public write through a Server Action

- **Decision**: `app/meine-anmeldung/[token]/actions.ts` exports `sendParticipantMessageAction`.
  The token is a bound argument from the page; the action resolves the registration itself.
- **Rationale**: Same pattern as admin actions, progressive enhancement through `useActionState`, no
  extra route handler. The token is the authorization, like the page read.
- **Alternatives considered**: `app/api/participant-message` route handler (more boilerplate, same
  security).

## R3 · Throttling

- **Decision**: per ip 10 attempts in 10 minutes (`submission_attempts`, kind `participant_message`,
  every attempt recorded); per registration 5 stored items per Berlin day (count in
  `participant_messages`); duplicate text within 60 seconds returns success without insert.
- **Rationale**: Protects the team inbox and the mail quota without bothering real users.

## R4 · Team address and reply to

- **Decision**: to = `camp_mail_info.reply_to` (resolved sender of the camp), fallback
  `EMAIL_REPLY_TO`; reply to = the registration's email; from = `EMAIL_FROM` with the camp sender
  name. No team address: store only.
- **Rationale**: The team already maintains this address in 016 for answers to camp mails, so it is
  the team inbox. Reply to the person lets the team answer with one click (no chat needed).

## R5 · Quota and history

- **Decision**: Claim a row in `email_deliveries` (kind `team_message`, trigger `participant`,
  `registration_id` set) so `countDeliveriesSince` includes it. Send only while the day's count is
  below `DAILY_EMAIL_BUDGET - CONFIRMATION_RESERVE`. Migration recreates
  `email_deliveries_once_idx` with `kind not in ('payment_link', 'team_message')` so several team
  mails per registration are allowed. `getMailHistory` excludes `team_message`, because the dialog
  history lists mails to the person.
- **Rationale**: One quota counter for every mail kind (012 research R5).

## R6 · Change requests reuse form validation

- **Decision**: Allowed fields = `mergeFields(campFields)` without `step` rows. Validation with
  `validateField`, applied both on submit and on apply. Values stored as jsonb (`string` or
  `boolean`, the `FieldValue` type). Core keys write their column (`gender` through
  `genderFromOption`), other keys write `form_data[key]`.
- **Rationale**: Constitution IV, one rule set. Rechecking on apply catches fields whose options or
  rules changed since the request.

## R7 · Conflict on apply

- **Decision**: The row keeps `previous_value` (snapshot at submit). Apply compares it with the
  current stored value; on mismatch the action returns `{ ok: false, conflict: { current } }` and the
  dialog offers "Trotzdem übernehmen" which repeats the call with `confirmOverwrite: true`.
- **Rationale**: Prevents silently overwriting an admin edit made after the request.

## R8 · Visibility for admins

- **Decision**: `Registration.openMessages` (count) loaded in `getRegistrations` with one query over
  open rows grouped in JS; badge in the name cell. No new tab, no realtime.
- **Rationale**: Smallest visible signal in the place admins already work; the team mail is the
  primary notification.
