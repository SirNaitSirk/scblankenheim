-- Room planning (specs/008-room-planning).
--
-- Houses and rooms are shared by all camps. `camp_rooms` holds the gender of a
-- room for one camp (missing row = not set yet). `room_assignments` puts one
-- registration into one room; its primary key enforces one room per
-- registration. Capacity and gender rules are enforced by the functions below
-- under a row lock on the room, so concurrent admins can never overbook a room
-- or mix genders. Registration gender is a plain nullable column without a
-- CHECK constraint (constitution IV); the app validates it.

create table public.houses (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.rooms (
  id         uuid primary key default gen_random_uuid(),
  house_id   uuid not null references public.houses(id) on delete cascade,
  name       text not null,
  beds       int not null check (beds >= 1),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index rooms_house_id_idx on public.rooms (house_id);

create table public.camp_rooms (
  camp_id uuid not null references public.camps(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  gender  text not null check (gender in ('female', 'male')),
  primary key (camp_id, room_id)
);

create table public.room_assignments (
  registration_id uuid primary key references public.registrations(id) on delete cascade,
  camp_id         uuid not null references public.camps(id) on delete cascade,
  room_id         uuid not null references public.rooms(id) on delete cascade,
  assigned_at     timestamptz not null default now()
);

create index room_assignments_camp_room_idx on public.room_assignments (camp_id, room_id);

alter table public.houses enable row level security;
alter table public.rooms enable row level security;
alter table public.camp_rooms enable row level security;
alter table public.room_assignments enable row level security;

alter table public.registrations add column gender text;

-- Active assignments of a room in a camp: the registration is neither deleted
-- nor cancelled. Assignments of inactive rows are removed by the app, this is
-- the safety net.
create or replace function public.room_occupancy(p_camp_id uuid, p_room_id uuid)
returns int
language sql
stable
security invoker
set search_path = public
as $$
  select count(*)::int
    from room_assignments a
    join registrations r on r.id = a.registration_id
   where a.camp_id = p_camp_id
     and a.room_id = p_room_id
     and r.deleted = false
     and r.status <> 'cancelled';
$$;

-- Assigns or moves a registration into a room.
--
-- Returns jsonb { status, gender }:
--   ok               assigned, room gender unchanged
--   ok_gender_set    assigned, the empty room adopted the person's gender
--   full             no free bed
--   gender_mismatch  occupied room of the other gender
--   no_gender        registration has no gender yet
--   inactive         registration deleted, cancelled or not in this camp
--   not_found        room does not exist
create or replace function public.assign_room(
  p_camp_id         uuid,
  p_registration_id uuid,
  p_room_id         uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_beds        int;
  v_gender      text;
  v_room_gender text;
  v_current     uuid;
  v_others      int;
begin
  -- Serialize every write on this room; released at transaction end.
  select beds into v_beds from rooms where id = p_room_id for update;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  select gender into v_gender
    from registrations
   where id = p_registration_id
     and camp_id = p_camp_id
     and deleted = false
     and status <> 'cancelled';
  if not found then
    return jsonb_build_object('status', 'inactive');
  end if;
  if v_gender is null then
    return jsonb_build_object('status', 'no_gender');
  end if;

  select room_id into v_current
    from room_assignments
   where registration_id = p_registration_id;
  if v_current = p_room_id then
    return jsonb_build_object('status', 'ok');
  end if;

  v_others := room_occupancy(p_camp_id, p_room_id);

  select gender into v_room_gender
    from camp_rooms
   where camp_id = p_camp_id and room_id = p_room_id;

  if v_others >= v_beds then
    return jsonb_build_object('status', 'full');
  end if;

  if v_others = 0 then
    if v_room_gender is distinct from v_gender then
      insert into camp_rooms (camp_id, room_id, gender)
      values (p_camp_id, p_room_id, v_gender)
      on conflict (camp_id, room_id) do update set gender = excluded.gender;

      insert into room_assignments (registration_id, camp_id, room_id)
      values (p_registration_id, p_camp_id, p_room_id)
      on conflict (registration_id) do update
        set room_id = excluded.room_id, camp_id = excluded.camp_id, assigned_at = now();

      return jsonb_build_object('status', 'ok_gender_set', 'gender', v_gender);
    end if;
  elsif v_room_gender is distinct from v_gender then
    return jsonb_build_object('status', 'gender_mismatch');
  end if;

  insert into room_assignments (registration_id, camp_id, room_id)
  values (p_registration_id, p_camp_id, p_room_id)
  on conflict (registration_id) do update
    set room_id = excluded.room_id, camp_id = excluded.camp_id, assigned_at = now();

  return jsonb_build_object('status', 'ok');
end;
$$;

-- Sets or clears (p_gender null) the gender of a room for a camp. Only allowed
-- while the room is empty in that camp. Returns jsonb { status }: ok, not_empty,
-- not_found.
create or replace function public.set_room_gender(
  p_camp_id uuid,
  p_room_id uuid,
  p_gender  text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform 1 from rooms where id = p_room_id for update;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  if room_occupancy(p_camp_id, p_room_id) > 0 then
    return jsonb_build_object('status', 'not_empty');
  end if;

  if p_gender is null then
    delete from camp_rooms where camp_id = p_camp_id and room_id = p_room_id;
  else
    insert into camp_rooms (camp_id, room_id, gender)
    values (p_camp_id, p_room_id, p_gender)
    on conflict (camp_id, room_id) do update set gender = excluded.gender;
  end if;

  return jsonb_build_object('status', 'ok');
end;
$$;

-- Changes the bed count unless the room holds more people than that in the
-- given camp. Returns jsonb { status }: ok, below_occupancy, not_found.
create or replace function public.update_room_beds(
  p_room_id uuid,
  p_beds    int,
  p_camp_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform 1 from rooms where id = p_room_id for update;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  if p_camp_id is not null and room_occupancy(p_camp_id, p_room_id) > p_beds then
    return jsonb_build_object('status', 'below_occupancy');
  end if;

  update rooms set beds = p_beds where id = p_room_id;
  return jsonb_build_object('status', 'ok');
end;
$$;

-- The public registration now stores the gender core field.
drop function public.create_public_registration(
  uuid, text, text, text, text, jsonb, int, uuid, jsonb
);

create function public.create_public_registration(
  p_camp_id       uuid,
  p_reference     text,
  p_first_name    text,
  p_last_name     text,
  p_email         text,
  p_gender        text,
  p_form_data     jsonb,
  p_amount_due    int,
  p_price_tier_id uuid,
  p_option_limits jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_capacity  int;
  v_active    int;
  v_limit     jsonb;
  v_taken     int;
  v_full_keys text[] := '{}';
begin
  perform pg_advisory_xact_lock(hashtext(p_camp_id::text));

  select capacity into v_capacity from camps where id = p_camp_id;

  if v_capacity is not null then
    select count(*) into v_active
      from registrations
     where camp_id = p_camp_id
       and deleted = false
       and status <> 'cancelled';

    if v_active >= v_capacity then
      return jsonb_build_object('status', 'camp_full', 'keys', '[]'::jsonb);
    end if;
  end if;

  for v_limit in
    select value from jsonb_array_elements(coalesce(p_option_limits, '[]'::jsonb))
  loop
    select count(*) into v_taken
      from registrations
     where camp_id = p_camp_id
       and deleted = false
       and status <> 'cancelled'
       and form_data ->> (v_limit ->> 'key') = v_limit ->> 'option';

    if v_taken >= (v_limit ->> 'limit')::int then
      v_full_keys := array_append(v_full_keys, v_limit ->> 'key');
    end if;
  end loop;

  if coalesce(array_length(v_full_keys, 1), 0) > 0 then
    return jsonb_build_object('status', 'option_full', 'keys', to_jsonb(v_full_keys));
  end if;

  begin
    insert into registrations (
      camp_id, reference, first_name, last_name, email, gender, form_data,
      status, payment_status, amount_due, amount_paid, price_tier_id
    )
    values (
      p_camp_id, p_reference, p_first_name, p_last_name, p_email, p_gender,
      coalesce(p_form_data, '{}'::jsonb),
      'pending', 'unpaid', p_amount_due, 0, p_price_tier_id
    );
  exception when unique_violation then
    return jsonb_build_object('status', 'duplicate_reference', 'keys', '[]'::jsonb);
  end;

  return jsonb_build_object('status', 'ok', 'keys', '[]'::jsonb);
end;
$$;

-- Only the server (service role) may call these; never the public Data API roles.
revoke execute on function public.create_public_registration(
  uuid, text, text, text, text, text, jsonb, int, uuid, jsonb
) from public, anon, authenticated;
grant execute on function public.create_public_registration(
  uuid, text, text, text, text, text, jsonb, int, uuid, jsonb
) to service_role;

revoke execute on function public.room_occupancy(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.assign_room(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.set_room_gender(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.update_room_beds(uuid, int, uuid) from public, anon, authenticated;
grant execute on function public.room_occupancy(uuid, uuid) to service_role;
grant execute on function public.assign_room(uuid, uuid, uuid) to service_role;
grant execute on function public.set_room_gender(uuid, uuid, text) to service_role;
grant execute on function public.update_room_beds(uuid, int, uuid) to service_role;
