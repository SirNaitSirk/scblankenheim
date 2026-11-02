---

description: "Task list for the registration bot protection"
---

# Tasks: Botschutz für das Anmeldeformular

**Input**: Design documents from `specs/029-registration-bot-protection/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/register-api.md

**Tests**: Unit Tests für die reine Tokenprüfung und das Fallenfeld (plan.md, Dateien die sich ändern).

## Phase 1: Setup

- [x] T001 Create `lib/register/limits.ts` with `FORM_MIN_FILL_MS = 3000`, `FORM_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000`, `REGISTRATION_HOURLY_CEILING = 60`, `REGISTRATION_CEILING_WINDOW_MS = 60 * 60 * 1000` (research R8)
- [x] T002 [P] Add `api.formExpired` ("Das Formular war zu lange geöffnet. Bitte lade die Seite neu und sende es noch einmal ab.") and `api.busy` ("Gerade gehen sehr viele Anmeldungen ein. Bitte versuche es in einer Stunde noch einmal.") to `lib/register/messages.ts`

## Phase 2: Foundational

- [x] T003 Create `lib/register/form-token.ts` (pure, testable): `createFormToken(issuedAtMs, key)` returning `<issuedAtMs>.<base64url hmac>`, `checkFormToken(token, now, key)` returning `ok | missing | forged | too_fast | expired` per data-model.md (future timestamp counts as `too_fast`, compare with `timingSafeEqual`), `classifySubmission({ trap, formToken, now, key })` returning `pass | silent(reason) | expired`
- [x] T004 Create `lib/register/form-token-server.ts` (`server-only`): key derivation `HMAC_SHA256(SUPABASE_ROLE_KEY, "registration-form-token")`, `issueFormToken()`, `checkSubmission(trap, formToken)`, and `recordBotAttempt(reason, ip)` inserting into `submission_attempts` with `kind` `registration_bot_trap | registration_bot_fast | registration_bot_token` and `ip`, no `email`, no `camp_id`

## Phase 3: User Story 1 und 2 · Menschen kommen durch, einfache Bots still abgewiesen (P1)

**Independent Test**: quickstart.md Schritte 1 bis 4.

- [x] T005 [US1] Issue a token in `components/marketing/registration-section.tsx` and pass it as `formToken` prop to `RegistrationForm`
- [x] T006 [US1] In `components/marketing/registration-form.tsx` accept `formToken`, render one off screen trap input (`aria-hidden`, `tabIndex={-1}`, `autoComplete="off"`, neutral name), send `formToken` and `trap` in the payload
- [x] T007 [US2] In `app/api/register/route.ts` extend the Zod schema with optional `formToken` and `trap`, run `classifySubmission` before `submitRegistration`; on `silent` record the attempt and answer 200 `{ reference: generateReference(), free: true, checkoutUrl: null }`; on `expired` answer 409 with `api.formExpired`

## Phase 4: User Story 3 · Veraltetes Formular (P2)

- [x] T008 [US3] Confirm the form keeps its values on a 409 and shows `data.error` in `components/marketing/registration-form.tsx` (no change expected beyond T006)

## Phase 5: User Story 4 · Obergrenze (P2)

- [x] T009 [US4] In `lib/register/service.ts` add result `{ ok: false, reason: "busy" }`; before `isThrottled` count `submission_attempts` with `kind = 'registration'` and the camp id within `REGISTRATION_CEILING_WINDOW_MS`; at or above `REGISTRATION_HOURLY_CEILING` write `registration.ceiling` (level `warning`) only if none exists within the window, then return `busy`; on a counting error log `registration.ceiling_check_failed` and continue
- [x] T010 [US4] Map `busy` to 429 with `api.busy` in `app/api/register/route.ts`

## Phase 6: Polish

- [x] T011 [P] Add `tests/unit/registration-bot-guard.test.ts`: valid, missing, malformed, forged, too fast, future, expired token; filled trap
- [x] T012 Run `npm test`, `npm run lint`, `npm run build` and report the output
- [ ] T013 Walk through quickstart.md steps 1 to 4 in the browser

## Dependencies

T001 and T002 first, then T003 and T004, then T005 to T007. T009 and T010 depend only on T001 and T002. T011 depends on T003 and T004.

## Implementation Strategy

MVP sind Phase 1 bis 3: Sie halten schon die meisten Bots fern. Phase 5 begrenzt danach gezielte Angriffe.
