# Data Model: Tabs auf der Teilnehmerseite

**Feature**: specs/022-participant-tabs

No schema change, no migration, no new server data. The page keeps reading the existing
`ParticipantView` (`lib/participant/view.ts`).

## Client state (browser only)

### ParticipantTab

| Value | Fragment | Label | Shown when |
|-------|----------|-------|------------|
| `overview` | `uebersicht` | Übersicht | always |
| `details` | `angaben` | Meine Angaben | always |
| `documents` | `dokumente` | Dokumente | `view.busTicket` is set, or the release card is shown (`release` prop and `view.schoolRelease` set) |

### Fragment resolution

`resolveTab(hash, available) → { tab, scrollTo }`

| Fragment | Result when `documents` available | Result when not available |
|----------|-----------------------------------|---------------------------|
| empty | `overview`, no scroll | `overview` |
| `#uebersicht` | `overview` | `overview` |
| `#angaben` | `details` | `details` |
| `#dokumente` | `documents` | `overview` |
| `#busticket` | `documents`, scroll to `busticket` | `overview` |
| `#schulbefreiung` | `documents`, scroll to `schulbefreiung` | `overview` |
| anything else | `overview` | `overview` |

Matching ignores a leading `#` and letter case.

### Transitions

- Tab click or arrow key: `tab` changes, fragment replaced via `history.replaceState`, no scroll.
- `hashchange` (link on the page, manual edit, back or forward between fragments): `resolveTab`
  again, scroll if a target is returned.
- Server action result (`revalidatePath`): no change, the component keeps its state.

### Values reused for the status strip

`view.status`, `view.payState`, `view.payHref`, `view.amounts.outstanding`.
