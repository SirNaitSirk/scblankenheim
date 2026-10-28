# Contract: Anmeldestatus

## Server Actions `createRegistrationAction` and `updateRegistrationAction` (existing, `app/admin/actions.ts`)

Input field `status`: `"active" | "cancelled"`. Any other value fails Zod validation and returns the
existing validation error result; nothing is written.

## UI

| Place | Values shown |
|-------|--------------|
| Table column „Status“ | Badge „Aktiv“ (neutral) or „Storniert“ (danger) |
| Status filter | „Alle“, „Aktiv“, „Storniert“ |
| Registration dialog | Select „Aktiv“, „Storniert“; default „Aktiv“ for new registrations |
| CSV export column „Status“ | „Aktiv“ or „Storniert“ |

## Database

`create_public_registration(...)` keeps its signature and return shape; inserted rows carry
`status = 'active'`.
