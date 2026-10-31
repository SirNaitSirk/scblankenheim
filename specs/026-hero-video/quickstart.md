# Quickstart: Hero Video

## Prerequisites

- `ffmpeg` with `libx264` and `libvpx-vp9` (`brew install ffmpeg`).
- The source recording at `~/Downloads/SC2026_Recap.MOV` (not in the repo).
- Before changing the hero: record a baseline Lighthouse mobile run of `/` (LCP value) on a
  production build.

## 1 · Build the assets

```bash
scripts/build-hero-video.sh ~/Downloads/SC2026_Recap.MOV
```

Expected: five files in `public/videos/`, the script prints each size and exits non zero if a size
target from [research.md](research.md) R3 is exceeded. Watch both videos once: 8 scenes in the
order of [data-model.md](data-model.md), no group photo, no logo, no black frame.

## 2 · Checks

```bash
npm run lint
npm test
npm run build
```

`tests/unit/hero-video.test.ts` covers `shouldPlayHeroVideo` and `pickHeroVideoSource`.

## 3 · Desktop

`npm run dev`, open `http://localhost:3000`:

- poster visible at once, video fades in and loops without a black frame;
- network panel: exactly one video request (`hero-2026-desktop.webm` in Chrome), status 206 or 200,
  no proxy redirect and no HTML response;
- pause control pauses and resumes; Tab reaches it after the hero buttons;
- scroll past the hero: video pauses (`document.querySelector('video').paused === true`).

## 4 · Phones

- iPhone Safari (real device or simulator) and Android Chrome: video plays inline, not
  fullscreen; the mobile variant is loaded.
- Chrome DevTools, mobile preset, network „Slow 3G“: poster and text appear before the video.
- Chrome DevTools, emulate `prefers-reduced-motion: reduce`: no video request, no control.
- Android Chrome with Data Saver (or `navigator.connection.saveData` emulated): no video request.
- JavaScript disabled: poster, text and buttons; no video request.

## 5 · Legibility

Take one screenshot per scene (pause on each) at 1440 px and 375 px; check that headline and lead
meet the contrast targets of SC-005 (sample the brightest area behind the text).

## 6 · Performance

Lighthouse mobile on the production build: LCP at most 10 % above the baseline from the
prerequisites (SC-003). Total video bytes on desktop ≤ 4 MB, on mobile ≤ 2.5 MB (SC-004).

## 7 · Coming soon gate

With `COMING_SOON=true` locally: visitors still see `/demnaechst`; requesting
`/videos/hero-2026-desktop.mp4` directly returns the video, not HTML.

## 8 · Before go live

The owner confirms consent for publishing the people shown (spec assumption). Only then deploy.
