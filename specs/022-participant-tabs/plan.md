# Implementation Plan: Tabs auf der Teilnehmerseite

**Branch**: `022-participant-tabs` | **Date**: 2026-10-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/022-participant-tabs/spec.md`

## Summary

The participant page `/meine-anmeldung/<token>` is split into the tabs Übersicht, Meine Angaben
and Dokumente. A small client component renders an accessible tab bar and keeps all panels
mounted, hiding inactive ones, so form input and server action results survive switching. The
active tab lives in the URL fragment; the existing mail anchors `#busticket` and `#schulbefreiung`
map to Dokumente. A compact status strip above the tabs keeps cancelled state and open amounts
visible. No data, server, mail or schema change.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.4 (App Router)

**Primary Dependencies**: Tailwind CSS 4, `@phosphor-icons/react`; no new dependency

**Storage**: N/A (reads the existing `ParticipantView`)

**Testing**: Vitest 4 in node environment (`tests/unit`), manual browser checks

**Target Platform**: mobile and desktop browsers, public page

**Project Type**: web application (Next.js full stack)

**Performance Goals**: tab switch instant (no network); no added server work

**Constraints**: works without JavaScript; existing mail links stay valid; touch targets 44 px;
no horizontal scroll from 320 px

**Scale/Scope**: one page, two new files, three changed files

## Constitution Check

*GATE: Must pass before Phase 0 research. Checked again after Phase 1 design.*

| Principle | Check | Result |
|-----------|-------|--------|
| I. Fixed stack | Own component, no new dependency (research R4) | Pass |
| II. Server security boundary | No new data reaches the browser; token handling, throttling and actions unchanged | Pass |
| III. Strict scope | Layout of an in scope page; AGENTS.md section 4 participant page entry gets one sentence about the tabs | Pass |
| IV. Single source of truth | No schema change; anchors reuse `TICKET_ANCHOR` and `RELEASE_ANCHOR` | Pass |
| V. Language separation | Labels in `lib/participant/messages.ts`; code English (`overview`, `details`, `documents`) | Pass |
| VI. Tolerant payment | Strip keeps the open amount visible; no automatic action | Pass |
| VII. Simplicity, quality gates | Pure `resolveTab` with unit test; lint, test, build run after implementation | Pass |
| Writing rules | Copy and comments without dash punctuation | Pass |

Second check after Phase 1: unchanged, all pass. No complexity tracking needed.

## Existing code inspected

- `app/meine-anmeldung/[token]/page.tsx`: server page, binds the two actions, renders
  `ParticipantSummary` inside `PaymentShell`. Stays unchanged.
- `components/participant/participant-summary.tsx`: server component with header and all cards in
  one column. Main change.
- `components/participant/participant-contact.tsx`, `school-release-form.tsx`: client forms with
  local state and `startTransition`; must stay mounted (research R1). Both already own a tablist
  pattern (mode switch) to mirror.
- `components/participant/bus-ticket-card.tsx` (`id="busticket"`), `school-release-form.tsx`
  (`id="schulbefreiung"`): anchors used by mails via `lib/bus/participant.ts` and
  `lib/email/send.ts`, `lib/email/preview.ts`.
- `lib/participant/view.ts`: `status`, `payState`, `payHref`, `amounts`, `busTicket`,
  `schoolRelease` are enough for the strip and tab availability.
- `lib/participant/messages.ts`: central German copy.
- No admin preview renders `ParticipantSummary` (only the public page imports it).

## Decisions and assumptions

See [research.md](research.md): R1 panels stay mounted, R2 noscript fallback, R3 fragment mapping
and scroll, R4 own accessible tabs, R5 sticky segmented bar, R6 status strip.

## UI

- **Layout**: header unchanged → status strip (conditional) → sticky tab bar → active panel. Panels
  keep the existing card stack with `gap-6`.
- **Tab bar**: full width segmented control, `grid` with 2 or 3 equal columns, track
  `rounded-pill bg-ink-100 p-1`, segments `h-11 rounded-pill`, active `bg-surface text-foreground
  shadow-card font-semibold`, inactive `text-muted-foreground hover:text-foreground`. Sticky
  `top-0 z-10` with `bg-canvas/95 backdrop-blur` and `py-2`, so cards scroll beneath it.
- **Typography**: tab labels `text-sm`, below `sm` `text-[13px] whitespace-nowrap`; „Angaben“ as
  short label below 360 px if „Meine Angaben“ does not fit (checked in browser).
- **Status strip**: one row card `rounded-card border bg-surface px-4 py-3`, text left, small
  `ButtonLink size="sm"` right; cancelled uses the danger tone text, no button.
- **Colors**: existing tokens only; active tab distinguishable by surface, shadow and weight.
- **Scroll offset**: bus ticket and release cards get a scroll margin covering the sticky bar
  (`scroll-mt-20`).
- **Motion**: background change `transition-colors duration-150`; no panel animation (respects
  reduced motion by default).
- **States**: loading and error states unchanged (server rendered page, existing notices for not
  found and throttled). Empty: Dokumente tab absent when it would be empty.
- **Responsive**: same layout on all widths; PaymentShell keeps max width 40rem.

## Project Structure

### Documentation (this feature)

```text
specs/022-participant-tabs/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/participant-page-ui.md
└── tasks.md             # next: /speckit-tasks
```

### Source Code (repository root)

```text
lib/participant/
├── tabs.ts                      # NEW: ParticipantTab, fragments, resolveTab()
└── messages.ts                  # CHANGED: tabs and strip copy
components/participant/
├── participant-tabs.tsx         # NEW: client tab bar and panels
├── participant-summary.tsx      # CHANGED: status strip, panels grouped into tabs
├── bus-ticket-card.tsx          # CHANGED: scroll margin
└── school-release-form.tsx      # CHANGED: scroll margin
tests/unit/
└── participant-tabs.test.ts     # NEW: fragment table
AGENTS.md                        # CHANGED: one sentence in section 4 participant page
```

**Structure Decision**: Existing Next.js single project layout; logic in `lib/participant`, UI in
`components/participant`, page route untouched.

## Security requirements

- No new props cross the server client boundary beyond already rendered card content (the tabs
  component receives React nodes from the server component, plus labels and the availability
  flag).
- No change to token lookup, throttling, `robots`, `referrer` or the server actions.

## Acceptance criteria

All acceptance scenarios of [spec.md](spec.md) US1 to US4, FR-001 to FR-015 and SC-001 to SC-005,
verified through [quickstart.md](quickstart.md).

## Checks to run

`npm run lint`, `npm test`, `npm run build` (client component boundary changes).

## Manual test steps

See [quickstart.md](quickstart.md), scenarios 1 to 12.
