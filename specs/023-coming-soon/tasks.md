---

description: "Task list for feature 023 coming soon gate"
---

# Tasks: Coming Soon Sperre vor dem Livegang

**Input**: Design documents from `specs/023-coming-soon/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/gate.md, quickstart.md

**Tests**: One unit test for the pure gate decision (contracts/gate.md). Everything else is checked
manually via quickstart.md.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on unfinished tasks)
- All user facing copy is German, without dash punctuation; code and comments are English only,
  also without dash punctuation.

---

## Phase 1: Setup

- [X] T001 Create branch `023-coming-soon` from `main` after pushing the open spec 022 work.
- [X] T002 [P] Document `COMING_SOON` (server only, `true` turns the gate on, set only for Vercel Production); the repo has no `.env.example`, so it is documented in `AGENTS.md` section 6.
- [X] T003 [P] Add one line to `AGENTS.md` section 4 Public: prelaunch coming soon gate via `COMING_SOON`, admins see the real site (specs/023-coming-soon).

## Phase 2: Foundational

- [X] T004 Create `lib/coming-soon/gate.ts`: `COMING_SOON_PATH = "/demnaechst"`, `isComingSoonEnabled(value)` (R5), `isOpenPath(pathname)` with segment exact prefixes (R2), `decideGate(input)` per contracts/gate.md.
- [X] T005 [P] Create `tests/unit/coming-soon-gate.test.ts` covering the full decision table, switch values (`true`, ` TRUE `, `1`, empty, undefined) and open path edges (`/admin`, `/admin/x`, `/administrator`, `/api/cron/info-mails`, `/api/register`, `/demnaechst`).
- [X] T006 [P] Create `lib/coming-soon/messages.ts` with the German copy (eyebrow, fallback camp name, text, team link label, 503 text, page title).
- [X] T007 Create `lib/coming-soon/admin.ts` (`server-only`): `isAdminUserId(userId)` selects `id` from `profiles` with the service client, returns false on any error (R3).

## Phase 3: User Story 1 and 2 (P1) · Gate and team access

- [X] T008 [US1] Create `app/demnaechst/page.tsx`: `notFound()` when the gate is off; camp name from `getCurrentCamp` with fallback; layout per plan.md UI; metadata `robots` noindex; link „Teamzugang“ to `/sign-in?redirect_url=/`.
- [X] T009 [US1] [US2] Extend `proxy.ts`: keep the admin protection; when enabled and the path is not open, read `userId` from `auth()`, check `isAdminUserId` only when a user exists, apply `decideGate` (rewrite with `X-Robots-Tag`, or 503 with `Retry-After` and German text).

## Phase 4: User Story 3 and 4 · Technik und Livegang

- [X] T010 [US3] Verify via quickstart steps 3 and 4 that public POSTs get 503 while webhook and cron keep their own responses.
- [X] T011 [US4] Verify quickstart step 7 (switch removed, behaviour unchanged, `/demnaechst` 404).

## Phase 5: Polish

- [X] T012 Run `npm run lint`, `npm test`, `npm run build` and report the output.
- [ ] T013 Run quickstart steps 1, 2, 5, 6 and 8 in the browser; screenshot of the coming soon page as proof.

## Notes

- T013: steps 1, 2 and 8 checked against a production build with `COMING_SOON=true` (all seven paths show the page, `noindex` header, no horizontal scroll at 320 px). Steps 5 and 6 (sign in as admin, account without profile) need a real sign in and are covered by the decision tests; check once on Vercel after setting the variable.
