# Research: Preisstufen verwalten im Tab „Preise“

## R1 Rename route and keep grants

* **Decision**: new route `/admin/preise`; `next.config.ts` `redirects()` with
  `{ source: "/admin/finanzen", destination: "/admin/preise", permanent: true }`; migration
  `array_replace(visible_tabs, '/admin/finanzen', '/admin/preise')` on `profiles` and
  `admin_invitations`.
* **Rationale**: grants are stored hrefs; `canSeeTab` compares exact strings. Without the migration
  plain admins would lose the tab.
* **Alternatives**: keep URL `/admin/finanzen` with a new label (rejected: label and URL disagree);
  map old href in code (rejected: permanent compatibility code for one time data).

## R2 Permission for writes

* **Decision**: `requirePermission("finances")`. Key unchanged, label "Preise".
* **Rationale**: matches the existing see/act model; renaming the key would need another data
  migration on `permissions` for no user visible gain.

## R3 Token generation

* **Decision**: `randomBytes(24).toString("base64url")` (32 URL safe chars, 192 bit).
* **Rationale**: unguessable, URL safe, no dependency. Unique constraint already exists.

## R4 Link construction

* **Decision**: client side from `window.location.origin`.
* **Rationale**: correct on localhost, preview and production without a new env var.

## R5 Status

* **Decision**: `scheduled` if `validFrom > now`, `expired` if `validUntil < now`, else `active`.
  Mirrors `findValidTier` so the badge matches what the link does.

## R6 Delete rule

* **Decision**: refuse delete when non deleted registrations reference the tier.
* **Rationale**: FK is `on delete set null`; deleting would silently drop the tier from reports.
  Soft deleted registrations do not block (same count as the table).

## R7 End validity

* **Decision**: set `valid_until = now()`; if `valid_from` is later than now, clear it so the range
  stays consistent.

## R8 Legacy public tiers

* **Decision**: show unchanged with badge "Öffentlich"; editing keeps `hidden`; regenerating a link
  sets `hidden = true`. Creating always sets `hidden = true`.
