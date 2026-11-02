# Research: Landingpage Review Fixes

## R1 · Remaining time granularity

- **Decision**: pure `countdownRemaining(targetMs, nowMs)` returns `{ kind: "days", value }` for
  24 h or more (whole days, floored), `{ kind: "hours", value }` from 1 h to under 24 h (floored),
  `{ kind: "underHour" }` below 1 h, and `null` once reached. Singular and plural handled in copy
  („1 Tag“ / „90 Tage“, „1 Stunde“ / „5 Stunden“).
- **Rationale**: matches FR-002; flooring never promises more time than is left.
- **Alternatives**: days plus hours (still a ticking feel); calendar days instead of 24 h blocks
  (confusing around midnight).

## R2 · Ticker interval and refresh at zero

- **Decision**: keep `useSyncExternalStore`, interval 30 s, snapshot quantized to 30 s. Add a one
  shot `setTimeout` to the exact target (when it lies within 24 h) so the refresh at zero is not
  delayed by the interval.
- **Rationale**: nothing on screen changes more than once per hour, so a 30 s tick is plenty; the
  timeout keeps the existing „refresh once at zero“ behaviour precise.
- **Alternatives**: 60 s interval only (up to a minute late at opening); no ticker (stale label
  when a tab stays open overnight).

## R3 · Screen reader behaviour

- **Decision**: remove `aria-live` from the countdown. The date and remaining time are plain text,
  read when the person reaches them.
- **Rationale**: FR-003; a polite live region updating every second was an accessibility bug.

## R4 · Opening date formatting

- **Decision**: `Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long",
  year: "numeric", timeZone: "Europe/Berlin" })` for the date and
  `{ hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }` plus „Uhr“ for the time.
- **Rationale**: the old formatter had no time zone, so a visitor abroad could see a different day.

## R5 · Short nav label

- **Decision**: `{ day: "numeric", month: "numeric", timeZone: "Europe/Berlin" }` gives „1.2.“;
  copy `countdownShort` becomes `Anmeldung ab ${numeric}`.
- **Rationale**: FR-005; reads as an action. Width checked at 1024 px in the browser step.

## R6 · Reassurance wording without invented terms

- **Decision**: block titled „So geht es weiter“ with three short lines and one contact line:
  1. „Falls ein Beitrag anfällt, geht es direkt weiter zur sicheren Bezahlseite.“
  2. „Du bekommst eine Bestätigungsmail mit deinem persönlichen Link.“
  3. „Über diesen Link kannst du auch später bezahlen.“
  Contact: „Falls du doch nicht kannst, schreib uns an info@fcg-blankenheim.de.“ (mailto link)
- **Rationale**: only states what the system really does (specs/006, 007, 017); no deadlines or
  refunds (user decision 2026-11-02).

## R7 · Copy button

- **Decision**: small client component with `navigator.clipboard.writeText`, wrapped in try/catch;
  label „Kopieren“, then „Kopiert“ for 2 s; failure text „Kopieren nicht möglich“. A visually
  hidden `role="status"` region announces the outcome. The number itself stays selectable text.
- **Alternatives**: `document.execCommand("copy")` fallback (deprecated, not needed for the
  supported browsers).

## R8 · School release visibility

- **Decision**: in `loadSchoolRelease`, after `isReleaseActive`, call `getActiveRegistrationCount`
  and return `null` when it is 0 or throws. `loadLandingState` reuses that count for capacity when
  both need it, so the request makes at most one count query.
- **Rationale**: FR-011; the existing count already excludes deleted and cancelled rows.
- **Alternatives**: hide only in the countdown state (misses manual registrations before opening;
  user chose the count rule).

## R9 · Nav entry removal

- **Decision**: delete the item and the `showSchoolRelease` prop from `SiteNav`; footer keeps its
  link under the new visibility rule. Mail deep links to `#schulbefreiung` stay; a missing anchor
  leaves the page at the top (browser default).
