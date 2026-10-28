# Research: Persönliche Teilnehmerseite

## R1 · Access by capability token, not by reference

- **Decision**: New column `registrations.access_token`, 64 hex characters (256 bit), unique,
  independent of `reference`.
- **Rationale**: The reference is printed in mails, used for bank transfers and guessable within
  its short format (the pay page only shows first name and amounts for that reason). The participant
  page shows full name, email and answers, so it needs a secret that is never typed or printed as a
  reference. A separate value can be renewed without touching the reference used for payments.
- **Alternatives considered**: reference plus email check (extra form, worse for SC-001); signed
  link with HMAC over the id (cannot be revoked individually without extra state); Clerk accounts
  for participants (explicitly rejected in the spec).

## R2 · Token generation and backfill

- **Decision**: Column default
  `replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')`.
  Adding the column with this volatile default fills every existing row with its own value.
  Renewal uses `randomBytes(32).toString("hex")` from Node `crypto` in the server module.
- **Rationale**: `gen_random_uuid` is built in (no `pgcrypto` schema question), each uuid
  carries 122 random bits, two give 244 bits, far beyond guessing. No change to
  `create_public_registration` is needed because the default applies on insert. Both generators
  produce 64 lowercase hex characters, so one format check covers both.
- **Alternatives considered**: backfill in a separate `update` (unnecessary with a volatile
  default); `gen_random_bytes` (lives in the `extensions` schema on Supabase, more moving parts).

## R3 · Storing the token in plain text

- **Decision**: Store the token as is, readable only through the service role.
- **Rationale**: Admins must be able to copy the current link (FR-015) and mails need it on every
  send. A hash would force a renewal on every copy. RLS stays on and anon has no select on
  `registrations`.
- **Alternatives considered**: hashed token plus renewal on copy (would silently break links in
  older mails).

## R4 · Route shape

- **Decision**: `/meine-anmeldung/[token]` as a dynamic Server Component page.
- **Rationale**: German public route like `/bezahlen` and `/packzettel`; a path segment instead of a
  query keeps the link short in plain text mails. The page reads the database per request, so it is
  never cached across visitors.
- **Alternatives considered**: `/bezahlen?ref=…&t=…` (mixes two purposes), `/anmeldung/…`
  (confusable with the registration form).

## R5 · Not revealing whether a token exists

- **Decision**: Malformed, unknown, renewed and deleted tokens all render the same notice with HTTP
  200, no `notFound()`. The format check rejects early without a query, which is fine because the
  format is public knowledge and reveals nothing about any registration.
- **Rationale**: FR-011. A 404 versus 200 difference would not reveal much for a 256 bit space, but
  one code path is simpler and matches `/bezahlen`.

## R6 · Throttling

- **Decision**: Count only misses per ip in `submission_attempts` with `kind = 'participant'`
  within 10 minutes, limit 20. Check the count first; at the limit show the throttle notice and skip
  the lookup. A miss inserts one row; a hit inserts nothing.
- **Rationale**: FR-012 asks to slow down wrong calls. Counting only misses means a family can
  reload their page as often as they like. Same table and pattern as `isPaymentThrottled`.
- **Alternatives considered**: counting every view like the pay page (would bother real users for
  no security gain).

## R7 · What the page shows from the form

- **Decision**: Core fields first name, last name, email, gender, then every question field of the
  registration's camp in `sort_order` (skipping `step` rows) that has a non empty saved value.
  Checkbox shows "Ja" or "Nein", select shows the stored option text, date is formatted German.
  Values without a matching current field are left out.
- **Rationale**: Mirrors the one config driven form (constitution IV) and the edge cases in the
  spec. A pure `buildParticipantView` makes it unit testable.
- **Alternatives considered**: reusing `formatFieldValue` from `components/admin/` (pulls admin
  messages into the public bundle and lives in a client folder).

## R8 · Pay button

- **Decision**: The button links to the existing `/bezahlen?ref=<reference>`. It is shown only when
  `checkoutEligibility` returns `ok`. `processing` shows "Zahlung wird geprüft", `paid` and
  `nothing_due` show "Alles bezahlt", `refunded` and `cancelled` show their own short text.
- **Rationale**: Reuses the whole checkout and webhook flow unchanged. The reference in that link
  is already public in mails.
- **Alternatives considered**: starting a checkout session directly from the page (duplicates
  `/api/checkout`). A link back from `/bezahlen/danke` to the participant page would need the token
  in the Stripe return URL; left out, the mail link covers the return.

## R9 · Link in mails and admin copy

- **Decision**: `EmailContext` gains `participantUrl: string`, set in `buildMailTarget` from
  `APP_URL` (a missing `APP_URL` already makes the context null). A shared block "Deine Anmeldung
  ansehen" with button and plain text line goes into the confirmation, the payment mail body shared
  by payment link and reminders, and the info mail layout. The preview uses a fixed sample token.
  Admin copy fetches the token on demand through `getParticipantLinkAction(reference)`, so the bulk
  admin table never carries tokens. Renewal asks for confirmation and writes
  `registration.access_renewed` to `logs`.
- **Rationale**: One construction point covers every sender (constitution IV). On demand fetching
  keeps tokens out of data that is cached in the browser for 30 seconds.
