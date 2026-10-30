-- School release letters (specs/020-school-release).
--
-- One row per registration holds the data a participant or an admin entered
-- for the letter: teacher, school, school address, own address and class. The
-- PDF is never stored; it is rendered on every request. Rows go away with the
-- registration (cascade, and explicitly on soft delete in the app).
--
-- camp_mail_info gains the per camp release settings: switch, release dates,
-- signer name and role, the path of the signature image in the private bucket
-- 'signatures' and the ordered form field keys that prefill the address.
-- Values are validated in the app, not by CHECK constraints. Only the service
-- role reads and writes.
--
-- Release letters and link mails may repeat per registration, so the partial
-- unique index of email_deliveries excludes both kinds.

create table public.school_releases (
  registration_id     uuid primary key references public.registrations(id) on delete cascade,
  camp_id             uuid not null references public.camps(id) on delete cascade,
  teacher_name        text not null,
  school_name         text not null,
  school_address      text not null,
  participant_address text not null,
  class_name          text,
  updated_by          text not null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index school_releases_camp_idx on public.school_releases (camp_id);

alter table public.school_releases enable row level security;

alter table public.camp_mail_info
  add column release_enabled        boolean not null default false,
  add column release_dates          date[] not null default '{}',
  add column release_signer_name    text,
  add column release_signer_role    text,
  add column release_signature_path text,
  add column release_address_keys   text[] not null default '{}';

insert into storage.buckets (id, name, public)
values ('signatures', 'signatures', false)
on conflict (id) do nothing;

drop index public.email_deliveries_once_idx;

create unique index email_deliveries_once_idx
  on public.email_deliveries (registration_id, kind)
  where kind not in ('payment_link', 'team_message', 'school_release', 'participant_link')
    and status in ('sending', 'sent');
