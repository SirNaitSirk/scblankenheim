# Contract: Kalenderdatei

## `GET /kalender/[campId]`

- `campId` must have the 8 4 4 4 12 hex shape (`z.guid()`), else 404. Base URL is `APP_URL`, or the request origin when it is empty.
- Camp missing, dates missing or end before start → 404, body "Nicht gefunden", `text/plain`.
- Success → 200, `Content-Type: text/calendar; charset=utf-8`,
  `Content-Disposition: attachment; filename="<slug of camp name>.ics"`, `Cache-Control: no-store`.

Body (CRLF, folded at 75 octets):

```text
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//FCG Blankenheim//CampConnect//DE
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:camp-<campId>@<host>
DTSTAMP:<now UTC, YYYYMMDDTHHMMSSZ>
DTSTART;VALUE=DATE:<start YYYYMMDD>
DTEND;VALUE=DATE:<end plus one day YYYYMMDD>
SUMMARY:<camp name escaped>
LOCATION:<location escaped>            (only when set)
DESCRIPTION:<German description with website link, escaped>
URL:<APP_URL>
END:VEVENT
END:VCALENDAR
```

Description copy: "Wir freuen uns auf dich! Alle Infos findest du auf <url>."

## Google link

`https://calendar.google.com/calendar/render?action=TEMPLATE&text=<name>&dates=<start>/<end plus one>&details=<description>&location=<location>`,
every value `encodeURIComponent`, `location` omitted when empty.

## Mail and page

- `EmailContext.calendar: CalendarLinks | null`, built in `buildMailTarget` from the camp (send
  selects `id, location` in addition).
- Block in confirmation (both variants) after the facts and in the teaser info mail after the facts.
- `ParticipantView.calendar` rendered in the camp card.
