# Research: Landingpage Aufbau, Gestaltung und Technik

Inputs: [spec.md](spec.md), the Impeccable critique of 2026-10-30
(`.impeccable/critique/2026-10-30T13-00-31Z__app-page-tsx.md`), the `design-taste-frontend`
(tasteskill) rules, and the current code in `components/marketing/*`.

## R1 · Scroll reveal without hiding content

**Decision**: Replace the IntersectionObserver based `Reveal` (starts at `opacity-0` in the server
HTML) with a pure CSS scroll driven reveal: a `.reveal` class that animates opacity and a small
translate on `animation-timeline: view()` inside `@supports (animation-timeline: view())` and
`@media (prefers-reduced-motion: no-preference)`. Outside those conditions the class does nothing,
so content is always visible. `Reveal` becomes a plain server component wrapper; the `delay` prop
is dropped (stagger is expressed through a slightly later `animation-range` on the second item
where it matters, or not at all).

**Rationale**: The content is visible in the HTML before any JavaScript, for no JS, slow phones,
reduced motion and deep links (FR-008, FR-009, FR-017, FR-019). No `.js` flag is needed; a flag
set before paint would still hide content until hydration on slow phones. Browsers without scroll
driven animations (currently Firefox stable) simply show the content without animation.

**Alternatives considered**: `.js` class plus observer (still blank until hydration); motion
`whileInView` (renders `opacity:0` on the server, same bug); removing all motion (loses the
intended feel the critique counted as a strength).

## R2 · Hero entrance

**Decision**: Drop motion's `initial="hidden"` variants in `MountainHero`. The h1 renders fully
visible with no entrance animation (it is the LCP element). Eyebrow, lead, buttons and the scroll
cue get a CSS keyframe `hero-rise` (translate plus opacity, `animation-fill-mode: both`, staggered
`animation-delay` up to 300 ms). The global reduced motion rule in `app/globals.css` already
shortens animations to 0.01 ms. The bobbing scroll cue becomes a CSS animation as well, so the
hero no longer needs to be a client component except for the nav and parallax image.

**Rationale**: The critique measured a blank hero for more than 2 seconds on mobile because the
server HTML carried `opacity:0`. CSS keyframes run without JavaScript and finish visible.

**Alternatives considered**: motion with `initial={false}` (no entrance at all); keeping motion
and accepting the delay (rejected, P1 finding).

## R3 · Heading measure

**Decision**: Every `max-w-[..ch]` that limits a heading moves from the wrapper onto the `h2`
itself, plus `text-balance`. Target measures: closing campfire heading `max-w-[16ch]` at
`text-5xl md:text-6xl`, program heading `max-w-[18ch]`, the new „Gut zu wissen“ heading
`max-w-[18ch]`.

**Rationale**: `ch` resolves against the element's own font size. On the 16 px wrapper 24ch is
about 255 px, which produced 8 lines in the campfire band (critique P1, root cause).

## R4 · Section order and „Gut zu wissen“

**Decision**:

1. Hero
2. Facts (`#camp`)
3. Program
4. Youth groups (new `CommunityGroups`, the photo tile of today's `ArrivalCommunity`)
5. Campfire band (`ClosingCta`)
6. Registration (`#anmelden`)
7. „Gut zu wissen“ (`#gut-zu-wissen`) with open blocks:
   · Anreise (`#anreise`)
   · Bezahlen (`#bezahlen`)
   · Packliste (`#packliste`)
   · Schulbefreiung (`#schulbefreiung`, conditional)
8. Footer

Blocks sit in a two column grid from `md`, one column below. Each block has an `h3` at
`text-2xl`, about three lines of copy and at most one action. The school release block keeps its
email form. The packing block shows a shorter list of featured items as quiet tags and the link
to `/packzettel`.

**Rationale**: Product decision of 2026-10-30. Open blocks keep anchors from mails working
without JavaScript and keep the form visible (critique, focus point 2). One section heading
replaces four 48 px headings, which quiets the logistics part.

**Alternatives considered**: accordion (rejected by the owner); keeping Anreise beside the
youth groups (rejected by the owner).

## R5 · Registration CTAs follow the state

**Decision**: A pure, isomorphic function `registrationCta(state, opensAt)` in
`lib/register/registration-cta.ts` returns `{ label, href }` for every state, using
`getRegistrationState` (the existing single rule). Labels live in `registerMessages.cta`:

| State | Label | Target |
|---|---|---|
| open | „Jetzt anmelden“ | `#anmelden` |
| countdown | „Anmeldung ab 30. November“ (day and month, Berlin time) | `#anmelden` |
| countdown without date | „Anmeldung bald“ | `#anmelden` |
| closed | „Anmeldung geschlossen“ | `#anmelden` |
| full | „Ausgebucht“ | `#anmelden` |

Hero, nav button and campfire band use it; the nav button uses a short variant („Anmelden“ when
open, „Ab 30.11.“ in countdown, „Anmeldung“ otherwise) so the nav stays on one line. The countdown
heading changes from „Die Anmeldung öffnet in Kürze“ to „Die Anmeldung öffnet am 30. November“
when a date is known.

**Rationale**: FR-020, SC-007; tasteskill „no duplicate CTA intent“: one label per state for the
same action instead of three different wordings.

## R6 · Price line at the registration

**Decision**: Under the registration intro a single muted line built from the public base price,
for example „195 € inklusive Übernachtung und Verpflegung · Bezahlen per Karte, PayPal, SEPA
Lastschrift und mehr“. Only `camp.basePrice` from `getLandingCamp` is used, never the invitation
tier. Without a current camp the line is omitted. The payment method list moves into one
constant in `lib/marketing/messages.ts`, shared by the line and the Bezahlen block.

**Rationale**: FR-021, constitution VI. Parents hesitate at the form, not further down.

## R7 · Share preview

**Decision**: `app/opengraph-image.tsx` with `ImageResponse` (1200 × 630, PNG), `alt` from the
messages module, `export const revalidate = 3600` so a new camp date appears within an hour
without a deploy. It reads the current camp through `getLandingCamp` and renders the camp name and
the date range („24. bis 28. Mai 2027“, via a pure helper `formatCampDateRange`) on a warm sand
background with an amber accent; without dates only the name, without a camp
„FCG Blankenheim Summercamp“. Font: Archivo Black as a TTF in `assets/fonts/` (SIL Open Font
License), read with `readFile` as in the Next.js docs. `app/page.tsx` metadata gains
`openGraph` (title, description, `locale: "de_DE"`, `type: "website"`) and
`twitter: { card: "summary_large_image" }`; `metadataBase` comes from `APP_URL` through the
existing `appBaseUrl()` helper.

**Coming soon**: `/opengraph-image` has no file extension, so the proxy matcher runs and the
allowlist based gate of spec 023 refuses or rewrites it for non admins automatically (FR-012).
No gate change needed; verified in the quickstart.

**Alternatives considered**: a static PNG (date would go stale every year); Google Fonts fetch at
render time (network dependency at build and revalidate).

## R8 · Anchors under the fixed nav

**Decision**: Raise `scroll-padding-top` on `html` from `2rem` to `5.5rem` (68 px nav plus air).
That covers every anchor, including the new block anchors, without per section `scroll-mt`.

**Rationale**: FR-007, FR-019. One global rule instead of remembering it per section.

## R9 · Navigation and mobile menu

**Decision**: `SiteNav` gets props `cta: { label, href }` and `showSchoolRelease: boolean`.
Items: Camp, Gut zu wissen, Schulbefreiung (conditional) as text links, the CTA as a pill button
on the right (amber, `size="sm"`). The brand becomes a link to `#start`. The mobile menu closes
on Esc, on a tap on a transparent backdrop and on `hashchange`; the CTA is the last item, styled
as a full width button. `SiteFooter` gets the same optional props (defaults keep other pages
unchanged) and always adds the link to `/packzettel`.

**Rationale**: Product decision (button right), FR-005, FR-006, FR-018.

## R10 · Non interactive hover and the facts card

**Decision**: Remove hover color on packing tags, hover lift on the program cards and the image
zoom on the worship and youth group tiles (none are links). Facts rows switch to a stacked layout
below `sm` (value, then note, left aligned) so nothing is clipped at 375 px.

**Rationale**: FR-014, FR-016; critique heuristic 4 and the measured clipping at x 379 > 351.

## R11 · Copy location

**Decision**: New and changed German strings of this feature go to a new
`lib/marketing/messages.ts` (nav, footer, „Gut zu wissen“, block headings, payment methods, price
line, share image alt) and to `registerMessages` (CTA labels, countdown heading). Existing
hardcoded copy in untouched components stays where it is (no unrelated refactor), but every block
that moves into „Gut zu wissen“ takes its copy into the new module.

**Rationale**: Constitution V and VII.
