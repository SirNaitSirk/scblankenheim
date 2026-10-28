# Research: Infomails an Angemeldete

All open points from the Technical Context are resolved below. No NEEDS CLARIFICATION remains.

## R1 · Where the per camp mail content lives

- **Decision**: a new table `camp_mail_info` with one row per camp (primary key `camp_id`), explicit
  nullable text columns for every field from FR-013 and four booleans `teaser_enabled`,
  `packing_enabled`, `arrival_enabled`, `thanks_enabled` (default `false`). A missing row means
  "nothing filled, everything disabled". The motto reuses `camps.tagline`, the address field is
  separate from `camps.location` (location is a short place name on the landing page).
- **Rationale**: typed columns give generated types and Zod parity; keeping them out of `camps`
  leaves the already large camp dialog and its action untouched. Times are free text ("Sonntag ab
  15 Uhr") because the team writes them as prose, not as timestamps.
- **Alternatives**: columns on `camps` (bloats the camp form and every camp query); `camps.config`
  jsonb (untyped, no Zod at the DB boundary, would mix with the form config).

## R2 · Admin UI for the content

- **Decision**: a new subpage `/admin/camps/[campId]/infomails`, reached from the camp card menu next
  to "Felder", guarded like the fields page and saved by a Server Action behind
  `requirePermission("camps")`. One form with four sections (Vorfreude, Packliste, Anreise, Danke),
  each with its switch and its fields, so the admin sees which field feeds which mail.
- **Rationale**: mirrors the existing `felder` subpage pattern; no new tab or permission.
- **Alternatives**: a dialog on the camp card (too many fields for a dialog on a phone); fields in
  the `/admin/mail` tab (that tab is read only by design, specs/007 US4).

## R3 · Stage rule

- **Decision**: a pure function `nextInfoMail(input, today)` in `lib/email/info-mails.ts`, Berlin
  calendar dates like `lib/email/reminders.ts`. Due days: teaser `start − 56`, packing `start − 21`,
  arrival `start − 5`, thanks `end + 5`. A stage is open from its due day until the day before the
  next stage's due day; arrival closes the day before camp start; thanks closes at `end + 30`. The
  function returns the open stage or null when any of these holds: registration deleted or
  cancelled, no address, stage disabled for the camp, stage already sent, today is the
  registration day, an info mail went to this registration today, a payment reminder was sent
  today or `nextReminder` says one is due today, arrival required fields missing, the relevant camp
  date is missing.
- **Rationale**: "verpasst, sobald die nächste Stufe fällig ist" (spec edge cases) falls out of the
  window definition. Due days ignore whether neighbouring stages are enabled, so the schedule stays
  predictable when the team enables mails late. Calling `nextReminder` keeps the "no info mail on a
  reminder day" rule correct even if the reminder run is late or failed that morning.
- **Alternatives**: a sequential state per registration (needs extra storage); skipping based on
  enabled stages only (enabling a mail later would silently reopen old stages).

## R4 · Duplicate protection and history

- **Decision**: reuse `email_deliveries` with four new kinds `info_teaser`, `info_packing`,
  `info_arrival`, `info_thanks`. The existing partial unique index `(registration_id, kind)` for all
  kinds except `payment_link` already guarantees at most one sent or in flight mail per kind and
  registration. Idempotency key `${kind}/${registrationId}` as for reminders. No migration change to
  that table.
- **Rationale**: one delivery log for every mail (FR-018), and the claim pattern from 007 already
  handles overlapping runs and retries after failure.

## R5 · Daily quota

- **Decision**: new constants in `lib/email/limits.ts`: `DAILY_EMAIL_BUDGET = 100`,
  `CONFIRMATION_RESERVE = 15`. The info run counts deliveries created since Berlin midnight with
  status `sending` or `sent` (any kind) and sends at most
  `DAILY_EMAIL_BUDGET − CONFIRMATION_RESERVE − countToday`, never negative. Registrations are
  processed oldest first, current camp first. Remaining mails go out on the next days automatically
  because the stage window is still open.
- **Rationale**: confirmations and reminders keep priority (FR-009) without coordinating the two
  runs; counting real deliveries also covers admin payment link mails. With 200 registrations and a
  quiet reminder day the run sends 85 per day, so SC-001 (4 days) holds unless reminders use most of
  the quota on the same days; the run summary and the counters in `/admin/mail` show it, and the
  team can switch to a paid plan for the weeks around the camp.
- **Alternatives**: a fixed info cap of 20 (too slow for 200 registrations); one shared run with a
  joint budget (couples two features and two failure modes in one route).

## R6 · Scheduling

- **Decision**: a separate cron route `app/api/cron/info-mails` with `CRON_SECRET` like the reminder
  route, scheduled at `30 6 * * *` in `vercel.json`, 30 minutes after the reminders. `maxDuration`
  60 s; at 500 ms spacing a full run of 85 mails takes about 45 s.
- **Rationale**: thin single purpose routes (constitution VII); reminders run first so their mails
  count against the budget before the info run calculates its share.

## R7 · Which camps a run covers

- **Decision**: the current camp for all stages, plus every other camp whose `end_date` lies between
  `today − 30` and `today − 5`, for which only the thanks stage can be open anyway.
- **Rationale**: FR-008 and US4 scenario 4: switching the current camp to next year right after the
  camp must not swallow the thank you mail.

## R8 · Templates and content

- **Decision**: four pure template functions in a new `lib/email/info-templates.ts`, built on the
  existing `layout.ts` helpers and copy in `lib/email/messages.ts` (new `info` section). The packing
  mail lists `featuredPackingItems()` from `lib/marketing/packing-list.ts` and links to
  `/packzettel`; the teaser links to `/`. Optional sections render only when their field is filled
  (FR-016). The arrival mail adds the payment block with `outstanding` and `payUrl` when
  `outstanding > 0` (FR-010). Free text fields are HTML escaped and line breaks kept.
- **Rationale**: same pattern as 007, so sender and preview share one renderer.

## R9 · Preview and counters

- **Decision**: `lib/email/preview.ts` gains four preview ids built from the sample person plus the
  current camp's `camp_mail_info`. The mail page shows, per info mail, enabled state, a German hint
  for each missing field and three counts for the current camp: erhalten (sent), noch nicht erhalten
  (active with address, not sent), ohne Mailadresse. Counts come from one grouped read of
  `email_deliveries` filtered in JS by the camp's registration ids (AGENTS.md supabase gotcha).
- **Rationale**: FR-017 with no new route; the tab stays read only.
