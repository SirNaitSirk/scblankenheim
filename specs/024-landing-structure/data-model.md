# Data Model: Landingpage Aufbau, Gestaltung und Technik

No schema change, no migration, no new table or column. The feature only reads existing data
through existing helpers.

## Read sources

| Source | Helper | Used for |
|---|---|---|
| `camp_settings.current_camp_id`, `camps` | `getLandingCamp()` (`lib/marketing/current-camp.ts`, React `cache`) | name, start and end date, base price, registration window |
| active registration count | `getActiveRegistrationCount()` | registration state `full` |
| release settings of the camp | `getReleaseSettings()`, `isReleaseActive()` | whether the Schulbefreiung block and nav item show |

## Derived view: LandingState (new, server only)

One cached server helper `getLandingState()` in `lib/marketing/landing-state.ts` so the page, the
hero nav, the campfire band, the registration section and „Gut zu wissen“ agree within one request.

| Field | Type | Rule |
|---|---|---|
| `camp` | `LandingCamp \| null` | `getLandingCamp()` |
| `registrationState` | `"open" \| "countdown" \| "closed" \| "full"` | `getRegistrationState(camp, now, activeCount)` (unchanged rule) |
| `opensAt` | `string \| null` | `camp.opensAt` |
| `cta` | `{ label: string; shortLabel: string; href: "#anmelden" }` | `registrationCta(state, opensAt)` (research R5) |
| `schoolRelease` | `ReleaseSettings \| null` | settings when camp exists, camp not over, settings readable and `isReleaseActive` (unchanged rule of spec 020); null hides the block and the nav item |

Failures degrade exactly as today: no camp means state `closed` and no release block; a failing
release settings read hides the block.

## Pure helpers (unit tested)

- `registrationCta(state, opensAt)` → labels per research R5 table.
- `formatCampDateRange(start, end)` → „24. bis 28. Mai 2027“, „30. Mai bis 2. Juni 2027“,
  „28. Dezember 2026 bis 3. Januar 2027“, a single date when start equals end, `null` when start is
  missing.
- `priceLine(basePrice)` → the German price and payment line of research R6.
