---

description: "Task list for feature 024 landing structure"
---

# Tasks: Landingpage Aufbau, Gestaltung und Technik

**Input**: Design documents from `specs/024-landing-structure/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/landing-ui.md, quickstart.md

**Tests**: Unit tests for the three pure helpers named in data-model.md (`registrationCta`,
`formatCampDateRange`, `priceLine`). Everything else is checked manually via quickstart.md and
the Impeccable detector.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on unfinished tasks)
- All user facing copy is German, without dash punctuation or hyphenated words; code and comments
  are English only, also without dash punctuation.

---

## Phase 1: Setup

- [X] T001 Add the Archivo Black font file (SIL Open Font License, from the official Google Fonts repository) as `assets/fonts/ArchivoBlack-Regular.ttf`, plus `assets/fonts/OFL.txt` with the license text.
- [X] T002 [P] Create `lib/marketing/messages.ts` with the German copy of this feature: nav labels (Camp, Gut zu wissen, Schulbefreiung, Menü öffnen, Menü schließen), footer labels (plus „Packliste“), „Gut zu wissen“ heading and one line intro, block headings and copy for Anreise, Bezahlen, Packliste (moved from `arrival-community.tsx`, `payment-faq.tsx`, `packing-teaser.tsx`), the payment method list (`Karte`, `Apple Pay`, `Google Pay`, `PayPal`, `SEPA Lastschrift`, `Klarna`), youth group heading, text and group names (moved from `arrival-community.tsx`), share image alt text and fallback name „FCG Blankenheim Summercamp“.

## Phase 2: Foundational (blocks all stories)

- [X] T003 [P] Create `lib/register/registration-cta.ts` with pure `registrationCta(state, opensAt)` returning `{ label, shortLabel, href: "#anmelden" }` per research R5 table: open „Jetzt anmelden“ / „Anmelden“; countdown „Anmeldung ab <Tag>. <Monat>“ / „Ab <TT>.<MM>.“ in Europe/Berlin, without date „Anmeldung bald“ / „Anmeldung“; closed „Anmeldung geschlossen“ / „Anmeldung“; full „Ausgebucht“ / „Anmeldung“. Add the labels to `registerMessages.cta` in `lib/register/messages.ts`.
- [X] T004 [P] Create `tests/unit/registration-cta.test.ts` covering all four states, countdown with and without `opensAt`, an invalid date string, and a time near midnight UTC that falls on the next Berlin day.
- [X] T005 Create `lib/marketing/landing-state.ts` (`server-only`, wrapped in React `cache`) with `getLandingState()` returning `{ camp, registrationState, opensAt, cta, showSchoolRelease }` per data-model.md: reuse `getLandingCamp`, `getActiveRegistrationCount` (only when capacity is set, failures count as zero, same as `registration-section.tsx` today), `getRegistrationState`, and the release rule of `school-release-section.tsx` (camp exists, `endDate` not before `berlinDate(now)`, `getReleaseSettings` readable, `isReleaseActive`).
- [X] T006 [P] In `app/globals.css` raise `html { scroll-padding-top }` from `2rem` to `5.5rem` (research R8).

**Checkpoint**: helpers exist and are tested; no visible change yet.

---

## Phase 3: User Story 1 · Inhalte sind sofort sichtbar (P1) 🎯 MVP

**Goal**: every section, including the hero, is visible without JavaScript and under reduced motion.

**Independent Test**: quickstart steps 1 to 3.

- [X] T007 [US1] In `app/globals.css` add the `.reveal` rule: inside `@supports (animation-timeline: view())` and `@media (prefers-reduced-motion: no-preference)` animate from `opacity: 0; translate: 0 1.5rem` to visible with `animation-timeline: view()` and `animation-range: entry 0% entry 40%`, `animation-fill-mode: both`; no styles outside those conditions (research R1).
- [X] T008 [US1] Rewrite `components/marketing/reveal.tsx` as a server component: no `"use client"`, no observer, no state; renders `Tag` with `cn("reveal", className)`; drop the `delay` prop and remove every `delay={...}` at its call sites in `components/marketing/*`.
- [X] T009 [US1] In `app/globals.css` add keyframes `hero-rise` (from `opacity: 0; translate: 0 1.25rem`) and a `.hero-rise` utility with `animation: hero-rise 700ms var(--ease-out-expo) both` plus delay modifiers via `style={{ animationDelay }}`; add a CSS `scroll-cue` bob keyframe (research R2).
- [X] T010 [US1] Update `components/marketing/mountain-hero.tsx`: remove the motion variants and `motion.*` wrappers; the h1 renders without any entrance animation; eyebrow, lead, button row and scroll cue use `.hero-rise` with delays 0, 120, 240, 900 ms; scroll cue bob via CSS. Keep `ParallaxImage` and the scrims unchanged. If the file no longer needs client hooks, drop `"use client"` (the nav and parallax stay client components on their own).

**Checkpoint**: US1 testable on its own (quickstart 1 to 3).

---

## Phase 4: User Story 2 · Reihenfolge mit „Gut zu wissen“ (P1)

**Goal**: decision first order and one „Gut zu wissen“ section with open blocks.

**Independent Test**: quickstart steps 4 to 6.

- [X] T011 [P] [US2] Create `components/marketing/community-groups.tsx`: full width photo band with the youth group heading, text and group tags from `lib/marketing/messages.ts` (photo, scrims and tag style taken from the right tile of `arrival-community.tsx`, without the hover zoom).
- [X] T012 [P] [US2] Create `components/marketing/good-to-know-blocks.tsx` with server components `ArrivalBlock` (`id="anreise"`, check in, meeting point, carpool rows from `arrival-community.tsx`, rows stack on phones), `PaymentBlock` (`id="bezahlen"`, short copy plus method tags), `PackingBlock` (`id="packliste"`, featured items from `featuredPackingItems()` as quiet tags without hover, `ButtonLink` „Zur vollständigen Packliste“ to `/packzettel`) and `SchoolReleaseBlock` (`id="schulbefreiung"`, eyebrow icon, heading, intro with `formatReleaseDates`, the `how` text and the existing `SchoolReleaseLinkForm`, copy still from `releaseMessages.landing`). Each block: `h3` at `text-2xl`, surface with border, padding `p-6 md:p-8`, no wide shadow, no nested card.
- [X] T013 [US2] Create `components/marketing/good-to-know.tsx` (server): `section id="gut-zu-wissen"` with heading (`max-w-[18ch] text-balance`) and intro line, grid `md:grid-cols-2 gap-4` with Arrival, Payment, Packing and, when `getLandingState().showSchoolRelease` and settings are available, SchoolRelease; no empty cell when the release block is missing (let the packing block span both columns or keep an even count).
- [X] T014 [US2] Update `app/page.tsx` to the order of contracts/landing-ui.md: `MountainHero`, `IntroFacts`, `ProgramHighlights`, `CommunityGroups`, `ClosingCta`, `RegistrationSection`, `GoodToKnow`, `SiteFooter`.
- [X] T015 [US2] Delete `components/marketing/arrival-community.tsx`, `payment-faq.tsx`, `packing-teaser.tsx` and `school-release-section.tsx`; fix any remaining import (search `app/` and `components/`).

**Checkpoint**: US2 testable on its own (quickstart 4 to 6).

---

## Phase 5: User Story 3 · Navigation passt zur Seite (P2)

**Goal**: nav and footer show exactly the page's targets, CTA as a button, clean mobile menu.

**Independent Test**: quickstart step 7.

- [X] T016 [US3] Update `components/marketing/site-nav.tsx`: props `cta?: { label: string; href: string }` and `showSchoolRelease?: boolean` (defaults: CTA „Anmelden“ to `/#anmelden`, no release item); brand becomes `<a href="#start">`; text links Camp, Gut zu wissen, conditional Schulbefreiung; CTA as `ButtonLink size="sm"` on the right (desktop) and as last full width button in the mobile menu; mobile menu closes on Esc (`keydown` listener while open), on tap of a transparent fixed backdrop and on `hashchange`; labels from `lib/marketing/messages.ts`; `aria-label` toggles between open and close text.
- [X] T017 [US3] Pass `{ label: state.cta.shortLabel, href: state.cta.href }` as `cta` and `showSchoolRelease` from `app/page.tsx` through `MountainHero` props into `SiteNav` in `components/marketing/mountain-hero.tsx`.
- [X] T018 [P] [US3] Update `components/marketing/site-footer.tsx`: optional prop `showSchoolRelease` (default false); links Camp (`/#camp`), Gut zu wissen (`/#gut-zu-wissen`), Schulbefreiung (conditional, `/#schulbefreiung`), Anmelden (`/#anmelden`), Packliste (`/packzettel`); labels from `lib/marketing/messages.ts`. `app/page.tsx` passes the flag; `app/packzettel/page.tsx` and `components/payment/payment-shell.tsx` keep the default.

**Checkpoint**: US3 testable (quickstart 7).

---

## Phase 6: User Story 6 · Ehrliche Buttons und Preis an der Anmeldung (P2)

**Goal**: CTA labels follow the registration state; public price line at the registration.

**Independent Test**: quickstart steps 8 and 9.

- [X] T019 [US6] Pass `cta` from `getLandingState()` into the hero primary button in `components/marketing/mountain-hero.tsx` (label `cta.label`, href `cta.href`) and into `components/marketing/closing-cta.tsx` (make it accept a `cta` prop instead of the fixed „Zur Anmeldung“).
- [X] T020 [US6] In `lib/register/messages.ts` add a countdown heading builder: „Die Anmeldung öffnet am <Tag>. <Monat>“ when the opening date is known, else the current „Die Anmeldung öffnet in Kürze“; use it in `components/marketing/registration-section.tsx`.
- [X] T021 [P] [US6] Add pure `priceLine(basePrice)` to `lib/marketing/messages.ts` (or a small `lib/marketing/price-line.ts` if the messages module should stay data only): „<Preis> inklusive Übernachtung und Verpflegung · Bezahlen per Karte, PayPal, SEPA Lastschrift und mehr“ with `formatCurrency`.
- [X] T022 [P] [US6] Create `tests/unit/landing-price-line.test.ts`: whole and non whole euro amounts, German currency formatting, no dash characters in the output.
- [X] T023 [US6] Update `components/marketing/registration-section.tsx`: read `camp`, `registrationState` from `getLandingState()` instead of its own loading; render the price line under the intro in every state when a camp exists, using only `camp.basePrice` (never the invitation tier); keep form, countdown, closed and full rendering unchanged.

**Checkpoint**: US6 testable (quickstart 8 and 9).

---

## Phase 7: User Story 4 · Vorschaubild beim Teilen (P2)

**Goal**: link previews show an image with camp name and dates.

**Independent Test**: quickstart steps 12 and 13.

- [X] T024 [P] [US4] Create `lib/marketing/camp-dates.ts` with pure `formatCampDateRange(start, end)` per data-model.md (same month „24. bis 28. Mai 2027“, different months „30. Mai bis 2. Juni 2027“, different years „28. Dezember 2026 bis 3. Januar 2027“, equal dates single date, missing start `null`, missing end only the start date), using German month names and date only strings (no time zone shift).
- [X] T025 [P] [US4] Create `tests/unit/camp-dates.test.ts` covering every case above.
- [X] T026 [US4] Create `app/opengraph-image.tsx`: `alt` from `lib/marketing/messages.ts`, `size = { width: 1200, height: 630 }`, `contentType = "image/png"`, `revalidate = 3600`; reads `getLandingCamp()`; renders with `ImageResponse` from `next/og` a sand background, amber accent bar, eyebrow „Summercamp“, camp name (or fallback) in Archivo Black loaded with `readFile(join(process.cwd(), "assets/fonts/ArchivoBlack-Regular.ttf"))`, and the date range when available; long names wrap within the canvas; no price.
- [X] T027 [US4] Extend `metadata` in `app/page.tsx`: `metadataBase` from `appBaseUrl()` (`lib/email/links.ts`) when set, `openGraph: { title, description, locale: "de_DE", type: "website", siteName: "FCG Blankenheim Summercamp" }`, `twitter: { card: "summary_large_image" }`. Convert to `generateMetadata` only if `metadataBase` cannot be computed statically.

**Checkpoint**: US4 testable (quickstart 12 and 13).

---

## Phase 8: User Story 5 · Feinschliff der Gestaltung (P2)

**Goal**: balanced headings, nothing clipped on phones, no fake hover.

**Independent Test**: quickstart steps 10 and 11.

- [X] T028 [P] [US5] `components/marketing/closing-cta.tsx`: move the measure from the `Reveal` wrapper to the `h2` as `max-w-[16ch] text-balance mx-auto` (research R3).
- [X] T029 [P] [US5] `components/marketing/program-highlights.tsx`: move `max-w-[24ch]` from the wrapper to the `h2` as `max-w-[18ch] text-balance`; remove `hover:-translate-y-1`, the icon `group-hover:scale-105` and the image `group-hover:scale-[1.06]`.
- [X] T030 [P] [US5] `components/marketing/intro-facts.tsx`: below `sm` stack each fact row (icon and value, then the note left aligned under it); from `sm` keep today's row with the right aligned note; verify nothing clips at 375 px.

**Checkpoint**: US5 testable (quickstart 10 and 11).

---

## Phase 9: Polish and cross cutting

- [X] T031 [P] Update `AGENTS.md` section 4 Public: landing page order with „Gut zu wissen“ and the generated share image (specs/024-landing-structure).
- [X] T032 Run `npm run lint`, `npm test`, `npm run build` and report the output verbatim.
- [X] T033 Run `node .agents/skills/impeccable/scripts/detect.mjs --json app/page.tsx components/marketing` once and fix true positives.
- [X] T034 One browser pass on desktop (1280 and 1440) and mobile (375) through quickstart.md steps 1 to 13, fix all findings in one batch, confirm with at most one more pass.

---

## Dependencies and execution order

- Phase 1 and 2 first (T002 before T016, T018; T003 before T017, T019; T005 before T013, T017, T019, T023).
- US1 (Phase 3) and US2 (Phase 4) are independent of each other and form the MVP.
- US3 depends on US2 for the `#gut-zu-wissen` target and on T003 for the CTA.
- US6 depends on T003 and T005; T019 touches `mountain-hero.tsx` after T010 and T017.
- US4 is independent of all other stories (only T002 for the alt text).
- US5 tasks are independent; T028 should run after T019 because both edit `closing-cta.tsx`.
- Polish last.

## Parallel examples

- Phase 2: T003, T004, T006 together; then T005.
- US2: T011 and T012 together, then T013, T014, T015.
- US4: T024 and T025 together, then T026 and T027.
- US5: T029 and T030 together (different files).

## Implementation strategy

1. MVP: Phases 1 to 4 (content always visible, new order). Check quickstart 1 to 6.
2. Then US3 and US6 (nav, honest CTAs, price line).
3. Then US4 (share image) and US5 (polish).
4. Polish phase with checks, detector and one browser pass.
