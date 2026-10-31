# Research: Echte Campfotos auf der Landingpage

## R1 · Photo per slot

**Decision**:

| Slot | Photo | Format | Why |
|---|---|---|---|
| Program, worship tile (tall) | `_MG_3076` raised hands from behind, chandelier | portrait | Fits the tall tile, only backs visible |
| Program, „Inspirierende Inputs“ | `_MG_2528` prayer room with Jeremiah 33:3 garland | landscape | No people, reflection and teaching mood |
| Program, sport, campfire, night game | `IMG_3330` volleyball against clouds | landscape | Action, faces dark and small when framed on the sky |
| Youth groups band | `IMG_3491` worship crowd from behind, purple stage | portrait | Many young people, nobody faces the camera |
| Closing band before registration | `_MG_3632` campfire at night | landscape | Matches the band's campfire role |

**Rationale**: all 224 photos were reviewed on 2026-10-31, the shortlist again at 1600 px.

**Alternatives considered**: `IMG_4139` (worship, lead singer clearly recognizable at 1600 px),
`IMG_3500` (speaker on stage recognizable), `IMG_3708` and stage shots with „Born to Win“
(old motto), `IMG_3724` (crowd from above, faces recognizable at full size).

## R2 · Converting the originals

**Decision**: `ffmpeg -i <src> -vf scale=<long edge 2400> -map_metadata -1 -q:v 4 <dst>.jpg`.

**Rationale**: ffmpeg 8 applies the EXIF rotation (`_MG_3076` is stored 6000 × 4000 with a 90°
display matrix and comes out 1600 × 2400) and drops all metadata, including the camera serial
number. A test conversion of `_MG_3076` gave 250 KB. 2400 px covers a full width band on a
1200 px wide 2x screen; the optimizer derives smaller WebP variants.

**Alternatives considered**: `sips` (keeps EXIF, would publish camera serial and time), committing
WebP directly (the optimizer already serves WebP; JPG stays the most robust source).

## R3 · Paths instead of static imports

**Decision**: string paths `/images/camp/2026-*.jpg` with `fill`, kept in
`lib/marketing/camp-photos.ts`.

**Rationale**: `ParallaxImage` takes `src: string`; all photo slots already use `fill` with a
fixed box, so intrinsic size and blur placeholders bring nothing. Same pattern as
`HERO_POSTER_SRC`.

**Alternatives considered**: static imports with `placeholder="blur"` (would change the
`ParallaxImage` props for a cosmetic gain).

## R4 · Focus points

**Decision**: one `object-position` per photo in the data module: worship `center 40%` (hands and
chandelier), community `center 30%` (screen and heads), campfire `center 70%` (fire and
foreground silhouettes), inputs `center 35%` (garland text), volleyball `center 30%` (ball and
net, players at the lower edge).

**Rationale**: the bands are much wider than the photos; without a focus point the fire or the
ball can be cut off.

## R5 · Faces at the campfire

**Decision**: use `_MG_3632` under the existing scrim (`ink-950` 55 to 85 percent) and check the
rendered band in the browser at desktop width. If a face is still clearly recognizable, first try
`_MG_3633`, then a darker scrim on this band only.

**Rationale**: at 1600 px the back row across the fire is lit and partly recognizable; the band
darkens the photo strongly, and parallax plus ken burns move it slightly.

## R6 · Remote image patterns

**Decision**: remove both remote patterns and the `TODO` from `next.config.ts`.

**Rationale**: after this feature no component loads a remote image (picsum is unused already),
so an open optimizer proxy for foreign hosts is not needed.
