# Research: Busticket

## R1 · Ticket code

- **Decision**: 16 random bytes from `node:crypto`, encoded base64url (22 characters), stored in
  `bus_tickets.code` (unique). Reissue revokes the current row and inserts a new one; block only
  revokes. Revoked rows stay so an old code answers "Ticket ungültig" instead of "Unbekannter
  Code".
- **Rationale**: Scanning is always online (spec assumption), so the server can look the code up.
  A stored random code is as unforgeable as a signature, needs no extra secret and makes revocation
  a simple row update.
- **Alternatives considered**: HMAC signed code with registration id and version (needs a new
  secret, still needs a database lookup for revocation, only useful offline). Reusing the
  participant token (would hand private page access to anyone who sees the QR).

## R2 · Rendering the QR code

- **Decision**: `qrcode` on the server only (`lib/bus/qr.ts`, `server-only`): `toString(..., {
  type: "svg" })` for the participant page, `toBuffer(..., { type: "png" })` for mails. Error
  correction level M, margin 4.
- **Rationale**: Mature, MIT, no native modules, works on Vercel Node. SVG is sharp at any size;
  PNG is the only format mail clients render reliably.
- **Alternatives considered**: Client side rendering (code would have to reach the browser anyway,
  but duplicates logic and fails in mails). External QR image APIs (leak codes).

## R3 · Decoding in the browser

- **Decision**: `navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })`
  into a `<video>`. If `window.BarcodeDetector` supports `qr_code`, use it; otherwise draw frames
  into a canvas about five times per second and decode with `jsqr`. Load `jsqr` dynamically only
  when needed. After a hit, pause decoding until the result overlay closes.
- **Rationale**: Android Chrome has a fast native detector; iOS Safari does not ship
  `BarcodeDetector`, so a small pure JS decoder covers it. `jsqr` has no dependencies.
- **Alternatives considered**: `@zxing/browser` (larger, more formats than needed), `qr-scanner`
  (bundles its own worker setup, more moving parts).

## R4 · QR payload

- **Decision**: `<APP_URL>/admin/bus?t=<code>`. The scanner accepts either this URL or a bare code
  and extracts the code with one parser (`lib/bus/code.ts`). When the page opens with `?t=`, it
  checks that code once the trip is known, then removes the parameter from the URL.
- **Rationale**: Fulfils US2.10: the normal phone camera opens the scan page; Clerk handles login.
  The URL stays short, so the QR stays low density and easy to scan from a screen.
- **Alternatives considered**: Bare code only (normal camera would show meaningless text).

## R5 · QR image in mails

- **Decision**: Route `GET /meine-anmeldung/<token>/busticket` returns the PNG of the current code
  (`Cache-Control: private, no-store`). Mails link the image as
  `.../busticket?v=<first 8 chars of a hash of the code>` so a reissued ticket gets a new URL and
  image proxies (Gmail) do not show a stale code. The mail also contains the participant page link
  (US4.5).
- **Rationale**: Mail clients block `data:` images and handle inline CID attachments unevenly. The
  participant token is already in every mail, so the route adds no new exposure. Same token checks
  and miss throttle as the release PDF route.
- **Alternatives considered**: CID inline attachment through Resend (works in some clients only,
  bigger mails). Image by ticket code (would make the code itself a second secret URL).

## R6 · Ticket lifecycle

- **Decision**: `ensureTicket(registrationId)` creates a ticket on first need: participant page
  view of a bus person and rendering a mail with a ticket. The list does not show codes and needs
  no ticket. Insert races are resolved by the partial unique index on
  active tickets (`on conflict do nothing`, then read).
- **Rationale**: No backfill job and no trigger on `form_data` changes; whether someone is a bus
  person is always evaluated live (FR-005), the ticket only carries the code.
- **Alternatives considered**: Creating tickets at registration (answers and settings change later).

## R7 · Scan decision and boarding

- **Decision**: One Server Action `scanBusTicket({ code, trip })`. Order:
  1. code not found → `unknown`
  2. ticket revoked → `invalid`
  3. ticket camp is not the current camp → `other_camp`
  4. bus ticket off or mapping broken for the camp → `disabled`
  5. registration deleted or cancelled → `cancelled`
  6. answer does not match the mapping → `no_ticket`
  7. insert boarding `(registration_id, trip)` with `on conflict do nothing`; nothing inserted →
     `already` with the stored time; else `boarded` with `paymentOpen = outstandingAmount > 0`.
  Pure decision in `rules.ts`, data access in `data.ts`.
- **Rationale**: The primary key makes double boarding impossible even with simultaneous scans
  (edge case). The order gives the most useful reason first.
- **Alternatives considered**: Read then insert (race), storing every scan attempt (not needed;
  boardings plus logs for manual changes suffice).

## R8 · Live list

- **Decision**: Client component calls `loadBoardingList(trip)` every 4 s while
  `document.visibilityState === "visible"`, and immediately after own scans and changes. The list
  contains every bus person of the current camp with ticket status and boarding of this trip.
- **Rationale**: The repo has no TanStack Query and no realtime setup; polling a Server Action is a
  few lines and meets "within a few seconds" (FR-023) for about 100 rows.
- **Alternatives considered**: Supabase Realtime (needs client side Supabase auth, which Clerk
  setup does not provide), adding TanStack Query only for this.

## R9 · Where the settings live

- **Decision**: A card "Busticket" on `/admin/camps/[campId]/felder`, saved through a Server Action
  with permission `camps`, stored in `camp_bus_settings`.
- **Rationale**: The mapping points at the form fields of that camp; seeing them side by side
  prevents mistakes. Only select and checkbox fields are offered (FR-002). For checkbox, the answer
  values are `true` and `false`, shown as "Ja" and "Nein".
- **Alternatives considered**: The "Mails" page (unrelated), a column on `camp_form_fields` (spreads
  one setting over rows).

## R10 · Camp and trip on the scan page

- **Decision**: The scan page always works on the current camp (`camp_settings`). The chosen trip
  is kept in `localStorage` per device and in the URL (`?fahrt=hin|rueck`); without a choice the
  page asks first. The trip keys in code are `outbound` and `return`.
- **Rationale**: Buses run only for the current camp; keeping the trip per phone avoids wrong
  trip scans after a reload.
- **Alternatives considered**: Choosing a camp on the scan page (never needed in practice).

## Duplicate names

Scan result and list show the registration reference next to the name. It is already printed in
every mail, so it adds no new data (spec edge case).
