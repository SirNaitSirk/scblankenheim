# Research: Mail Einstellungen pro Camp

## R1 · Where the settings live

- **Decision**: Add columns to `camp_mail_info` (one row per camp).
- **Rationale**: The table already holds per camp mail content and switches, has a data module,
  a save action guarded by `camps`, and a form. A missing row already means defaults.
- **Alternatives considered**: A new `camp_mail_settings` table (two rows to load and save for one
  page, no benefit); columns on `camps` (mixes mail concerns into the core camp form).

## R2 · Representing defaults

- **Decision**: Seven nullable integer columns; `null` means the constant from `lib/email/limits.ts`.
  The form shows the default as placeholder and offers "Vorgabe verwenden" per field.
- **Rationale**: Existing camps keep today's behaviour without a data backfill (SC-003), and a
  future change of a default applies to all camps that never set a value.
- **Alternatives considered**: Non null columns with defaults copied in the migration (freezes
  today's values per camp, makes "reset" ambiguous).

## R3 · Passing timing into the rules

- **Decision**: New `lib/email/settings.ts` exports `MailTiming`, `DEFAULT_TIMING`,
  `resolveTiming(row)` and `CampMailSettings` (timing, remindersEnabled, sender, texts).
  `nextReminder`, `infoDueDate`, `infoWindow`, `openInfoStage` and `nextInfoMail` take a
  `timing: MailTiming` argument. The thanks lookup in `loadRunCamps` widens the query to camps
  ended 1 to 30 days ago and filters per camp timing in JS.
- **Rationale**: Rules stay pure and testable; defaults are tested once.
- **Alternatives considered**: Reading settings inside the rule functions (breaks purity, needs
  the database in tests).

## R4 · Reminder pause

- **Decision**: `registrations.reminders_paused boolean not null default false` and
  `reminders_paused_at timestamptz`. `ReminderInput` gets `paused` and `campEnabled`;
  `isReminderEligible` returns false when either blocks. The info run keeps calling `nextReminder`
  for its "reminder today" rule, so a paused registration no longer blocks its info mail.
- **Rationale**: One flag on the main entity, visible in both admin views without a join.
  Behaviour after unpausing follows the existing stage rules (missed stages never sent late).
- **Alternatives considered**: A separate pause table (extra join for every run); a reason field
  (spec assumption: no reason, notes exist).

## R5 · Sender name and reply address

- **Decision**: `sendEmail` accepts an optional `sender: { name: string | null; replyTo: string | null }`.
  The address part of `EMAIL_FROM` is extracted (`Name <addr>` or bare `addr`) and combined with
  the camp name override as `"Name" <addr>`. Reply address: camp value, else `EMAIL_REPLY_TO`.
  Name limited to 60 characters from a safe character set.
- **Rationale**: The sending domain must stay verified at Resend; only display name and reply
  address are safe to change.
- **Alternatives considered**: Free sender address per camp (would fail at the provider).

## R6 · Text blocks in templates

- **Decision**: `EmailContext` gets `texts: MailTexts` (`greeting`, `closing`, `contactName`,
  `contactPhone`, each nullable). Confirmation and payment mails render: custom greeting line after
  "Hallo Vorname," when set; contact line "Bei Fragen erreichst du <Name> unter <Telefon>." above
  the closing when a name or phone is set; custom closing instead of the default closing. Info mails
  keep their own content from specs/012 and are not changed. All values pass through
  `renderParagraph` (escaped) and `renderText`.
- **Rationale**: Fixed positions keep the template code defined (no editor, Principle III) and the
  defaults byte identical.
- **Alternatives considered**: Placeholders inside a free text (that is a template editor).

## R7 · Test send, quota and cooldown

- **Decision**: Migration makes `email_deliveries.registration_id` nullable. A test send inserts a
  row `kind = 'test'`, `trigger = 'admin'`, `actor = admin id`, `registration_id = null`, then
  sends via `sendEmail` with idempotency key `test/<row id>` and marks sent or failed.
  Before claiming: reject when the admin has a `test` row within 60 seconds
  (`TEST_SEND_COOLDOWN_MS`) or when `countDeliveriesSince(day start)` is at least
  `DAILY_EMAIL_BUDGET - CONFIRMATION_RESERVE`. Subject is prefixed with "Test: ". Context comes from
  `sampleContext` plus the current camp settings; pay links point to `SAMPLE_REFERENCE`, which
  matches no registration, so no checkout can start.
  Mail history queries filter by `registration_id`, so test rows never appear there; the unique
  index ignores null registration ids.
- **Rationale**: One quota counter for all mail kinds, no new table, cooldown survives reloads.
- **Alternatives considered**: Count tests in `logs` (second counter to keep in sync); in memory
  cooldown (lost on serverless cold start).

## R8 · Migration numbering

- **Decision**: New migration `0012_mail_settings.sql`. Before adding it, check that the two
  existing `0011_*` files apply in a clean local reset; if the Supabase CLI rejects the duplicate
  version, raise it with the user as a separate small fix rather than renaming inside this feature.
- **Rationale**: Renaming an already applied migration can desync remote history; that decision
  belongs to the owner.
