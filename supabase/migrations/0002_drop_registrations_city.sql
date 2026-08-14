-- The `city` (Ort) field was removed as a hardcoded core column. Camps that
-- want an "Ort" question can add it as a dynamic `camp_form_fields` entry.
alter table registrations
  drop column if exists city;
