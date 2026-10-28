# Data Model: Preisstufen verwalten im Tab „Preise“

No schema change. One data migration.

## price_tiers (existing)

| Column | Use in this feature |
|--------|---------------------|
| `id` | key |
| `camp_id` | always the current camp on create; scope check on every write |
| `name` | required, trimmed, 1 to 80 chars (Zod) |
| `price` | whole euros, 0 to 9999 (Zod) |
| `hidden` | `true` on create and on link regenerate |
| `invitation_token` | 32 char base64url, set on create, replaced on regenerate |
| `valid_from` / `valid_until` | optional; `valid_until >= valid_from` (Zod); end validity sets `valid_until = now` |

## Domain type `PriceTier` (lib/admin/types.ts)

Adds `invitationToken: string | null`. Status is derived, not stored:
`getTierStatus(validFrom, validUntil, now): "active" | "scheduled" | "expired"`.

## Form types

* `PriceTierFormValues`: `{ name: string; price: string; validFrom: string; validUntil: string }`
  (datetime-local strings).
* `PriceTierInput`: `{ name: string; price: number; validFrom: string | null; validUntil: string | null }`.

## Migration 0006_rename_finances_tab.sql

```sql
update public.profiles
  set visible_tabs = array_replace(visible_tabs, '/admin/finanzen', '/admin/preise')
  where '/admin/finanzen' = any(visible_tabs);

update public.admin_invitations
  set visible_tabs = array_replace(visible_tabs, '/admin/finanzen', '/admin/preise')
  where '/admin/finanzen' = any(visible_tabs);
```
