-- Transactional emails and payment reminders (specs/007-transactional-emails).
--
-- One row per send attempt. A row is claimed with status 'sending' before the
-- provider call and becomes 'sent' or 'failed' afterwards. The partial unique
-- index allows each confirmation and each reminder at most once per
-- registration while a failed attempt can be retried. Payment link mails sent
-- by admins may repeat. No address or body is stored. Values are validated in
-- the app, not by CHECK constraints. Only the service role reads and writes.

create table public.email_deliveries (
  id                  uuid primary key default gen_random_uuid(),
  registration_id     uuid not null references public.registrations(id) on delete cascade,
  kind                text not null,
  status              text not null,
  trigger             text not null,
  actor               text,
  provider_message_id text,
  error               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create unique index email_deliveries_once_idx
  on public.email_deliveries (registration_id, kind)
  where kind <> 'payment_link' and status in ('sending', 'sent');

create index email_deliveries_registration_idx
  on public.email_deliveries (registration_id, created_at desc);

alter table public.email_deliveries enable row level security;
