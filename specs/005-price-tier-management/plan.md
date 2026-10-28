# Implementation Plan: Preisstufen verwalten im Tab „Preise“

**Branch**: `005-price-tier-management` | **Date**: 2026-10-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-price-tier-management/spec.md`

## Summary

The admin tab "Finanzen" becomes "Preise" (`/admin/preise`, permanent redirect from the old URL,
stored `visible_tabs` migrated). The page keeps the four payment stats and gains a price tier
manager for the current camp: create, edit, copy invitation link, regenerate link, end validity,
delete (only without registrations). Writes run as guarded Server Actions with Zod validation,
following the existing `app/admin/camps/actions.ts` pattern. No new tables, no new columns.

## Technical Context

**Language/Version**: TypeScript, Next.js 16 App Router (React Server Components + Server Actions)

**Primary Dependencies**: existing only: Clerk, supabase-js (service role, server only), Zod,
Tailwind, admin UI primitives in `components/ui/*`, Phosphor icons. No new dependency.

**Storage**: Supabase Postgres, existing table `price_tiers`; one data migration for
`profiles.visible_tabs` and `admin_invitations.visible_tabs`.

**Testing**: Vitest (`npm test`) for pure helpers (status, validation); manual steps in quickstart.

**Target Platform**: Vercel, desktop and mobile browsers.

**Project Type**: web application (single Next.js project).

**Performance Goals**: tab loads with the same query count as today plus nothing extra
(the tier query already exists; it only gains columns).

**Constraints**: invitation token and hidden prices never reach public pages; all writes server side.

**Scale/Scope**: a handful of tiers per camp, a few admins.

## Existing code inspected

* `app/admin/finanzen/page.tsx`: stats + tier breakdown table, guarded by `guardTab("/admin/finanzen")`.
* `lib/admin/data.ts` `getPriceTiers()`: reads tiers of the current camp + counts non deleted
  registrations per tier. `writeLog()` for activity log.
* `lib/register/invitation.ts` + `lib/register/service.ts`: token lookup checks camp and validity
  window; fallback is the camp base price. Unchanged by this feature.
* `lib/admin/access.ts`: `PERMISSION_BY_HREF["/admin/finanzen"] = "finances"`, `canSeeTab`.
* `lib/admin/guard.ts`: `guardTab` (see), `requirePermission` (act).
* `app/admin/camps/actions.ts`: Server Action pattern (`runGuarded`, Zod `superRefine`,
  `fieldErrorResult`, `writeLog`, `revalidatePath`).
* `components/admin/camp-form-dialog.tsx`, `camps-board.tsx`: dialog + `router.refresh()` pattern,
  datetime-local conversion.
* `components/admin/nav-items.ts`, `admin-sidebar.tsx`, `lib/admin/messages.ts`
  (`de.nav.finances`, `de.finances`, `PERMISSION_LABELS.finances`), `app/admin/actions.ts`
  (`revalidatePath("/admin/finanzen")`).
* `supabase/migrations/0001_init_schema.sql`: `price_tiers` (`invitation_token text unique`,
  `valid_from`, `valid_until`, `hidden`), `profiles.visible_tabs text[]`,
  `admin_invitations.visible_tabs text[]`.

## Decisions (details in research.md)

* **R1 Rename**: move route folder to `app/admin/preise`; permanent redirect in `next.config.ts`;
  migration `0006_rename_finances_tab.sql` replaces `/admin/finanzen` with `/admin/preise` in both
  `visible_tabs` arrays. The **permission key stays `finances`** (stored data, internal name);
  only its German label becomes "Preise". Message namespace `de.finances` becomes `de.pricing`.
* **R2 Act permission**: tier writes require the existing section permission via
  `requirePermission("finances")`, same see/act model as every other tab. This refines the spec
  assumption: the tab's existing permission is the gate, no new permission is added.
* **R3 Token**: `crypto.randomBytes(24).toString("base64url")` on the server for create and
  regenerate. The unique constraint guards collisions.
* **R4 Link**: the client builds `${window.location.origin}/?einladung=${token}`. Tokens are only
  rendered inside the Clerk protected admin page.
* **R5 Status**: pure helper `getTierStatus(validFrom, validUntil, now)` returns
  `active | scheduled | expired`, unit tested.
* **R6 Delete**: server counts non deleted registrations on the tier; if > 0 it refuses with a
  German message. Same count as shown in the table.
* **R7 Scope check**: every update/regenerate/end/delete first loads the tier and requires
  `camp_id === current camp id`.
* **R8 Hidden**: create always sets `hidden = true`. Regenerating a legacy tier without token also
  sets `hidden = true`. Legacy public tiers are listed unchanged with a "Öffentlich" badge.
* **R9 Price edits** only update `price_tiers.price`; `registrations.amount_due` is never touched.
* **R10 Dates**: reuse the datetime-local conversion from the camp dialog (move to a shared helper
  in `lib/admin/datetime.ts` if it is local to that component).

## Security requirements

* All five actions: `requirePermission("finances")` first, then Zod, then camp scope check.
* Service role client only in `lib/admin/data.ts` (server only).
* Logs record action and tier name, never the token.
* No change to public routes; anon still cannot read hidden tiers (existing RLS).

## UI (layout, states)

* `PageHeader` "Preise" + camp badge + description; four `StatCard`s unchanged.
* Card "Preisstufen": header row with title, line "Standardpreis: 195 €" and button
  "Preisstufe anlegen". Table columns: Name (+ status badge Aktiv/Geplant/Abgelaufen, + "Öffentlich"
  for legacy), Preis, Gültigkeit, Anmeldungen, Einnahmen, Aktionen. Footer row with sums as today.
* Actions: icon button "Link kopieren" (toast "Link kopiert"); menu with Bearbeiten, Link erneuern,
  Gültigkeit beenden, Löschen (disabled with tooltip text when count > 0). Confirm dialogs for
  regenerate, end and delete.
* Form dialog: Name, Preis (€), Gültig ab, Gültig bis; on edit with registrations a hint that
  existing registrations keep their amount.
* Empty state: short explanation + create button. No current camp: existing empty state + hint.
* Loading: existing `app/admin/loading.tsx`. Errors: existing toast + `error.tsx`.
* Mobile: table scrolls inside the card (`overflow-x-auto`), dialogs full width.
* Clipboard failure: fallback dialog showing the link in a read only input, preselected.

## Files likely to change

* `app/admin/finanzen/page.tsx` → `app/admin/preise/page.tsx`
* `app/admin/preise/actions.ts` (new)
* `components/admin/price-tiers-manager.tsx` (new), `components/admin/price-tier-form-dialog.tsx` (new)
* `lib/admin/price-tiers.ts` (new: status helper, token generator, Zod schema)
* `lib/admin/data.ts` (tier CRUD, `getPriceTiers` adds `invitationToken`)
* `lib/admin/types.ts` (`PriceTier.invitationToken`, `PriceTierFormValues`, `PriceTierInput`)
* `lib/admin/messages.ts`, `lib/admin/access.ts`, `components/admin/nav-items.ts`,
  `components/admin/admin-sidebar.tsx`, `components/admin/payment-overview.tsx`, `app/admin/actions.ts`
* `next.config.ts` (redirect)
* `supabase/migrations/0006_rename_finances_tab.sql` (new)
* `tests/unit/price-tiers.test.ts` (new)

## Constitution Check

| Principle | Result |
|-----------|--------|
| I Fixed stack | Pass: no new dependency |
| II Server is the boundary | Pass: guarded Server Actions, service role server only, Zod |
| III Strict scope | Pass: price tiers with hidden invitation links are in scope (AGENTS.md section 4) |
| IV Single source of truth | Pass: data migration in `supabase/migrations/`, no schema change, no CHECK constraints |
| V Language separation | Pass: UI German in `messages.ts`, code English; route segment `preise` is a German URL like `finanzen`, `bezahlen` |
| VI Hidden pricing | Pass: tokens only in admin, public flow unchanged |
| VII Simplicity | Pass: reuses existing patterns, one migration, two new components |

Re-check after design: unchanged, pass.

## Checks to run

`npm run lint`, `npm test`, `npm run build` (route move + redirect + config change).

## Project Structure

```text
specs/005-price-tier-management/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/server-actions.md
├── quickstart.md
└── tasks.md
```

**Structure Decision**: single Next.js project; admin route under `app/admin/preise`, UI in
`components/admin`, data access in `lib/admin`.

## Complexity Tracking

None.
