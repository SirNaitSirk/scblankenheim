# UI Contract: Admin am Handy und als Homescreen App

## Manifest `public/admin.webmanifest`

```json
{
  "name": "Summercamp Admin",
  "short_name": "SC Admin",
  "start_url": "/admin",
  "scope": "/",
  "display": "standalone",
  "background_color": "#ececee",
  "theme_color": "#ffffff",
  "lang": "de",
  "icons": [
    { "src": "/admin-icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/admin-icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/admin-icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

## Head of every `/admin` page

- `<link rel="manifest" href="/admin.webmanifest">`
- exactly one `<link rel="apple-touch-icon">`, pointing to the admin icon
- `<meta name="apple-mobile-web-app-capable" content="yes">` (or `mobile-web-app-capable`),
  `apple-mobile-web-app-title` „Summercamp Admin“, `apple-mobile-web-app-status-bar-style` `default`
- `<meta name="viewport">` containing `viewport-fit=cover`, without `maximum-scale`
- `<meta name="theme-color">` for light `#ffffff` and dark `#17171a`; after hydration a single
  value that follows the chosen admin theme

Public pages: none of the above changes; still the public `apple-touch-icon`, no manifest link.

## Visibility by context

| Element | Safari phone | Safari from `md` | Home screen phone | Home screen from `md` |
|---|---|---|---|---|
| Card list Anmeldungen | yes | no (table) | yes | no (table) |
| Theme control in topbar | no (in drawer) | yes | no (in drawer) | yes |
| Reload button | no | no | yes | yes |
| Bottom bar | no | no | yes | no |

## Bottom bar entries

Order: Übersicht (`/admin`), Finanzen (`/admin/finanzen`), Bus (`/admin/bus`), Menü (opens the
drawer). Each of the first three only when `canSeeTab` allows it. Active entry by the sidebar rule:
`/admin` exact, others by prefix.

## Minimum sizes below `md`

44 x 44 points for: drawer toggle, nav items, theme buttons, `Button` size `sm`, menu trigger,
dialog close, reload button, bottom bar entries.
