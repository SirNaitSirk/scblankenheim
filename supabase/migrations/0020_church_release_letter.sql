-- School release letter on the church letterhead (specs/042-church-release-letter).
--
-- The letter now only needs school name and school location. Existing rows get
-- the location from the last line of the old school address, without a leading
-- five digit postal code; when that leaves nothing, the full last line. Teacher,
-- addresses and class are dropped (data minimisation). The letter is signed by
-- the church stamp image, so signer name and role go, and so does the address
-- prefill from form answers. No CHECK constraints; values are validated in the app.

alter table public.school_releases add column school_location text;

update public.school_releases
set school_location = coalesce(
  nullif(trim(regexp_replace(last_line, '^\s*\d{5}\s*', '')), ''),
  trim(last_line),
  ''
)
from (
  select registration_id as id,
    (string_to_array(school_address, E'\n'))[array_length(string_to_array(school_address, E'\n'), 1)] as last_line
  from public.school_releases
) as source
where public.school_releases.registration_id = source.id;

update public.school_releases set school_location = '' where school_location is null;

alter table public.school_releases
  alter column school_location set not null,
  drop column teacher_name,
  drop column school_address,
  drop column participant_address,
  drop column class_name;

alter table public.camp_mail_info
  drop column release_signer_name,
  drop column release_signer_role,
  drop column release_address_keys;
