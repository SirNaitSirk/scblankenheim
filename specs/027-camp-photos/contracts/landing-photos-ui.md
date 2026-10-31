# UI Contract: Campfotos auf der Landingpage

Unchanged: hero, section order, headings and body copy, buttons, anchors, `Reveal` animations.

## Program section (`program-highlights.tsx`)

Grid stays: tall worship tile left (two rows on desktop), two tiles stacked right.

- **Worship tile**: photo `worship`, rest as today (bottom scrim, amber tint, eyebrow, heading,
  text in `on-inverse`).
- **Inputs tile** and **sport tile**: become photo tiles like the worship tile: `next/image` with
  `fill`, `sizes="(min-width: 768px) 50vw, 100vw"`, focus point from the data module, dark bottom
  scrim `from-ink-950/85 via-ink-950/40 to-ink-950/10`, text and icon in `on-inverse`, icon chip
  `bg-on-inverse/15`. The sport tile keeps a light amber tint overlay as the warm accent. Minimum
  height `min-h-[18rem]` so the photo reads on phones.
- Typography, spacing and radius stay (`rounded-card`, `p-8`, `font-display` headings).

## Youth groups band (`community-groups.tsx`)

Photo `community` with its focus point; scrims and group chips unchanged.

## Closing band (`closing-cta.tsx`)

`ParallaxImage` with photo `campfire`, focus point through `imageClassName`; scrims, parallax, ken
burns and reduced motion behaviour unchanged.

## States

- Loading: dark base colour of the tile or band (`bg-sand-900`) until the photo arrives; text is
  readable on it.
- Error: same as loading, no broken image icon visible behind the scrim.
- No JavaScript: photos and text render from the server.

## Accessibility

- Each photo has its German alt text from `marketingMessages.photos`.
- Text over photos keeps at least 4.5:1 contrast against the scrimmed photo.
