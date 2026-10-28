# Data Model: Infomails an Angemeldete

## New table `camp_mail_info` (migration `0011_camp_mail_info.sql`)

One row per camp. A missing row behaves like a row with every text empty and every switch off.

| Column | Type | Notes |
|---|---|---|
| `camp_id` | uuid, primary key, references `camps(id)` on delete cascade | |
| `highlights` | text, null | teaser; one highlight per line |
| `team_greeting` | text, null | teaser |
| `arrival_address` | text, null | arrival; required to enable arrival |
| `arrival_time` | text, null | arrival; free text, required to enable arrival |
| `pickup_time` | text, null | arrival |
| `first_day` | text, null | arrival, flow of the first day |
| `emergency_phone` | text, null | arrival; required to enable arrival |
| `phone_rules` | text, null | arrival |
| `photos_url` | text, null | thanks; must be `https://` (Zod) |
| `feedback_url` | text, null | thanks; must be `https://` (Zod) |
| `next_camp_note` | text, null | thanks, for example „Nächstes Jahr: 18. bis 25. Juli 2027“ |
| `teaser_enabled` | boolean, not null, default false | |
| `packing_enabled` | boolean, not null, default false | |
| `arrival_enabled` | boolean, not null, default false | |
| `thanks_enabled` | boolean, not null, default false | |
| `updated_at` | timestamptz, not null, default now() | |

RLS enabled, no policies: only the service role reads and writes. No CHECK constraints on the text
values (constitution IV); length limits (500 characters, 2000 for `first_day` and `phone_rules`) and
the arrival rule live in Zod. Camp `tagline` stays the motto source.

## Existing table `email_deliveries` (no schema change)

New `kind` values: `info_teaser`, `info_packing`, `info_arrival`, `info_thanks`, `trigger` `cron`.
The partial unique index `email_deliveries_once_idx` already enforces one `sending` or `sent` row per
registration and kind for these.

## Domain types (`lib/email/info-mails.ts`, `lib/admin/camp-mail-info.ts`)

- `InfoMailKind = "info_teaser" | "info_packing" | "info_arrival" | "info_thanks"`
- `CampMailInfo`: camelCase mirror of the table, text fields `string | null`, four `enabled` flags.
- `InfoMailInput` for `nextInfoMail`:
  `{ deleted, status, hasEmail, registeredDate, campStartDate, campEndDate, enabled: Record<InfoMailKind, boolean>, arrivalReady, sentKinds, lastInfoDate, reminderToday }`
- `InfoMailContext` extends the existing `EmailContext` with `mailInfo: CampMailInfo`,
  `motto: string | null`, `packingUrl`.

## Stage windows (Berlin dates)

| Kind | Opens | Closes (last day) |
|---|---|---|
| `info_teaser` | start − 56 | start − 22 |
| `info_packing` | start − 21 | start − 6 |
| `info_arrival` | start − 5 | start − 1 |
| `info_thanks` | end + 5 | end + 30 |

## State per registration and kind

`none` → `sending` (claim) → `sent` or `failed`; `failed` and stale `sending` rows can be claimed again
while the window is open. A cancelled or deleted registration never enters `sending`.
