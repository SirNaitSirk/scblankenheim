# Data Model: Kompakterer Anmeldedialog

No data model change. No migration, no type regeneration.

The only new type is presentational:

- `SplitCampFields`: `{ inputs: CampFormField[]; toggles: CampFormField[] }`, where `toggles` holds every field with `fieldType === "checkbox"` and `inputs` all others, each in the original configured order.
