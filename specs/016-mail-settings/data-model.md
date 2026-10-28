# Data Model: Mail Einstellungen pro Camp

Migration `supabase/migrations/0012_mail_settings.sql`. No CHECK constraints; validation in Zod
(`lib/admin/camp-mail-info.ts`). RLS stays enabled, only the service role reads and writes.

## camp_mail_info (extended)

| Column | Type | Default | Meaning |
|---|---|---|---|
| reminders_enabled | boolean not null | true | Automatic payment reminders for this camp |
| teaser_days_before | integer null | null | Vorfreude, days before start (14 to 120), null = 56 |
| packing_days_before | integer null | null | Packzettel, days before start (7 to 60), null = 21 |
| arrival_days_before | integer null | null | Anreise, days before start (1 to 21), null = 5 |
| thanks_days_after | integer null | null | Danke, days after end (1 to 29), null = 5 |
| reminder_first_after_days | integer null | null | First reminder after registration (3 to 60), null = 7 |
| reminder_before_due_days | integer null | null | Second reminder before due date (1 to 30), null = 7 |
| reminder_min_gap_days | integer null | null | Minimum gap (1 to 14), null = 3 |
| sender_name | text null | null | Display name, at most 60 chars, safe charset |
| reply_to | text null | null | Valid email address |
| text_greeting | text null | null | At most 300 chars |
| text_closing | text null | null | At most 200 chars |
| contact_name | text null | null | At most 80 chars |
| contact_phone | text null | null | At most 40 chars |

Validation rules:

- Integer, inside the ranges above (bounds in `lib/email/limits.ts` as `TIMING_BOUNDS`).
- Effective values must satisfy teaser > packing > arrival (days before start), compared after
  resolving nulls to defaults.
- Missing row: as today for info mails, plus `reminders_enabled = true`, every other new field null.

## registrations (extended)

| Column | Type | Default | Meaning |
|---|---|---|---|
| reminders_paused | boolean not null | false | No automatic payment reminders |
| reminders_paused_at | timestamptz null | null | Last change of the flag |

## email_deliveries (changed)

- `registration_id` becomes nullable. Rows with null are test sends: `kind = 'test'`,
  `trigger = 'admin'`, `actor = <Clerk user id>`.
- The partial unique index `(registration_id, kind)` is unaffected (nulls never collide).
- `countDeliveriesSince` counts test rows, so tests share the daily quota.

## Types (lib)

- `MailTiming`: `{ teaserDaysBefore, packingDaysBefore, arrivalDaysBefore, thanksDaysAfter,
  reminderFirstAfterDays, reminderBeforeDueDays, reminderMinGapDays }`, all numbers.
- `MailTexts`: `{ greeting, closing, contactName, contactPhone }`, each `string | null`.
- `MailSender`: `{ name: string | null; replyTo: string | null }`.
- `CampMailSettings`: `{ remindersEnabled, timing: MailTiming, sender: MailSender, texts: MailTexts }`.
- `CampMailInfo` gains the raw nullable fields; `resolveMailSettings(info)` returns `CampMailSettings`.
- `Registration.remindersPaused: boolean`; `FinanceRow.remindersPaused: boolean`;
  `FinanceFilter` gains `"paused"`.

## State transitions

- Pause: `false → true` and `true → false` by an admin with `registrations` or `finances`
  permission; each change sets `reminders_paused_at = now()` and writes a log entry.
- Test delivery: `sending → sent | failed`, stale rows handled by the existing `failStaleDeliveries`.
