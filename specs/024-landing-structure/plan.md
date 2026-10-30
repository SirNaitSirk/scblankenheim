# Implementation Plan: Landingpage Aufbau, Gestaltung und Technik

**Branch**: `024-landing-structure` | **Date**: 2026-10-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/024-landing-structure/spec.md`

## Summary

The landing page gets a decision first order:

1. Hero
2. Facts
3. Program
4. Youth groups
5. Campfire band
6. Registration
7. „Gut zu wissen“ with open blocks for Anreise, Bezahlen, Packliste and Schulbefreiung

Content no longer depends on JavaScript to appear: scroll reveals become pure CSS scroll driven
animations that only run where supported and motion is allowed, and the hero headline renders
visible. Registration buttons in hero, nav and campfire band follow the existing registration
state rule, and the registration area gains a public price line. The nav loses „Start“, gains
„Gut zu wissen“ and a conditional „Schulbefreiung“, and shows the CTA as a button. A generated
share image with camp name and dates plus Open Graph metadata is added. Heading widths, the
mobile facts card, fake hover effects and anchor offsets are fixed. No schema, API or admin
change.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.4 (App Router)

**Primary Dependencies**: existing only: Tailwind CSS 4, `motion` (kept for parallax only),
`next/og` `ImageResponse` (part of Next.js), Phosphor icons. One new asset: Archivo Black TTF
(SIL OFL) in `assets/fonts/` for the share image.

**Storage**: N/A (reads current camp, registration count and release settings via existing helpers)

**Testing**: Vitest 4 (`tests/unit`) for the pure helpers; manual checks per
[quickstart.md](quickstart.md); Impeccable detector on the changed components.

**Target Platform**: Vercel; modern browsers. Scroll driven reveal is progressive: browsers
without `animation-timeline` show content without animation.

**Project Type**: web application (Next.js full stack)

**Performance Goals**: hero headline in the first painted frame (no `opacity:0` in server HTML);
less client JavaScript on the landing page (Reveal and hero entrance become CSS)

**Constraints**: anchors `#camp`, `#anmelden`, `#packliste`, `#schulbefreiung` stay stable for
links in mails; hidden prices never appear in the price line or share image; nav fits one line
at 1024 px

**Scale/Scope**: one page, about 12 marketing components touched, 4 new small modules, 3 unit
test files

## Constitution Check

*GATE: Must pass before Phase 0 research. Checked again after Phase 1 design.*

| Principle | Check | Result |
|-----------|-------|--------|
| I. Fixed stack | Only Next.js built ins (`next/og`) and existing libraries; a font file is an asset, not a dependency | Pass |
| II. Server security boundary | All data reads stay in server components and the image route with the public anon client; no secret involved | Pass |
| III. Strict scope | Same single landing page (no variant), no new feature beyond AGENTS.md section 4 | Pass |
| IV. Single source of truth | CTA labels derive from the existing `getRegistrationState`; release visibility reuses `isReleaseActive`; one cached `getLandingState` per request; one registration form untouched | Pass |
| V. Language separation | New German copy in `lib/marketing/messages.ts` and `registerMessages`; code, ids of helpers and comments English; anchor ids follow the existing German public anchors (`#anmelden`, `#packliste`) | Pass |
| VI. Tolerant payment, hidden pricing | Price line and share image use only `camp.basePrice`; the invitation tier is never read there | Pass |
| VII. Simplicity, quality gates | Pure helpers with unit tests; Reveal gets simpler (no client state); lint, test, build after implementation | Pass |
| Writing rules | Copy, docs and comments without dash punctuation or hyphenated words | Pass |
| UI workflow (`impeccable`, `tasteskill`) | Critique ran on 2026-10-30 and drives this plan; detector runs again after implementation | Pass |

Second check after Phase 1: unchanged, all pass. No complexity tracking needed.

## Existing code inspected

- `app/page.tsx`: section order, `force-dynamic`, invitation token from `?einladung=`.
- `components/marketing/mountain-hero.tsx`: client component, motion stagger with
  `initial="hidden"` (server HTML at `opacity:0`), renders `SiteNav variant="overlay"`.
- `components/marketing/reveal.tsx`: client IntersectionObserver wrapper, starts `opacity-0`,
  also under reduced motion.
- `components/marketing/site-nav.tsx`: items Start, Camp, Packliste, Anmelden; mobile menu without
  Esc, backdrop or hash close; also used by `app/design-system/page.tsx`.
- `components/marketing/site-footer.tsx`: used by `app/packzettel/page.tsx` and
  `components/payment/payment-shell.tsx`.
- `components/marketing/intro-facts.tsx`: facts card, right aligned note clips at 375 px.
- `components/marketing/program-highlights.tsx`, `closing-cta.tsx`, `packing-teaser.tsx`:
  `max-w-[..ch]` on the Reveal wrapper (root cause of the narrow headings), hover effects on non
  links.
- `components/marketing/arrival-community.tsx`, `payment-faq.tsx`,
  `school-release-section.tsx`: become blocks or a section of the new structure.
- `components/marketing/registration-section.tsx`, `countdown-panel.tsx`.
- `lib/register/registration-state.ts` (the state rule), `lib/register/messages.ts`,
  `lib/marketing/current-camp.ts` (`getLandingCamp`, cached), `lib/marketing/availability.ts`,
  `lib/school-release/settings.ts` and `data.ts`, `lib/email/links.ts` (`appBaseUrl`),
  `lib/time/berlin.ts`, `lib/format.ts`.
- `app/layout.tsx` metadata, `app/globals.css` (`scroll-padding-top: 2rem`, reduced motion rule).
- `proxy.ts` matcher and `lib/coming-soon/gate.ts` allowlist: `/opengraph-image` is gated.
- Next.js docs: `01-app/03-api-reference/03-file-conventions/01-metadata/opengraph-image.md`.

## Decisions and assumptions

See [research.md](research.md): R1 CSS scroll driven reveal, R2 hero without hidden start state,
R3 heading measure on the heading, R4 order and open blocks, R5 CTA per state, R6 price line, R7
share image and metadata, R8 global scroll padding, R9 nav and mobile menu, R10 hover and facts
card, R11 copy location.

## UI

- **Layout**: page order per [contracts/landing-ui.md](contracts/landing-ui.md). „Gut zu wissen“:
  section heading plus one short intro line, then a grid `md:grid-cols-2 gap-4`, blocks as quiet
  surfaces (`bg-surface`, border, no wide shadow, no nested cards), one column on phones. Youth
  groups become one full width photo band with the group tags, so the persuasive part alternates
  split (facts), bento (program), full bleed band (groups), dark band (campfire): no repeated
  layout family.
- **Typography**: section headings keep the display scale (`text-4xl md:text-5xl`), measure on
  the `h2` with `text-balance`; blocks in „Gut zu wissen“ use `text-2xl` `h3`. The campfire
  heading stays `text-5xl md:text-6xl` with `max-w-[16ch]`.
- **Spacing**: section padding unchanged (`py-24 lg:py-32`); „Gut zu wissen“ blocks `p-6 md:p-8`.
- **Colors**: existing tokens only; CTA button in the nav uses the primary amber button.
- **Motion**: hero CSS `hero-rise` on eyebrow, lead, buttons; scroll reveal only via CSS view
  timeline; everything off under reduced motion.
- **States**: registration states open, countdown, closed, full drive CTA labels; no camp hides
  the price line and the release block; failing release settings hide the block; share image
  falls back to the name only.
- **Responsive**: nav on one line from 1024 px, hamburger below `md`; facts rows stack below
  `sm`; no horizontal scroll from 320 px.

## Project Structure

### Documentation (this feature)

```text
specs/024-landing-structure/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/landing-ui.md
└── tasks.md             # next: /speckit-tasks
```

### Source Code (repository root)

```text
app/page.tsx                                   # CHANGED: new order, metadata openGraph/twitter, metadataBase
app/opengraph-image.tsx                        # NEW: share image (ImageResponse, revalidate 3600)
app/globals.css                                # CHANGED: .reveal scroll driven, hero-rise keyframes, scroll padding
assets/fonts/ArchivoBlack-Regular.ttf          # NEW: font for the share image (SIL OFL)
lib/marketing/messages.ts                      # NEW: German copy for nav, footer, Gut zu wissen, price line, share alt
lib/marketing/landing-state.ts                 # NEW: cached getLandingState() (server only)
lib/marketing/camp-dates.ts                    # NEW: formatCampDateRange() (pure)
lib/register/registration-cta.ts               # NEW: registrationCta() (pure)
lib/register/messages.ts                       # CHANGED: cta labels, countdown heading with date
components/marketing/reveal.tsx                # CHANGED: server wrapper with .reveal, no observer
components/marketing/mountain-hero.tsx         # CHANGED: no motion entrance, CSS hero-rise, props for nav
components/marketing/site-nav.tsx              # CHANGED: items, CTA button, brand link, Esc/backdrop/hash close
components/marketing/site-footer.tsx           # CHANGED: optional props, Gut zu wissen, Packliste link
components/marketing/intro-facts.tsx           # CHANGED: stacked rows below sm
components/marketing/program-highlights.tsx    # CHANGED: heading measure, no hover lift or zoom
components/marketing/community-groups.tsx      # NEW: youth groups band (from arrival-community)
components/marketing/closing-cta.tsx           # CHANGED: heading measure, CTA per state
components/marketing/registration-section.tsx  # CHANGED: price line, uses getLandingState
components/marketing/good-to-know.tsx          # NEW: section with the blocks below
components/marketing/good-to-know-blocks.tsx   # NEW: ArrivalBlock, PaymentBlock, PackingBlock, SchoolReleaseBlock
components/marketing/arrival-community.tsx     # DELETED (split into blocks and community-groups)
components/marketing/payment-faq.tsx           # DELETED (now PaymentBlock)
components/marketing/packing-teaser.tsx        # DELETED (now PackingBlock)
components/marketing/school-release-section.tsx# DELETED (now SchoolReleaseBlock, link form reused)
tests/unit/registration-cta.test.ts            # NEW
tests/unit/camp-dates.test.ts                  # NEW
tests/unit/landing-price-line.test.ts          # NEW
```

**Structure Decision**: Existing single Next.js project; pure helpers in `lib/marketing` and
`lib/register`, presentation in `components/marketing`. `app/design-system/page.tsx` keeps
rendering `SiteNav variant="solid"` with default props.

## Security requirements

- No secret, no service role client: all reads use the public anon client exactly as today.
- The price line and the share image read only `basePrice` and never resolve the invitation token.
- The share image route is a public path and therefore covered by the coming soon gate.

## Acceptance criteria

All acceptance scenarios of [spec.md](spec.md) US1 to US6, FR-001 to FR-021 and SC-001 to SC-007,
verified through [quickstart.md](quickstart.md).

## Checks to run

`npm run lint`, `npm test`, `npm run build` (new route, metadata and server code), then the
Impeccable detector `node .agents/skills/impeccable/scripts/detect.mjs --json app/page.tsx components/marketing`
and one browser pass on desktop and mobile.

## Complexity Tracking

None.
