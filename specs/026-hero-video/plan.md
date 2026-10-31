# Implementation Plan: Hero Video aus dem Summercamp Recap

**Branch**: `026-hero-video` | **Date**: 2026-10-31 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/026-hero-video/spec.md`

## Summary

The hero replaces the Unsplash mountain photo with a 14 second, muted, looping cut of 8 scenes
from the 2026 recap. A reproducible ffmpeg script builds a landscape and a portrait variant
(WebM VP9 and MP4 H.264 each) plus a poster from the first frame into `public/videos/`. The
server renders the poster as the LCP image and an empty `<video>`; a small client component
attaches a source only when motion is allowed and the visitor is not saving data, fades the video
in on `playing`, pauses it off screen and offers a pause control. Parallax and ken burns leave the
hero, the scrim gets slightly stronger, the headline no longer says „Bergen“, and all hero copy
moves into the messages module. The proxy matcher learns to skip video files. No schema, API or
admin change.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.4 (App Router)

**Primary Dependencies**: existing only: Tailwind CSS 4, `next/image`, Phosphor icons. Build time
tool: `ffmpeg` (local, not a runtime dependency, not in `package.json`).

**Storage**: static files in `public/videos/` (about 11 MB in total), served by Vercel's CDN

**Testing**: Vitest 4 (`tests/unit/hero-video.test.ts`) for the pure helpers; manual checks per
[quickstart.md](quickstart.md); Impeccable detector on the hero.

**Target Platform**: Vercel; current Chrome, Safari (iOS 15 and newer), Firefox, Edge.

**Project Type**: web application (Next.js full stack)

**Performance Goals**: LCP stays the poster image and rises at most 10 % (SC-003); video bytes
≤ 4 MB desktop, ≤ 2.5 MB mobile (SC-004); no video bytes under reduced motion or save data.

**Constraints**: no `src` on the video in server HTML; hero height, anchors and CTA logic
unchanged; source recording never committed; copy without dashes or hyphenated words.

**Scale/Scope**: one component rewritten, one new client component, one pure helper module, one
build script, one matcher line, copy additions.

## Constitution Check

*GATE: Must pass before Phase 0 research. Checked again after Phase 1 design.*

| Principle | Check | Result |
|-----------|-------|--------|
| I. Fixed stack | No new runtime dependency; ffmpeg is a local build tool for a one time asset, justified in research R3 | Pass |
| II. Server security boundary | Only public static files; no secret, no data read; proxy skips video files that contain nothing private | Pass |
| III. Strict scope | Same single landing page, hero visual only; AGENTS.md section 4 already lists the hero; no admin upload | Pass |
| IV. Single source of truth | No schema or form change | Pass |
| V. Language separation | New German copy (headline, lead, poster alt, pause labels) in `lib/marketing/messages.ts`; code and file names English | Pass |
| VI. Tolerant payment, hidden pricing | Not touched | Pass |
| VII. Simplicity, quality gates | Two pure helpers with unit tests; no player library; lint, test, build after implementation | Pass |
| Writing rules | Copy, docs and comments without dash punctuation or hyphenated words | Pass |
| UI workflow (`impeccable`, `tasteskill`) | Contract in [contracts/hero-ui.md](contracts/hero-ui.md); detector and a visual pass per scene after implementation | Pass |

Second check after Phase 1: unchanged, all pass. No complexity tracking needed.

## Existing code inspected

- `app/page.tsx`: renders `MountainHero` with `cta`, `showSchoolRelease`, `campYear`; `force-dynamic`.
- `components/marketing/mountain-hero.tsx`: server component, `ParallaxImage` with Unsplash URL,
  `kenBurns`, two scrims, inline German headline „Ein Sommer in den Bergen“, lead and „Mehr
  erfahren“, CSS `animate-rise` entrance (specs/024-landing-structure R2).
- `components/marketing/parallax-image.tsx`: client, motion `useScroll`; also used by
  `closing-cta.tsx` (stays).
- `app/globals.css`: `animate-rise`, `animate-ken-burns`, global reduced motion rule.
- `lib/marketing/messages.ts`: `marketingMessages.brand.heroTag` already says „Belgien“.
- `proxy.ts` matcher: excludes images, fonts, documents, but not `mp4` or `webm`.
- `next.config.ts`: remote image patterns for Unsplash (kept, closing CTA still uses a remote photo).
- `lib/legal/messages.ts`: Vercel hosting already covered in the privacy text.
- Next.js docs `01-app/02-guides/videos.md`: `muted` plus `playsInline` for autoplay, poster,
  reserved box, self hosting recommended for background videos.

## Decisions and assumptions

See [research.md](research.md): R1 hosting in `public/videos/`, R2 proxy matcher, R3 encoding
and variants, R4 client decides playback, R5 pause off screen, R6 pause control, R7 no parallax in
the hero, R8 legibility, R9 copy, R10 consent dependency.

**Headline (chosen by the owner on 2026-10-31)**: „Strand, Scheune, **Gemeinschaft**“ with the
amber accent on „Gemeinschaft“. It goes into the messages module.

## UI

- **Layout**: unchanged structure and height; media layer per
  [contracts/hero-ui.md](contracts/hero-ui.md). Pause control bottom right, scroll cue stays
  centered.
- **Typography**: unchanged scale (`text-5xl` to `lg:text-8xl`, `max-w-[16ch]`); new headline keeps
  one amber accent word.
- **Spacing**: unchanged; control `bottom-8 right-6 md:right-10`.
- **Colors**: existing tokens; bottom scrim `ink-950/80` to `/30`, amber tint removed.
- **Motion**: video fade in 400 ms; existing `animate-rise` on lead and buttons; no parallax, no
  ken burns; reduced motion shows the poster only.
- **States**: idle (poster), playing, paused by hand, autoplay rejected, load error, off screen.
- **Responsive**: portrait variant on phones, `object-cover` everywhere, control 44 px, no
  horizontal scroll from 320 px.

## Project Structure

### Documentation (this feature)

```text
specs/026-hero-video/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/hero-ui.md
├── checklists/requirements.md
└── tasks.md             # next: /speckit-tasks
```

### Source Code (repository root)

```text
scripts/build-hero-video.sh                    # NEW: cut list, encodes 4 variants and the poster, size check
public/videos/hero-2026-desktop.webm           # NEW (generated)
public/videos/hero-2026-desktop.mp4            # NEW (generated)
public/videos/hero-2026-mobile.webm            # NEW (generated)
public/videos/hero-2026-mobile.mp4             # NEW (generated)
public/videos/hero-2026-poster.jpg             # NEW (generated)
lib/marketing/hero-video.ts                    # NEW: shouldPlayHeroVideo, pickHeroVideoSource, file paths (pure)
lib/marketing/messages.ts                      # CHANGED: marketingMessages.hero (headline, lead, poster alt, pause labels)
components/marketing/hero-video.tsx            # NEW: client, video element, playback decision, observer, pause control
components/marketing/mountain-hero.tsx         # CHANGED: poster plus HeroVideo instead of ParallaxImage, scrims, copy from messages
proxy.ts                                       # CHANGED: matcher skips mp4 and webm
tests/unit/hero-video.test.ts                  # NEW
```

`mountain-hero.tsx` keeps its name and export to avoid touching `app/page.tsx`; renaming it is an
unrelated refactor.

**Structure Decision**: Existing single Next.js project; pure logic in `lib/marketing`,
presentation in `components/marketing`, generated assets in `public/videos`, the one time build
script in `scripts/`.

## Security requirements

- Only public static assets; no secret, no service role, no new route.
- The proxy skips `mp4` and `webm` the same way it already skips images; these files hold nothing
  private.
- Privacy text unchanged: no third party embed, the video comes from the own origin (Vercel).
- Consent for the people shown is confirmed by the owner before the public deploy (R10).

## Acceptance criteria

All acceptance scenarios of [spec.md](spec.md) US1 to US4, FR-001 to FR-013 and SC-001 to SC-007,
verified through [quickstart.md](quickstart.md).

## Checks to run

`scripts/build-hero-video.sh ~/Downloads/SC2026_Recap.MOV`, `npm run lint`, `npm test`,
`npm run build` (proxy and component change), the Impeccable detector
`node .agents/skills/impeccable/scripts/detect.mjs --json components/marketing/mountain-hero.tsx components/marketing/hero-video.tsx`,
then the browser passes of the quickstart on desktop, iPhone and Android.

## Manual test steps

See [quickstart.md](quickstart.md) steps 1 to 8.

## Complexity Tracking

None.
