# Implementation Plan: Anmeldebestätigung bei Anmeldungen aus dem Admin

**Branch**: `039-admin-confirmation-mail` | **Date**: 2026-11-05 | **Spec**: [spec.md](spec.md)

## Summary

The admin create action gets an optional `sendConfirmation` flag. After the insert it looks up the
new registration id and schedules the existing `sendConfirmationEmail` through `after()`, with
trigger `admin` and the acting admin. The create dialog shows a switch, on by default. No schema
change, no new template.

## Existing code inspected

- `app/api/register/route.ts:79`: public flow sends via `after(() => sendConfirmationEmail(id))`.
- `lib/email/send.ts:247`: `sendConfirmationEmail(registrationId)` calls `deliver` with
  `trigger: "registration"`, no actor.
- `lib/email/send.ts:182` `deliver` skips without address or `APP_URL`, claims via
  `claimDelivery`; `email_deliveries` is unique per registration and kind for confirmation, so the
  mail goes out at most once.
- `lib/email/deliveries.ts:27`: `DeliveryTrigger` already contains `"admin"`.
- `app/admin/actions.ts:209` `createRegistrationAction`; `lib/admin/data.ts:303`
  `createRegistration` returns only the reference.
- `components/admin/registrations-manager.tsx:392` calls the action; toast at line 400.
- `components/admin/registration-form-dialog.tsx` already uses `Switch` from `components/ui`.

## Decisions

- **D1**: `createRegistration` returns `{ id, reference }` (insert with `.select("id")`), so no
  second lookup. Its only caller is the create action.
- **D2**: `sendConfirmationEmail(registrationId, options?)` takes an optional
  `{ trigger, actor }`, default stays `registration` without actor. One sender function, no copy.
- **D3**: Sending runs in `after()` so the dialog closes as fast as today; failures land in
  `email_deliveries` and `logs` as today (FR-004).
- **D4**: The flag travels as a second argument `{ sendConfirmation: boolean }` of the action,
  validated with Zod, not inside the registration form values, so the edit path never sees it.
- **D5**: The switch lives in local state of the dialog, shown only in `mode === "create"`,
  default `true`. Below it a short hint on what the mail contains. The admin form already requires a mail address.
- **D6**: Toast copy: „Anmeldung hinzugefügt. Die Bestätigung wird verschickt.“ versus
  „Anmeldung hinzugefügt.“ The action returns `confirmation: "queued" | "off"`.

## Files likely to change

- `lib/admin/data.ts` (return id and reference)
- `lib/email/send.ts` (options for trigger and actor)
- `app/admin/actions.ts` (flag, `after()`)
- `components/admin/registration-form-dialog.tsx` (switch, passes flag)
- `components/admin/registrations-manager.tsx` (passes flag, toast)
- `lib/admin/messages.ts` (switch label, hint, toast)
- `tests/unit/` (schema of the flag if a pure helper is added)
- `AGENTS.md` section 4 (one sentence, specs/039)

## Security

- The action stays behind `runGuarded` and the existing registrations write permission.
- The mail goes only to the address of the new registration; no address input beyond the form.
- No secret reaches the browser; sending stays on the server.

## Constitution Check

Small, typed, one form, code defined template, German UI copy in the messages module, no dashes
in copy, no migration. Pass.

## Checks

`npm run lint`, `npm test`, `npm run build`.

## Manual test

1. `npm run dev`, Admin, Anmeldungen, „Anmeldung hinzufügen“: Schalter ist an.
2. Mit eigener Mailadresse speichern: Toast nennt die Bestätigung, Mail kommt an, Mailverlauf der
   Anmeldung zeigt die Bestätigung.
3. Zweite Anmeldung mit Schalter aus: keine Mail, Mailverlauf leer.
4. Eine bestehende Anmeldung bearbeiten: kein Schalter, keine Mail.
