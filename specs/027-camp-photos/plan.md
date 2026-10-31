# Implementation Plan: Echte Campfotos auf der Landingpage

**Branch**: `027-camp-photos` | **Date**: 2026-10-31 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/027-camp-photos/spec.md`

## Summary

Five photos from Summercamp 2026 replace the three Unsplash placeholders and give the two plain
program tiles a picture. A reproducible ffmpeg script reads the original JPGs, applies the camera
rotation, scales the long edge to 2400 px, strips all metadata and writes them to
`public/images/camp/`. Paths and focus points live in one small module, German alt texts in the
messages module. `next/image` keeps serving resized WebP from the own domain. The Unsplash and
picsum remote patterns leave `next.config.ts`. Hero, section order, copy and buttons stay as they
are. No schema, API or admin change.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.4 (App Router)

**Primary Dependencies**: existing only: Tailwind CSS 4, `next/image`, `motion` (parallax in the
closing band), Phosphor icons. Build time tool: `ffmpeg` (local, already used by
`scripts/build-hero-video.sh`, not a runtime dependency).

**Storage**: five static JPGs in `public/images/camp/` (about 1.5 MB in total), served through the
Next.js image optimizer

**Testing**: Vitest (`tests/unit`) has nothing new to test (no logic, only data); manual checks per
[quickstart.md](quickstart.md); visual check of every photo at delivered size for recognizable
faces.

**Target Platform**: Vercel, current mobile and desktop browsers

**Project Type**: web application (Next.js full stack)

**Performance Goals**: no change to LCP (all photos lie below the hero and load lazily); the five
desktop variants together stay below 1.5 MB (SC-003)

**Constraints**: no recognizable person at delivered size (FR-006), no „Born to Win“, no camera
metadata (serial number, time) in the public files, German alt texts in the messages module

**Scale/Scope**: 3 marketing components, 1 new data module, 1 build script, `next.config.ts`,
messages, AGENTS.md

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Fixed stack | No new runtime dependency; ffmpeg is a local build tool like in specs/026 | Pass |
| II. Server boundary | No secrets, no privileged work, static files only | Pass |
| III. Strict scope | Landing page content, already in scope (AGENTS.md section 4, landing) | Pass |
| IV. Single source of truth | Photo paths in one module, schema untouched | Pass |
| V. Language separation | Alt texts German in `lib/marketing/messages.ts`; code, file names, comments English | Pass |
| VI. Payment and pricing | Not touched | Pass |
| VII. Simplicity and gates | One script, one data module, no abstraction; lint, test and build run (config changes) | Pass |
| Writing rules | No dash punctuation in copy, comments, commit | Pass |

Post design re-check: unchanged, all pass.

## Project Structure

### Documentation (this feature)

```text
specs/027-camp-photos/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── landing-photos-ui.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
scripts/build-camp-photos.sh                # new: originals to public/images/camp
public/images/camp/                         # new: five 2026 photos, generated
lib/marketing/camp-photos.ts                # new: paths and focus points
lib/marketing/messages.ts                   # alt texts (photos), community photoAlt moves
components/marketing/program-highlights.tsx # three tiles with photos
components/marketing/community-groups.tsx   # band photo
components/marketing/closing-cta.tsx        # campfire photo
next.config.ts                              # remote patterns removed
AGENTS.md                                   # landing scope line mentions the photos
```

**Structure Decision**: existing Next.js layout. Media follows the hero pattern of specs/026:
generated files in `public/`, a script in `scripts/`, paths in `lib/marketing/`.

## Existing Code Inspected

- `components/marketing/program-highlights.tsx`: worship tile with Unsplash `WORSHIP_PHOTO` and
  `TODO`; two tiles with icon only (surface and amber gradient). Copy is inline.
- `components/marketing/community-groups.tsx`: full width band, Unsplash `COMMUNITY_PHOTO`, left
  scrim, alt from `marketingMessages.community.photoAlt`.
- `components/marketing/closing-cta.tsx`: `ParallaxImage` with Unsplash `CAMPFIRE_PHOTO`, ken burns,
  dark scrim; `ParallaxImage` already respects reduced motion and passes `imageClassName`.
- `next.config.ts`: remote patterns for picsum (unused) and Unsplash (only these three).
- `proxy.ts`: matcher already skips `jpe?g` and `webp`, so the proxy never runs for the photos.
- `lib/marketing/hero-video.ts`, `scripts/build-hero-video.sh`: pattern for generated media.
- `specs/025-legal-pages/research.md`: images already pass the optimizer, privacy text unaffected.

## Decisions (details in [research.md](research.md))

- Photo per slot: `_MG_3076` worship tile, `IMG_3491` community band (instead of `IMG_4139`, whose
  lead singer is recognizable), `_MG_3632` campfire band, `_MG_2528` inputs tile, `IMG_3330` sport
  tile (R1).
- ffmpeg: rotation from EXIF, long edge 2400 px, JPEG quality 4, `-map_metadata -1` (R2).
- Plain string paths with `fill`, not static imports: `ParallaxImage` takes a string and the hero
  uses the same pattern (R3).
- Focus points per photo via `object-position` so the fire, the hands and the ball stay in frame (R4).
- Campfire faces: delivered darkened by the existing scrim; checked visually after build, fallback
  `_MG_3633` or a stronger scrim (R5).

## Security Requirements

- Public files carry no EXIF (camera serial, timestamps); the script strips them and the quickstart
  verifies it.
- No external image host remains in `next.config.ts`.

## Acceptance Criteria

Spec FR-001 to FR-012 and SC-001 to SC-005, verified by [quickstart.md](quickstart.md).

## Checks to Run

`npm run lint`, `npm test`, `npm run build` (config and components change).

## Complexity Tracking

None.
