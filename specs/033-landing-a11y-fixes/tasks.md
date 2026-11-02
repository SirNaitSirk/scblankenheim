# Tasks: Landingpage Zugänglichkeit und Abschluss

**Input**: [plan.md](plan.md), [spec.md](spec.md)

## Phase 1: User Story 1 · Abschluss wahrnehmbar (P1)

- [X] T001 [US1] `lib/register/messages.ts`: add `form.toPayment` „Zur Bezahlseite“.
- [X] T002 [US1] `components/marketing/registration-form.tsx`: `Notice` with `role="status"`, `h3`
  title with `tabIndex={-1}`, focus and scroll into view on mount (instant under reduced motion).
- [X] T003 [US1] `components/marketing/registration-form.tsx`: keep `checkoutUrl` in state; in the
  redirect notice show an outline `ButtonLink` to it after 5 s.

## Phase 2: User Story 2 · Kleine Ausschlüsse (P2)

- [X] T004 [P] [US2] `components/marketing/site-nav.tsx`: hamburger `h-11 w-11`.
- [X] T005 [P] [US2] `app/globals.css`: `.eyebrow` font size 12px.
- [X] T006 [P] [US2] `components/marketing/registration-section.tsx`: eyebrow `text-amber-700`;
  `components/marketing/program-highlights.tsx`: kicker `text-xs`.
- [X] T007 [US2] `lib/register/messages.ts`: `section.countdown.intro` „Merk dir den Termin vor. Ab
  dann kannst du dich hier anmelden.“

## Phase 3: Polish

- [X] T008 `npm run lint`, `npm test`, `npm run build`; report verbatim.
- [X] T009 Browser at 375 px and desktop: hamburger size, label sizes, computed contrast of every
  `.eyebrow`; detector CLI on `components/marketing`.

## Dependencies

T001 before T003; T002 before T003 (same file); T001 before T007 (same file). Rest independent.
