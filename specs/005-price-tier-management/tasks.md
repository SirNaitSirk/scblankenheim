# Tasks: Preisstufen verwalten im Tab „Preise“

**Input**: `specs/005-price-tier-management/` (spec.md, plan.md, research.md, data-model.md,
contracts/server-actions.md, quickstart.md)

Format: `[ID] [P?] [Story] Description`. `[P]` = can run in parallel (different files, no open dependency).

## Phase 1: Setup

- [x] T001 Create migration `supabase/migrations/0006_rename_finances_tab.sql` (array_replace on `profiles.visible_tabs` and `admin_invitations.visible_tabs`, see data-model.md)

## Phase 2: Foundational (blocks all stories)

- [x] T002 [P] Rename German copy in `lib/admin/messages.ts`: `de.nav.finances` → `de.nav.pricing` ("Preise"), namespace `de.finances` → `de.pricing` (title "Preise", fix "Preistufe" → "Preisstufe"), `PERMISSION_LABELS.finances` label "Preise"; add all new tier strings (buttons, dialog, status badges, confirmations, toasts, errors, empty state, standard price line)
- [x] T003 [P] Extend `lib/admin/types.ts`: `PriceTier.invitationToken`, `PriceTierFormValues`, `PriceTierInput`, `PriceTierStatus`
- [x] T004 Create `lib/admin/price-tiers.ts`: `getTierStatus()`, `generateInvitationToken()` (server only usage), Zod `priceTierSchema` (name 1 to 80, price 0 to 9999 whole euros, `validUntil >= validFrom`, datetime-local → ISO) (depends on T002, T003)
- [x] T005 [P] Unit tests `tests/unit/price-tiers.test.ts` for status and schema (depends on T004)

## Phase 3: User Story 2 · Tab heißt „Preise“ (P1)

- [x] T006 [US2] Move `app/admin/finanzen/page.tsx` to `app/admin/preise/page.tsx`, guard with `/admin/preise`, use `de.pricing`
- [x] T007 [P] [US2] Update `components/admin/nav-items.ts`, `components/admin/admin-sidebar.tsx` icon map, `lib/admin/access.ts` (`PERMISSION_BY_HREF["/admin/preise"] = "finances"`), `components/admin/payment-overview.tsx` (`de.pricing`), `app/admin/actions.ts` revalidate path
- [x] T008 [P] [US2] Add permanent redirect `/admin/finanzen` → `/admin/preise` in `next.config.ts`

## Phase 4: User Story 1 · Preisstufe anlegen und Link weitergeben (P1)

- [x] T009 [US1] `lib/admin/data.ts`: `getPriceTiers()` returns `invitationToken`; add `getPriceTier(id)`, `createPriceTier(campId, input, token)`, `getCurrentCampBasePrice` if not already available via `getCurrentCamp()`
- [x] T010 [US1] Create `app/admin/preise/actions.ts` with `runGuarded` (`requirePermission("finances")`), `fieldErrorResult`, `createPriceTierAction` (contract)
- [x] T011 [P] [US1] Create `components/admin/price-tier-form-dialog.tsx` (Name, Preis, Gültig ab, Gültig bis; field errors; reuse datetime-local conversion from `camp-form-dialog.tsx`, extract to `lib/admin/datetime.ts` if needed)
- [x] T012 [US1] Create `components/admin/price-tiers-manager.tsx`: card header with standard price and create button, table (name + status badge + legacy "Öffentlich" badge, Preis, Gültigkeit, Anmeldungen, Einnahmen, Aktionen, footer sums), "Link kopieren" with toast and clipboard fallback dialog, empty state
- [x] T013 [US1] Wire manager into `app/admin/preise/page.tsx` (replace the static table; handle no current camp)

## Phase 5: User Story 3 · Bearbeiten, Link erneuern, beenden, löschen (P2)

- [x] T014 [US3] `lib/admin/data.ts`: `updatePriceTier`, `setPriceTierToken`, `endPriceTier`, `countActiveRegistrationsForTier`, `deletePriceTier`
- [x] T015 [US3] `app/admin/preise/actions.ts`: `updatePriceTierAction`, `regeneratePriceTierLinkAction`, `endPriceTierAction`, `deletePriceTierAction` with camp scope check, delete guard and log entries without token
- [x] T016 [US3] `components/admin/price-tiers-manager.tsx`: row menu (Bearbeiten, Link erneuern, Gültigkeit beenden, Löschen disabled when count > 0) with confirm dialogs; edit hint about existing registrations in the form dialog

## Phase 6: Polish

- [x] T017 Apply migration to the database and regenerate `lib/database.types.ts` if the generator reports changes
- [x] T018 Search for leftover `finanzen` / `de.finances` references (`grep -rn`), update AGENTS.md quick reference if it mentions the tab
- [x] T019 Run `npm run lint`, `npm test`, `npm run build`; report output verbatim
- [ ] T020 Walk through quickstart.md in the browser (desktop and 375 px)

## Dependencies

* T001 independent; must be applied before T020.
* T002, T003 → T004 → T005.
* Phase 3 needs T002. Phase 4 needs T002 to T004 and T006. Phase 5 needs Phase 4.
* T019, T020 last.

## Parallel opportunities

T002 with T003; T007 with T008; T011 with T010.

## MVP

Phases 1 to 4 deliver the rename and creating tiers with copyable links.
