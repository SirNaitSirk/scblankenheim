-- Stripe payments (specs/006-stripe-payment).
--
-- One row per Stripe payment intent; the registration's payment_status and
-- amount_paid are recomputed from these rows after every webhook event.
-- stripe_events makes webhook processing idempotent. Status values are
-- validated in the app, not by CHECK constraints. Only the service role
-- reads and writes these tables.

create table public.stripe_payments (
  id                  uuid primary key default gen_random_uuid(),
  registration_id     uuid not null references public.registrations(id) on delete cascade,
  payment_intent_id   text not null unique,
  checkout_session_id text,
  status              text not null,
  amount_cents        int not null,
  refunded_cents      int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index stripe_payments_registration_id_idx
  on public.stripe_payments (registration_id);

create table public.stripe_events (
  id          text primary key,
  type        text not null,
  received_at timestamptz not null default now()
);

-- Separate throttles for the registration form and the public payment page.
alter table public.submission_attempts
  add column kind text not null default 'registration';

create index submission_attempts_kind_ip_created_at_idx
  on public.submission_attempts (kind, ip, created_at);

alter table public.stripe_payments enable row level security;
alter table public.stripe_events   enable row level security;
