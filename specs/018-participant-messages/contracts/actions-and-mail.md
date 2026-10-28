# Contracts: Nachrichten, Änderungswünsche, Teammail

## Public Server Action `sendParticipantMessageAction(token, input)`

File `app/meine-anmeldung/[token]/actions.ts`. Input (Zod, discriminated by `kind`):

```text
{ kind: "message", text: string }                                   text trimmed, 1..2000
{ kind: "change_request", fieldKey: string, value: string | boolean, reason?: string }   reason trimmed, 0..500
```

Flow: normalize token → ip throttle (record attempt) → resolve non deleted registration by token →
per registration day limit → duplicate check (60 s) → for change requests: field allowed,
`validateField`, differs from stored → insert row → `after(() => sendTeamNotification(id))` →
`revalidatePath` of the page.

Result: `{ ok: true } | { ok: false; error: string; fieldError?: string }`. Errors (German):
invalid link (same neutral copy as 017), throttled, day limit, empty or too long, field not
available, invalid value (message of `validateField`), unchanged value, generic.

## Team mail `teamMessageEmail(ctx)`

Pure in `lib/email/team-templates.ts`.

- Subject message: `Nachricht von <Vorname Nachname> (<Referenz>)`; change request:
  `Änderungswunsch von <Vorname Nachname> (<Referenz>)`.
- Body: camp, name, reference, kind; message text, or field label with old and new value and reason;
  hint "Antworte einfach auf diese Mail, die Antwort geht an <Mail der Anmeldung>." when a reply
  address exists; link "Im Admin Bereich öffnen" to `<APP_URL>/admin`.
- All user text escaped; text version included.

`sendTeamNotification(messageId)` in `lib/email/team.ts` (server only): load row, registration and
camp mail settings; skip and log `email.skipped` without team address, provider config or quota;
claim `email_deliveries` (`team_message`, trigger `participant`); send with reply to; mark sent or
failed; log.

## Admin Server Actions (`app/admin/actions.ts`, guard `registrations`)

- `getParticipantMessagesAction(reference)` → `{ ok: true; items: AdminParticipantMessage[] } | { ok: false; error }`
- `resolveParticipantMessageAction(id, { action: "done" | "apply" | "dismiss", confirmOverwrite?: boolean })`
  → `{ ok: true } | { ok: false; error; conflict?: { current: string } }`

`AdminParticipantMessage`: id, kind, createdAt, text, fieldKey, fieldLabel, previous and proposed
as display strings, status, resolution, resolvedByName, resolvedAt.

Apply: only `change_request` with status `open`; field still allowed; `validateField` passes;
stored value equals `previous_value` unless `confirmOverwrite`; writes the column or `form_data`
key and `updated_at`; sets status `done`, resolution `applied`; `writeLog`; revalidates `/admin`
and `/admin/finanzen`.
