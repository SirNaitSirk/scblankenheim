# Tasks: Jugendgruppen hell, Lagerfeuer als einziger dunkler Moment

**Input**: [plan.md](plan.md), [spec.md](spec.md), [contracts/community-ui.md](contracts/community-ui.md)

## Phase 1: Setup

- [X] T001 `scripts/build-camp-photos.sh`: add `teamwork:IMG_3265.JPG` and `beach:IMG_3450.JPG`,
  remove `community:IMG_3491.JPG`; run it; delete `public/images/camp/2026-community.jpg`.

## Phase 2: Foundational

- [X] T002 `lib/marketing/camp-photos.ts`: keys `teamwork` and `beach` with focus classes, remove
  `community`.
- [X] T003 `lib/marketing/messages.ts`: `community.eyebrow`, alt texts `photos.teamwork` and
  `photos.beach` (remove `photos.community`), new `closing` block with `heading` and `questions`.

## Phase 3: User Story 1 · Wer dabei ist (P1)

- [X] T004 [US1] Rewrite `components/marketing/community-groups.tsx` per contracts/community-ui.md.

## Phase 4: User Story 2 · Lagerfeuer (P2)

- [X] T005 [US2] `components/marketing/closing-cta.tsx`: heading and second button label from
  `marketingMessages.closing`.

## Phase 5: Polish

- [X] T006 Note the photo change in `specs/027-camp-photos/data-model.md` (community replaced by
  teamwork and beach, see specs/028).
- [X] T007 Browser check per quickstart.md at 1440, 375 and 320 px; Impeccable detector on both
  components.
- [X] T008 Run `npm run lint`, `npm test`, `npm run build` and report the output.

## Dependencies

T001 → T002 → T003 → T004, T005 → T006 to T008.
