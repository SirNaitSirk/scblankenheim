# Data Model: Coming Soon Sperre

No schema change and no migration.

- **Switch**: server environment variable `COMING_SOON`. On only for the exact value `true`.
- **Admin**: existing `profiles` row keyed by the Clerk user id (read only, column `id`).
- **Camp name**: existing current camp from `camp_settings` and `camps` via `getCurrentCamp`.
