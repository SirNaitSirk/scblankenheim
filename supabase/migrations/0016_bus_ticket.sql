-- Bus ticket (specs/021-bus-ticket).
--
-- camp_bus_settings maps the bus to one question of the camp's registration
-- form: the field key and the answer values that mean "takes the bus". A
-- missing row means off. Whether a registration is a bus person is always
-- derived from its stored answer; there is no separate flag.
--
-- bus_tickets holds one row per issued code. A reissue or block sets
-- revoked_at; revoked rows stay so an old code is recognised as invalid. At
-- most one active row per registration.
--
-- bus_boardings holds at most one boarding per registration and trip
-- ('outbound' or 'return'), by scan or manual.
--
-- Values are validated in the app, not by CHECK constraints. Only the service
-- role reads and writes. Ticket mails may repeat per registration, so the
-- partial unique index of email_deliveries excludes the kind 'bus_ticket'.

create table public.camp_bus_settings (
  camp_id    uuid primary key references public.camps(id) on delete cascade,
  enabled    boolean not null default false,
  field_key  text,
  answers    text[] not null default '{}',
  updated_by text not null,
  updated_at timestamptz not null default now()
);

alter table public.camp_bus_settings enable row level security;

create table public.bus_tickets (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  registration_id uuid not null references public.registrations(id) on delete cascade,
  camp_id         uuid not null references public.camps(id) on delete cascade,
  created_at      timestamptz not null default now(),
  created_by      text,
  revoked_at      timestamptz,
  revoked_by      text
);

create unique index bus_tickets_active_idx
  on public.bus_tickets (registration_id)
  where revoked_at is null;

create index bus_tickets_camp_idx on public.bus_tickets (camp_id);

alter table public.bus_tickets enable row level security;

create table public.bus_boardings (
  registration_id uuid not null references public.registrations(id) on delete cascade,
  trip            text not null,
  camp_id         uuid not null references public.camps(id) on delete cascade,
  boarded_at      timestamptz not null default now(),
  boarded_by      text not null,
  method          text not null,
  primary key (registration_id, trip)
);

create index bus_boardings_camp_trip_idx on public.bus_boardings (camp_id, trip);

alter table public.bus_boardings enable row level security;

drop index public.email_deliveries_once_idx;

create unique index email_deliveries_once_idx
  on public.email_deliveries (registration_id, kind)
  where kind not in ('payment_link', 'team_message', 'school_release', 'participant_link', 'bus_ticket')
    and status in ('sending', 'sent');
