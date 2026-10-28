# Data Model: Kalendereintrag für das Camp

No schema change. Reads from `camps`: `id`, `name`, `start_date`, `end_date`, `location`.

## CampEvent (not stored)

```text
CampEvent
  campId: string
  name: string
  start: string          ISO date, inclusive
  end: string            ISO date, inclusive, >= start
  location: string | null
  websiteUrl: string     APP_URL
```

`toCampEvent(camp, websiteUrl)` returns null when a date is missing or `end < start`.

## CalendarLinks (not stored)

```text
CalendarLinks { icsUrl: string; googleUrl: string }
```

Added as `calendar: CalendarLinks | null` to `EmailContext` and `ParticipantView`.
