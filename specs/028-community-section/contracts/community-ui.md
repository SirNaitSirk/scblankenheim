# UI Contract: Jugendgruppen und Lagerfeuer

## Jugendgruppen (`community-groups.tsx`)

Desktop (md and up): grid `md:grid-cols-[1.15fr_0.85fr]`, gap 12 to 16, `items-center`,
`max-w-[1400px]`, padding like the other sections (`px-6 py-24 md:px-10 lg:py-32`).

Left column, top to bottom:

1. Eyebrow „Wer dabei ist“ (`eyebrow text-amber-600`)
2. Heading „Jugenden aus der ganzen Region“ (same style as other section headings)
3. Lead text unchanged (`text-lg text-muted-foreground`, `max-w-[44ch]`)
4. Group names: `ul` with the six names in display type, `mt-10`, separators „·“ in amber

Right column: two portrait photos side by side, second offset down; `rounded-card`,
`overflow-hidden`, `bg-sand-200` as loading colour, `shadow-warm`.

Phone: single column, photos after the names, still side by side, offset reduced (`mt-8`).

Background `bg-sand-100`, top border like other sections.

## Lagerfeuer (`closing-cta.tsx`)

Unchanged layout, photo, scrims, parallax, buttons. Heading text „Ein Kreis ums Feuer. Und du
gehörst dazu.“ from `marketingMessages.closing.heading`; second button label from
`marketingMessages.closing.questions`.

## States

- Loading: photo boxes show `bg-sand-200` with fixed aspect, no layout shift.
- No JavaScript: everything server rendered.

## Accessibility

- Names are a list; separators `aria-hidden`.
- Photos have German alt texts from `marketingMessages.photos`.
- Text contrast on `sand-100` meets 4.5:1 (ink on sand).
