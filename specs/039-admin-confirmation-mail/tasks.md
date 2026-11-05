---

description: "Task list for 039-admin-confirmation-mail"
---

# Tasks: Anmeldebestätigung bei Anmeldungen aus dem Admin

**Input**: `/specs/039-admin-confirmation-mail/` (spec.md, plan.md)

All user facing text is German, lives in `lib/admin/messages.ts` and contains no dashes.

## Phase 1: Foundational

- [X] T001 `createRegistration` in `lib/admin/data.ts` returns `{ id, reference }` (insert with `.select("id").single()`).
- [X] T002 `sendConfirmationEmail(registrationId, options?: { trigger?: DeliveryTrigger; actor?: { id: string; label: string } | null })` in `lib/email/send.ts`, default trigger `registration`.

## Phase 2: User Story 1 und 2 (P1, P2)

- [X] T003 `createRegistrationAction(values, options)` in `app/admin/actions.ts`: Zod schema `{ sendConfirmation: boolean }`, after insert `after(() => sendConfirmationEmail(id, { trigger: "admin", actor }))` when on; result carries `confirmation: "queued" | "off"`.
- [X] T004 Messages in `lib/admin/messages.ts`: switch label „Anmeldebestätigung senden“, hint on what the mail contains, toast „Anmeldung hinzugefügt. Die Bestätigung wird verschickt.“
- [X] T005 Switch in `components/admin/registration-form-dialog.tsx`, only in create mode, default on, passed to `onSubmit`.
- [X] T006 `components/admin/registrations-manager.tsx`: forward the flag, pick the toast by `confirmation`.

## Phase 3: Polish

- [X] T007 One sentence in `AGENTS.md` section 4 (specs/039).
- [ ] T008 Run `npm run lint`, `npm test`, `npm run build` and report output.
- [ ] T009 Manual test per plan.md.
