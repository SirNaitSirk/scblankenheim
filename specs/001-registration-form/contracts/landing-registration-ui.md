# Contract: Registration section on `/` (UI)

## Entry

- Anchor `#anmelden` on the landing page.
- Invitation link: `/?einladung=<token>#anmelden`. Unknown or invalid tokens behave like no token.

## States

| State | Shown | Copy source |
|-------|-------|-------------|
| `open` | form; plus invitation hint above the form when the token is valid | `messages.section.open`, `messages.invitationHint` |
| `countdown` | countdown to `registration_opens_at`; at zero the page refreshes itself once | `messages.section.countdown` |
| `closed` | closed notice with contact button | `messages.section.closed` |
| `full` | sold out notice with contact button | `messages.section.full` |

## Form

- Field order: Vorname, Nachname, Mail, then camp questions by `sort_order`.
- Required fields marked with `*`; errors shown under the field, linked via `aria-describedby`,
  `aria-invalid` set; server error shown in a `role="alert"` block.
- Capacity limited option: live seat note under the select; sold out option disabled and labelled
  "ausgebucht".
- Success: title, reference number, button "Noch jemanden anmelden" which resets the form but keeps
  the invitation token.
- Submitting state: button disabled with progress label; double submit impossible.

## Layout and visual

Unchanged from today: card on `bg-sand-50` section, max width `2xl`, single column, mobile first,
no horizontal scroll from 320 px. The invitation hint uses the existing muted notice style (border,
small text), no price, no badge with amounts. The `full` state mirrors the `closed` layout.
