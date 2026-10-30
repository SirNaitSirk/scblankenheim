# Research: Schulbefreiung

## R1 · PDF erzeugen

- **Decision**: `pdf-lib` (1.17.1) on the server, A4 letter drawn with the built in Helvetica fonts,
  signature embedded as PNG or JPEG.
- **Rationale**: Pure JavaScript, no headless browser, no native binaries, runs in the Vercel Node
  runtime. The standard fonts use WinAnsi encoding, which covers ä, ö, ü, Ä, Ö, Ü and ß, so no font
  file has to be shipped. One page letter with fixed layout needs only text placement and line
  wrapping. Stable API, no known open security issues.
- **Alternatives considered**: `@react-pdf/renderer` (larger, own layout engine and font loading,
  more than a one page letter needs); HTML plus headless Chromium (heavy cold starts, size limits on
  Vercel); handwritten PDF syntax (fragile, no image embedding).
- **Constitution**: new runtime dependency, justified in plan Complexity Tracking.
- **Guard**: characters outside WinAnsi (e.g. emoji, some Polish or Turkish letters) are replaced by
  the closest Latin letter or `?` before drawing, so rendering never throws. Unit tested.

## R2 · Mail mit Anhang

- **Decision**: extend `OutgoingEmail` in `lib/email/provider.ts` with optional
  `attachments: { filename: string; content: string }[]` (base64), passed as Resend `attachments`.
- **Rationale**: Resend accepts base64 attachments in the same JSON call; the existing thin fetch
  client stays the only provider path. A one page letter with signature stays well below 200 KB.
- **Alternatives considered**: link only, no attachment (user decision was attachment plus
  download); storing the PDF and linking it (violates FR-004).

## R3 · Unterschriftsbild

- **Decision**: private Supabase Storage bucket `signatures`, created in the migration with
  `public = false`. One object per camp at `<campId>/signature-<timestamp>.<ext>`; the path is stored
  in `camp_mail_info.release_signature_path`. Upload through an admin Server Action (permission
  `camps`) with the service role; PNG or JPEG only, at most 512 KB, type checked by magic bytes.
  The admin preview uses a 60 second signed URL generated on the server.
- **Rationale**: Storage is part of the fixed stack, the image never becomes public (FR-018), and
  a new path per upload avoids cache issues. 512 KB stays below the default Server Action body
  limit of 1 MB.
- **Alternatives considered**: bytea column in Postgres (works, but Storage is the intended place
  for files); public bucket (violates FR-018).

## R4 · Adresse der angemeldeten Person

- **Decision**: the release settings hold `release_address_keys`, an ordered list of question
  field keys of the camp's registration form (e.g. street, postcode, city). The participant address
  is prefilled by joining the non empty answers of those fields from `form_data` (street on line one,
  the rest on line two). The person can edit it; the edited text is stored in
  `school_releases.participant_address`.
- **Rationale**: there is no fixed address column; the one registration form is config driven
  (Principle IV). Letting admins point at fields is explicit and survives renamed labels.
  Without configured keys the field starts empty and is required.
- **Alternatives considered**: guessing fields by key or label (`adresse`, `strasse`): fragile
  across years; adding fixed address core fields: changes the registration form and is a larger,
  separate decision.

## R5 · Betroffene Tage

- **Decision**: `release_dates date[]`, one to five dates, shown in German long format
  ("Freitag, 4. Juni 2027") in letter, page, landing section and mails.
- **Rationale**: real dates format correctly and can be checked against the camp period (must lie
  within start and end, validated in the app).
- **Alternatives considered**: free text (no validation, inconsistent formatting).

## R6 · Link zur eigenen Anmeldung anfordern

- **Decision**: public Server Action `requestParticipantLinkAction` used by the landing section.
  Input: email (Zod, trimmed, lowercased) and a fixed target from an allow list (`school_release`
  maps to the anchor `#schulbefreiung`). Lookup: non deleted, active registrations of the current
  camp whose `lower(trim(email))` matches. One mail per match (kind `participant_link`). The action
  always returns the same neutral state.
- **Throttles** (in `lib/participant/limits.ts`): per ip 5 requests within 10 minutes
  (`submission_attempts` kind `participant_link`, every attempt counts); per registration at most one
  link mail within 10 minutes and three per Berlin day (from `email_deliveries`). Mails respect
  `DAILY_EMAIL_BUDGET - CONFIRMATION_RESERVE`.
- **Timing**: lookup and sending run in `after()`, so response time does not reveal whether a match
  existed (SC-005).
- **Rationale**: same pattern as 018 (throttle, quota, `after()`), no enumeration.
- **Alternatives considered**: magic link login (overkill, no accounts); search by reference
  (people do not know their reference).

## R7 · Mailarten, Historie, Duplikate

- **Decision**: two new kinds in `email_deliveries`: `school_release` and `participant_link`. Both
  may repeat per registration, so the partial unique index `email_deliveries_once_idx` excludes them
  (migration drops and recreates it). Claims use a new `claimRepeatableDelivery(registrationId,
  kind, trigger, actor)`; the idempotency key is `<kind>/<claimId>`. New trigger `participant`
  (already used for team mails) is shown in the mail history as "Teilnehmerseite"; both new kinds
  get German labels there.
- **Double click**: a participant submit with unchanged data within 60 seconds of the last
  `school_release` mail stores nothing new and sends no second mail; the download still works.
- **Rationale**: reuses the existing claim and history design.

## R8 · Löschen mit der Anmeldung

- **Decision**: `school_releases.registration_id` references `registrations` with `on delete
  cascade`. Registrations are soft deleted (`deleted = true`), so the admin delete path
  (`setRegistrationDeleted`) also deletes the `school_releases` row when marking a registration
  deleted. Restoring a registration does not restore the release data.
- **Rationale**: FR-024 and data minimisation; release data are trivial to enter again.

## R9 · Zugriff auf die PDF

- **Decision**: two GET route handlers returning `application/pdf` with `Cache-Control: no-store`
  and `Content-Disposition: attachment`:
  - participant: `/meine-anmeldung/[token]/befreiung` (token resolved on the server, active
    registration, release on for its camp, saved data present; same per ip miss throttle as the
    page);
  - admin: `/api/admin/school-release/[registrationId]` (Clerk, permission `registrations`),
    plus `/api/admin/school-release/preview/[campId]` (permission `camps`, sample data).
- **Rationale**: Server Actions cannot stream a file download; route handlers keep secrets on the
  server.

## R10 · Landing Abschnitt und Mails

- **Decision**: `components/marketing/school-release-section.tsx` rendered in `app/page.tsx` before
  `PaymentFaq` when the current camp has the release on and its end date has not passed. Small
  client form for the email field (`useActionState`). Confirmation mail and teaser info mail get a
  `schoolReleaseBlock(ctx)` beside `calendarBlock(ctx)`, rendered only when `ctx.schoolRelease` is
  set (dates plus deep link `participantUrl + #schulbefreiung`).
