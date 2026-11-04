-- Camp feedback (specs/038-camp-feedback).
--
-- camp_feedback_settings holds per camp the open switch and the secret code of
-- the public page /feedback/<code>. A missing row means closed, no code yet.
--
-- camp_feedback_questions holds the questions per camp. The key stays the same
-- across years so answers can be compared; it is unique within a camp.
--
-- feedback_responses holds one row per answer. Anonymity rule: the only
-- reference is the camp. There is deliberately no time, ip, registration or
-- browser column, so an answer cannot be matched with a person, not even through
-- the throttling rows in submission_attempts. The nonce only stops double
-- submits of one rendered form.
--
-- Values are validated in the app, not by CHECK constraints. Only the service
-- role reads and writes.

create table public.camp_feedback_settings (
  camp_id    uuid primary key references public.camps(id) on delete cascade,
  open       boolean not null default false,
  link_code  text not null unique,
  updated_by text not null,
  updated_at timestamptz not null default now()
);

alter table public.camp_feedback_settings enable row level security;

create table public.camp_feedback_questions (
  id         uuid primary key default gen_random_uuid(),
  camp_id    uuid not null references public.camps(id) on delete cascade,
  key        text not null,
  label      text not null,
  type       text not null,
  required   boolean not null default false,
  options    text[] not null default '{}',
  sort_order int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index camp_feedback_questions_camp_key_idx
  on public.camp_feedback_questions (camp_id, key);

create index camp_feedback_questions_camp_order_idx
  on public.camp_feedback_questions (camp_id, sort_order);

alter table public.camp_feedback_questions enable row level security;

create table public.feedback_responses (
  id      uuid primary key default gen_random_uuid(),
  camp_id uuid not null references public.camps(id) on delete cascade,
  nonce   uuid not null unique,
  answers jsonb not null
);

create index feedback_responses_camp_idx on public.feedback_responses (camp_id);

alter table public.feedback_responses enable row level security;
