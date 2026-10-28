# Research: Kompakterer Anmeldedialog

## R1 · How to widen only this dialog

- Decision: pass a `className` with larger `max-w` values to the shared `Dialog`.
- Rationale: `Dialog` already merges `className` with `cn` (tailwind merge), so later `max-w` classes win. Other dialogs stay untouched.
- Alternatives: a `size` prop on `Dialog` (more API for one caller, rejected); changing the default width (would affect every dialog, rejected).

## R2 · Column count

- Decision: 1 column below 640 px, 2 from 640 px, 3 for camp fields and 4 for contact and registration from 1024 px.
- Rationale: at about 1024 px dialog width minus padding, three camp fields get roughly 300 px each, enough for selects with long option labels; the core sections hold fixed short fields, so four fit.
- Alternatives: CSS auto fill grid (`minmax`), rejected because the column count would jump unpredictably with dialog width.

## R3 · Toggles

- Decision: collect checkbox fields after the input fields in their own grid.
- Rationale: a switch needs one line, a full grid cell next to a labelled input wastes about half its height. Approved with the spec.
- Alternatives: keep original order in the same grid (less compact, mixed row heights).

## R4 · Textareas

- Decision: textarea fields span the full grid row from `sm` upwards.
- Rationale: long free text stays readable (spec FR-003).
