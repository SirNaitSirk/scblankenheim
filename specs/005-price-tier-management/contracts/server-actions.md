# Contract: Server Actions in `app/admin/preise/actions.ts`

All return the existing `ActionResult` (`{ ok: true, id? } | { ok: false, error, fieldErrors? }`).
All run `requirePermission("finances")` first; auth failure → `de.pricing.toast.unauthorized`.
Every write calls `revalidatePath("/admin/preise")` and writes a log entry (no token).

| Action | Input | Behaviour | Log action |
|--------|-------|-----------|------------|
| `createPriceTierAction` | `PriceTierFormValues` | Zod; needs current camp; insert with `hidden = true` and new token | `price_tier.create` |
| `updatePriceTierAction` | `id`, `PriceTierFormValues` | Zod; scope check; update name, price, validity | `price_tier.update` |
| `regeneratePriceTierLinkAction` | `id` | scope check; new token, `hidden = true` | `price_tier.regenerate_link` |
| `endPriceTierAction` | `id` | scope check; `valid_until = now`, clear future `valid_from` | `price_tier.end` |
| `deletePriceTierAction` | `id` | scope check; refuse if non deleted registrations > 0 | `price_tier.delete` (level warning) |

Errors (German, in `de.pricing.errors`): name required, name too long, invalid price, end before
start, no current camp, tier not found, has registrations.
