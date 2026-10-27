-- Race free insert for the public registration form.
--
-- The register service used to count free seats in JS and insert afterwards, so
-- two parallel submissions could both take the last seat. This function takes a
-- per camp advisory lock, checks the camp's total capacity and every selected
-- capacity limited option against active rows (not deleted, not cancelled), and
-- inserts only when all checks pass. Payment status does not matter: unpaid
-- registrations hold their seat. No CHECK constraints are added.
--
-- Returns jsonb { status, keys }:
--   ok                  row inserted
--   camp_full           camps.capacity reached
--   option_full         keys lists the fields whose limited option is taken
--   duplicate_reference reference collided; caller retries with a new one
--
-- p_option_limits: array of { "key": text, "option": text, "limit": int },
-- containing only the limited options the person actually selected.

create or replace function public.create_public_registration(
  p_camp_id       uuid,
  p_reference     text,
  p_first_name    text,
  p_last_name     text,
  p_email         text,
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
  -- Serialize registrations of the same camp; released at transaction end.
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
      camp_id, reference, first_name, last_name, email, form_data,
      status, payment_status, amount_due, amount_paid, price_tier_id
    )
    values (
      p_camp_id, p_reference, p_first_name, p_last_name, p_email,
      coalesce(p_form_data, '{}'::jsonb),
      'pending', 'unpaid', p_amount_due, 0, p_price_tier_id
    );
  exception when unique_violation then
    return jsonb_build_object('status', 'duplicate_reference', 'keys', '[]'::jsonb);
  end;

  return jsonb_build_object('status', 'ok', 'keys', '[]'::jsonb);
end;
$$;

-- Only the server (service role) may call it; never the public Data API roles.
revoke execute on function public.create_public_registration(
  uuid, text, text, text, text, jsonb, int, uuid, jsonb
) from public, anon, authenticated;

grant execute on function public.create_public_registration(
  uuid, text, text, text, text, jsonb, int, uuid, jsonb
) to service_role;
