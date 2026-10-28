-- Messages and change requests from the participant page
-- (specs/018-participant-messages).
--
-- One row per item a person sends from the participant page: a free text
-- message or a request to change one own field. Change requests keep the field,
-- its label, the stored value at submit time and the requested value, so an
-- admin can apply them with one click and conflicts are detected. Values are
-- validated in the app, not by CHECK constraints. Only the service role reads
-- and writes. Team notification mails are recorded in email_deliveries with the
-- kind 'team_message' and may repeat per registration, so the partial unique
-- index excludes that kind as it does for payment links.

create table public.participant_messages (
  id              uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  camp_id         uuid not null references public.camps(id) on delete cascade,
  kind            text not null,
  body            text not null default '',
  field_key       text,
  field_label     text,
  previous_value  jsonb,
  proposed_value  jsonb,
  status          text not null default 'open',
  resolution      text,
  resolved_by     text,
  resolved_at     timestamptz,
  created_at      timestamptz not null default now()
);

create index participant_messages_registration_idx
  on public.participant_messages (registration_id, created_at desc);

create index participant_messages_open_idx
  on public.participant_messages (registration_id)
  where status = 'open';

alter table public.participant_messages enable row level security;

drop index public.email_deliveries_once_idx;

create unique index email_deliveries_once_idx
  on public.email_deliveries (registration_id, kind)
  where kind not in ('payment_link', 'team_message') and status in ('sending', 'sent');
