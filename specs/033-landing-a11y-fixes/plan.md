# Implementation Plan: Landingpage Zugänglichkeit und Abschluss

**Branch**: `033-landing-a11y-fixes` (work continues on `026-hero-video`) | **Date**: 2026-11-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/033-landing-a11y-fixes/spec.md`

## Summary

`registration-form.tsx`: the local `Notice` gets `role="status"`, a heading with `tabIndex={-1}`
that is focused and scrolled into view on mount. The submit stores `checkoutUrl` in state; the
redirect notice shows a fallback link after 5 s. `site-nav.tsx`: hamburger `h-11 w-11`.
`globals.css`: `.eyebrow` at 12px. Section eyebrow colors move from `amber-600` to `amber-700`.
Countdown intro copy without „Countdown“.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.4
**Primary Dependencies**: existing only
**Storage**: none
**Testing**: Vitest stays green; browser check of nav and labels at 375 px and desktop; contrast
computed in the browser; success and redirect states checked from source plus a forced render if the
form is reachable (registration currently in countdown)
**Constraints**: no new copy beyond the fallback link label and the changed intro
**Scale/Scope**: 4 source files, 1 messages module

## Constitution Check

| Principle | Check | Result |
|---|---|---|
| I. Fixed stack | No dependency | Pass |
| II. Server boundary | Checkout URL already reaches the browser today | Pass |
| III. Strict scope | Existing form and landing page | Pass |
| IV. Single source of truth | Same one form | Pass |
| V. Language separation | Link label in `lib/register/messages.ts` | Pass |
| VI. Tolerant payment | Fallback link only eases reaching Stripe; paying later unchanged | Pass |
| VII. Simplicity | Local edits; lint, test, build | Pass |
| Writing rules | New strings checked | Pass |

Post design re-check: unchanged.

## Decisions

- **Focus**: `Notice` gets a `headingRef`; `useEffect` on mount calls `focus({ preventScroll: true })`
  and `scrollIntoView({ block: "center", behavior })` with `behavior` from `useReducedMotion`.
- **Status**: container `role="status"`; the title is a `h3` (form heading level) so headings stay in
  order.
- **Fallback link**: `checkoutUrl` state set before `window.location.assign`; a `useEffect` in the
  redirect branch starts a 5 s timer that reveals `ButtonLink` „Zur Bezahlseite“ (`variant="outline"`).
- **Contrast**: `.eyebrow` 12px; it already uses `--muted-foreground` (checked ≥ 4.5:1 in the browser);
  `registration-section.tsx` and `community-groups.tsx` eyebrows use `text-amber-700`. Program kicker
  `text-[11px]` on the dark photo becomes `text-xs`.
- **Hamburger**: `h-11 w-11`.

## Project Structure

```text
components/marketing/registration-form.tsx   # Notice focus and status, redirect fallback link
components/marketing/site-nav.tsx            # hamburger 44px
components/marketing/registration-section.tsx # eyebrow amber-700
components/marketing/community-groups.tsx     # eyebrow already amber-700, verify contrast
components/marketing/program-highlights.tsx   # kicker 12px
app/globals.css                               # .eyebrow 12px
lib/register/messages.ts                      # countdown intro, form.toPayment
```

## Checks

`npm run lint`, `npm test`, `npm run build`; browser at 375 px and desktop for nav size, label size and
computed contrast; detector CLI once.

## Complexity Tracking

None.
