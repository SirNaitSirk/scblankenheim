---

description: "Task list for feature 022 participant tabs"
---

# Tasks: Tabs auf der Teilnehmerseite

**Input**: Design documents from `specs/022-participant-tabs/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/participant-page-ui.md, quickstart.md

**Tests**: One unit test for the pure fragment mapping (plan.md, Constitution VII). Everything else
is checked manually via quickstart.md. No end to end tests.

**Organization**: Tasks are grouped by user story so each story can be built and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on unfinished tasks)
- **[Story]**: User story from spec.md (US1 to US4)
- All user facing copy is German, without dash punctuation; code and comments are English only,
  also without dash punctuation.

---

## Phase 1: Setup

- [X] T001 Create branch `022-participant-tabs` from the current `021-bus-ticket` head (working tree is clean, nothing to commit first).
- [X] T002 [P] Amend the participant page entry in `AGENTS.md` section 4 with one sentence: the page is split into the tabs Übersicht, Meine Angaben and Dokumente, the active tab lives in the URL fragment, `#busticket` and `#schulbefreiung` open Dokumente (specs/022-participant-tabs). No dash punctuation.

---

## Phase 2: Foundational (blocks all stories)

- [X] T003 Create `lib/participant/tabs.ts`: export `type ParticipantTab = "overview" | "details" | "documents"`, `PARTICIPANT_TABS` in that order, `TAB_FRAGMENTS: Record<ParticipantTab, string>` = `{ overview: "uebersicht", details: "angaben", documents: "dokumente" }`, and `resolveTab(hash: string, available: readonly ParticipantTab[]): { tab: ParticipantTab; scrollTo: string | null }`. Strip a leading `#`, compare lowercase. `TICKET_ANCHOR` (`lib/bus/limits.ts`) and `RELEASE_ANCHOR` (`lib/school-release/limits.ts`) map to `documents` with `scrollTo` set to that anchor. A fragment whose tab is not in `available`, or any unknown fragment, returns `{ tab: "overview", scrollTo: null }`. Follow every row of the table in `data-model.md`.
- [X] T004 [P] Add copy to `lib/participant/messages.ts`: `tabs: { label: "Bereiche deiner Anmeldung", overview: "Übersicht", details: "Meine Angaben", detailsShort: "Angaben", documents: "Dokumente" }` and `strip: { outstanding: (amount: string) => \`Noch ${amount} offen\`, cancelled: "Deine Anmeldung ist storniert." }`.
- [X] T005 [P] Create `tests/unit/participant-tabs.test.ts` covering every row of the fragment table in `data-model.md` for both availability cases (with and without `documents`), plus case and leading `#` handling.

**Checkpoint**: `npm test` passes with the new test.

---

## Phase 3: User Story 1 · Das Wichtigste sofort sehen (P1) 🎯 MVP

**Goal**: The page opens with the Übersicht tab; answers, contact and documents are out of sight.

**Independent Test**: quickstart scenario 1.

- [X] T006 [US1] Create client component `components/participant/participant-tabs.tsx` (`"use client"`). Props: `panels: { tab: ParticipantTab; label: string; shortLabel?: string; content: ReactNode }[]` and `label: string`. State `active` initialised to `"overview"`. Render a `role="tablist"` with `aria-label={label}` and `data-participant-tablist`, one `button role="tab"` per panel with `id="participant-tab-<tab>"`, `aria-selected`, `aria-controls="participant-panel-<tab>"`, roving `tabIndex` (0 for active, −1 otherwise), and one `div role="tabpanel"` per panel with `id="participant-panel-<tab>"`, `aria-labelledby`, `tabIndex={0}`, `data-participant-panel`, `hidden={tab !== active}`, wrapping `content` in `flex flex-col gap-6`. All panels stay mounted (research R1). Element ids must never equal a fragment from `TAB_FRAGMENTS`.
- [X] T007 [US1] Style the tab bar in `components/participant/participant-tabs.tsx` per plan "UI" and research R5: wrapper `sticky top-0 z-10 -mx-1 bg-canvas/95 px-1 py-2 backdrop-blur`; track `grid gap-1 rounded-pill bg-ink-100 p-1` with `grid-cols-2` or `grid-cols-3` from `panels.length`; segment `h-11 rounded-pill px-2 whitespace-nowrap text-[13px] sm:text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`; active `bg-surface font-semibold text-foreground shadow-card`, inactive `font-medium text-muted-foreground hover:text-foreground`. When `shortLabel` is set, show it below 360 px and `label` above (e.g. `min-[360px]:hidden` / `hidden min-[360px]:inline`).
- [X] T008 [US1] Add the JavaScript free fallback in `components/participant/participant-tabs.tsx` (research R2): render `<noscript><style>{"[data-participant-tablist]{display:none}[data-participant-panel][hidden]{display:block}"}</style></noscript>` next to the tab bar; also add a small gap between panels in that mode (`[data-participant-panel]+[data-participant-panel]{margin-top:1.5rem}`) so stacked panels keep the `gap-6` rhythm.
- [X] T009 [US1] Restructure `components/participant/participant-summary.tsx`: keep the header; build the panel list `overview` = StatusCard, CampCard, PackingCard; `details` = AnswersCard, then ParticipantContact when `contactAction` is set; `documents` = BusTicketCard when `view.busTicket`, SchoolReleaseForm when `release && view.schoolRelease`, included only when at least one of the two renders. Pass labels from `copy.tabs` (`detailsShort` as `shortLabel` for `details`) and render `<ParticipantTabs>` below the header. Order inside each panel stays as today.

**Checkpoint**: quickstart scenario 1, 7 (two tabs without documents) and 10 (without JavaScript) pass.

---

## Phase 4: User Story 2 · Zwischen den Bereichen wechseln (P1)

**Goal**: Switching without reload, input survives, the tab survives reload and submits.

**Independent Test**: quickstart scenarios 2, 3 and 4.

- [X] T010 [US2] In `components/participant/participant-tabs.tsx`, on tab click set `active` and call `window.history.replaceState(window.history.state, "", \`#${TAB_FRAGMENTS[tab]}\`)` (keeps Next.js router state, adds no history entry, fires no `hashchange`, no scroll).
- [X] T011 [US2] In `components/participant/participant-tabs.tsx`, add keyboard handling on the tablist: Arrow Right and Left move to the next and previous tab with wrap, Home and End to first and last; each move activates the tab (same path as T010) and focuses its button. Focus moves only on key input.
- [X] T012 [US2] In `components/participant/participant-tabs.tsx`, on mount read `window.location.hash` through `resolveTab` with the available tabs from `panels` and set `active`; subscribe to `hashchange` with the same handler and clean up on unmount. Verify that a server action result (`revalidatePath`) keeps the active tab and form state (quickstart scenario 3, and saving the release form stays on Dokumente).

**Checkpoint**: quickstart scenarios 2 to 4 pass.

---

## Phase 5: User Story 3 · Aus einer Mail direkt beim Dokument landen (P2)

**Goal**: `#busticket`, `#schulbefreiung` and `#dokumente` open Dokumente, the first two scroll to their card.

**Independent Test**: quickstart scenarios 5 and 6.

- [X] T013 [US3] In `components/participant/participant-tabs.tsx`, when `resolveTab` returns `scrollTo`, after setting `active` scroll `document.getElementById(scrollTo)` into view on the next animation frame (`scrollIntoView({ block: "start" })`), only for mount and `hashchange`, never on click.
- [X] T014 [P] [US3] Change the scroll margin from `scroll-mt-6` to `scroll-mt-20` in `components/participant/bus-ticket-card.tsx` so the card is not covered by the sticky tab bar.
- [X] T015 [P] [US3] Change the scroll margin from `scroll-mt-6` to `scroll-mt-20` in `components/participant/school-release-form.tsx` for the same reason.

**Checkpoint**: quickstart scenarios 5 and 6 pass, including the arrival mail preview link from `/admin/mail`.

---

## Phase 6: User Story 4 · Offenen Betrag nie übersehen (P2)

**Goal**: A compact strip above the tabs for cancelled registrations and open payable amounts.

**Independent Test**: quickstart scenario 8.

- [X] T016 [US4] Add `StatusStrip` in `components/participant/participant-summary.tsx`, rendered between header and tabs. Cancelled (`view.status === "cancelled"`): one row card `rounded-card border border-border bg-surface px-4 py-3` with `copy.strip.cancelled` in danger tone, no button. Payable (`view.payState === "pay" && view.payHref`): `copy.strip.outstanding(formatCurrency(view.amounts.outstanding))` left, `ButtonLink size="sm"` with `copy.pay.button` right, wrapping to two lines on narrow screens without horizontal scroll. Otherwise render nothing.

**Checkpoint**: quickstart scenario 8 passes.

---

## Phase 7: Polish

- [X] T017 Check all new and changed files for dash punctuation in copy and comments.
- [X] T018 Run `npm run lint`, `npm test` and `npm run build` and report the output verbatim.
- [ ] T019 Run quickstart scenarios 1 to 12 in the browser at 375 px and 320 px (scenario 11 decides whether `detailsShort` is needed; remove it and the short label logic if „Meine Angaben“ fits at 320 px), plus the keyboard and Lighthouse checks (scenarios 9 and 12). Take a screenshot of the default view as proof.

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → US1 → US2 → US3. US4 only needs US1 (T009) and can run right after it.
- T003 blocks T005, T006 and T012. T004 blocks T009 and T016.
- T006, T007, T008, T010 to T013 all edit `participant-tabs.tsx` and run in sequence.

### Parallel opportunities

- T002, T004 and T005 (after T003) touch different files.
- T014 and T015 run in parallel with each other and with T013.
- T016 (US4, `participant-summary.tsx`) can run in parallel with T010 to T013 (US2, US3, `participant-tabs.tsx`).

## Implementation Strategy

- **MVP**: Phases 1 to 3 (US1). The page is already split, the default tab works and the fallback
  without JavaScript is in place.
- Then US2 (fragment sync, keyboard) and US3 (old mail links) before merging, because without US3
  links in already sent mails would open the wrong tab. US4 completes the release.
- Single branch, single commit series; no feature flag needed.
