---

description: "Task list for 038-camp-feedback"
---

# Tasks: Campfeedback mit Historie

**Input**: Design documents from `/specs/038-camp-feedback/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/feedback-routes.md, quickstart.md

**Tests**: Unit tests for the pure rules, as in every feature of this project (Vitest, `tests/unit/`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no open dependency)
- **[Story]**: user story from spec.md (US1 to US5)
- All user facing text is German, lives in the central messages modules and contains no dashes.
- Code, identifiers, comments and table names are English; comments contain no dash punctuation.

---

## Phase 1: Setup

- [X] T001 Amend `AGENTS.md` without dash punctuation: in section 4 „Public“ one bullet for the camp feedback page (`/feedback/<code>`, reached by a QR code shown at camp end, answers bound only to the camp, admins open and close it, specs/038-camp-feedback); in section 4 „Admin dashboard“ one bullet for `/admin/feedback` (questions per camp with copy from earlier camps, results, history across camps, CSV export, QR code full screen and PNG, permission `feedback`); in section 5 the tables `camp_feedback_settings`, `camp_feedback_questions`, `feedback_responses` (no time, no ip, no registration); add `app/feedback/[code]/page.tsx` to the Quick reference public routes.

---

## Phase 2: Foundational (blocks every story)

- [X] T002 Create `supabase/migrations/0018_camp_feedback.sql` with a header comment referencing specs/038 and the anonymity rule. Tables exactly as in data-model.md:
  `camp_feedback_settings` (`camp_id uuid primary key references public.camps(id) on delete cascade`, `open boolean not null default false`, `link_code text not null unique`, `updated_by text not null`, `updated_at timestamptz not null default now()`);
  `camp_feedback_questions` (`id uuid primary key default gen_random_uuid()`, `camp_id uuid not null references public.camps(id) on delete cascade`, `key text not null`, `label text not null`, `type text not null`, `required boolean not null default false`, `options text[] not null default '{}'`, `sort_order int not null`, `created_at`, `updated_at timestamptz not null default now()`; unique index (`camp_id`, `key`), index (`camp_id`, `sort_order`));
  `feedback_responses` (`id uuid primary key default gen_random_uuid()`, `camp_id uuid not null references public.camps(id) on delete cascade`, `nonce uuid not null unique`, `answers jsonb not null`; index (`camp_id`); deliberately no `created_at`).
  `enable row level security` on all three, no policies, no CHECK constraints. Apply it to the Supabase project. (File written; applying is done by the owner, open as of 2026-11-04.)
- [X] T003 Add the three tables to `lib/database.types.ts` in the existing style (Row, Insert, Update, Relationships).
- [X] T004 [P] Create `lib/feedback/types.ts`: `FeedbackQuestionType = "rating" | "single" | "multi" | "text"`, `FeedbackQuestion` (id, campId, key, label, type, required, options, sortOrder), `PublicFeedbackQuestion` (without ids beyond key), `FeedbackAnswer` union exactly as in data-model.md, `QuestionSummary`, `CampFeedbackSummary`, `FeedbackHistoryRow`.
- [X] T005 [P] Create `lib/feedback/limits.ts`: `FEEDBACK_KEY_PATTERN = /^[a-z][a-z0-9_]{0,39}$/`, label 1 to 200 chars, options 2 to 20 entries of 1 to 100 chars, `FEEDBACK_TEXT_MAX = 2000`, `FEEDBACK_QUESTIONS_MAX = 20`, `FEEDBACK_IP_MAX = 20`, `FEEDBACK_IP_WINDOW_MS = 60 * 60 * 1000`, `FEEDBACK_CAMP_DAILY_MAX = 1000`, `FEEDBACK_LINK_CODE_BYTES = 16`, `FEEDBACK_COOKIE_MAX_AGE_S = 365 * 24 * 60 * 60`, `feedbackCookieName(campId)` returning `feedback_<campId>`, `FEEDBACK_PATH = "/feedback"`, `FEEDBACK_QR_PNG_SIZE = 1024`.
- [X] T006 [P] Create `lib/feedback/schema.ts` with Zod: `feedbackQuestionInputSchema` (label trimmed 1 to 200, type enum, required boolean, key matching `FEEDBACK_KEY_PATTERN`, options trimmed, unique, 2 to 20 entries of 1 to 100 chars for `single` and `multi`, forced to `[]` otherwise) with German errors from `de.feedback.errors`.
- [X] T007 Create `lib/feedback/validation.ts` with pure `validateFeedback(questions, raw): { ok: true; answers: FeedbackAnswer[] } | { ok: false; errors: Record<string, string> }`: drop keys without a current question; rating integer 1 to 5; single one of `options`; multi non empty subset of `options` without duplicates; text trimmed, 1 to `FEEDBACK_TEXT_MAX`; empty optional answers omitted; missing required answers give an error; result entries carry current `key`, `label`, `type`; at least one answer overall. German errors from `lib/feedback/messages.ts`.
- [X] T008 [P] Create `lib/feedback/messages.ts` with all German copy of the public page (title line, anonymity hint with the request to name nobody, scale ends „gar nicht gut“ and „sehr gut“, „Pflicht“, submit, sending, thanks, already answered, unavailable, expired, throttled, field errors, counter).
- [X] T009 [P] Create `tests/unit/feedback-validation.test.ts` covering every type, required and optional, unknown keys dropped, wrong option, duplicate multi values, text too long and whitespace only, empty submission.

**Checkpoint**: migration applied, `npm test` green.

---

## Phase 3: User Story 2 · Fragen einstellen und QR Code zeigen (P1) 🎯 MVP part 1

**Goal**: admins manage questions per camp, copy them from another camp, open and close feedback, show and renew the QR code. Comes first because US1 needs questions and an open camp.

**Independent Test**: quickstart scenario 1 and scenario 2 steps 1, 2, 6.

- [X] T010 [P] [US2] Add `feedback: "Feedback"` to `PERMISSION_LABELS`, `de.nav.feedback = "Feedback"` and a `de.feedback` block (page titles and descriptions, access card, switch, copy address, show QR, download image, renew link with confirmation text, questions tab, results tab, type labels „Bewertung 1 bis 5“, „Einfachauswahl“, „Mehrfachauswahl“, „Freitext“, dialog labels, copy questions dialog and result text with count, delete confirmation naming the number of answers, empty states, all errors including `locked_type`, `locked_key`, `options_removed`, `duplicate_key`, `no_questions`, `same_camp`, `too_many`) in `lib/admin/messages.ts`.
- [X] T011 [P] [US2] Add `{ label: de.nav.feedback, href: "/admin/feedback" }` after Bus in `components/admin/nav-items.ts` and an icon (`ChatCircleText`) in `NAV_ICONS` of `components/admin/admin-sidebar.tsx`.
- [X] T012 [P] [US2] Create `lib/feedback/rules.ts` (pure): `suggestKey(label, existingKeys)` (lowercase, umlauts to ae oe ue ss, non alphanumerics to `_`, trimmed, max 40, numbered suffix when taken), `answeredKeys(responses)`, `questionChangeProblem(existing, next, answered)` returning `locked_type` or `locked_key` or `options_removed` or null, `answerCountForKey(responses, key)`, `questionsToCopy(source, target)` keeping only keys missing in target with `sort_order` appended.
- [X] T013 [P] [US2] Create `tests/unit/feedback-rules.test.ts` for all functions of T012, including umlauts and key collisions.
- [X] T014 [P] [US2] Create `lib/feedback/code-server.ts` with `generateFeedbackCode()` using `randomBytes(FEEDBACK_LINK_CODE_BYTES).toString("base64url")` and `feedbackUrl(baseUrl, code)` returning `${APP_URL without trailing slash}/feedback/<code>`.
- [X] T015 [US2] Create `lib/feedback/data.ts` (`server-only`, service client): `getFeedbackSettings(campId)`, `ensureFeedbackSettings(campId, userId)` (creates the row with a fresh code when missing), `listFeedbackQuestions(campId)`, `listFeedbackResponses(campId)` ordered by `id`, `listCampsWithFeedback()` (id, name, start_date, open, response count), `getActiveRegistrationCount(campId)`. Fetch joins unfiltered and filter in JS (AGENTS.md gotcha).
- [X] T016 [US2] Create `app/admin/feedback/actions.ts` (`"use server"`) with `createFeedbackQuestion`, `updateFeedbackQuestion`, `deleteFeedbackQuestion`, `moveFeedbackQuestion`, `copyFeedbackQuestions`, `setFeedbackOpen`, `renewFeedbackLink` exactly as in contracts/feedback-routes.md: each starts with `requirePermission("feedback")`, maps `AuthError` to the German forbidden message, validates with `feedbackQuestionInputSchema`, enforces `FEEDBACK_QUESTIONS_MAX`, uses `questionChangeProblem` against `answeredKeys`, refuses opening without questions, writes `logs` entries only for admin actions (`feedback.opened`, `feedback.closed`, `feedback.link_renewed`, `feedback.questions_copied`, never the code), returns `ActionResult` and calls `revalidatePath`.
- [X] T017 [US2] Create `app/api/admin/feedback/[campId]/qr/route.ts` (GET): `requirePermission("feedback")` (403 on `AuthError`), `ensureFeedbackSettings`, `qrPng(feedbackUrl(APP_URL, code), FEEDBACK_QR_PNG_SIZE)` from `lib/bus/qr.ts`, `Content-Type: image/png`, `Content-Disposition: attachment; filename="feedback-qr-<campslug>.png"`, `Cache-Control: no-store`.
- [X] T018 [P] [US2] Create `components/admin/feedback-question-dialog.tsx`: dialog in the style of `field-form-dialog.tsx` with label, type select, required switch, options editor for choice types, key with suggestion from `suggestKey` while untouched; type and key disabled with a hint when the key already has answers; existing options not removable then.
- [X] T019 [US2] Create `components/admin/feedback-questions.tsx`: list with type badge, required mark, key, up and down buttons, edit, delete with confirmation naming the answer count, „Fragen übernehmen“ with a camp select (other camps that have questions) and a warning when the camp already has questions; read only when the user lacks the permission.
- [X] T020 [US2] Create `components/admin/feedback-link-card.tsx`: switch „Feedback offen“ (disabled without questions, with hint), address with copy button, button link „QR Code zeigen“ to `/admin/feedback/[campId]/qr` in a new tab, „Als Bild laden“ to the PNG route, „Link erneuern“ with confirmation.
- [X] T021 [US2] Create `app/admin/feedback/[campId]/page.tsx`: `guardTab("/admin/feedback")`, redirect to `/admin` without `canUseSection(profile, "feedback")`, `ensureFeedbackSettings`, load camp, questions, responses; `PageHeader` with camp name and back link to `/admin/feedback`; `FeedbackLinkCard`; two view links „Auswertung“ and „Fragen“ via `?ansicht=fragen` (default Auswertung) styled like existing segmented controls; render `FeedbackQuestions` for the questions view; hint when the camp has no end date is not needed (switch is manual). The shared `app/admin/loading.tsx` covers this route, no own file needed.
- [X] T022 [US2] Create `app/admin/feedback/[campId]/qr/page.tsx`: same guard; white page without admin shell (like `app/admin/zeltkreise/druck`), camp name, `qrSvg` sized `min(80vh, 80vw)`, address in plain text below, close button hidden in print, print CSS.

**Checkpoint**: questions managed, copied, feedback opened, QR code shown and downloaded, link renewed.

---

## Phase 4: User Story 1 · Feedback per QR Code geben (P1) 🎯 MVP part 2

**Goal**: anyone with the link answers once per browser while feedback is open.

**Independent Test**: quickstart scenario 2 steps 2 to 6 and scenario 6.

- [X] T023 [US1] Extend `lib/feedback/data.ts` with `findOpenFeedbackByCode(code)` (settings plus camp name plus questions; null when unknown, closed or without questions), `isFeedbackThrottled(ip, campId)` (counts `submission_attempts` with `kind = 'feedback'` per ip within `FEEDBACK_IP_WINDOW_MS` and per camp within 24 hours against `FEEDBACK_CAMP_DAILY_MAX`, then inserts the current attempt with `ip` and `camp_id`), `insertFeedbackResponse(campId, nonce, answers)` treating a unique violation on `nonce` as success. No logging.
- [X] T024 [US1] Create `app/feedback/[code]/actions.ts` (`"use server"`) with `submitFeedback` following contracts/feedback-routes.md steps 1 to 7: `checkSubmission` from `lib/register/form-token-server.ts`, `requestIp` from `lib/payment/lookup.ts`, `isFeedbackThrottled`, `validateFeedback`, insert, set cookie `feedbackCookieName(campId)` = `1` with `path: "/feedback"`, `httpOnly`, `sameSite: "lax"`, `secure` in production, `maxAge: FEEDBACK_COOKIE_MAX_AGE_S`; return `SubmitFeedbackResult`. Code input validated as base64url of the expected length.
- [X] T025 [US1] Create `components/feedback/feedback-form.tsx` (client): rating as radiogroup of five buttons at least 44px with end labels and arrow key support, single as radio group, multi as checkboxes, text as textarea with counter up to 2000; required marks; errors under the question with focus on the first error; hidden `nonce`, `formToken`, trap field (same markup approach as the registration form); submit button full width, disabled while sending; switches to thanks, expired, throttled or unavailable views by result; replaces questions when the result carries new ones; respects `prefers-reduced-motion`.
- [X] T026 [US1] Create `app/feedback/[code]/page.tsx`: `dynamic` rendering, `metadata.robots = { index: false, follow: false }`; `findOpenFeedbackByCode`; unavailable view without camp name; already answered view when the cookie is set; otherwise camp name, anonymity hint and `FeedbackForm` with a new `crypto.randomUUID()` nonce and `issueFormToken()`. Mobile first, single column, in the look of the participant page.

**Checkpoint**: MVP complete: admins set up and show the QR code, people answer.

---

## Phase 5: User Story 3 · Ergebnisse eines Camps auswerten (P1)

**Goal**: results per camp with numbers, bars, free texts and CSV.

**Independent Test**: quickstart scenario 3.

- [X] T027 [P] [US3] Create `lib/feedback/stats.ts` (pure) with `summarizeCamp(questions, responses, activeRegistrations, open): CampFeedbackSummary` as in data-model.md: per current question and per deleted key with answers (label from the latest stored answer, `deleted: true`); rating `answered`, `average` rounded to one decimal, `distribution` 1 to 5; choice counts and shares relative to `answered`, options only found in old answers appended; texts non empty in response `id` order.
- [X] T028 [P] [US3] Create `lib/feedback/csv.ts` with `feedbackResponsesToCsv(questions, responses, shuffle = defaultShuffle)`: semicolon, UTF 8 BOM like `financeRowsToCsv`, one column per key (current order, then deleted), header is the label, rows shuffled, multi joined with `", "`, cells starting with `=`, `+`, `-`, `@` prefixed with `'`, no person, id or time column.
- [X] T029 [P] [US3] Create `tests/unit/feedback-stats.test.ts` (averages, distribution, shares for multi above 100 percent in total, deleted questions, old options, empty camp) and `tests/unit/feedback-csv.test.ts` (columns, escaping, injection guard, deterministic shuffle passed in).
- [X] T030 [US3] Create `components/admin/feedback-results.tsx`: top numbers (answers, active registrations for orientation, open or closed), one card per question with Tailwind width bars and counts, „n = …“ per question, multi hint that shares do not add up to 100 percent, free text list, „gelöscht“ badge, empty state telling whether feedback is open, CSV export button with Blob download named `feedback-<campslug>.csv`.
- [X] T031 [US3] Render `FeedbackResults` with `summarizeCamp` in the default view of `app/admin/feedback/[campId]/page.tsx`.

**Checkpoint**: results match hand calculation, CSV contains no personal data.

---

## Phase 6: User Story 4 · Historie über die Jahre (P2)

**Goal**: compare questions with the same key across camps.

**Independent Test**: quickstart scenario 4.

- [X] T032 [P] [US4] Add `buildHistory(camps)` to `lib/feedback/stats.ts`: input per camp (id, name, startDate, questions, responses), camps without responses left out, sorted by `start_date` ascending; one row per key of rating or choice questions with newest label and `previousLabels`; empty cell when the key is missing in a camp. Extend `tests/unit/feedback-stats.test.ts`.
- [X] T033 [US4] Create `components/admin/feedback-history.tsx`: table with one row per key, one column per camp (oldest left), average with small bar and „n = …“, choice shares compact, empty cells „·“, previous labels in a disclosure, camp header links to `/admin/feedback/[campId]`; horizontal scroll inside the card on phones.
- [X] T034 [US4] Create `app/admin/feedback/page.tsx`: same guard as T021; `PageHeader`; `FeedbackHistory` built from all camps; below a camp list (name, dates, open or closed badge, answer count) linking to each camp page, current camp first; empty state explaining how to start. The shared `app/admin/loading.tsx` covers the loading state.

**Checkpoint**: history shows at least two camps side by side.

---

## Phase 7: User Story 5 · Zugriff nur mit Berechtigung (P2)

**Goal**: only `feedback` permission holders (or superadmins) reach anything.

**Independent Test**: quickstart scenario 5.

- [X] T035 [US5] Verify that the user dialog in `components/admin/user-form-dialog.tsx` and `components/admin/access-controls.tsx` lists the new permission and tab automatically from `PERMISSION_LABELS` and `NAV_ITEMS`; adjust only if they use a hard coded list.
- [X] T036 [US5] Check every new page, action and the PNG route for the guard: pages redirect without permission, actions and route answer forbidden; no public route returns admin data.

---

## Phase 8: Polish

- [X] T037 [P] Add a privacy section to `lib/legal/messages.ts`: what the feedback stores (answers bound only to the camp, no name, no time, no ip with the answer), voluntary, the technically necessary cookie marking a given answer (365 days, no personal content), throttling rows with ip kept 7 days as already described; extend `tests/unit/legal-content.test.ts` accordingly.
- [X] T038 [P] Check every new German text and comment for dash punctuation and hyphens joining words.
- [X] T039 Run `npm run lint`, `npm test`, `npm run build` and report the output verbatim.
- [ ] T040 (open: needs migration 0018 applied) Walk through quickstart.md scenarios 1 to 6 in the dev server, including the phone layout of `/feedback/<code>` at 375px width.

---

## Phase 9: User Story 6 · Kommentar zu einer Frage (P2)

**Goal**: rating and choice questions can carry an optional comment.

**Independent Test**: spec US6 independent test.

- [X] T041 [US6] Create `supabase/migrations/0019_feedback_comments.sql` (header comment, specs/038 US6): `alter table public.camp_feedback_questions add column allow_comment boolean not null default false`; add `allow_comment` to Row, Insert in `lib/database.types.ts`. Applying is done by the owner.
- [X] T042 [US6] Extend `lib/feedback/types.ts` (`allowComment` on `FeedbackQuestion` and `PublicFeedbackQuestion`, optional `comment` on rating, single and multi answers, `comments: string[]` on their summaries), `lib/feedback/rules.ts` (`parseAnswers` keeps a string comment, `questionsToCopy` copies `allowComment`), `lib/feedback/schema.ts` (`allowComment` boolean, forced false for `text`), `lib/feedback/data.ts` (select and map `allow_comment`), `app/admin/feedback/actions.ts` (write `allow_comment` on create, update, copy).
- [X] T043 [US6] In `lib/feedback/validation.ts` read `<key>__comment` for questions with `allowComment`, trim, max 2000 chars (error under the question), attach only when the answer has a value; drop otherwise. Add `FEEDBACK_COMMENT_SUFFIX = "__comment"` to `lib/feedback/limits.ts`.
- [X] T044 [US6] In `lib/feedback/stats.ts` collect non empty `comments` per rating and choice question; in `lib/feedback/csv.ts` add a column „<label> · Kommentar“ right after each question that allows or has comments.
- [X] T045 [P] [US6] Extend `tests/unit/feedback-validation.test.ts`, `tests/unit/feedback-stats.test.ts`, `tests/unit/feedback-csv.test.ts`, `tests/unit/feedback-rules.test.ts` for comments.
- [X] T046 [US6] Copy: `de.feedback.dialog.allowComment` „Kommentar erlauben“ with hint, `de.feedback.questions.comment` badge, `de.feedback.results.comments(count)`, `feedbackMessages.commentLabel` „Magst du etwas dazu schreiben?“ in `lib/admin/messages.ts` and `lib/feedback/messages.ts`.
- [X] T047 [US6] UI: switch in `components/admin/feedback-question-dialog.tsx` (hidden for Freitext), badge in `components/admin/feedback-questions.tsx`, comment textarea with counter in `components/feedback/feedback-form.tsx` shown once the question has a value, comment list in `components/admin/feedback-results.tsx`.
- [X] T048 Run `npm run lint`, `npm test`, `npm run build` and report the output.

## Dependencies

- Phase 1 before everything (constitution III).
- Phase 2 before all stories.
- US2 before US1 (an open camp with questions is needed to answer).
- US3 needs US2 and benefits from US1 data; T027 to T029 can start right after Phase 2.
- US4 needs `stats.ts` from US3.
- US5 checks run after US2 to US4 exist.
- Polish last.

## Parallel examples

- Phase 2: T004, T005, T006, T008 together, then T007 and T009.
- US2: T010, T011, T012, T013, T014 together; T018 parallel to T015 and T016.
- US3: T027, T028, T029 together while US1 is in progress.

## Implementation strategy

1. MVP: Phases 1, 2, US2, US1. The team can collect feedback at the next camp end.
2. Then US3 for results and CSV, so the collected answers become usable.
3. Then US4 history, US5 checks, polish and the checks of T039 and T040.
