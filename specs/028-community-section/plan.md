# Implementation Plan: Jugendgruppen hell, Lagerfeuer als einziger dunkler Moment

**Branch**: `028-community-section` | **Date**: 2026-10-31 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/028-community-section/spec.md`

## Summary

`community-groups.tsx` turns from a dark full bleed photo band into a light `sand-100` section: a
left text column with eyebrow, heading, lead and the six group names as one large display type
run separated by amber „·“, and a right column with two portrait day photos offset against each
other. The worship photo leaves the section; two new photos join the build script and the photo
module. `closing-cta.tsx` keeps photo, scrims, parallax and buttons and gets a new heading; its copy
moves into the messages module. No schema, API or route change.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.4 (App Router)

**Primary Dependencies**: existing only (Tailwind CSS 4, `next/image`, `motion` through `Reveal` and
`ParallaxImage`); ffmpeg as local build tool (specs/027)

**Storage**: two more JPGs in `public/images/camp/`, `2026-community.jpg` removed

**Testing**: no logic changes; Vitest suite must stay green; browser check per
[quickstart.md](quickstart.md); Impeccable detector on both components

**Target Platform**: Vercel, mobile and desktop browsers

**Project Type**: web application (Next.js full stack)

**Performance Goals**: two lazy loaded portrait photos instead of one full width photo; page weight
roughly unchanged

**Constraints**: no recognizable people, no dash punctuation in copy, German copy in
`lib/marketing/messages.ts`

**Scale/Scope**: 2 components, photo module, messages, build script, specs/027 data model note

## Constitution Check

| Principle | Check | Result |
|---|---|---|
| I. Fixed stack | No new dependency | Pass |
| II. Server boundary | Static content only | Pass |
| III. Strict scope | Landing page content, in scope | Pass |
| IV. Single source of truth | Photos in `camp-photos.ts`, copy in messages | Pass |
| V. Language separation | German copy in messages, English code | Pass |
| VI. Payment and pricing | CTA label logic untouched | Pass |
| VII. Simplicity | Two component edits, no abstraction; lint, test, build | Pass |
| Writing rules | Heading „Ein Kreis ums Feuer. Und du gehörst dazu.“ has no dashes | Pass |

Post design re-check: unchanged.

## Project Structure

```text
specs/028-community-section/
├── plan.md
├── quickstart.md
├── contracts/community-ui.md
└── tasks.md

components/marketing/community-groups.tsx   # light section with names and photos
components/marketing/closing-cta.tsx        # copy from messages, new heading
lib/marketing/camp-photos.ts                # keys teamwork, beach; community removed
lib/marketing/messages.ts                   # community.eyebrow, photos.*, closing.*
scripts/build-camp-photos.sh                # IMG_3265, IMG_3450 in, IMG_3491 out
public/images/camp/                         # 2026-teamwork.jpg, 2026-beach.jpg; community removed
```

## Existing Code Inspected

- `community-groups.tsx`: dark band, `CAMP_PHOTOS.community`, left scrim, chips with blur.
- `closing-cta.tsx`: centered dark band, inline German copy (heading and second button), `cta` prop
  for the primary button, comment calls it the one dark moment.
- `program-highlights.tsx` and `registration-section.tsx`: both `bg-sand-50`, so the community
  section needs `bg-sand-100` to read as its own block.
- Tokens: `sand-50` `#fbf7f0`, `sand-100` `#f4ecdf`, `amber-600` for eyebrows, `font-display`
  Archivo black for headings, `rounded-card`, `shadow-warm`.

## Decisions

- **Background**: `bg-sand-100` (one tone step warmer than the neighbours, no new colour).
- **Names**: `font-display font-black` at `text-3xl md:text-5xl lg:text-6xl`, `leading-[1.05]`,
  `text-balance`; each name a `nowrap` span, separators `text-amber-500` with spacing; rendered as a
  list (`ul`) for assistive tech, separators `aria-hidden`.
- **Photos**: two portrait photos in a two column grid on the right, the second shifted down
  (`md:mt-16`) for an editorial offset; `rounded-card`, `aspect-[3/4]`, lazy. Below the text on
  phones, side by side.
- **Campfire copy**: heading „Ein Kreis ums Feuer. Und du gehörst dazu.“; button label
  „Bei Fragen schreib uns“ unchanged, both moved to `marketingMessages.closing`.
- Photos built with the specs/027 script: `teamwork` from `IMG_3265`, `beach` from `IMG_3450`;
  `community` (`IMG_3491`) removed from script, module and `public/`.

## Security Requirements

None beyond specs/027 (metadata stripped by the script).

## Checks to Run

`npm run lint`, `npm test`, `npm run build`, Impeccable detector on both components.

## Complexity Tracking

None.
