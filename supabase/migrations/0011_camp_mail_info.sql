-- Info mails to active registrations (specs/012-info-mails).
--
-- One row per camp with the texts the four info mails need and one switch per
-- mail. A missing row means nothing filled and every mail switched off. Text
-- values are validated in the app, not by CHECK constraints. Only the service
-- role reads and writes. Deliveries reuse public.email_deliveries with the
-- kinds info_teaser, info_packing, info_arrival and info_thanks.

create table public.camp_mail_info (
  camp_id          uuid primary key references public.camps(id) on delete cascade,
  highlights       text,
  team_greeting    text,
  arrival_address  text,
  arrival_time     text,
  pickup_time      text,
  first_day        text,
  emergency_phone  text,
  phone_rules      text,
  photos_url       text,
  feedback_url     text,
  next_camp_note   text,
  teaser_enabled   boolean not null default false,
  packing_enabled  boolean not null default false,
  arrival_enabled  boolean not null default false,
  thanks_enabled   boolean not null default false,
  updated_at       timestamptz not null default now()
);

alter table public.camp_mail_info enable row level security;
