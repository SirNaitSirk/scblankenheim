# Data Model: Hero Video

No database change, no migration, no new table. The feature only adds static assets and two pure
helpers.

## Static assets (`public/videos/`)

| Asset | Description |
|---|---|
| `hero-2026-desktop.webm` / `.mp4` | Landscape cut, 8 scenes, about 14 s, no audio |
| `hero-2026-mobile.webm` / `.mp4` | Portrait center crop of the same cut |
| `hero-2026-poster.jpg` | First frame of the cut (scene 1), landscape |

Rules: the year in the name changes with every new cut; size limits per [research.md](research.md)
R3; the source recording is never part of the repository.

## Cut list (in `scripts/build-hero-video.sh`)

Ordered list of scenes, each with start and end in seconds on the decoded source timeline:

| # | Scene | Start | End |
|---|---|---|---|
| 1 | Kreisspiel vor den Reisebussen | 39.0 | 41.7 |
| 2 | Volleyball auf der Wiese | 127.6 | 130.5 |
| 3 | Salto am Strand | 126.15 | 127.45 |
| 4 | Salto von der Düne | 171.95 | 173.45 |
| 5 | Worship, erhobene Hände | 65.45 | 66.75 |
| 6 | Bühne mit Band | 84.4 | 85.6 |
| 7 | Party in der Scheune | 173.55 | 174.9 |
| 8 | Seilziehen am Auto | 177.85 | 179.4 |

## Playback decision (pure helpers, `lib/marketing/hero-video.ts`)

`HeroVideoEnvironment`: `reducedMotion: boolean`, `saveData: boolean`,
`effectiveType: string | null`, `portrait: boolean`, `canPlayWebm: boolean`.

- `shouldPlayHeroVideo(env)` → `boolean`
- `pickHeroVideoSource(env)` → `{ src: string; type: "video/webm" | "video/mp4" }`

State of the player in the client component: `idle` (poster only) → `playing` → `paused`
(by hand) ↔ `playing`; `idle` stays when playback is not allowed or `play()` is rejected.
