# Contracts: Schulbefreiung

All input validated with Zod on the server. German copy in the messages modules.

## Participant

### Server Action `saveSchoolReleaseAction(token, prev, formData)`

File `app/meine-anmeldung/[token]/actions.ts`.

- Input: `teacherName`, `schoolName`, `schoolAddress`, `participantAddress`, `className?`.
- Checks in order: token shape, ip throttle (`submission_attempts` kind `school_release`, 10 per
  10 minutes), registration by token (not deleted, status `active`), release on for its camp, Zod.
- Effect: upsert `school_releases` (`updated_by = 'participant'`); in `after()` send the
  `school_release` mail unless the data are unchanged and a release mail went out within 60 seconds,
  and only within `DAILY_EMAIL_BUDGET - CONFIRMATION_RESERVE`.
- Result:
  `{ status: "idle" } | { status: "saved"; mail: "queued" | "skipped" } | { status: "error"; error: string; fieldErrors?: Record<string, string> }`.
  `mail: "skipped"` when there is no address or the quota is used up (FR-009).

### GET `/meine-anmeldung/[token]/befreiung`

- 200 `application/pdf`, `Content-Disposition: attachment; filename="Schulbefreiung-<Nachname>.pdf"`,
  `Cache-Control: no-store`, `X-Robots-Tag: noindex`.
- 404 (same body for every failure) when token invalid, registration missing, deleted or cancelled,
  release off, or no saved data. Misses count toward the participant page ip throttle.

## Landing

### Server Action `requestParticipantLinkAction(prev, formData)`

File `app/actions/participant-link.ts`.

- Input: `email` (trimmed, lowercased, max 254), `target` from allow list `["school_release"]`.
- Always returns `{ status: "done" }` for valid input, `{ status: "error", error }` only for an
  invalid email or the ip throttle (5 per 10 minutes).
- In `after()`: find active, non deleted registrations of the current camp with matching email;
  for each, unless a `participant_link` mail went out within 10 minutes or 3 today, send one
  `participant_link` mail with `participantUrl(token) + "#schulbefreiung"`.
- Does nothing in `after()` when the release is off for the current camp.

## Admin (Clerk)

### Server Actions in `app/admin/actions.ts`

| Action | Permission | Effect |
|---|---|---|
| `loadSchoolReleaseAction(reference)` | admin session (`requireAdmin`), like the mail history | data or null, plus `available` (release on, registration active) and `canEdit` |
| `saveSchoolReleaseAdminAction(reference, input)` | `registrations` edit | upsert, `updated_by = <clerk id>`, log without values |
| `sendSchoolReleaseAction(reference)` | `registrations` edit | `school_release` mail, trigger `admin`, quota check |

### Server Actions in `app/admin/camps/[campId]/infomails/actions.ts`

| Action | Permission | Effect |
|---|---|---|
| `saveReleaseSettingsAction(campId, input)` | `camps` | dates, signer, address keys, switch; rejects switch on when incomplete |
| `uploadSignatureAction(campId, formData)` | `camps` | PNG or JPEG, max 512 KB, magic byte check, upload, replace path, remove old object |
| `removeSignatureAction(campId)` | `camps` | remove object, clear path, set `release_enabled = false` |

### GET `/api/admin/school-release/[reference]`

Clerk plus permission `registrations`. Addressed by the registration reference like every other
dialog action (changed during implementation from the registration id). PDF as above; 404 when no
data. Works while the release is off.

### GET `/api/admin/school-release/preview/[campId]`

Clerk plus permission `camps`. PDF with sample data and the camp's current settings; works while
the switch is off, as long as a signature exists (otherwise a placeholder box "Unterschrift fehlt").

## Mails (code defined)

| Kind | To | Content |
|---|---|---|
| `school_release` | registration email | greeting, short text, dates, PDF attachment, link to participant page |
| `participant_link` | registration email | first name, camp, button "Zur Schulbefreiung" with deep link |
| block in `confirmation` and `info_teaser` | | heading "Schulbefreiung", dates, button to `#schulbefreiung` |

All four visible in `/admin/mail` preview with sample data.

## PDF layout (A4, one page)

Sender block (camp name, contact from mail settings) · recipient block (teacher, school, school
address) · place and date · subject "Bitte um Unterrichtsbefreiung" · body with participant name,
participant address, class, camp name, camp period, release dates · closing · signature image ·
signer name and role.
