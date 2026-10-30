# Contract: Landing page structure, anchors and share metadata

External surface of `/` that other parts of the system (mails, nav on other pages, link previews)
rely on.

## Section order

| # | Section | Anchor |
|---|---|---|
| 1 | Hero with nav | `#start` (on `main`) |
| 2 | Facts | `#camp` |
| 3 | Program | none |
| 4 | Youth groups | none |
| 5 | Campfire band | none |
| 6 | Registration | `#anmelden` |
| 7 | Gut zu wissen | `#gut-zu-wissen` |
| 7a | Anreise | `#anreise` |
| 7b | Bezahlen | `#bezahlen` |
| 7c | Packliste | `#packliste` |
| 7d | Schulbefreiung (conditional) | `#schulbefreiung` |
| 8 | Footer | none |

Stable anchors that existing mails and pages link to and that MUST keep working: `#camp`,
`#anmelden`, `#packliste`, `#schulbefreiung`, `/#camp`, `/#anmelden`.

## Navigation

| Item | Target | Shown |
|---|---|---|
| Brand | `#start` | always |
| Camp | `#camp` | always |
| Gut zu wissen | `#gut-zu-wissen` | always |
| Schulbefreiung | `#schulbefreiung` | only when the block is shown |
| CTA button (short label per state) | `#anmelden` | always |

Footer on the landing page: Camp, Gut zu wissen, Schulbefreiung (conditional), Anmelden, Packliste
(`/packzettel`). On other pages the footer keeps absolute `/#…` targets and omits Schulbefreiung.

## Registration CTA labels

See [research.md R5](../research.md#r5--registration-ctas-follow-the-state). The same label is used
in hero and campfire band; the nav uses the short label.

## Share metadata on `/`

| Tag | Value |
|---|---|
| `og:title` | „FCG Blankenheim Summercamp · Sommer 2027“ (page title) |
| `og:description` | page description |
| `og:locale` | `de_DE` |
| `og:type` | `website` |
| `og:image` | absolute URL of `/opengraph-image` (via `metadataBase` = `APP_URL`), 1200 × 630 PNG |
| `og:image:alt` | German alt text from `lib/marketing/messages.ts` |
| `twitter:card` | `summary_large_image` |

The image shows the camp name and, if known, the date range; never any price. While the coming soon
gate is on, `/opengraph-image` is gated like every other public path.
