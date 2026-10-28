# Contract: `getRegistrationMailsAction(reference)`

File `app/admin/actions.ts`, `"use server"`.

- **Auth**: inside the existing `runGuarded` pattern, `requirePermission("registrations")`; without it
  the result is `{ ok: false, error: de.registrations.toast.unauthorized }`.
- **Input**: `reference` validated with the existing `referenceSchema`; invalid or unknown yields
  `{ ok: false, error: de.registrations.mails.notFound }`.
- **Output**: `{ ok: true, mails: MailHistoryEntry[] }` (see data-model.md), newest first, at most
  50. Never contains an address, subject, body, provider id or raw error code.
- **Errors**: unexpected failures yield `{ ok: false, error: de.registrations.mails.loadFailed }`.
- **Side effects**: none; no log entry (read only).

# UI contract: section „Mails“ in the registration dialog

- Shown only in edit mode, after the payment block, titled „Mails“.
- States: loading (three skeleton rows), empty („Noch keine Mails verschickt“), error (message plus
  „Erneut versuchen“), list.
- Row: label, status badge (icon plus text: check „Verschickt“, warning „Fehlgeschlagen“, spinner or
  clock „Wird gesendet“), date and time in Berlin time, trigger line („bei Anmeldung“, „automatisch“,
  „von {Name}“, „von einem Admin“).
