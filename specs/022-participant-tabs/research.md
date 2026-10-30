# Research: Tabs auf der Teilnehmerseite

**Feature**: specs/022-participant-tabs · **Date**: 2026-10-30

## R1 · Panels stay mounted, inactive ones get `hidden`

- **Decision**: All three panels are rendered once and stay in the tree. Only the active panel is
  visible; the others carry the `hidden` attribute.
- **Rationale**: `ParticipantContact` and `SchoolReleaseForm` keep their input and result state in
  React state and submit through `startTransition`. Unmounting a panel would drop that state
  (FR-010). Keeping the panels mounted also keeps the server action flow unchanged: after
  `revalidatePath` the refreshed RSC payload reuses the same component positions, so state and the
  active tab survive a submit.
- **Alternatives considered**: Rendering only the active panel (loses input); one route per tab
  with `?tab=` search params (full navigation per switch, loses input, breaks the old `#busticket`
  links).

## R2 · Without JavaScript all sections stack

- **Decision**: The server renders the tab bar and hides inactive panels with `hidden`, so the
  common case (no fragment, Übersicht) paints correctly before hydration. A `<noscript><style>`
  block hides the tab bar and forces every panel visible (`[hidden]` overridden to `display:block`
  through a data attribute selector).
- **Rationale**: Meets FR-011 without a second layout and without a flash on the default tab.
  React 19 renders `noscript` children on the server and ignores them on the client, so there is no
  hydration mismatch.
- **Alternatives considered**: Rendering everything visible and collapsing after hydration (layout
  jump on every visit); a blocking inline script that reads the hash before paint (extra inline
  script on a public page for a rare case).

## R3 · Fragment handling

- **Decision**: A pure function `resolveTab(hash, available)` maps the fragment to a tab and an
  optional scroll target. `#uebersicht`, `#angaben`, `#dokumente` select their tab; `#busticket`
  (`TICKET_ANCHOR`) and `#schulbefreiung` (`RELEASE_ANCHOR`) select Dokumente and return their
  element id as scroll target; anything else, or a fragment for a missing tab, selects Übersicht.
  The client reads `location.hash` after mount and on `hashchange`. A tab click sets the state and
  calls `history.replaceState` with the new fragment (no new history entry, no `hashchange`, no
  jump).
- **Rationale**: Old mail links keep working without touching templates (FR-008, FR-015). The tab
  fragments never match an element id on the page, so the browser never jumps on its own. A
  pure function is testable in the existing node only Vitest setup.
- **Hash on first load**: the server cannot see the fragment, so a mail link to Dokumente shows
  Übersicht until hydration and then switches. This is a single short switch, accepted.
- **Scroll**: for `#busticket` and `#schulbefreiung` the browser cannot scroll on load because the
  target sits in a hidden panel. After activation the client scrolls the target into view on the
  next animation frame. The existing `scroll-mt-6` on both cards is extended by the height of the
  sticky tab bar.
- **Alternatives considered**: `useSyncExternalStore` over `hashchange` (replaceState fires no
  event, so a manual notifier would be needed; plain state plus one effect is simpler).

## R4 · Accessible tabs without a new dependency

- **Decision**: Own small client component following the WAI ARIA tabs pattern: `role="tablist"`
  with `aria-label`, buttons with `role="tab"`, `aria-selected`, `aria-controls`, roving
  `tabIndex`; panels with `role="tabpanel"`, `aria-labelledby`, `tabIndex={0}`. Arrow Left and
  Right move and activate (automatic activation, content is cheap to show), Home and End jump to
  the ends. Focus moves only on keyboard interaction, never on fragment activation.
- **Rationale**: No Radix Tabs in `components/ui`; the project already hand rolls a tablist in
  `ParticipantContact` and `bus-station`. Constitution I requires justification for new
  dependencies; none is needed for about 80 lines.
- **Alternatives considered**: `@radix-ui/react-tabs` (new dependency, and its unmount behaviour
  would need `forceMount` plus custom hiding anyway).

## R5 · Visual form

- **Decision**: A segmented control in the same language as the existing mode switch (pill track
  `bg-ink-100`, active segment `bg-surface` with `shadow-card`), but page level: full width grid
  with two or three equal columns, segment height `h-11` (44 px, FR-013), text `text-sm
  font-semibold`. The bar is `sticky top-0` with a `bg-canvas` backing and small vertical padding,
  so it stays reachable while scrolling long panels. Active state is shown by surface, shadow and
  weight, not by color alone (FR-012).
- **Width check**: at 320 px the content width is 272 px (PaymentShell `px-6`). Three columns give
  about 88 px each; „Meine Angaben“ in `text-sm` semibold is about 95 px, so labels use `text-[13px]`
  below `sm` and may not wrap (`whitespace-nowrap`, tight `px-2`). Verified in the browser during
  implementation; fallback is the short label „Angaben“ below 360 px.
- **Alternatives considered**: Underline tabs (look like links on a page full of cards); bottom
  navigation bar (conflicts with the pay button and iOS home indicator).

## R6 · Compact status strip

- **Decision**: Above the tabs, below the greeting, a single row shown only when
  `view.status === "cancelled"` (danger tone text „Deine Anmeldung ist storniert.“) or
  `view.payState === "pay" && view.payHref` (text „Noch 60,00 € offen“ with a small „Jetzt
  bezahlen“ button). Otherwise nothing renders (FR-006).
- **Rationale**: Uses values already present in `ParticipantView`; no new data. The full status
  card stays in Übersicht.
