-- room_capacity is superseded by camp_form_fields.config.capacity
-- (per-option seat limits). Drop the unused camp-level column.
alter table public.camps drop column if exists room_capacity;
