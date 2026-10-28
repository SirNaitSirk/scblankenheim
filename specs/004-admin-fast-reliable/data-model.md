# Data Model: Adminbereich zuverlässig und schnell

No schema change, no migration, no new type. Affected read paths only:

| Loader | Tables | Change |
|--------|--------|--------|
| `loadCurrentCampId` | `camp_settings` | memoized per render |
| `loadCamps` (`getCamps`, `getCurrentCamp`, `getCampById`) | `camps`, `registrations`, `camp_form_fields` | memoized per render |
| `getCurrentProfile` | `profiles`, `user_roles` | memoized per render |
| all other admin reads | unchanged tables | 3s read timeout, single retry layer |
