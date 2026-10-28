# Data Model: Nachricht ans Team und Änderung anfragen

## participant_messages (new)

| Column | Type | Rule |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | |
| `registration_id` | `uuid not null references registrations(id) on delete cascade` | resolved from the token on the server |
| `camp_id` | `uuid not null references camps(id) on delete cascade` | copied from the registration |
| `kind` | `text not null` | `message` or `change_request` (validated in the app) |
| `body` | `text not null default ''` | message text 1 to 2000 characters, or reason up to 500 characters (may be empty) |
| `field_key` | `text` | change request only |
| `field_label` | `text` | label at submit time |
| `previous_value` | `jsonb` | stored value at submit time (`string`, `boolean` or null) |
| `proposed_value` | `jsonb` | requested value (`string` or `boolean`) |
| `status` | `text not null default 'open'` | `open` or `done` |
| `resolution` | `text` | `done`, `applied` or `dismissed`, set with status `done` |
| `resolved_by` | `text` | Clerk user id of the admin |
| `resolved_at` | `timestamptz` | |
| `created_at` | `timestamptz not null default now()` | |

Indexes: `(registration_id, created_at desc)`; partial `(registration_id) where status = 'open'`.
RLS enabled, no policies (service role only). No CHECK constraints.

## email_deliveries (index change)

`email_deliveries_once_idx` recreated as unique on `(registration_id, kind)` where
`kind not in ('payment_link', 'team_message') and status in ('sending', 'sent')`.
New kind `team_message`, trigger `participant`.

## submission_attempts

New kind `participant_message`, one row per send attempt with `ip`.

## logs

Actions `registration.message_done`, `registration.change_applied`, `registration.change_dismissed`;
message `<reference> <field_key>` (no values).

## Registration (admin type)

Adds `openMessages: number`.

## ParticipantView (017, extended)

```text
editableFields: Array<{ key; label; type; options: string[] | null; required; current: string | boolean | null }>
messages: Array<{ id; kind; createdAt; text; fieldLabel: string | null; proposed: string | null; status: "open" | "done" }>
```

`proposed` is the display string (checkbox as "Ja" or "Nein", date German). At most the 20 newest
items.
