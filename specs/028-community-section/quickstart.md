# Quickstart: Jugendgruppen hell, Lagerfeuer als einziger dunkler Moment

## Build the photos

```bash
scripts/build-camp-photos.sh "/tmp/camp2026/20260607 Summercamp"
```

Expected: `2026-teamwork.jpg` and `2026-beach.jpg` in `public/images/camp/`, no `2026-community.jpg`.

## Validate

```bash
npm run dev
```

1. Scroll from the program to the registration: light, light (warmer tone), dark campfire, light.
2. Youth groups: eyebrow „Wer dabei ist“, heading, lead, six names large with „·“, two photos.
3. 375 px and 320 px: no horizontal scroll, no name cut or hyphenated.
4. Campfire heading reads „Ein Kreis ums Feuer. Und du gehörst dazu.“, primary button follows the
   registration state.
5. Network: all images from the own host.

## Checks

```bash
npm run lint
npm test
npm run build
```
