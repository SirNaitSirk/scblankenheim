-- Participant page access (specs/017-participant-page).
--
-- Every registration gets a private, unguessable token for its read only
-- participant page. The value is two random uuids without separators (64 hex
-- characters). Because the default is volatile, adding the column fills every
-- existing row with its own value, so no separate backfill is needed, and the
-- public insert function stays unchanged. Admins renew a token from the server.
-- The format is validated in the app, not by a CHECK constraint. Only the
-- service role reads the column; anon has no select on registrations.

alter table public.registrations
  add column access_token text not null
    default (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''));

create unique index registrations_access_token_key
  on public.registrations (access_token);
