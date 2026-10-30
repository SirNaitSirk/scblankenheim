# Data Model: Schulbefreiung

Migration `0015_school_release.sql`. No CHECK constraints on values; validation in Zod
(`lib/school-release/schema.ts`). RLS on, service role only.

## Neue Tabelle `school_releases`

| Column | Type | Notes |
|---|---|---|
| `registration_id` | uuid PK, FK `registrations(id)` on delete cascade | one row per registration |
| `camp_id` | uuid FK `camps(id)` on delete cascade | for camp wide queries |
| `teacher_name` | text not null | max 120 |
| `school_name` | text not null | max 160 |
| `school_address` | text not null | max 300, up to 4 lines |
| `participant_address` | text not null | max 300, up to 4 lines |
| `class_name` | text null | max 40 |
| `updated_by` | text not null | `participant` or the Clerk user id of the admin |
| `created_at` | timestamptz default now() | |
| `updated_at` | timestamptz default now() | |

Upsert on `registration_id`. Deleted together with the registration (cascade and explicit delete on
soft delete, research R8).

## Erweiterung `camp_mail_info`

| Column | Type | Notes |
|---|---|---|
| `release_enabled` | boolean not null default false | switch; may only be true when complete |
| `release_dates` | date[] not null default '{}' | 1 to 5 dates within the camp period |
| `release_signer_name` | text null | max 120 |
| `release_signer_role` | text null | max 120, e.g. "Campleitung" |
| `release_signature_path` | text null | object path in bucket `signatures` |
| `release_address_keys` | text[] not null default '{}' | ordered form field keys, max 4 |

"Complete" = signature path set, at least one date, signer name set. The save action rejects
`release_enabled = true` otherwise; removing the signature sets `release_enabled = false`.

## Storage

Private bucket `signatures` (created in the migration, `public = false`). Objects
`<campId>/signature-<timestamp>.png|jpg`; the previous object is removed after a replace.

## `email_deliveries`

New kinds `school_release`, `participant_link`; new rows may use trigger `participant`.
`email_deliveries_once_idx` recreated with
`where kind not in ('payment_link', 'team_message', 'school_release', 'participant_link')`.

## `submission_attempts`

New kinds `school_release` (participant submits) and `participant_link` (landing requests).

## Typen

Regenerate `lib/database.types.ts`. Domain types in `lib/school-release/types.ts`:

```ts
type ReleaseSettings = {
  enabled: boolean;
  dates: string[];          // ISO dates
  signerName: string | null;
  signerRole: string | null;
  signaturePath: string | null;
  addressKeys: string[];
};

type SchoolReleaseData = {
  teacherName: string;
  schoolName: string;
  schoolAddress: string;
  participantAddress: string;
  className: string | null;
};
```

## Zustände

```text
Camp:          off ──(complete + switch)──▶ on ──(switch off | signature removed)──▶ off
Registration:  no data ──(submit by person or admin)──▶ data ──(edit)──▶ data
               any ──(registration deleted)──▶ removed
```
