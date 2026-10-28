# Research: Mailübersicht pro Anmeldung

No NEEDS CLARIFICATION remains.

## R1 · Load on open, not with the list

- **Decision**: a Server Action `getRegistrationMailsAction(reference)` in `app/admin/actions.ts`,
  called by the dialog when it opens in edit mode. The dashboard query and `mapRegistration` stay as
  they are (reminder count included).
- **Rationale**: FR-009 and SC-003; loading every delivery for every registration with the list would
  grow the page payload for data that is rarely looked at.
- **Alternatives**: extend `loadReminderInfo` to return full histories (heavier list load); a route
  handler `GET /api/admin/registrations/[ref]/mails` (more code than a Server Action for an admin only
  read used by one component).

## R2 · Data access

- **Decision**: a server only helper `getMailHistory(registrationId)` in `lib/email/deliveries.ts`
  selecting `kind, status, trigger, actor, error, created_at, updated_at` from `email_deliveries`
  for that registration, ordered by `created_at desc`, `limit 50`. Admin names are resolved with one
  read of `profiles (id, name, email)` for the distinct actor ids. The reference is resolved to the
  registration id with the existing `referenceSchema` and a lookup by `reference`.
- **Rationale**: one indexed query (`email_deliveries_registration_idx` is `(registration_id,
  created_at desc)`), no join filters (AGENTS.md gotcha), no new table.

## R3 · Pure mapping

- **Decision**: a pure function `toMailHistory(rows, adminNames)` in a new `lib/email/history.ts`
  returning `MailHistoryEntry[]` with `kind`, `label key`, `status` (`sent`, `failed`, `sending`; the
  stored `failed` with error `stale` also maps to `failed`), `trigger` (`registration`, `cron`,
  `admin`), `actorName` (null when unknown) and `at` (`updated_at` for sent, else `created_at`).
  German labels come from `de.registrations.mails` in `lib/admin/messages.ts`; unknown kinds use the
  fallback „Mail“.
- **Rationale**: testable without the database, same split as `reminders.ts` and `send.ts`.

## R4 · Privacy

- **Decision**: the action returns only the mapped entries. Provider message ids and raw error codes
  are not sent to the browser; the address and body are not stored anywhere to begin with.
- **Rationale**: FR-008 and the logging rules of 007.

## R5 · Refresh after sending

- **Decision**: the dialog keeps the history in local state; after `onSendPaymentLink` resolves (ok or
  not) it reloads the history.
- **Rationale**: FR-010 with no extra state library; TanStack Query is not used in this dialog today.

## R6 · Time zone

- **Decision**: add `formatDateTimeBerlin(iso)` to `lib/format.ts` with `timeZone: "Europe/Berlin"`
  and use it for the entries.
- **Rationale**: the existing `formatDateTime` uses the browser time zone; FR-003 asks for German
  time.
