-- Tent circles (specs/011-tent-circles).
--
-- A tent circle belongs to one camp and has a kind (`mixed`, `female`, `male`)
-- and exactly one leader, who is a registration of that camp. Participants are
-- rows in `tent_circle_members`; its primary key enforces one circle per
-- registration, the unique index on the leader enforces one led circle per
-- registration. "Never leader and participant at once" and "gender fits the
-- kind" are enforced by the functions below, which lock the registration row
-- first and the circle row second, so concurrent admins serialize per person
-- and per circle. There is no capacity.

create table public.tent_circles (
  id                     uuid primary key default gen_random_uuid(),
  camp_id                uuid not null references public.camps(id) on delete cascade,
  name                   text not null,
  kind                   text not null default 'mixed' check (kind in ('mixed', 'female', 'male')),
  leader_registration_id uuid references public.registrations(id) on delete set null,
  sort_order             int not null default 0,
  created_at             timestamptz not null default now()
);

create index tent_circles_camp_sort_idx on public.tent_circles (camp_id, sort_order);
create unique index tent_circles_leader_idx
  on public.tent_circles (leader_registration_id)
  where leader_registration_id is not null;

create table public.tent_circle_members (
  registration_id uuid primary key references public.registrations(id) on delete cascade,
  camp_id         uuid not null references public.camps(id) on delete cascade,
  tent_circle_id  uuid not null references public.tent_circles(id) on delete cascade,
  assigned_at     timestamptz not null default now()
);

create index tent_circle_members_camp_circle_idx
  on public.tent_circle_members (camp_id, tent_circle_id);

alter table public.tent_circles enable row level security;
alter table public.tent_circle_members enable row level security;

-- Does a person of `p_gender` (null = unknown) fit a circle of `p_kind`?
create or replace function public.fits_tent_circle(p_kind text, p_gender text)
returns boolean
language sql
immutable
security invoker
set search_path = public
as $$
  select p_kind = 'mixed' or p_kind = p_gender;
$$;

-- Assigns or moves a registration into a circle as participant.
--
-- Returns jsonb { status }:
--   ok             assigned (or already there)
--   is_leader      the registration leads a circle
--   kind_mismatch  gender does not fit the circle kind
--   inactive       registration deleted, cancelled or not in this camp
--   not_found      circle does not exist in this camp
create or replace function public.assign_tent_circle(
  p_camp_id         uuid,
  p_registration_id uuid,
  p_circle_id       uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_gender text;
  v_kind   text;
begin
  -- Lock order: registration, then circle (same as save_tent_circle).
  select gender into v_gender
    from registrations
   where id = p_registration_id
     and camp_id = p_camp_id
     and deleted = false
     and status <> 'cancelled'
     for update;
  if not found then
    return jsonb_build_object('status', 'inactive');
  end if;

  select kind into v_kind
    from tent_circles
   where id = p_circle_id and camp_id = p_camp_id
     for update;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  if exists (select 1 from tent_circles where leader_registration_id = p_registration_id) then
    return jsonb_build_object('status', 'is_leader');
  end if;

  if not coalesce(fits_tent_circle(v_kind, v_gender), false) then
    return jsonb_build_object('status', 'kind_mismatch');
  end if;

  insert into tent_circle_members (registration_id, camp_id, tent_circle_id)
  values (p_registration_id, p_camp_id, p_circle_id)
  on conflict (registration_id) do update
    set tent_circle_id = excluded.tent_circle_id,
        camp_id        = excluded.camp_id,
        assigned_at    = now();

  return jsonb_build_object('status', 'ok');
end;
$$;

-- Creates (p_circle_id null) or updates a circle with name, kind and leader.
--
-- Returns jsonb { status, id?, count? }:
--   ok               saved, `id` of the circle
--   ok_leader_moved  saved; the leader was a participant and got removed there
--   leader_taken     the leader already leads another circle
--   leader_mismatch  the leader's gender does not fit the kind
--   leader_inactive  leader deleted, cancelled or not in this camp
--   kind_conflict    `count` active participants do not fit the new kind
--   not_found        circle does not exist in this camp
create or replace function public.save_tent_circle(
  p_camp_id   uuid,
  p_circle_id uuid,
  p_name      text,
  p_kind      text,
  p_leader_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_gender    text;
  v_id        uuid := p_circle_id;
  v_conflicts int;
  v_moved     boolean := false;
  v_next      int;
begin
  -- Lock order: registration, then circle (same as assign_tent_circle).
  select gender into v_gender
    from registrations
   where id = p_leader_id
     and camp_id = p_camp_id
     and deleted = false
     and status <> 'cancelled'
     for update;
  if not found then
    return jsonb_build_object('status', 'leader_inactive');
  end if;

  if v_id is not null then
    perform 1 from tent_circles where id = v_id and camp_id = p_camp_id for update;
    if not found then
      return jsonb_build_object('status', 'not_found');
    end if;
  end if;

  if exists (
    select 1 from tent_circles
     where leader_registration_id = p_leader_id
       and (v_id is null or id <> v_id)
  ) then
    return jsonb_build_object('status', 'leader_taken');
  end if;

  if not coalesce(fits_tent_circle(p_kind, v_gender), false) then
    return jsonb_build_object('status', 'leader_mismatch');
  end if;

  if v_id is not null then
    select count(*)::int into v_conflicts
      from tent_circle_members m
      join registrations r on r.id = m.registration_id
     where m.tent_circle_id = v_id
       and m.registration_id <> p_leader_id
       and r.deleted = false
       and r.status <> 'cancelled'
       and not coalesce(fits_tent_circle(p_kind, r.gender), false);
    if v_conflicts > 0 then
      return jsonb_build_object('status', 'kind_conflict', 'count', v_conflicts);
    end if;

    -- Inactive participants that would not fit can never come back into this
    -- circle, so they are dropped now.
    delete from tent_circle_members m
     using registrations r
     where r.id = m.registration_id
       and m.tent_circle_id = v_id
       and not coalesce(fits_tent_circle(p_kind, r.gender), false);
  end if;

  delete from tent_circle_members where registration_id = p_leader_id;
  v_moved := found;

  if v_id is null then
    select coalesce(max(sort_order), -1) + 1 into v_next
      from tent_circles where camp_id = p_camp_id;
    insert into tent_circles (camp_id, name, kind, leader_registration_id, sort_order)
    values (p_camp_id, p_name, p_kind, p_leader_id, v_next)
    returning id into v_id;
  else
    update tent_circles
       set name = p_name, kind = p_kind, leader_registration_id = p_leader_id
     where id = v_id;
  end if;

  return jsonb_build_object(
    'status', case when v_moved then 'ok_leader_moved' else 'ok' end,
    'id', v_id
  );
end;
$$;

-- Only the server (service role) may call these; never the public Data API roles.
revoke execute on function public.fits_tent_circle(text, text) from public, anon, authenticated;
revoke execute on function public.assign_tent_circle(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.save_tent_circle(uuid, uuid, text, text, uuid) from public, anon, authenticated;
grant execute on function public.fits_tent_circle(text, text) to service_role;
grant execute on function public.assign_tent_circle(uuid, uuid, uuid) to service_role;
grant execute on function public.save_tent_circle(uuid, uuid, text, text, uuid) to service_role;
