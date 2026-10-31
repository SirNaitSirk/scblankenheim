---

description: "Task list for feature 026 hero video"
---

# Tasks: Hero Video aus dem Summercamp Recap

**Input**: Design documents from `specs/026-hero-video/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/hero-ui.md, quickstart.md

**Tests**: Unit tests for the two pure helpers named in data-model.md (`shouldPlayHeroVideo`,
`pickHeroVideoSource`). Everything else is checked manually via quickstart.md and the Impeccable
detector.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on unfinished tasks)
- All user facing copy is German, without dash punctuation or hyphenated words; code and comments
  are English only, also without dash punctuation.

---

## Phase 1: Setup

- [X] T001 Create `scripts/build-hero-video.sh` (bash, `set -euo pipefail`, executable) taking the source path as the only argument. It holds the cut list of data-model.md verbatim (39.0 to 41.7, 127.6 to 130.5, 126.15 to 127.45, 171.95 to 173.45, 65.45 to 66.75, 84.4 to 85.6, 173.55 to 174.9, 177.85 to 179.4 seconds) and cuts with the `trim` filter on the decoded timeline (not input seeking), then `concat`. It writes into `public/videos/`: `hero-2026-desktop.webm` (1920×1080, 30 fps, VP9 two pass), `hero-2026-desktop.mp4` (1920×1080, H.264 High, `yuv420p`, `+faststart`), `hero-2026-mobile.webm` and `hero-2026-mobile.mp4` (center crop to 9:16, scaled to 720×1280), all with `-an`; and `hero-2026-poster.jpg` (first frame of the desktop cut, 1920×1080, JPEG quality about 80). It prints every file size and exits non zero if a desktop video exceeds 4 MB, a mobile video 2.5 MB or the poster 250 kB (research R3). Comment at the top: how to rerun it for a new camp year.
- [X] T002 Run `scripts/build-hero-video.sh ~/Downloads/SC2026_Recap.MOV`; tune CRF or bitrate in the script until all size limits pass (fall back to 1600×900 for desktop only if 1080p cannot meet 4 MB). Watch each output once: 8 scenes in order, no group photo, no logo, no black frame, no audio track (`ffprobe` shows one video stream only). Commit only the five generated files, never the source.
- [X] T003 [P] In `lib/marketing/messages.ts` add `marketingMessages.hero` with: `eyebrow` „FCG Blankenheim Summercamp“, `headlineLead` „Strand, Scheune,“ and `headlineAccent` „Gemeinschaft“, `lead` „Eine Woche Gemeinschaft, Abenteuer und Glaube an der belgischen Küste. Sichere dir jetzt deinen Platz beim Summercamp.“, `more` „Mehr erfahren“, `scrollCue` „Weiter zum Camp“, `posterAlt` „Szenen vom letzten Summercamp: Spiele vor den Bussen, Volleyball, Saltos am Strand und in den Dünen, Worship und Party in der Scheune.“, `pauseVideo` „Video anhalten“, `playVideo` „Video abspielen“ (research R6, R9).

## Phase 2: Foundational (blocks all stories)

- [X] T004 [P] Create `lib/marketing/hero-video.ts` (pure, isomorphic) with the type `HeroVideoEnvironment` `{ reducedMotion: boolean; saveData: boolean; effectiveType: string | null; portrait: boolean; canPlayWebm: boolean }`, the constants for the five file paths under `/videos/`, `HERO_POSTER_SRC`, `shouldPlayHeroVideo(env)` (false if `reducedMotion`, `saveData`, or `effectiveType` is `slow-2g` or `2g`; true otherwise) and `pickHeroVideoSource(env)` returning `{ src, type: "video/webm" | "video/mp4" }` (mobile variant when `portrait`, WebM when `canPlayWebm`) per data-model.md.
- [X] T005 [P] Create `tests/unit/hero-video.test.ts` covering: plays by default; each blocker alone stops playback; `3g` and `4g` and `null` effective type play; all four combinations of `portrait` and `canPlayWebm` map to the right file and type.
- [X] T006 [P] In `proxy.ts` extend the matcher exclusion list with `mp4|webm` so video files skip Clerk and the coming soon gate (research R2).

**Checkpoint**: assets, copy and helpers exist and are tested; no visible change yet.

---

## Phase 3: User Story 1 · Echte Campstimmung beim ersten Blick (P1) 🎯 MVP

**Goal**: the hero plays the cut muted, inline and in a loop, text stays legible.

**Independent Test**: quickstart step 3 and the iPhone and Android part of step 4.

- [X] T007 [US1] Create `components/marketing/hero-video.tsx` (`"use client"`): renders `<video>` with `className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-[400ms]"`, `muted`, `playsInline`, `loop`, `preload="none"`, `aria-hidden`, `tabIndex={-1}` and no `src` on the server. In an effect it builds `HeroVideoEnvironment` from `matchMedia('(prefers-reduced-motion: reduce)')`, `navigator.connection?.saveData` and `effectiveType` (typed via a narrow local interface, no `any`), `matchMedia('(orientation: portrait), (max-width: 767px)')` and `video.canPlayType('video/webm; codecs="vp9"')`; if `shouldPlayHeroVideo` is true it sets `src` from `pickHeroVideoSource`, calls `load()` and `play()`. On the `playing` event it switches to `opacity-100`. Player state `idle | playing | paused` per data-model.md.
- [X] T008 [US1] Update `components/marketing/mountain-hero.tsx` per contracts/hero-ui.md: remove `ParallaxImage` and the Unsplash `HERO_PHOTO`; add the poster as `next/image` with `src={HERO_POSTER_SRC}`, `fill`, `priority`, `sizes="100vw"`, `className="object-cover"`; render `<HeroVideo />` above it; scrims: bottom `bg-gradient-to-t from-ink-950/80 via-ink-950/30 to-transparent`, diagonal `bg-gradient-to-br from-ink-950/45 via-transparent to-transparent` (amber tint removed, research R8); eyebrow, lead, „Mehr erfahren“ and scroll cue label from `marketingMessages.hero`. Keep section height, `SiteNav`, CTA, anchors and `animate-rise` delays unchanged; keep the component a server component.

**Checkpoint**: US1 testable on its own.

---

## Phase 4: User Story 2 · Schnelle Seite trotz Video (P1)

**Goal**: poster first, no video bytes when they would hurt, no broken state on errors.

**Independent Test**: quickstart steps 3 (network panel), 4 (Slow 3G, Data Saver, JavaScript off) and 6.

- [X] T009 [US2] In `components/marketing/hero-video.tsx` handle failure: on the `error` event and on a rejected `play()` that is not an autoplay block, stay `idle`, keep the video at `opacity-0` and remove the `src` so no further range requests run; the poster stays.
- [X] T010 [US2] In `components/marketing/hero-video.tsx` add an `IntersectionObserver` on the video: pause when less than 10 % is visible, resume when visible again unless the state is `paused` by hand (research R5); disconnect on unmount.
- [X] T011 [US2] Verify in the browser with JavaScript disabled and with save data emulated that the network panel shows no request to `/videos/hero-2026-*` (FR-005, SC-006), and that the LCP element in Lighthouse is the poster image.

**Checkpoint**: US1 and US2 work together; page weight checked.

---

## Phase 5: User Story 3 · Bewegung abschalten können (P2)

**Goal**: reduced motion shows the poster only; a pause control stops the video.

**Independent Test**: quickstart step 4 (reduced motion) and step 3 (pause control, keyboard).

- [X] T012 [US3] In `components/marketing/hero-video.tsx` add the pause control per the table in contracts/hero-ui.md: a `<button type="button">` rendered only when the state is `playing` or `paused` (including autoplay rejected, which sets `paused`), `absolute bottom-8 right-6 md:right-10 z-10 flex h-11 w-11 items-center justify-center rounded-pill bg-ink-950/40 text-on-inverse/80 backdrop-blur-sm transition-colors hover:text-on-inverse` with the same focus ring classes as the hero buttons, Phosphor `Pause` or `Play` (`weight="fill"`, size 18), `aria-label` from `marketingMessages.hero.pauseVideo` or `playVideo`, `aria-pressed={state === "paused"}`. Clicking toggles `pause()` and `play()`.
- [X] T013 [US3] Place `<HeroVideo />` in `components/marketing/mountain-hero.tsx` so the pause button follows the hero buttons and precedes the scroll cue in tab order (SC-007); render the button through the same component, positioned absolutely, and check below `sm` that it does not overlap the centered scroll cue.
- [X] T014 [US3] Listen to `change` on the reduced motion media query in `components/marketing/hero-video.tsx`: switching it on while playing pauses the video and hides the control; switching it off does not auto start (a reload starts it).

**Checkpoint**: US3 testable on its own (motion off, keyboard only).

---

## Phase 6: User Story 4 · Überschrift passt zum Ort (P2)

**Goal**: headline and description match the camp in Belgium.

**Independent Test**: look at the hero and read it with VoiceOver.

- [X] T015 [US4] In `components/marketing/mountain-hero.tsx` render the h1 from `marketingMessages.hero.headlineLead` and `headlineAccent` („Strand, Scheune, **Gemeinschaft**“) with the accent word in `text-amber-300`, keep the h1 classes and `max-w-[16ch]`; set the poster `alt` to `marketingMessages.hero.posterAlt`. Check that „Gemeinschaft“ does not break inside the word at 320 px and that the line count looks balanced at 1440 px (add `text-balance` if needed).

**Checkpoint**: all stories complete.

---

## Phase 7: Polish and cross cutting

- [X] T016 [P] Remove the now unused Unsplash comment and `TODO` from `components/marketing/mountain-hero.tsx`; keep `next.config.ts` remote patterns (closing CTA still uses them).
- [X] T017 [P] Update AGENTS.md section 4 landing bullet: the hero shows a muted looping video of the last camp with a poster, reduced motion and save data show the poster only, pause control; reference specs/026-hero-video.
- [X] T018 Run `node .agents/skills/impeccable/scripts/detect.mjs --json components/marketing/mountain-hero.tsx components/marketing/hero-video.tsx` and fix findings that belong to this change.
- [X] T019 Contrast pass (quickstart step 5): pause on each of the 8 scenes at 1440 px and 375 px, sample the brightest area behind headline and lead; if any scene misses SC-005, strengthen the bottom scrim in `components/marketing/mountain-hero.tsx` and recheck.
- [X] T020 Run `npm run lint`, `npm test`, `npm run build` and report the output verbatim.
- [ ] T021 Run quickstart steps 3, 4, 6 and 7 (desktop, phones, Lighthouse against the baseline, coming soon gate) and record the results in the final report.
- [ ] T022 Before the public deploy: ask the owner to confirm consent for publishing the people shown (research R10). Do not deploy before the answer.

---

## Dependencies

- T001 → T002 (script before assets). T003, T004, T005, T006 are independent of each other.
- Phase 2 and T002 block all story phases (paths and assets must exist).
- US1 (T007, T008) → US2 (T009 to T011) → US3 (T012 to T014): all touch `hero-video.tsx`, so they
  run in order.
- US4 (T015) needs T003 and T008, independent of US2 and US3.
- Polish after all stories; T022 is the last step before deploy.

## Parallel examples

- After T001: T002 runs (long encode) while T003, T004, T005 and T006 are written.
- After T008: T015 (US4) can run in parallel with T009 to T014 (different file sections, but the
  same file `mountain-hero.tsx` is only touched again in T013, so do T015 before or after T013).
- T016 and T017 in parallel.

## Implementation strategy

1. MVP: Phase 1, Phase 2, US1 → the video plays with poster; review with the owner.
2. Add US2 (robust loading) and US3 (pause, reduced motion): required before go live for
   performance and accessibility.
3. Add US4 (headline) and polish, then checks and consent confirmation, then deploy.
