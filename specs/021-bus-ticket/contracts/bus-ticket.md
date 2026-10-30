# Contracts: Busticket

All inputs validated with Zod (`lib/bus/schema.ts`). Server Actions return the existing
`ActionResult` shape (`{ ok: true, ... } | { ok: false, error: string }`) with German errors;
`AuthError` maps to the usual "Keine Berechtigung" message.

## QR payload

```text
<APP_URL>/admin/bus?t=<code>
code: /^[A-Za-z0-9_-]{22}$/
```

`parseTicketCode(text)` accepts this URL (any host, path `/admin/bus`) or a bare code and returns
the code or null.

## Scan page Server Actions (`app/admin/bus/actions.ts`)

Guard: `requirePermission("bus")`. Camp: always the current camp.

| Action | Input | Output |
|---|---|---|
| `scanBusTicket` | `{ code: string, trip: "outbound" \| "return" }` | `{ ok: true, outcome: ScanOutcome }` |
| `loadBoardingList` | `{ trip }` | `{ ok: true, state: "ready", total, boarded, entries: BoardingListEntry[] }` or `{ ok: true, state: "disabled" \| "mapping_broken" \| "no_camp" }` |
| `markBoardedManually` | `{ registrationId: uuid, trip }` | `{ ok: true, outcome: ScanOutcome }` (same rules as a scan, `method = manual`) |
| `undoBoarding` | `{ registrationId: uuid, trip }` | `{ ok: true }`; logs `bus.boarding_undone` |

`ScanOutcome` see [data-model.md](../data-model.md). The scan never returns more than name,
reference, time and `paymentOpen`.

A thrown or network error on the client shows "Keine Verbindung, bitte erneut versuchen" and no
outcome (FR-020).

## Settings Server Action (`app/admin/camps/[campId]/felder/actions.ts`)

Guard: `requirePermission("camps")`.

| Action | Input | Output |
|---|---|---|
| `saveBusSettings` | `{ campId: uuid, enabled: boolean, fieldKey: string \| null, answers: string[] }` | `{ ok: true, counts: { busPersons, withoutAnswer } }` or `{ ok: false, error }` when enabling with a missing or invalid mapping |

## Registration dialog Server Actions (`app/admin/actions.ts`)

Guard: `requirePermission("registrations")`. Keyed by registration reference like the release
panel.

| Action | Input | Output |
|---|---|---|
| `loadBusTicket` | `reference` | `{ ok: true, ticket: { isBusPerson, state: "active" \| "blocked" \| "none", issuedAt, boardings: { outbound, return } } }` |
| `reissueBusTicket` | `reference` | `{ ok: true }`; revokes current, creates new; logs `bus.ticket_reissued` |
| `blockBusTicket` | `reference` | `{ ok: true }`; revokes current; logs `bus.ticket_blocked` |
| `sendBusTicket` | `reference` | `{ ok: true }` or `{ ok: false, error }` (no email, not a bus person, blocked, quota, provider) |

## Participant route

`GET /meine-anmeldung/<token>/busticket[?v=<hash>]`

- 200 `image/png`, `Cache-Control: private, no-store`: valid token, active registration, bus
  person, active ticket (created on demand).
- 404 "Nicht gefunden" for everything else; unknown tokens count toward the participant miss
  throttle.

## Mails

- Kind `bus_ticket` in `email_deliveries` (may repeat). Template `busTicketEmail(ctx)` in
  `lib/email/templates.ts`: greeting, intro, QR image, hint to show it at boarding and turn up
  brightness, participant page button, closing. Listed in `/admin/mail` preview with a sample
  image.
- `EmailContext.busTicket?: { imageUrl: string; pageUrl: string } | null`. When set,
  `arrivalInfoEmail` adds the block "Dein Busticket" after the arrival facts.

## Permissions and navigation

- `PERMISSION_LABELS.bus = "Bus"`; nav item `{ label: "Bus", href: "/admin/bus" }`.
