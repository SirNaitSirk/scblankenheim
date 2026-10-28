---

description: "Task list for Nachricht ans Team und Änderung anfragen"
---

# Tasks: Nachricht ans Team und Änderung anfragen

**Input**: Design documents from `specs/018-participant-messages/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/actions-and-mail.md, quickstart.md

**Tests**: Unit tests for the pure input schema, change helpers and the team mail template.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [X] T001 Amend `AGENTS.md`: section 4 under "Public" (next to the participant page entry) add "From the participant page a person sends a message to the team or requests a change of one own field; items are stored, forwarded to the camp's team address by mail and handled in the registration dialog (mark done, apply, dismiss); no chat, no replies in the app (specs/018-participant-messages)". Section 5: add `participant_messages`. No dash punctuation.

---

## Phase 2: Foundational

- [X] T002 Create `supabase/migrations/0014_participant_messages.sql`: table `public.participant_messages` exactly as in data-model.md (no CHECK constraints), indexes `participant_messages_registration_idx (registration_id, created_at desc)` and partial `participant_messages_open_idx (registration_id) where status = 'open'`, `enable row level security`; `drop index public.email_deliveries_once_idx` and recreate it unique on `(registration_id, kind) where kind not in ('payment_link', 'team_message') and status in ('sending', 'sent')`. Header comment referencing specs/018.
- [X] T003 (types updated by hand, migration to be applied by the project owner) Update `lib/database.types.ts` with `participant_messages` (Row, Insert, Update) by hand if no local database is available, noted here.
- [X] T004 [P] Add to `lib/participant/limits.ts`: `MESSAGE_TEXT_MAX = 2000`, `CHANGE_REASON_MAX = 500`, `MESSAGE_IP_WINDOW_MS = 10 * 60 * 1000`, `MESSAGE_IP_MAX = 10`, `MESSAGE_DAY_MAX = 5`, `MESSAGE_DUPLICATE_MS = 60 * 1000`, `OWN_MESSAGES_SHOWN = 20`.
- [X] T005 Create `lib/participant/contact.ts` (pure): Zod `participantMessageInputSchema` (discriminated union from the contract), `allowedChangeFields(campFields)` = `mergeFields` without `step`, `storedFieldValue(registration, key)` (core column or `form_data[key]`, gender as option text via `GENDER_OPTIONS`), `checkChangeRequest(field, stored, value)` returning `null` or a German error (`validateField`, unchanged value), `changePatch(key, value)` returning the row patch (`first_name`, `last_name`, `email`, `gender` through `genderFromOption`, else `form_data` merge input), `displayValue(field, value)`.
- [X] T006 [P] Create `tests/unit/participant-contact.test.ts`: schema limits and trimming, allowed fields skip step rows and keep core keys first, stored value for core and form keys, unchanged and invalid values rejected (select option, email, required checkbox), patch for core keys, gender and form keys, display strings.

---

## Phase 3: User Story 1 · Nachricht ans Team (P1) 🎯 MVP

- [X] T007 [P] [US1] Add page copy to `lib/participant/messages.ts` under `contact`: card title "Fragen oder Korrekturen", modes "Nachricht" and "Änderung anfragen", labels, placeholder, counter, send "Senden", sending "Wird gesendet …", success "Danke! Das Team meldet sich per Mail bei dir.", errors (throttled, day limit "Du hast heute schon einige Anliegen geschickt. Bitte versuche es morgen wieder.", empty, too long, field unavailable, unchanged "Der Wert ist schon so eingetragen.", generic), list title "Deine Anliegen", kinds, status "offen" and "erledigt", empty state. No dashes.
- [X] T008 [US1] Create `lib/participant/submit.ts` (`server-only`): `findRegistrationForToken(token)` (id, camp_id, reference, names, email, gender, form_data, deleted), `isMessageThrottled(ip)` (count then record one attempt, kind `participant_message`), `countTodayMessages(registrationId)` (since `berlinDayStartIso`), `isDuplicate(registrationId, kind, body, fieldKey)` (within `MESSAGE_DUPLICATE_MS`), `insertParticipantMessage(row)` returning id.
- [X] T009 [US1] Create `app/meine-anmeldung/[token]/actions.ts` (`"use server"`): `sendParticipantMessageAction(token, prevState, formData)` per contract, using `useActionState` compatible state; on success `after(() => sendTeamNotification(id))` and `revalidatePath` of the page.
- [X] T010 [P] [US1] Add team mail copy to `lib/email/messages.ts` under `team` (subjects, labels, reply hint, admin link label "Im Admin Bereich öffnen", kinds) and create `lib/email/team-templates.ts` with pure `teamMessageEmail(ctx)` using the layout helpers (escaped text, text version).
- [X] T011 [P] [US1] Create `tests/unit/email-team-templates.test.ts`: subjects for both kinds, escaping of `<script>`, old and new value and reason in a change mail, reply hint only with reply address, no dashes.
- [X] T012 [US1] Create `lib/email/team.ts` (`server-only`): `sendTeamNotification(messageId)` per contract: team address from `resolveMailSettings(getCampMailInfo(campId)).sender.replyTo` or `EMAIL_REPLY_TO`; quota check like `sendTestEmail`; claim via a new `claimTeamDelivery(registrationId)` in `lib/email/deliveries.ts` (kind `team_message`, trigger `participant`); `sendEmail` with sender `{ name, replyTo: registration email if valid }` and idempotency key `team_message/<claim id>`; mark and log like `deliver`. Exclude `team_message` in `getMailHistory`.
- [X] T013 [US1] Extend `lib/participant/view.ts` and `lib/participant/lookup.ts`: `editableFields` and `messages` as in data-model.md (load options and required from `camp_form_fields`, own messages newest first limited to `OWN_MESSAGES_SHOWN`); keep the 017 privacy test passing by updating its key list.
- [X] T014 [US1] Create `components/participant/participant-contact.tsx` (client): segmented control, message form with counter, change form with type matched input, `useActionState` with the bound action, inline success and errors, disabled while pending; and the "Deine Anliegen" list. Render it in `components/participant/participant-summary.tsx` after "Deine Angaben"; pass the token from the page. Apply `impeccable` and `tasteskill`.

---

## Phase 4: User Story 2 · Änderung anfragen (P1)

- [X] T015 [US2] Wire change requests through T009 (field allowed via `allowedChangeFields`, `checkChangeRequest`, store `field_key`, `field_label`, `previous_value`, `proposed_value`, `body` = reason).
- [X] T016 [US2] Create `lib/admin/participant-messages.ts` (`server-only`): `listParticipantMessages(reference)`, `openMessageCounts(registrationIds)`, `markMessageDone(id, adminId)`, `dismissChange(id, adminId)`, `applyChange(id, adminId, confirmOverwrite)` per contract (re read registration and camp fields, `checkChangeRequest` without the unchanged rule, compare stored with `previous_value`, update registration with `changePatch` and `updated_at`, then mark applied). Return types for conflict and not found.
- [X] T017 [P] [US2] Add admin copy to `lib/admin/messages.ts` under `participantMessages`: section title "Nachrichten", kinds, "Als erledigt markieren", "Übernehmen", "Ablehnen", "Trotzdem übernehmen", conflict text `(current) => …`, results "Erledigt", "Übernommen", "Abgelehnt", by line `(name, date) => …`, empty "Keine Nachrichten", load error, badge `(count) => \`${count} offen\``. No dashes.
- [X] T018 [US2] Add to `app/admin/actions.ts`: `getParticipantMessagesAction(reference)` and `resolveParticipantMessageAction(id, input)` behind `requirePermission("registrations")` with Zod (`id` uuid, `action` enum, `confirmOverwrite` boolean), `writeLog` with field key only, `revalidateRegistrations()` and `/admin/finanzen`. Types in `lib/admin/types.ts`.

---

## Phase 5: User Story 3 · Anliegen im Admin Bereich (P1)

- [X] T019 [US3] Add `openMessages: number` to `Registration` in `lib/admin/types.ts`; in `getRegistrations` (`lib/admin/data.ts`) load counts with `openMessageCounts` and map them; default 0 in every other place that builds a `Registration` (fixtures, create flows).
- [X] T020 [US3] Show the badge in the name cell of `components/admin/registrations-table.tsx` when `openMessages > 0` (`Badge tone="pending"`).
- [X] T021 [US3] Create `components/admin/participant-messages-panel.tsx` (client): loads through the action on mount and after each resolve, list with actions, conflict state, feedback; render it in `components/admin/registration-form-dialog.tsx` after the participant link panel and pass the actions from `components/admin/registrations-manager.tsx`; call `router.refresh()` after a resolve so the badge updates.

---

## Phase 6: Polish

- [X] T022 (real participant page at 375px: card, both modes, type matched value input and current value checked; sending needs the migration) Check the participant card at 375px and desktop in the browser (sample page if no migration), keyboard and screen reader labels.
- [X] T023 Run `npm run lint`, `npm test`, `npm run build`; report verbatim.
- [ ] T024 (open: every scenario needs migration 0014 on the database and a team inbox) Walk through `specs/018-participant-messages/quickstart.md`; note steps that need the migration or a real inbox.

## Dependencies

- T001 first. T002 → T003 → T004 to T006.
- US1: T007, T010, T011 parallel; T008 → T009; T012 after T010; T013 → T014.
- US2: T015 after T009; T016 after T005; T017 parallel; T018 after T016.
- US3: T019 after T016; T020 after T019; T021 after T018.
- Polish last.

## Implementation Strategy

MVP is US1 (message reaches the team). Then US2 and US3 together, since applying needs the dialog.
