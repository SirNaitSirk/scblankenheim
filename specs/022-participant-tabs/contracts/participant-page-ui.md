# UI Contract: Teilnehmerseite mit Tabs

**Route**: `/meine-anmeldung/<token>` (unchanged, specs/017-participant-page)

## Fragments (public, stable)

Mails and shared links rely on these. They must keep working.

| Fragment | Opens | Used by |
|----------|-------|---------|
| none | Übersicht | confirmation, payment link, reminders, info mails |
| `#uebersicht` | Übersicht | new, optional |
| `#angaben` | Meine Angaben | new, optional |
| `#dokumente` | Dokumente | new, optional |
| `#busticket` | Dokumente, scrolled to bus ticket | arrival info mail, bus ticket mail (`lib/bus/participant.ts`) |
| `#schulbefreiung` | Dokumente, scrolled to release form | release hint in confirmation and teaser mail, participant link request (`lib/email/send.ts`) |

Unknown fragments, or a Dokumente fragment while that tab is missing, open Übersicht.

## Page structure (top to bottom)

1. Header: eyebrow, greeting, intro (unchanged).
2. Status strip: only when cancelled or an amount is open and payable.
3. Tab bar (sticky): Übersicht · Meine Angaben · Dokumente (third only when available).
4. Panels:
   - Übersicht: status card, camp card, packing card.
   - Meine Angaben: answers card, contact section (when the action is bound).
   - Dokumente: bus ticket card, school release card (each under its current condition).

## Accessibility

- `role="tablist"` labelled „Bereiche deiner Anmeldung“; each tab `role="tab"` with
  `aria-selected` and `aria-controls`; each panel `role="tabpanel"` with `aria-labelledby`.
- Keyboard: Arrow Left and Right move and activate, Home and End jump, Tab moves into the panel.
- Without JavaScript: no tab bar, all panels visible in the order above.

## German copy (new, in `lib/participant/messages.ts`)

| Key | Text |
|-----|------|
| `tabs.label` | Bereiche deiner Anmeldung |
| `tabs.overview` | Übersicht |
| `tabs.details` | Meine Angaben |
| `tabs.detailsShort` | Angaben |
| `tabs.documents` | Dokumente |
| `strip.outstanding(amount)` | Noch {amount} offen |
| `strip.cancelled` | Deine Anmeldung ist storniert. |

The strip button reuses `pay.button` („Jetzt bezahlen“).
