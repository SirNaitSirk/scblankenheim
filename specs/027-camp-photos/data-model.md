# Data Model: Echte Campfotos auf der Landingpage

No database change. One static data module.

## CampPhoto (`lib/marketing/camp-photos.ts`)

| Field | Type | Rule |
|---|---|---|
| `src` | string | `/images/camp/2026-<slug>.jpg`, file exists in `public/images/camp/` |
| `focusClass` | string | literal Tailwind `object-[x_y]` class for the focus point, see research R4 |

Keys: `worship`, `inputs`, `sport`, `community`, `campfire`.

Alt texts live in `marketingMessages.photos` with the same keys (German, describe the real motif).
`marketingMessages.community.photoAlt` moves there.

## Source mapping (`scripts/build-camp-photos.sh`)

| Key | Source file | Output |
|---|---|---|
| `worship` | `_MG_3076.JPG` | `2026-worship.jpg` |
| `inputs` | `_MG_2528.JPG` | `2026-inputs.jpg` |
| `sport` | `IMG_3330.JPG` | `2026-sport.jpg` |
| `community` | `IMG_3491.JPG` | `2026-community.jpg` |
| `campfire` | `_MG_3632.JPG` | `2026-campfire.jpg` |

Limits: long edge 2400 px, each file at most 600 KB, no metadata.

## Change in specs/028-community-section

`community` (`IMG_3491`) is replaced by `teamwork` (`IMG_3265.JPG`, long edge 1600 px) and `beach`
(`IMG_3450.JPG`, long edge 1600 px). The script accepts an optional long edge per photo.
