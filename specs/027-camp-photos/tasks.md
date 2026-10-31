# Tasks: Echte Campfotos auf der Landingpage

**Input**: Design documents from `specs/027-camp-photos/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/landing-photos-ui.md](contracts/landing-photos-ui.md)

## Phase 1: Setup

- [X] T001 Create `scripts/build-camp-photos.sh` per data-model.md and research R2: takes the folder
  of originals, maps the five source files to `public/images/camp/2026-<key>.jpg`, scales the long
  edge to 2400 px with EXIF rotation, strips metadata, fails when a file exceeds 600 KB.
- [X] T002 Run the script on the unzipped 2026 photos and commit the five generated JPGs.

## Phase 2: Foundational

- [X] T003 Create `lib/marketing/camp-photos.ts` with `CAMP_PHOTOS` (keys `worship`, `inputs`,
  `sport`, `community`, `campfire`; `src` and `focusClass` per research R4).
- [X] T004 Add `photos` alt texts to `lib/marketing/messages.ts` and move `community.photoAlt` there.

## Phase 3: User Story 1 · Echte Fotos statt Stockfotos (P1)

- [X] T005 [US1] `components/marketing/program-highlights.tsx`: worship tile uses `CAMP_PHOTOS.worship`
  and its alt text; remove `WORSHIP_PHOTO` and the `TODO`.
- [X] T006 [P] [US1] `components/marketing/community-groups.tsx`: band uses `CAMP_PHOTOS.community`;
  remove `COMMUNITY_PHOTO` and the `TODO`.
- [X] T007 [P] [US1] `components/marketing/closing-cta.tsx`: `ParallaxImage` uses
  `CAMP_PHOTOS.campfire` with its focus point via `imageClassName`; remove `CAMPFIRE_PHOTO` and the
  `TODO`.
- [X] T008 [US1] `next.config.ts`: remove the picsum and Unsplash remote patterns and the `TODO`.

## Phase 4: User Story 2 · Programmkacheln mit Fotos (P2)

- [X] T009 [US2] `components/marketing/program-highlights.tsx`: inputs and sport tiles become photo
  tiles per contracts/landing-photos-ui.md (photo, scrim, `on-inverse` text, icon chip, amber tint on
  the sport tile, `min-h-[18rem]`).

## Phase 5: Polish

- [X] T010 Update the landing line in `AGENTS.md` section 4: photos below the hero are real camp
  photos without recognizable people, built by `scripts/build-camp-photos.sh` (specs/027-camp-photos).
- [X] T011 Browser check per quickstart.md, including the campfire faces check (research R5) at
  1440 px and 375 px, network tab without foreign image hosts, reduced motion.
- [X] T012 Run `npm run lint`, `npm test`, `npm run build` and report the output.

## Dependencies

T001 → T002 → T003 → T005 to T009. T006 and T007 can run in parallel. T008 after T005 to T007.
T010 to T012 last.
