# Tasks: Landingpage Review Fixes (Countdown, Rückversicherung, Schulbefreiung)

**Input**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[contracts/landing-ui.md](contracts/landing-ui.md)

**Tests**: unit tests for the pure countdown helper and the short label (research R1, R5); no
component tests.

## Phase 1: Setup

None. No dependency, no migration.

## Phase 2: Foundational

None. The three stories touch separate files apart from the two message modules, which each
story edits in its own block.

## Phase 3: User Story 1 · Ruhiger Countdown (P1)

**Goal**: date led countdown without seconds, no live announcements, readable nav label.
**Independent test**: quickstart steps 1 to 3.

- [X] T001 [P] [US1] Create `lib/register/countdown.ts`: `countdownRemaining(targetMs, nowMs)`
  returning `{ kind: "days"; value }` for 24 h or more (floored), `{ kind: "hours"; value }` from 1 h
  to under 24 h (floored), `{ kind: "underHour" }` below 1 h, `null` at or after the target; plus
  `formatOpeningDate(date)` („Samstag, 1. Februar 2027“) and `formatOpeningTime(date)` („18:00“),
  both with `timeZone: "Europe/Berlin"` (research R1, R4).
- [X] T002 [P] [US1] Create `tests/unit/countdown.test.ts`: 90 days, exactly 24 h, 23 h 59 min,
  1 h, 59 min, 0 and negative; date and time formatting for a winter and a summer instant in Berlin.
- [X] T003 [US1] `lib/register/messages.ts`: replace `countdown.reopenHint` and `countdown.units`
  with `opensAtTime(time)` → „ab {time} Uhr“, `remainingDays(n)` → „Noch 1 Tag“ / „Noch {n} Tage“,
  `remainingHours(n)` → „Noch 1 Stunde“ / „Noch {n} Stunden“, `remainingUnderHour` → „In weniger
  als einer Stunde“; change `cta.countdownShort` to `Anmeldung ab ${numeric}`.
- [X] T004 [US1] `lib/register/registration-cta.ts`: `dayMonthNumeric` with `day: "numeric",
  month: "numeric"` so the short label reads „Anmeldung ab 1.2.“ (research R5); update
  `tests/unit/registration-cta.test.ts` expectations to „Anmeldung ab 30.11.“.
- [X] T005 [US1] Rewrite `components/marketing/countdown-panel.tsx` per contracts/landing-ui.md:
  one card without `shadow-card`, date line in display font, „ab HH:MM Uhr“, remaining line from
  `countdownRemaining` after hydration only; ticker interval 30 s with snapshot quantized to 30 s;
  one shot `setTimeout` to the target when it lies within 24 h; remove `aria-live`; keep the
  reached notice and the single `router.refresh()` (research R2, R3).

## Phase 4: User Story 2 · Rückversicherung (P1)

**Goal**: reassurance before „Verbindlich anmelden“, honest payment copy, copyable reference.
**Independent test**: quickstart steps 4 to 6.

- [X] T006 [US2] `lib/register/messages.ts`: add `steps.reassurance` with `title` „So geht es
  weiter“, `items` (three lines from research R6), `contactLead` „Falls du doch nicht kannst,
  schreib uns an“ and `contactEmail` „info@fcg-blankenheim.de“; change `form.successBody` and
  `form.successFree` to texts without the number; add `form.referenceLabel` „Referenznummer“,
  `form.referenceMailHint` „Du findest sie auch in deiner Bestätigungsmail.“, `form.copy`
  „Kopieren“, `form.copied` „Kopiert“, `form.copyFailed` „Kopieren nicht möglich“. No deadlines,
  fees or refund promises (FR-007).
- [X] T007 [P] [US2] Create `components/marketing/registration-reassurance.tsx`: static block on
  `bg-sand-50` with title, three lines with check icons (`@phosphor-icons/react`), contact line with
  `mailto:` link, using `registerMessages.steps.reassurance`.
- [X] T008 [P] [US2] Create `components/marketing/copy-reference.tsx` (client): shows label, the
  reference in tabular selectable text and an outline small button; `navigator.clipboard.writeText`
  in try/catch; button text „Kopiert“ for 2 s or failure text; visually hidden `role="status"`
  announces the outcome (research R7).
- [X] T009 [US2] `components/marketing/registration-form.tsx`: render `RegistrationReassurance`
  on the review step between the server error and the action row; in the success `Notice` render
  `CopyReference` plus the mail hint for paid and free views, keeping „Jetzt bezahlen“ and „Noch
  jemanden anmelden“.
- [X] T010 [P] [US2] `lib/marketing/messages.ts`: `goodToKnow.payment.text` as in
  contracts/landing-ui.md (paying later via the personal link from the confirmation mail).

## Phase 5: User Story 3 · Schulbefreiung tritt zurück (P1)

**Goal**: no nav entry, block and footer link only with ≥ 1 active registration, quiet button.
**Independent test**: quickstart step 7.

- [X] T011 [US3] `lib/marketing/landing-state.ts`: `loadSchoolRelease` returns `null` unless
  `getActiveRegistrationCount(camp.id)` is greater than 0 (errors count as hidden); reuse one count
  for capacity and release so the request makes at most one count query (research R8).
- [X] T012 [P] [US3] `components/marketing/site-nav.tsx`: remove the school release item and the
  `showSchoolRelease` prop; update the doc comment.
- [X] T013 [US3] `components/marketing/mountain-hero.tsx` and `app/design-system/page.tsx`: stop
  passing `showSchoolRelease` to `SiteNav` (hero keeps the prop only if still needed elsewhere,
  otherwise remove it and its pass in `app/page.tsx`).
- [X] T014 [P] [US3] `components/marketing/school-release-link-form.tsx`: submit button
  `variant="outline"`.

## Phase 6: Polish

- [X] T015 Check every new string for dash punctuation and hyphenated words.
- [X] T016 Run `npm run lint`, `npm test`, `npm run build`; report output verbatim.
- [X] T017 Browser check per quickstart.md at desktop and 375 px; run the Impeccable detector on
  `components/marketing`.
- [X] T018 AGENTS.md section 4: note under Public that the school release section and footer link
  need at least one active registration (specs/031-landing-review-fixes).

## Dependencies

- US1, US2, US3 are independent. Inside US1: T001 before T005, T003 before T004 and T005.
  Inside US2: T006 before T007, T008, T009. Inside US3: T011 alone; T012 before T013.
- T003 and T006 both edit `lib/register/messages.ts`: run them one after the other.
- Polish after all stories.

## Parallel examples

- US1: T001 and T002 together, then T003 to T005.
- US2: after T006, T007, T008 and T010 together, then T009.
- US3: T011, T012 and T014 together, then T013.

## Implementation strategy

All three stories are P1 and small; implement in order US1, US2, US3 in one pass, then polish.
MVP would be US1 alone (fixes the accessibility bug).
