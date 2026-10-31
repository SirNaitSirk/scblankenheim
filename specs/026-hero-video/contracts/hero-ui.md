# UI Contract: Hero with Video

## Layer order (bottom to top)

1. Poster `next/image`, `fill`, `priority`, `sizes="100vw"`, `object-cover`, alt from
   `marketingMessages.hero.posterAlt`.
2. `<video>` `absolute inset-0 h-full w-full object-cover`, `muted`, `playsInline`, `loop`,
   `preload="none"`, `aria-hidden`, `tabIndex={-1}`, no `src` in server HTML. Starts at
   `opacity-0`, becomes `opacity-100` with a 400 ms transition after the `playing` event; under
   reduced motion it never gets a source.
3. Scrims (bottom gradient `from-ink-950/80 via-ink-950/30 to-transparent`, diagonal
   `from-ink-950/45 via-transparent to-transparent`, left `from-ink-950/60 via-ink-950/25 via-60%
   to-transparent`, and below `md` a uniform `bg-ink-950/35`). The left and the phone layer were
   added after measuring every scene on 2026-10-31 (worst case 1440 px: headline 3.35, accent
   3.77, lead 6.29 to 1; 375 px: 4.72, 3.45, 4.53 to 1).
4. Vertical hero tag, `SiteNav variant="overlay"`, headline stack and buttons (unchanged layout,
   copy from the messages module).
5. Pause control and scroll cue at the bottom.

## Pause control

| State | Visible | Icon | aria-label | aria-pressed |
|---|---|---|---|---|
| idle (poster only) | no | · | · | · |
| playing | yes | Pause | „Video anhalten“ | false |
| paused by hand | yes | Play | „Video abspielen“ | true |
| autoplay rejected | yes | Play | „Video abspielen“ | true |

Position: `absolute bottom-8 right-6 md:right-10`, 44×44 px, `rounded-pill`, `bg-ink-950/40`,
`backdrop-blur-sm`, `text-on-inverse/80`, hover `text-on-inverse`, focus ring like the hero
buttons. Below `sm` it sits right of the scroll cue on the same line.

## Behaviour

- Without JavaScript: poster, scrims, text and buttons; no control.
- Reduced motion, save data, `slow-2g` or `2g`: same as without JavaScript.
- Portrait viewport (`orientation: portrait` or width below 768 px) loads the mobile variant,
  otherwise desktop; WebM if `canPlayType('video/webm; codecs="vp9"')` answers, else MP4.
- Hero out of view: video pauses; back in view: resumes unless paused by hand.
- Load error: video stays hidden, control disappears, poster stays.

## Unchanged

Section height `min-h-[100dvh]`, anchors `#camp`, CTA logic, nav, share image, closing CTA
parallax, coming soon page.
