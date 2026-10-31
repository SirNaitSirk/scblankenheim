# Quickstart: Echte Campfotos auf der Landingpage

## Build the photos

```bash
unzip -q "$HOME/Downloads/20260607 Summercamp-20261031T115053Z-1-001.zip" -d /tmp/camp2026
scripts/build-camp-photos.sh "/tmp/camp2026/20260607 Summercamp"
```

Expected: five files `public/images/camp/2026-*.jpg`, each at most 600 KB, long edge 2400 px,
`2026-worship.jpg` and `2026-community.jpg` in portrait.

Metadata check (expected: no `tag:Make`, no `tag:` lines at all):

```bash
for f in public/images/camp/*.jpg; do ffprobe -v error -show_frames -read_intervals %+#1 -show_entries frame_tags -of compact "$f"; done
```

## Run

```bash
npm run dev
```

Open http://localhost:3000.

## Validate

1. Program section: worship tile shows the raised hands, inputs tile the prayer room, sport tile
   the volleyball. Text readable on all three (FR-001, FR-004, FR-005, FR-010).
2. Youth groups band shows the worship crowd from behind (FR-002).
3. Campfire band shows the fire at night; nobody across the fire is clearly recognizable at
   1440 px and 2560 px width (FR-003, FR-006, research R5).
4. DevTools network tab, filter images: every image request goes to `localhost:3000`, none to
   `images.unsplash.com` (FR-007, SC-002).
5. Phone width 375 px: tiles stacked, photos and text not cut off.
6. Reduced motion on: campfire band static.
7. JavaScript off: all photos visible.
8. Hero unchanged (video and poster as before).

## Checks

```bash
npm run lint
npm test
npm run build
```
