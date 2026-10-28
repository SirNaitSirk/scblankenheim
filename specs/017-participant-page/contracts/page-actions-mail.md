# Contracts: Teilnehmerseite, Admin Actions, Mails

## Public page `GET /meine-anmeldung/[token]`

- Public, not behind Clerk (`proxy.ts` unchanged).
- Metadata: title "Meine Anmeldung · FCG Blankenheim Summercamp",
  `robots: { index: false, follow: false }`, `referrer: "no-referrer"`.
- Flow:
  1. `token` fails `^[0-9a-f]{64}$` → neutral notice.
  2. Misses of this ip in the last 10 minutes ≥ 20 → throttle notice, no lookup.
  3. Lookup by `access_token`; not found or `deleted` → record miss, neutral notice.
  4. Found → render `ParticipantView` (see data-model.md).
- Response is HTTP 200 in all cases.
- Neutral notice copy: title "Link nicht gefunden", body "Dieser Link ist ungültig oder nicht mehr
  aktuell. Bitte nutze den Link aus deiner neuesten Mail oder melde dich beim Team."

## Server Action `getParticipantLinkAction(reference: string)`

- Guard: `requirePermission("registrations")` via `runGuarded`.
- Input: `referenceSchema`.
- Result: `{ ok: true; url: string } | { ok: false; error: string }`. `url` is absolute when
  `APP_URL` is set, else the path.
- Errors (German, `lib/admin/messages.ts`): unauthorized, not found, generic.

## Server Action `renewParticipantLinkAction(reference: string)`

- Guard and input as above.
- Effect: writes a new token (`randomBytes(32)` hex) for the non deleted registration with that
  reference; old link invalid at once. Writes `logs` entry `registration.access_renewed`.
- Result: same shape as `getParticipantLinkAction` with the new url.

## Mail context

- `EmailContext.participantUrl: string` built in `buildMailTarget` from `APP_URL` and
  `access_token` (`participantUrl(token)` in `lib/email/links.ts`).
- Every template renders the block:
  - HTML: a quiet framed paragraph "Deinen Anmeldestand, Zahlungen und Daten findest du jederzeit
    hier:" with the link "Meine Anmeldung ansehen" (`renderTextLink`), so "Jetzt bezahlen" stays the
    only button in payment mails.
  - Text: the same sentence plus `Meine Anmeldung ansehen: <url>`.
- Templates: confirmation (paid and free), payment link, reminder 1 to 3, teaser, packing, arrival,
  thanks.
- Preview: sample token `0` repeated 64 times.
