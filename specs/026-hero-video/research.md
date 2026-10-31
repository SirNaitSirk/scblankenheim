# Research: Hero Video

Decisions for [spec.md](spec.md). Each entry: decision, rationale, alternatives considered.

## R1 · Hosting: static files in `public/videos/`

**Decision**: The encoded clips and the poster live in the repository under `public/videos/` and
are served by Vercel's CDN from the same origin. File names carry the camp year
(`hero-2026-desktop.mp4`), so a new cut next year gets a new URL and no stale cache.

**Rationale**: Four files of about 2 to 4 MB each (roughly 11 MB in total) are fine for the repo
and the Vercel deployment. Same origin means no new provider, no new privacy section (Vercel
hosting is already in the privacy text, specs/025-legal-pages) and no extra setup.

**Alternatives considered**: Vercel Blob (extra store, token and upload step for one file a year);
Supabase Storage (public bucket, another origin, cache headers to manage); YouTube or Vimeo
embed (third party cookies and tracking, a new privacy section, player chrome, slow start).

## R2 · Proxy matcher must skip video files

**Decision**: Add `mp4` and `webm` to the static file exclusion in the `proxy.ts` matcher.

**Rationale**: The current matcher skips images, fonts and other assets but not videos. Every video
request (including the many range requests a video player makes) would run Clerk and the coming
soon gate. That costs latency and function invocations and, while `COMING_SOON` is on, would
answer video requests with the coming soon HTML. Files in `public/` contain nothing secret.

**Alternatives considered**: Allowlisting `/videos` in `lib/coming-soon/gate.ts` (still runs the
proxy for every range request).

## R3 · Encoding and variants

**Decision**: One reproducible script `scripts/build-hero-video.sh <source>` cuts the 8 scenes from
the source file (cut list in the script, times from the spec) and writes:

| File | Frame | Codec | Target size |
|---|---|---|---|
| `hero-2026-desktop.webm` | 1920×1080, 30 fps | VP9, two pass, CRF tuned | ≤ 4 MB |
| `hero-2026-desktop.mp4` | 1920×1080, 30 fps | H.264 High, `+faststart` | ≤ 4 MB |
| `hero-2026-mobile.webm` | 720×1280 portrait, center crop | VP9 | ≤ 2.5 MB |
| `hero-2026-mobile.mp4` | 720×1280 portrait, center crop | H.264, `+faststart` | ≤ 2.5 MB |
| `hero-2026-poster.jpg` | 1920×1080, first frame of the cut | JPEG q≈80 | ≤ 250 kB |

No audio track (`-an`), no B frame tricks that break looping. If 1080p cannot meet the size target,
the desktop variant drops to 1600×900. The script checks sizes and fails if a target is exceeded.
The source file (555 MB) is read from its local path and never committed (FR-012).

**Rationale**: VP9 WebM is about 30 % smaller than H.264 at the same quality and plays in Chrome,
Firefox, Edge and current Safari; MP4 H.264 is the universal fallback (older iOS). A portrait crop
for phones avoids sending 16:9 pixels that `object-cover` would cut away anyway (only about a
third of a landscape frame is visible on a portrait phone), so phones download less.

**Alternatives considered**: AV1 (smaller, but slow encode and uneven hardware decoding on older
phones); one single MP4 for all (simpler, but phones would download the biggest file); adaptive
streaming HLS (overkill for 14 seconds).

**Scene check**: The cut was previewed on 2026-10-31. Trim points are taken on the decoded
timeline (`trim` filter), which matched the visual review; the stage scene starts at 84.4 s to skip
a whip transition.

## R4 · Who decides whether the video plays

**Decision**: The server renders the poster as a `next/image` with `priority` (it is the LCP
element) plus an empty `<video>` without `src`, `muted`, `playsInline`, `loop`, `preload="none"`,
`aria-hidden`. A small client component decides on mount via a pure helper
`shouldPlayHeroVideo({ reducedMotion, saveData, effectiveType })`:

- no playback if `prefers-reduced-motion: reduce`,
- no playback if `navigator.connection.saveData` is true,
- no playback if `effectiveType` is `slow-2g` or `2g`,
- otherwise it picks the variant with `pickHeroVideoSource({ portrait, canPlayWebm })`, sets the
  source, calls `play()`, and fades the video in over the poster once the `playing` event fires.

**Rationale**: Without JavaScript, with reduced motion or with save data the browser never gets a
video URL, so nothing is downloaded (FR-005, SC-006). The poster stays the first and largest paint,
so LCP is unchanged (SC-003). Rejected `play()` promises (autoplay blocked) keep the poster and set
the pause control to „Abspielen“.

**Alternatives considered**: Plain `<video autoPlay>` with `<source media>` (downloads even under
reduced motion and save data, `media` on `<source>` not reliable on all browsers); CSS only
(cannot read save data or stop a download).

## R5 · Off screen and hidden tab

**Decision**: An `IntersectionObserver` pauses the video when the hero leaves the viewport and
resumes it when it returns, unless the user paused it by hand. The variant choice happens once per
page load (no switch on rotation; a rotated phone keeps the already loaded file with
`object-cover`).

**Rationale**: Saves battery and CPU while the visitor reads the rest of the page.

## R6 · Pause control (WCAG 2.2.2)

**Decision**: A round button bottom right in the hero (same height as the scroll cue, 44 px touch
target), Phosphor `Pause` / `Play` icon, `aria-label` „Video anhalten“ / „Video abspielen“,
`aria-pressed`, visible focus ring. It is rendered only while the video is active. Tab order: after
the hero buttons, before the scroll cue (SC-007).

**Rationale**: Motion longer than 5 seconds next to other content must be pausable. Native controls
would look out of place on a background video.

## R7 · Remove parallax and ken burns in the hero

**Decision**: The hero no longer uses `ParallaxImage`; the video and poster sit in a plain
`absolute inset-0` layer with `object-cover`. `ParallaxImage` stays for `closing-cta.tsx`.

**Rationale**: Video plus zoom plus scroll drift is too much motion and costs frames on weak phones
(FR-013).

## R8 · Legibility

**Decision**: Keep both scrims. Raise the bottom scrim from `from-ink-950/75 via-ink-950/15` to
`from-ink-950/80 via-ink-950/30` and remove the amber tint on the top right (bright sky and beach
scenes already carry warmth). Verify the contrast of headline and lead over a still of every
scene (quickstart step 5).

**Rationale**: Video is brighter than the old photo in several scenes (sky, beach, meadow).

## R9 · Headline and description copy

**Decision**: New German copy in `lib/marketing/messages.ts` under `marketingMessages.hero`:

- headline (chosen by the owner on 2026-10-31): „Strand, Scheune, **Gemeinschaft**“, accent on
  „Gemeinschaft“; rejected proposals: „Ein Sommer, der bleibt“, „Eine Woche, die bleibt“;
- lead unchanged in meaning: „Eine Woche Gemeinschaft, Abenteuer und Glaube an der belgischen
  Küste. Sichere dir jetzt deinen Platz beim Summercamp.“;
- poster alt: „Szenen vom letzten Summercamp: Spiele vor den Bussen, Volleyball, Saltos am Strand
  und in den Dünen, Worship und Party in der Scheune.“;
- pause labels from R6.

The current hero strings are inline in the component; they move into the messages module in the
same change (constitution V).

## R10 · Consent dependency

**Decision**: Publishing is blocked until the owner confirms consent for public video use of the
people shown (spec assumption). The implementation can be merged behind no flag; the owner
confirms before the deploy that makes it public. Recorded as the last task.
