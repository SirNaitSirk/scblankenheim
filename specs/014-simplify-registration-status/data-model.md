# Data Model: Anmeldestatus vereinfachen

## `registrations.status`

| Aspect | Before | After |
|--------|--------|-------|
| Type | `text not null` | unchanged |
| Values | `pending`, `confirmed`, `cancelled` | `active`, `cancelled` |
| Default | `'pending'` | `'active'` |
| Constraint | none | none |

### Data migration

| Old value | New value |
|-----------|-----------|
| `pending` | `active` |
| `confirmed` | `active` |
| `cancelled` | `cancelled` |

Applies to every row, every camp, deleted rows included.

### State transitions

```text
active ⇄ cancelled   (only by an admin with the registrations permission)
```

New rows start as `active` (public form and admin dialog). Payment never changes the status.

### Meaning

`cancelled` excludes the row from capacity, finance sums, reminders, payment eligibility, room
planning and tent circles. `active` is everything else. Both rules are unchanged; only the name of
the non cancelled value changes.

## `create_public_registration`

Recreated with identical signature and grants; the inserted status literal becomes `'active'`.

## TypeScript

```ts
export type RegistrationStatus = "active" | "cancelled";
```
