-- CampConnect — initial schema.
--
-- Data layer only. Authentication is Clerk (no Supabase Auth); authorization is
-- enforced in the Next.js server layer via the service-role client. RLS is enabled
-- on every table as defense-in-depth, with public (anon) SELECT granted only where
-- the public site legitimately reads. Money is stored as integer whole euros.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- One row per yearly camp. Per-camp settings (dates, price, window, room
-- capacity, landing copy) live here; `config` is an escape hatch for future
-- settings so they do not each require a migration.
create table public.camps (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  location              text,
  start_date            date,
  end_date              date,
  capacity              int,
  base_price            int not null default 0,
  room_capacity         int,
  registration_open     boolean not null default true,
  registration_opens_at timestamptz,
  registration_closes_at timestamptz,
  payment_due_date      date,
  tagline               text,
  description           text,
  config                jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now()
);

-- Single global row (singleton via `id boolean primary key check (id)`). Holds
-- the current-camp pointer and app-wide settings admins can edit without a deploy.
create table public.camp_settings (
  id              boolean primary key default true,
  current_camp_id uuid references public.camps(id) on delete set null,
  settings        jsonb not null default '{}'::jsonb,
  updated_at      timestamptz not null default now(),
  constraint camp_settings_singleton check (id)
);

-- Dynamic registration form definition per camp. Drives both the public form and
-- the admin table columns. `config` carries field-level extras (placeholder, help
-- text, validation, conditional visibility) as data, not migrations.
create table public.camp_form_fields (
  id         uuid primary key default gen_random_uuid(),
  camp_id    uuid not null references public.camps(id) on delete cascade,
  key        text not null,
  label      text not null,
  field_type text not null default 'text',
  required   boolean not null default false,
  options    jsonb,
  sort_order int not null default 0,
  config     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (camp_id, key)
);

-- Pricing tiers per camp, including hidden ones reachable only via invitation
-- link (`invitation_token`). `valid_from`/`valid_until` allow admin-set validity
-- windows (e.g. early-bird auto-expiry).
create table public.price_tiers (
  id               uuid primary key default gen_random_uuid(),
  camp_id          uuid not null references public.camps(id) on delete cascade,
  name             text not null,
  price            int not null,
  hidden           boolean not null default false,
  invitation_token text unique,
  valid_from       timestamptz,
  valid_until      timestamptz,
  created_at       timestamptz not null default now()
);

-- Attendee registrations (main entity). Free-form/status values are intentionally
-- NOT CHECK-constrained (validated in the app/Zod layer). `form_data` holds the
-- dynamic field answers keyed by `camp_form_fields.key`.
create table public.registrations (
  id                uuid primary key default gen_random_uuid(),
  reference         text not null unique,
  camp_id           uuid not null references public.camps(id) on delete cascade,
  price_tier_id     uuid references public.price_tiers(id) on delete set null,
  first_name        text,
  last_name         text,
  email             text,
  city              text,
  form_data         jsonb not null default '{}'::jsonb,
  status            text not null default 'pending',
  payment_status    text not null default 'unpaid',
  amount_due        int not null default 0,
  amount_paid       int not null default 0,
  stripe_session_id text,
  deleted           boolean not null default false,
  registered_at     timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

-- Throttling / abuse tracking for the public form.
create table public.submission_attempts (
  id         uuid primary key default gen_random_uuid(),
  email      text,
  ip         text,
  camp_id    uuid references public.camps(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Admin profile keyed by the Clerk user id (text, not uuid — there is no
-- auth.users to join). Holds granular permissions + visible tabs.
create table public.profiles (
  id             text primary key,
  name           text,
  email          text,
  permissions    text[] not null default '{}',
  visible_tabs   text[] not null default '{}',
  status         text not null default 'active',
  last_active_at timestamptz,
  created_at     timestamptz not null default now()
);

-- Role per admin (superadmin / admin). One role per user.
create table public.user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null references public.profiles(id) on delete cascade,
  role       text not null,
  created_at timestamptz not null default now(),
  unique (user_id)
);

-- Pending admin invitations.
create table public.admin_invitations (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  role         text not null default 'admin',
  permissions  text[] not null default '{}',
  visible_tabs text[] not null default '{}',
  token        text not null unique,
  status       text not null default 'pending',
  invited_by   text,
  accepted_at  timestamptz,
  created_at   timestamptz not null default now()
);

-- Lightweight activity / error log.
create table public.logs (
  id         uuid primary key default gen_random_uuid(),
  level      text not null default 'info',
  actor      text,
  action     text,
  message    text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index registrations_camp_id_idx        on public.registrations (camp_id);
create index registrations_price_tier_id_idx  on public.registrations (price_tier_id);
create index registrations_deleted_idx        on public.registrations (deleted);
create index camp_form_fields_camp_id_idx      on public.camp_form_fields (camp_id);
create index price_tiers_camp_id_idx           on public.price_tiers (camp_id);
create index submission_attempts_email_idx     on public.submission_attempts (email);
create index logs_created_at_idx               on public.logs (created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- Enable RLS on every table. Privileged work uses the service-role client, which
-- bypasses RLS. Public (anon) SELECT is granted only on the four tables the public
-- site reads; hidden price tiers never leak to anon.

alter table public.camps               enable row level security;
alter table public.camp_settings       enable row level security;
alter table public.camp_form_fields    enable row level security;
alter table public.price_tiers         enable row level security;
alter table public.registrations       enable row level security;
alter table public.submission_attempts enable row level security;
alter table public.profiles            enable row level security;
alter table public.user_roles          enable row level security;
alter table public.admin_invitations   enable row level security;
alter table public.logs                enable row level security;

-- Public read surface (RLS policy + Data API grant — both are required).
grant select on public.camps            to anon;
grant select on public.camp_settings    to anon;
grant select on public.camp_form_fields to anon;
grant select on public.price_tiers      to anon;

create policy "Public camps are readable"
  on public.camps for select to anon using (true);

create policy "Public camp settings are readable"
  on public.camp_settings for select to anon using (true);

create policy "Public form fields are readable"
  on public.camp_form_fields for select to anon using (true);

-- Only non-hidden tiers are ever visible to anon; hidden tiers are read
-- server-side via the service-role client (invitation flow).
create policy "Public price tiers are readable"
  on public.price_tiers for select to anon using (hidden = false);

-- All other tables: RLS enabled, no anon/authenticated policies (default-deny).
-- Only the service-role client touches them.
