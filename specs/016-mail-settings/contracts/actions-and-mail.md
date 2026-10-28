# Contracts: Server Actions and Mail Behaviour

All actions return the existing `ActionResult` (`{ ok: true } | { ok: false; error; fieldErrors? }`)
with German messages from `lib/admin/messages.ts`.

## saveCampMailInfoAction(campId, values) (extended)

- File: `app/admin/camps/[campId]/infomails/actions.ts`
- Guard: `requirePermission("camps")`, else `unauthorized`.
- Input: existing `CampMailInfoFormValues` plus
  `remindersEnabled: boolean`, seven timing fields as `string` ("" = default),
  `senderName`, `replyTo`, `textGreeting`, `textClosing`, `contactName`, `contactPhone` as `string`.
- Validation: ranges and order (data-model.md), email format, sender charset and length, text
  lengths. Field errors keyed by field name.
- Effect: upsert row, log `camp_mail_info.saved`, revalidate the settings page and `/admin/mail`.

## setReminderPauseAction(reference, paused)

- File: `app/admin/actions.ts`, guard `requirePermission("registrations")`.
- Input: `{ reference: string (1..32), paused: boolean }` (Zod).
- Effect: update `reminders_paused`, `reminders_paused_at`; log `registration.reminders_paused`
  or `registration.reminders_resumed` with reference; revalidate `/admin`, `/admin/finanzen`.
- Errors: `notFound` when no registration has the reference.

## setFinanceReminderPauseAction(reference, paused)

- File: `app/admin/finanzen/actions.ts`, guard `requirePermission("finances")`, same input and
  effect through the same data helper.

## sendTestMailAction(templateId)

- File: `app/admin/mail/actions.ts`, guard `requirePermission("camps")`.
- Input: `templateId` in `PreviewId | InfoMailKind` (Zod enum).
- Outcomes:
  - `ok` with toast "Testmail an <Adresse> verschickt".
  - `no_email`: admin profile without email.
  - `no_camp`: no current camp.
  - `cooldown`: a test by this admin within 60 seconds.
  - `quota`: sent today ≥ budget minus confirmation reserve.
  - `failed`: provider or database error (logged as `email.test_failed`).
- Effect: render the template with sample data and current camp settings, subject
  `Test: <Betreff>`, send to `admin.email` with camp sender, record `email_deliveries` row with null
  registration, log `email.test_sent`.

## Mail behaviour

| Mail | Uses timing | Uses switch and pause | Uses sender | Uses text blocks |
|---|---|---|---|---|
| Bestätigung | no | no | yes | yes |
| Zahlungslink (Admin) | no | no | yes | yes |
| Erinnerung 1 to 3 | first after, before due, gap | camp switch, pause | yes | yes |
| Infomails | stage days | no | yes | no |
| Testmail | n/a | n/a | yes | as the template |

Text block positions (confirmation, payment link, reminders):

1. `Hallo <Vorname>,`
2. custom greeting line, if set
3. template body (unchanged)
4. `Bei Fragen erreichst du <Name> unter <Telefon>.` if name or phone set (only the given part is
   shown when one is missing)
5. custom closing, else the default closing
