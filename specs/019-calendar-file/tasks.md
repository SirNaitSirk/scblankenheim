---

description: "Task list for Kalendereintrag für das Camp"
---

# Tasks: Kalendereintrag für das Camp

**Input**: Design documents from `specs/019-calendar-file/`

**Prerequisites**: plan.md, spec.md, data-model.md, contracts/calendar.md, quickstart.md

**Tests**: Unit tests for the pure builder and the mail blocks.

## Phase 1: Setup

- [X] T001 Amend `AGENTS.md` section 4 under "Public": "Calendar file (`/kalender/<campId>`): public iCalendar file with one all day event per camp plus a Google Calendar link, linked in the confirmation mail, the teaser info mail and on the participant page (specs/019-calendar-file)". Quick reference: add `app/kalender/[campId]/route.ts`. No dash punctuation.

## Phase 2: Foundational

- [X] T002 [P] Create `lib/calendar/messages.ts` with `calendarMessages.description(url)` = "Wir freuen uns auf dich! Alle Infos findest du auf <url>." and `notFound` "Nicht gefunden".
- [X] T003 Create `lib/calendar/ics.ts` (pure): `CampEvent`, `CalendarLinks`, `toCampEvent(camp, websiteUrl)` (null for missing dates or end before start), `escapeIcsText`, `foldIcsLine` (75 octets, UTF 8 aware, continuation with a leading space), `addDays(isoDate, 1)`, `buildCampIcs(event, now, host)` exactly as contracts/calendar.md, `googleCalendarUrl(event)`, `calendarFileName(name)` (slug, umlauts transliterated, fallback `camp.ics`).
- [X] T004 [P] Create `tests/unit/calendar-ics.test.ts`: CRLF only, folding of a long name with umlauts, escaping of `,;\` and newlines, exclusive end date across a month end, single day camp, null for missing or inverted dates, no location line without location, Google link dates and encoding, file name slug.
- [X] T005 Add to `lib/email/links.ts`: `calendarPath(campId)` → `/kalender/<campId>`, `calendarLinks(event)` → `{ icsUrl, googleUrl }` or null without `APP_URL`.

## Phase 3: User Story 1 · Kalenderdatei (P1)

- [X] T006 [US1] (implemented with `z.guid()` because seed camp ids are not RFC uuids, and with the request origin as fallback when `APP_URL` is empty) Create `app/kalender/[campId]/route.ts`: `GET` per contract (uuid check with Zod, service role select of `name, start_date, end_date, location`, `toCampEvent`, `buildCampIcs` with `new Date()` and the host of `APP_URL`, headers as specified; 404 plain text otherwise).

## Phase 4: User Story 2 · Links in Mails und auf der Teilnehmerseite (P1)

- [X] T007 [P] [US2] Add copy: `lib/email/messages.ts` `calendar: { intro: "Trag dir das Camp gleich in den Kalender ein:", ics: "Apple oder Outlook", google: "Google Kalender" }`; `lib/participant/messages.ts` `camp.calendarIcs: "In den Kalender"`, `camp.calendarGoogle: "Google Kalender"`.
- [X] T008 [US2] In `lib/email/layout.ts` add `renderLinkPair(intro, links)` in the style of `renderTextLink`; in `lib/email/templates.ts` add `calendar: CalendarLinks | null` to `EmailContext`, export `calendarBlock(ctx)` (null without links) and insert it after the facts in `confirmationEmail`; in `lib/email/info-templates.ts` insert it after the facts in `teaserInfoEmail`.
- [X] T009 [US2] In `lib/email/send.ts` select `id, location` for the camp in every place that builds a mail target (`loadMailTarget`, reminders run, info run in `lib/email/info-run.ts`, the `CampRow` type) and set `calendar` from `toCampEvent` and `calendarLinks`; in `lib/email/preview.ts` set sample links from the preview camp (add `id` and `location` to `PreviewCamp` and its callers).
- [X] T010 [P] [US2] Update `tests/unit/email-templates.test.ts`, `tests/unit/email-info-templates.test.ts`, `tests/unit/email-preview.test.ts` fixtures with `calendar`, and assert the block in confirmation (both variants) and teaser, and its absence with `calendar: null`.
- [X] T011 [US2] Add `calendar: CalendarLinks | null` to `ParticipantView` (`lib/participant/view.ts`, camp input gains `id`; lookup selects `id`), update `tests/unit/participant-view.test.ts`, and render two `ButtonLink`s (`variant="outline"`, `size="sm"`, Google link with `target="_blank"` and `rel="noopener noreferrer"`) in the camp card of `components/participant/participant-summary.tsx`.

## Phase 5: Polish

- [X] T012 (file fetched from the dev server: headers, CRLF, folding, exclusive end checked; import into a real calendar app left to the project owner; participant card checked at 375px with sample data) Open the route in the browser and import the file into Calendar on macOS if available; check the participant card at 375px.
- [X] T013 Run `npm run lint`, `npm test`, `npm run build`; report verbatim.

## Dependencies

T001 first; T002 to T005 before the stories (T004 after T003, T005 after T003); T006 after T005;
T007 parallel; T008 → T009 → T010; T011 after T005. Polish last.
