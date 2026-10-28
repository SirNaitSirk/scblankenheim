---

description: "Task list for 004 admin fast and reliable"
---

# Tasks: Adminbereich zuverlässig und schnell

**Input**: Design documents from `/specs/004-admin-fast-reliable/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [contracts/admin-data-reads.md](./contracts/admin-data-reads.md)

**Tests**: Unit tests for the two new pure modules (constitution VII: tests where logic is testable).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

No setup: no new dependency, no migration.

---

## Phase 2: Foundational (blocks US1 and US2)

- [X] T001 [P] Create `lib/admin/transient.ts` (no `server-only` import): move `TRANSIENT_ERROR_CODES`, `isTransientError` and `retryTransient` out of `lib/admin/data.ts` and export them; extend the code less message regex with `timeout|abort` (postgrest wraps fetch errors as `TimeoutError: ...` or `AbortError: ...` with empty code); keep 2 retries with backoff `150 * (attempt + 1) ** 2` ms (150 ms, 600 ms) as named constants `READ_RETRIES` and `RETRY_BASE_DELAY_MS`
- [X] T002 [P] Create `lib/supabase/fetch.ts` (no `server-only` import): export `READ_TIMEOUT_MS = 3000` and `withReadTimeout(baseFetch: typeof fetch): typeof fetch` that always sets `cache: "no-store"` and, only when the method is GET or HEAD (default GET), combines the caller signal with `AbortSignal.timeout(READ_TIMEOUT_MS)` via `AbortSignal.any`; POST, PATCH, PUT and DELETE get no timeout
- [X] T003 Update `lib/supabase/server.ts`: pass `db: { retry: false }` and `global: { fetch: withReadTimeout(fetch) }` to `createClient`; update the doc comment (single retry layer lives in `lib/admin/transient.ts`)
- [X] T004 Update `lib/admin/data.ts` to import `retryTransient` from `./transient` and delete the moved code

**Checkpoint**: every admin read is bounded to about 10 s and never reused from a server cache.

---

## Phase 3: User Story 1 · Daten sind immer da (P1)

**Goal**: every tab shows existing data; real outages show the German error state within about 10 s.

**Independent Test**: quickstart scenarios 1 and 5.

- [X] T005 [P] [US1] Add `tests/unit/transient.test.ts`: codes `PGRST002`, `57014` transient; code `23505` not transient; messages `TypeError: fetch failed`, `TimeoutError: The operation was aborted due to timeout`, `AbortError: This operation was aborted` transient; contentless `{}` transient; `retryTransient` succeeds after one transient failure, rethrows a non transient error after one call, gives up after 3 attempts (use fake timers)
- [X] T006 [P] [US1] Add `tests/unit/supabase-fetch.test.ts` with a stub base fetch: GET receives `cache: "no-store"` and a signal that aborts after `READ_TIMEOUT_MS` (fake timers); POST receives `cache: "no-store"` and the caller signal unchanged; an already aborted caller signal aborts the GET
- [X] T007 [US1] Add `experimental.serverComponentsHmrCache: false` to `next.config.ts` with a short comment (dev HMR must not reuse admin responses)

**Checkpoint**: US1 testable on its own.

---

## Phase 4: User Story 3 · Eigene Änderungen sofort sichtbar (P1)

**Goal**: guarantee that the speed work in US2 never shows stale data after an own change.

**Independent Test**: quickstart scenario 3.

- [X] T008 [US3] Audit every Server Action in `app/admin/actions.ts`, `app/admin/dashboard-actions.ts`, `app/admin/camps/actions.ts`, `app/admin/camps/[campId]/felder/actions.ts`, `app/admin/benutzer/actions.ts` and `app/admin/profil` (if it has actions): each successful write path calls `revalidatePath` (which purges the whole client cache in Next 16.3); add a call where one is missing

---

## Phase 5: User Story 2 · Tabwechsel ohne spürbare Ladezeit (P2)

**Goal**: prefetched or visited tabs appear in under 0.5 s; dashboard needs at least a third fewer requests.

**Independent Test**: quickstart scenarios 2, 4 and 6.

- [X] T009 [US2] In `lib/admin/data.ts` wrap with `cache` from `react`: `loadCurrentCampId = cache(() => retryTransient(readCurrentCampId))` (rename the current `getCurrentCampId` body to `readCurrentCampId`), `loadCamps = cache(() => retryTransient(buildCamps))`; `buildCamps`, `getPriceTiers` and `getFinanceSummary` use `loadCurrentCampId()`; `getCamps`, `getCurrentCamp`, `getCampById` and `getFinanceSummary` use `loadCamps()` instead of calling `buildCamps` directly. The cache must wrap the retried function so a retry never reuses a cached rejection
- [X] T010 [US2] In `lib/admin/data.ts` export `getCurrentProfile` as `cache(async () => ...)` with the same signature, so layout and page share one read per render
- [X] T011 [P] [US2] In `components/admin/admin-sidebar.tsx` set `prefetch={true}` on the nav item `Link`s and the brand `Link` to `/admin`
- [X] T012 [P] [US2] In `next.config.ts` add `experimental.staleTimes = { dynamic: 30, static: 30 }` with a comment: prefetched and visited admin tabs are reused for 30 s; Server Actions purge them via `revalidatePath`
- [X] T013 [US2] Verify the request count once in dev by temporarily logging inside `withReadTimeout` (dashboard 19 → 11), then remove the log again · Done statically (counted in research R4: 19 → 11); a live count needs a signed in admin and was not run

---

## Phase 6: Polish

- [X] T014 Run `npm run lint`, `npm test`, `npm run build` and report the output verbatim
- [X] T015 Run quickstart scenarios that are possible locally (production build, signed in admin); state which ones could not be run · Run: unit tests, build, landing page read through the new client. Not run: scenarios 1 to 6 need a signed in admin
- [X] T016 Check all new comments and docs for dash punctuation (writing rules)

## Dependencies

- T001, T002 parallel → T003, T004 → US1 (T005, T006, T007), US3 (T008), US2 (T009 to T013) → Polish
- US2 depends on US3 being verified (speed must not cost freshness)
- T009 before T010 (same file); T011 and T012 parallel to T009

## Parallel Example

```text
T001 lib/admin/transient.ts   ‖  T002 lib/supabase/fetch.ts
T005 transient.test.ts        ‖  T006 supabase-fetch.test.ts
T011 admin-sidebar.tsx        ‖  T012 next.config.ts
```

## Implementation Strategy

MVP: Phase 2 plus US1 fixes the empty tabs alone. US3 then US2 add speed without risking freshness.
Total 16 tasks: Foundational 4, US1 3, US3 1, US2 5, Polish 3.
