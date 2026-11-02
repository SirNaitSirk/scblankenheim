# Tasks: Landingpage Polish

**Input**: [plan.md](plan.md), [spec.md](spec.md)

## Phase 1: User Story 1 · Erster Blick (P1)

- [X] T001 [US1] `app/page.tsx`: compute `formatCampDateRange(camp?.startDate, camp?.endDate)` and
  pass it as `dateRange` to `MountainHero`; adjust `app/design-system/page.tsx`.
- [X] T002 [US1] `components/marketing/mountain-hero.tsx`: eyebrow shows `dateRange ?? copy.eyebrow`;
  remove the vertical tag and the `campYear` prop if unused; remove `brand.heroTag` from
  `lib/marketing/messages.ts` when nothing else uses it.

## Phase 2: User Story 2 · Texte (P2)

- [X] T003 [US2] `lib/marketing/messages.ts`: add `intro` (heading lead and accent, lead text, fact
  labels and notes with „Übernachtung und Verpflegung inklusive“, „Termin folgt“) and `program`
  (heading, three tiles; sport title „Sport, Lagerfeuer und Geländespiel bei Nacht“). Wording
  otherwise identical.
- [X] T004 [P] [US2] `components/marketing/intro-facts.tsx`: read all copy from `marketingMessages.intro`.
- [X] T005 [P] [US2] `components/marketing/program-highlights.tsx`: read all copy from
  `marketingMessages.program`.
- [X] T006 [P] [US2] `components/marketing/closing-cta.tsx`: mailto from
  `registerMessages.section.contactHref`.

## Phase 3: User Story 3 · Details (P2)

- [X] T007 [P] [US3] `components/marketing/good-to-know-blocks.tsx`: payment methods as one muted line
  joined with „ · “ instead of chips.
- [X] T008 [US3] `components/marketing/intro-facts.tsx`: drop `shadow-warm` on the facts card.
- [X] T009 [P] [US3] `components/marketing/site-footer.tsx`: links `inline-flex min-h-11 items-center
  md:min-h-0`, gaps adjusted.

## Phase 4: Polish

- [X] T010 Scan visible landing copy for hyphenated words and „&“.
- [X] T011 `npm run lint`, `npm test`, `npm run build`; report verbatim.
- [X] T012 Browser at desktop and 375px, detector CLI and browser overlay once; fix findings in one
  batch.

## Dependencies

T003 before T004 and T005; T004 before T008 (same file). Everything else independent.
