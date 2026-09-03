-- CampConnect — seed data (illustrative sample, not real attendees).
--
-- Mirrors the former lib/admin/mock-data.ts so the admin dashboard renders real
-- rows. Uses fixed UUIDs + ON CONFLICT DO NOTHING so it is safe to re-run.
-- NOT applied automatically — run manually after 0001_init_schema.sql.
-- All names and email addresses below are fictional (@example.com).

-- ---------------------------------------------------------------------------
-- Camps
-- ---------------------------------------------------------------------------
insert into public.camps
  (id, name, location, start_date, end_date, capacity, base_price,
   registration_open, registration_opens_at, registration_closes_at, payment_due_date,
   tagline, description)
values
  ('11111111-1111-1111-1111-111111111126', 'Sommercamp 2026', 'Blankenheim, Eifel',
   '2026-07-12', '2026-07-19', 120, 195,
   true, '2026-01-15 08:00:00+01', '2026-06-15 23:59:00+02', '2026-06-30',
   'Eine Woche Berge, Gemeinschaft und Glaube.',
   'Das FCG Blankenheim Sommercamp bringt jedes Jahr Jugendliche in der Eifel zusammen — mit Programm, Andachten, Sport und viel gemeinsamer Zeit.'),
  ('11111111-1111-1111-1111-111111111125', 'Sommercamp 2025', 'Blankenheim, Eifel',
   '2025-07-13', '2025-07-20', 120, 180,
   false, '2025-01-15 08:00:00+01', '2025-06-15 23:59:00+02', '2025-06-30',
   null, null)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Global settings (singleton) — current camp + app-wide settings bag
-- ---------------------------------------------------------------------------
insert into public.camp_settings (id, current_camp_id, settings)
values
  (true, '11111111-1111-1111-1111-111111111126',
   jsonb_build_object(
     'orgName', 'FCG Blankenheim',
     'contactEmail', 'sommercamp@example.com',
     'supportPhone', '+49 2449 000000',
     'emailSender', 'sommercamp@example.com'
   ))
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Price tiers (2026)
-- ---------------------------------------------------------------------------
insert into public.price_tiers (id, camp_id, name, price, hidden, invitation_token)
values
  ('22222222-2222-2222-2222-222222220001', '11111111-1111-1111-1111-111111111126', 'Standard',    195, false, null),
  ('22222222-2222-2222-2222-222222220002', '11111111-1111-1111-1111-111111111126', 'Frühbucher',  165, false, null),
  ('22222222-2222-2222-2222-222222220003', '11111111-1111-1111-1111-111111111126', 'Geschwister', 150, true,  'geschwister-2026'),
  ('22222222-2222-2222-2222-222222220004', '11111111-1111-1111-1111-111111111126', 'Mitarbeitende', 95, true,  'mitarbeit-2026')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Form fields (2026). `accommodation` (zimmer/zelt) is the capacity-limited
-- option — the seat limit lives in that field's `config.capacity`.
-- ---------------------------------------------------------------------------
insert into public.camp_form_fields (id, camp_id, key, label, field_type, required, options, sort_order)
values
  ('33333333-3333-3333-3333-333333330001', '11111111-1111-1111-1111-111111111126', 'accommodation',     'Unterkunft',        'select', true,  '["zimmer","zelt"]'::jsonb, 1),
  ('33333333-3333-3333-3333-333333330002', '11111111-1111-1111-1111-111111111126', 'birthdate',         'Geburtsdatum',      'date',   true,  null,                        2),
  ('33333333-3333-3333-3333-333333330003', '11111111-1111-1111-1111-111111111126', 'phone',             'Telefon',           'text',   true,  null,                        3),
  ('33333333-3333-3333-3333-333333330004', '11111111-1111-1111-1111-111111111126', 'address',           'Adresse',           'text',   true,  null,                        4),
  ('33333333-3333-3333-3333-333333330005', '11111111-1111-1111-1111-111111111126', 'dietary',           'Ernährung',         'text',   false, null,                        5),
  ('33333333-3333-3333-3333-333333330006', '11111111-1111-1111-1111-111111111126', 'medical',           'Medizinische Hinweise', 'text', false, null,                     6),
  ('33333333-3333-3333-3333-333333330007', '11111111-1111-1111-1111-111111111126', 'emergency_contact', 'Notfallkontakt',    'text',   true,  null,                        7),
  ('33333333-3333-3333-3333-333333330008', '11111111-1111-1111-1111-111111111126', 'tshirt_size',       'T-Shirt-Größe',     'select', false, '["S","M","L","XL"]'::jsonb, 8)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Registrations (2026) — fictional sample attendees
-- ---------------------------------------------------------------------------
insert into public.registrations
  (id, reference, camp_id, price_tier_id, first_name, last_name, email, city,
   form_data, status, payment_status, amount_due, amount_paid, deleted, registered_at)
values
  ('44444444-0000-0000-0000-000000003471', 'A-3471', '11111111-1111-1111-1111-111111111126', '22222222-2222-2222-2222-222222220001', 'Lena',   'Fischer',    'lena.fischer@example.com',    'Köln',            '{"accommodation":"zimmer","tshirt_size":"M"}'::jsonb, 'confirmed', 'paid',    195, 195, false, '2026-03-04'),
  ('44444444-0000-0000-0000-000000003472', 'A-3472', '11111111-1111-1111-1111-111111111126', '22222222-2222-2222-2222-222222220001', 'Jonas',  'Weber',      'jonas.weber@example.com',     'Aachen',          '{"accommodation":"zelt","tshirt_size":"L"}'::jsonb,  'confirmed', 'unpaid',  195, 0,   false, '2026-03-05'),
  ('44444444-0000-0000-0000-000000003473', 'A-3473', '11111111-1111-1111-1111-111111111126', '22222222-2222-2222-2222-222222220002', 'Mia',    'Schulz',     'mia.schulz@example.com',      'Bonn',            '{"accommodation":"zimmer","tshirt_size":"S"}'::jsonb, 'confirmed', 'paid',    165, 165, false, '2026-02-11'),
  ('44444444-0000-0000-0000-000000003474', 'A-3474', '11111111-1111-1111-1111-111111111126', '22222222-2222-2222-2222-222222220003', 'Elias',  'Braun',      'elias.braun@example.com',     'Düren',           '{"accommodation":"zimmer","tshirt_size":"M"}'::jsonb, 'confirmed', 'partial', 150, 75,  false, '2026-02-11'),
  ('44444444-0000-0000-0000-000000003475', 'A-3475', '11111111-1111-1111-1111-111111111126', '22222222-2222-2222-2222-222222220001', 'Emilia', 'Wagner',     'emilia.wagner@example.com',   'Euskirchen',      '{"accommodation":"zelt"}'::jsonb,                     'pending',   'unpaid',  195, 0,   false, '2026-03-18'),
  ('44444444-0000-0000-0000-000000003476', 'A-3476', '11111111-1111-1111-1111-111111111126', '22222222-2222-2222-2222-222222220001', 'Noah',   'Hoffmann',   'noah.hoffmann@example.com',   'Mechernich',      '{"accommodation":"zimmer","tshirt_size":"L"}'::jsonb, 'confirmed', 'paid',    195, 195, false, '2026-03-19'),
  ('44444444-0000-0000-0000-000000003477', 'A-3477', '11111111-1111-1111-1111-111111111126', '22222222-2222-2222-2222-222222220002', 'Sophie', 'Koch',       'sophie.koch@example.com',     'Blankenheim',     '{"accommodation":"zimmer","tshirt_size":"S"}'::jsonb, 'confirmed', 'paid',    165, 165, false, '2026-02-02'),
  ('44444444-0000-0000-0000-000000003478', 'A-3478', '11111111-1111-1111-1111-111111111126', '22222222-2222-2222-2222-222222220001', 'Ben',    'Richter',    'ben.richter@example.com',     'Schleiden',       '{"accommodation":"zelt"}'::jsonb,                     'confirmed', 'unpaid',  195, 0,   false, '2026-04-01'),
  ('44444444-0000-0000-0000-000000003479', 'A-3479', '11111111-1111-1111-1111-111111111126', '22222222-2222-2222-2222-222222220003', 'Marie',  'Klein',      'marie.klein@example.com',     'Kall',            '{"accommodation":"zimmer","tshirt_size":"M"}'::jsonb, 'confirmed', 'partial', 150, 75,  false, '2026-02-24'),
  ('44444444-0000-0000-0000-000000003480', 'A-3480', '11111111-1111-1111-1111-111111111126', '22222222-2222-2222-2222-222222220004', 'Paul',   'Wolf',       'paul.wolf@example.com',       'Bad Münstereifel','{"accommodation":"zelt","tshirt_size":"XL"}'::jsonb, 'confirmed', 'paid',     95, 95,  false, '2026-01-28'),
  ('44444444-0000-0000-0000-000000003481', 'A-3481', '11111111-1111-1111-1111-111111111126', '22222222-2222-2222-2222-222222220001', 'Hannah', 'Neumann',    'hannah.neumann@example.com',  'Zülpich',         '{"accommodation":"zimmer"}'::jsonb,                   'pending',   'unpaid',  195, 0,   false, '2026-04-06'),
  ('44444444-0000-0000-0000-000000003482', 'A-3482', '11111111-1111-1111-1111-111111111126', '22222222-2222-2222-2222-222222220001', 'Luca',   'Schwarz',    'luca.schwarz@example.com',    'Nettersheim',     '{"accommodation":"zelt","tshirt_size":"M"}'::jsonb, 'confirmed', 'paid',    195, 195, false, '2026-04-09'),
  ('44444444-0000-0000-0000-000000003483', 'A-3483', '11111111-1111-1111-1111-111111111126', '22222222-2222-2222-2222-222222220002', 'Clara',  'Zimmermann', 'clara.zimmermann@example.com','Köln',            '{"accommodation":"zimmer"}'::jsonb,                   'cancelled', 'unpaid',  165, 0,   true,  '2026-02-15'),
  ('44444444-0000-0000-0000-000000003484', 'A-3484', '11111111-1111-1111-1111-111111111126', '22222222-2222-2222-2222-222222220001', 'Finn',   'Krüger',     'finn.krueger@example.com',    'Hellenthal',      '{"accommodation":"zimmer","tshirt_size":"L"}'::jsonb, 'confirmed', 'partial', 195, 98,  false, '2026-04-12')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Admin profiles (keyed by Clerk user id) + roles.
-- NOTE: these are placeholder Clerk ids for sample data; a real signed-in admin
-- gets a profiles row via the invitation/accept flow (future work), so
-- getCurrentProfile() will show "kein Profil verknüpft" until then.
-- ---------------------------------------------------------------------------
insert into public.profiles (id, name, email, permissions, visible_tabs, status, last_active_at)
values
  ('user_seed_admin', 'Max Mustermann',  'admin@example.com',
   '{registrations,finances,camps,users,logs}',
   '{/admin,/admin/finanzen,/admin/camps,/admin/logs,/admin/benutzer,/admin/profil}',
   'active', '2026-08-12'),
  ('user_seed_orga',    'Erika Musterfrau',   'orga@example.com',
   '{registrations,finances}',
   '{/admin,/admin/finanzen,/admin/profil}',
   'active', '2026-08-10'),
  ('user_seed_helfer',   'Tobias Muster',   'helfer@example.com',
   '{registrations}',
   '{/admin,/admin/profil}',
   'invited', null)
on conflict (id) do nothing;

insert into public.user_roles (id, user_id, role)
values
  ('55555555-0000-0000-0000-000000000001', 'user_seed_admin', 'superadmin'),
  ('55555555-0000-0000-0000-000000000002', 'user_seed_orga',    'admin'),
  ('55555555-0000-0000-0000-000000000003', 'user_seed_helfer',   'admin')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Logs
-- ---------------------------------------------------------------------------
insert into public.logs (id, level, actor, action, message, created_at)
values
  ('66666666-0000-0000-0000-000000000001', 'info',    'Max Mustermann', 'registration.updated', 'Anmeldung A-3476 als bezahlt markiert.', '2026-08-12T09:41:00'),
  ('66666666-0000-0000-0000-000000000002', 'info',    'System',       'email.sent',           'Zahlungserinnerung an 12 Anmeldungen versendet.', '2026-08-12T06:00:00'),
  ('66666666-0000-0000-0000-000000000003', 'warning', 'System',       'payment.mismatch',     'Teilzahlung bei A-3479 erkannt, Restbetrag offen.', '2026-08-11T18:22:00'),
  ('66666666-0000-0000-0000-000000000004', 'info',    'Erika Musterfrau',  'registration.deleted', 'Anmeldung A-3483 storniert und gelöscht.', '2026-08-11T14:07:00'),
  ('66666666-0000-0000-0000-000000000005', 'error',   'System',       'webhook.failed',       'Stripe-Webhook für Session cs_test_9f2 fehlgeschlagen (Timeout).', '2026-08-10T22:15:00'),
  ('66666666-0000-0000-0000-000000000006', 'info',    'Max Mustermann', 'invitation.created',   'Einladung an helfer@example.com gesendet.', '2026-08-10T11:30:00')
on conflict (id) do nothing;
