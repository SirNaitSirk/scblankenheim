# Data Model: Admin am Handy und als Homescreen App

No database change. No new table, column or migration.

Static files added:

- `public/admin.webmanifest`: web app manifest, see [contracts/ui.md](contracts/ui.md).
- `public/admin-icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`.
- `app/admin/apple-icon.png` (180 x 180).

Client state: none new. The bottom bar reads the same `visibleTabs` and role the sidebar already
receives from `app/admin/layout.tsx`.
