# Data Model: Mails und Zahlungserinnerungen

Feature: [spec.md](./spec.md) · Decisions: [research.md](./research.md) R4, R5

## New table `email_deliveries` (migration `0008_email_deliveries.sql`)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid, pk, `gen_random_uuid()` | |
| `registration_id` | uuid, not null, fk `registrations(id)` on delete cascade | |
| `kind` | text, not null | `confirmation`, `payment_link`, `reminder_1`, `reminder_2`, `reminder_3` (validated in app) |
| `status` | text, not null | `sending`, `sent`, `failed` (validated in app) |
| `trigger` | text, not null | `registration`, `cron`, `admin` |
| `actor` | text, null | Clerk user id of the admin for `trigger = admin` |
| `provider_message_id` | text, null | id returned by the provider |
| `error` | text, null | short code: `not_configured`, `rejected`, `rate_limited`, `network`, `stale` |
| `created_at` | timestamptz, not null, default now() | claim time |
| `updated_at` | timestamptz, not null, default now() | last status change |

No mail address and no body are stored (FR-007); the address stays on `registrations.email`.

Indexes:

- `email_deliveries_once_idx`: unique on `(registration_id, kind)` where
  `kind <> 'payment_link' and status in ('sending', 'sent')`. Guarantees one confirmation and each
  reminder at most once while still allowing retries after `failed`.
- `email_deliveries_registration_idx` on `(registration_id, created_at desc)` for admin display and
  the payment link rate limit.

RLS enabled, no grants to `anon` or `authenticated`; only the service role reads and writes. No
CHECK constraints on `kind`, `status`, `trigger` (constitution IV).

### State transitions

```text
(claim insert) → sending ─ provider accepted ─→ sent
                         ─ provider error ────→ failed   (unblocks retry)
                         ─ older than 30 min ─→ failed   (error = stale, at start of cron run)
```

## Unchanged tables, fields read

- `registrations`: `id`, `reference`, `camp_id`, `first_name`, `email`, `status`, `payment_status`,
  `amount_due`, `amount_paid`, `deleted`, `registered_at`.
- `camps`: `name`, `start_date`, `end_date`, `payment_due_date`.
- `camp_settings.current_camp_id`: selects the camp whose registrations are reminded.
- `logs`: receives `email.*` and `reminders.run` entries.

## Derived values (TypeScript, not stored)

- `outstandingAmount` (existing, `lib/payment/eligibility.ts`): euros still to pay.
- `ReminderKind = "reminder_1" | "reminder_2" | "reminder_3"`; `nextReminder()` per research R5.
- Admin `Registration` gains `reminderCount: number` and `lastReminderAt: string | null`, aggregated
  in JS from `email_deliveries` rows with status `sent` and a reminder kind (no joined filter, see
  AGENTS.md Supabase gotchas).

## Eligibility for reminders and payment link mail (FR-012, FR-020)

Eligible when all hold: not `deleted`, `status <> 'cancelled'`, `email` present, `payment_status` in
(`unpaid`, `partial`), `outstandingAmount > 0`. Reminders additionally require the registration to
belong to the current camp.
