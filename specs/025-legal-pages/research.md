# Research: Impressum und Datenschutzerklärung

Facts gathered from the real code on 2026-10-30. Every privacy statement must match one of these
facts (FR-006); if the code changes later, the text changes with it.

## R1 · Which services touch personal data

| Service | Used for | Code |
|---|---|---|
| Vercel | hosting, server functions, cron, request logs | `vercel.json`, deployment |
| Supabase | Postgres database and Storage (signature image of the school release) | `lib/supabase*`, `supabase/migrations` |
| Clerk | team accounts and sessions only; the provider wraps the whole app, so its script also loads on public pages | `app/layout.tsx` (`ClerkProvider`), `proxy.ts` |
| Stripe | checkout and payment status; Stripe offers card, Apple Pay, Google Pay, PayPal, SEPA, Klarna | `lib/payment/*`, `app/api/stripe-webhook` |
| Resend | sending all mails | `lib/email/provider.ts` |

Not used: analytics, ads, tracking pixels, social plugins, maps, video embeds, external fonts at
runtime (`next/font/google` downloads fonts at build time and serves them from the own domain).
Placeholder photos from Unsplash pass through the Next.js image optimizer, so the browser loads
them from the own domain; the visitor's IP does not reach Unsplash.

Decision: the privacy text names exactly these five services plus the self hosted fonts and
images. Server regions and the exact legal entities are part of the operator data (R3) because
they depend on the project settings, not the code.

## R2 · Personal data stored

| Table | Data | Deleted when |
|---|---|---|
| `registrations` | name, email, city, gender, answers of the camp form (`form_data`, may include birth date, phone, guardian, health notes depending on the camp), price tier, payment status and amounts, access token | admin delete hides the row (`deleted` flag) and removes school release and bus data at once; the row itself goes with the camp |
| `stripe_payments`, `stripe_events` | payment references from Stripe | with the camp or registration |
| `email_deliveries` | which mail went to which registration, status | with the registration (cascade) |
| `participant_messages` | message text, change requests | with the registration |
| `school_releases` | teacher, school, school address, participant address, class | with the registration or on admin delete; the PDF is never stored |
| `bus_tickets`, `bus_boardings` | ticket code, boarding time and trip | with the registration |
| `room_assignments`, `tent_circle_members` | internal assignment | with the registration |
| `submission_attempts` | IP address, optional email, kind, time; used for throttling with 10 minute windows | **never today** |
| `logs` | admin actions, may contain names | never today |
| `profiles`, `user_roles`, `admin_invitations` | team members, keyed by Clerk id | when an admin is removed |

## R3 · Operator data in one place

Decision: one typed module `lib/legal/operator.ts` with every operator value as `string | null`
(`null` means not yet provided). Both pages read it; nothing else stores operator data.

Rationale: FR-002 and FR-003. A typed object makes gaps visible to the compiler and the tests,
and the association can hand over values without touching page code.

Alternatives: environment variables (hidden from review, awkward for multiline addresses),
database table with admin form (out of scope, more surface than a yearly change needs).

## R4 · Visible gaps

Decision: a small server component renders a missing value as a highlighted `<mark>` with the text
„noch einzutragen: Anschrift“ (label per field). A pure helper `missingOperatorFields()` lists all
gaps; a unit test prints them, and the quickstart tells the team to make the list empty before go
live.

Alternatives: hiding missing lines (looks complete but is not, violates FR-003), failing the build
(blocks previews before the association answers).

## R5 · Gate and indexing

Decision: add `/impressum` and `/datenschutz` to `OPEN_PATH_PREFIXES` in `lib/coming-soon/gate.ts`
so both pages pass the prelaunch gate for everyone (FR-009). The existing gate test gets the two
paths. Both pages may be indexed when the site is live; during the gate the domain wide noindex
of the coming soon response does not apply to them, which is acceptable for legal pages.

## R6 · IP addresses in `submission_attempts`

Finding: IP addresses are stored without any deletion, although the throttle only looks back 10
minutes. A privacy statement cannot honestly promise a short retention without code.

Decision: delete rows older than 7 days (`SUBMISSION_ATTEMPT_RETENTION_DAYS = 7`, centralized in
`lib/legal/limits.ts`) once per day inside the existing cron route `app/api/cron/info-mails`,
before the mail run; a failure is logged and does not stop the mails. The privacy text states 7
days.

Rationale: smallest honest fix, no new cron entry, no schema change. 7 days leaves room to look at
abuse after a weekend.

Alternatives: state „unbegrenzt“ (not defensible), new cron route (more config for one query), a
database job (dashboard only change, forbidden by principle IV).

`logs` stays as is; the text says activity logs of the team are deleted with the camp data at the
latest and are reviewed yearly. Shortening that is a separate decision for the association.

## R7 · Retention wording

Decision: state principles, not promises the code does not keep:

1. Registration data are kept for the camp and its follow up and deleted by the team with the
   camp, at the latest at the end of the year after the camp, unless retention duties apply.
2. Payment records follow tax retention duties (up to 10 years) at Stripe and in the accounting of
   the association.
3. Throttling data: 7 days (R6).
4. Mails: delivery logs at Resend per their retention; the delivery list goes with the
   registration.

Exact periods are part of the association's review (spec assumption).

## R8 · Legal bases and minors

Decision: Art. 6 (1) b DSGVO for registration, payment, mails, participant page, bus and room
organisation; Art. 6 (1) f for server logs, throttling and the activity log; Art. 6 (1) a for
voluntary answers; Art. 9 (2) a for health notes the family enters voluntarily; Art. 6 (1) c for
retention duties. For participants under 16 the text asks that a parent or guardian completes or
approves the registration (Art. 8 DSGVO logic applied conservatively).

## R9 · Placement and design

Decision: one shared `LegalPage` frame like the packing list (home link on top, narrow reading
column of 46rem, `font-display` heading, footer). The privacy page lists its sections as anchor
links on top. `SiteFooter` gets a second, quieter row with „Impressum“ and „Datenschutz“; that
covers landing page, packing list, payment pages and the participant page (it uses
`PaymentShell`, which renders `SiteFooter`). The coming soon page gets the same two links under
„Teamzugang“, since it has no footer. Long words and mail addresses break with `break-words`;
no automatic hyphenation, because it would print hyphens the writing rules forbid. Print hides
header and footer.

## R10 · Copy location and writing rules

Decision: all German copy in `lib/legal/messages.ts` as structured sections (`id`, `heading`,
`blocks`), the privacy text built from operator data at render time. A unit test asserts that no
string contains an en dash, em dash or a hyphen between letters, and that all 15 FR-005 section
ids exist.
