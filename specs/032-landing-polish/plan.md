# Implementation Plan: Landingpage Polish

**Branch**: `032-landing-polish` (work continues on `026-hero-video`) | **Date**: 2026-11-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/032-landing-polish/spec.md`

## Summary

Refinement only, no new sections or claims. Hero: the eyebrow shows the camp date range (fallback
brand name), the vertical 10px tag goes. Copy: intro facts, program tiles and the campfire band move
their German strings into `lib/marketing/messages.ts`, fixing the hyphen and „&“. Details: payment
methods as one „·“ line, facts card without the wide shadow, footer and legal links with a 44px hit
area on phones.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.4 (App Router)
**Primary Dependencies**: existing only
**Storage**: none
**Testing**: Vitest suite stays green; browser check desktop and 375px; Impeccable detector (CLI and
browser overlay)
**Target Platform**: Vercel, mobile and desktop browsers
**Project Type**: web application
**Constraints**: preserve the incumbent look (polish, not redesign); no dash punctuation; German copy
only in messages
**Scale/Scope**: 7 components, 1 messages module, 1 page

## Constitution Check

| Principle | Check | Result |
|---|---|---|
| I. Fixed stack | No dependency | Pass |
| II. Server boundary | Camp dates already read on the server | Pass |
| III. Strict scope | Existing landing page | Pass |
| IV. Single source of truth | Contact address from one constant | Pass |
| V. Language separation | Hardcoded German copy moves into messages | Pass |
| VI. Payment and pricing | Only the public base price, unchanged | Pass |
| VII. Simplicity | Local edits, no abstraction; lint, test, build | Pass |
| Writing rules | Fixes the two remaining violations | Pass |

Post design re-check: unchanged.

## Decisions

- **Hero eyebrow**: `app/page.tsx` passes `formatCampDateRange(camp.startDate, camp.endDate)` as
  `dateRange` to `MountainHero`; null falls back to `marketingMessages.hero.eyebrow`. Same styling.
- **Vertical tag**: removed with `brand.heroTag`; `campYear` prop of the hero goes if unused.
- **Payment line**: `paymentMethods.join(" · ")` as one muted paragraph; `Tag` stays for the other
  blocks that use it (only removed if unused).
- **Facts card**: drop `shadow-warm`, keep `border-amber-100`.
- **Hit area**: footer and legal links get `inline-flex min-h-11 items-center` on phones,
  `md:min-h-0` on desktop; the gaps shrink so the row height stays close to today.
- **Contact**: closing band uses `registerMessages.section.contactHref`.

## Project Structure

```text
app/page.tsx                                  # pass dateRange to the hero
components/marketing/mountain-hero.tsx         # eyebrow from dateRange, no vertical tag
components/marketing/intro-facts.tsx           # copy from messages, no shadow-warm
components/marketing/program-highlights.tsx    # copy from messages
components/marketing/closing-cta.tsx           # shared contact href
components/marketing/good-to-know-blocks.tsx   # payment methods as one line
components/marketing/site-footer.tsx           # 44px hit area on phones
app/design-system/page.tsx                     # adjust hero props if needed
lib/marketing/messages.ts                      # new intro and program copy, heroTag removed
```

## Checks

`npm run lint`, `npm test`, `npm run build`; browser at desktop and 375px per spec; detector CLI on
`components/marketing` and the browser overlay once.

## Complexity Tracking

None.
