# Implementation Plan: Landingpage Review Fixes (Countdown, Rückversicherung, Schulbefreiung)

**Branch**: `031-landing-review-fixes` (work continues on the current branch `026-hero-video`, like specs 027 and 028) | **Date**: 2026-11-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/031-landing-review-fixes/spec.md`

## Summary

Three focused landing page changes, no schema, API or route change:

1. **Countdown**: `countdown-panel.tsx` drops the four ticking tiles. A pure helper computes the
   remaining time as whole days, whole hours or „unter einer Stunde“; the panel shows the opening
   date with weekday and time (Europe/Berlin) as the large element and the remaining time as a
   quiet line. No `aria-live`. The ticker runs every 30 s instead of every second and still
   refreshes once at zero. The nav short label becomes „Anmeldung ab 1.2.“.
2. **Reassurance**: the review step of `registration-form.tsx` shows a short „So geht es weiter“
   block above the action row (payment page, confirmation mail with personal link, paying later,
   contact for withdrawal). The success notice shows the reference number in its own row with a
   copy button and the mail hint. The payment block text names paying later.
3. **School release**: the nav loses the entry and its `showSchoolRelease` prop. `landing-state.ts`
   only returns release settings when the current camp has at least one active registration. The
   block's submit button becomes `variant="outline"`.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.4 (App Router)

**Primary Dependencies**: existing only (Tailwind CSS 4, `motion`, `@phosphor-icons/react`); clipboard
via the browser's `navigator.clipboard`

**Storage**: none new; one extra `count` query on `registrations` per landing request at most
(existing `getActiveRegistrationCount`)

**Testing**: Vitest unit tests for the new countdown helper and the changed short label
(`tests/unit/registration-cta.test.ts`); browser check per [quickstart.md](quickstart.md);
Impeccable detector on the changed components

**Target Platform**: Vercel, mobile and desktop browsers

**Project Type**: web application (Next.js full stack)

**Performance Goals**: the countdown rerenders twice a minute instead of every second; the landing
request gets at most one more cheap `head` count

**Constraints**: German copy only in the messages modules, no dash punctuation, no invented
cancellation terms (spec FR-007)

**Scale/Scope**: about 9 source files, 2 message modules, 2 test files

## Constitution Check

| Principle | Check | Result |
|---|---|---|
| I. Fixed stack | No new dependency; Clipboard API is a browser API | Pass |
| II. Server boundary | Count runs in the existing server helper with the service client; nothing new reaches the browser except the boolean outcome | Pass |
| III. Strict scope | Landing page, form and school release section are in scope (AGENTS.md section 4) | Pass |
| IV. Single source of truth | Same one form; release visibility stays in `landing-state.ts` | Pass |
| V. Language separation | New copy in `lib/register/messages.ts`, `lib/marketing/messages.ts`; code English | Pass |
| VI. Tolerant payment | Copy now states paying later, which matches the tolerant fallback; no price shown | Pass |
| VII. Simplicity | One pure helper, one small client component; lint, test, build | Pass |
| Writing rules | All new strings checked for dashes; the hyphenated program tile title is out of scope here | Pass |

Post design re-check: unchanged, no violations.

## Project Structure

### Documentation (this feature)

```text
specs/031-landing-review-fixes/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── landing-ui.md
├── checklists/
│   └── requirements.md
└── tasks.md            # /speckit-tasks
```

### Source Code (repository root)

```text
lib/
├── register/
│   ├── countdown.ts                 # NEW pure helper: remaining time + opening label
│   ├── registration-cta.ts          # short label „Anmeldung ab 1.2.“
│   └── messages.ts                  # countdown, reassurance, success, copy button copy
├── marketing/
│   ├── landing-state.ts             # release only with ≥ 1 active registration
│   └── messages.ts                  # payment block text
components/
├── marketing/
│   ├── countdown-panel.tsx          # date led layout, 30 s ticker, no aria-live
│   ├── registration-form.tsx        # reassurance block on review, reference row on success
│   ├── registration-reassurance.tsx # NEW static block for the review step
│   ├── copy-reference.tsx           # NEW client button: copy reference, status message
│   ├── site-nav.tsx                 # drop school release item and prop
│   ├── mountain-hero.tsx            # stop passing showSchoolRelease to the nav
│   └── school-release-link-form.tsx # submit variant outline
app/
├── page.tsx                         # unchanged props apart from hero
└── design-system/page.tsx           # adjust SiteNav usage
tests/unit/
├── countdown.test.ts                # NEW
└── registration-cta.test.ts         # updated short label
```

**Structure Decision**: existing Next.js layout; new code sits next to the code it serves.

## Security

No new route, no new input. The active registration count only decides visibility; the number is
not rendered. The copy button works on the reference already shown to the person.

## Acceptance and checks

Acceptance per spec user stories 1 to 3. Checks: `npm run lint`, `npm test`, `npm run build`
(server helper changes), Impeccable detector on changed components, manual steps in
[quickstart.md](quickstart.md).

## Complexity Tracking

None.
