---

description: "Task list for feature 025 legal pages"
---

# Tasks: Impressum und Datenschutzerklärung

**Input**: Design documents from `specs/025-legal-pages/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/legal-ui.md, quickstart.md

**Tests**: Unit tests for the pure helpers in data-model.md (`missingOperatorFields`,
`operatorAddressLines`, `attemptRetentionCutoff`), the content rules (15 section ids, writing
rules) and the two new open gate paths. Everything else is checked manually via quickstart.md.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on unfinished tasks)
- All user facing copy is German, without dash punctuation or hyphenated words; code and comments
  are English only, also without dash punctuation.

---

## Phase 1: Setup

- [X] T001 Create `lib/legal/operator.ts` with type `LegalOperator` and the constant `legalOperator` holding exactly the fields of data-model.md: `associationName`, `street`, `postalCity`, `registerCourt`, `registerNumber`, `email`, `phone`, `contentResponsible`, `dataProtectionOfficer`, `supervisoryAuthority`, `hostingRegion` as `string | null`, `board` as `string[] | null`, `updatedAt` as `string` („30. Oktober 2026“). Every value not known today is `null` (do not copy the meeting address); `supervisoryAuthority` defaults to „Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein Westfalen“. Add the German field labels used by the gap marker (`operatorFieldLabels`).
- [X] T002 [P] Create `lib/legal/limits.ts` with `SUBMISSION_ATTEMPT_RETENTION_DAYS = 7` and the pure `attemptRetentionCutoff(now: Date): string` returning the ISO time `now` minus 7 days.

## Phase 2: Foundational (blocks all stories)

- [X] T003 Add to `lib/legal/operator.ts` the pure helpers `missingOperatorFields(operator)` (German labels of every `null` field except the optional `dataProtectionOfficer`; empty list means ready) and `operatorAddressLines(operator)` (name, street, postal city, gaps kept as `null`).
- [X] T004 [P] Create `components/legal/operator-value.tsx`: renders a value, or for `null` a `<mark>` with „noch einzutragen: {label}“ in `bg-amber-100 text-amber-700`, rounded, readable in light and dark (contracts/legal-ui.md, Gap marker).
- [X] T005 [P] Create `components/legal/legal-page.tsx`, the shared frame per contracts/legal-ui.md: link „Zur Startseite“ to `/` styled like the packing list, `h1` in `font-display text-5xl font-black md:text-6xl`, „Stand: {legalOperator.updatedAt}“, reading column `max-w-[46rem]` with `pt-12 md:pt-20 pb-20 md:pb-28`, `SiteFooter` at the bottom, header link and footer hidden in print, `break-words` on the column, no automatic hyphenation.
- [X] T006 Create `components/legal/legal-blocks.tsx`: renders a list of sections from `lib/legal/messages.ts` (`h2` with `id`, paragraphs, bullet lists, address lines with `OperatorValue`, `mailto:` links in `text-accent-strong underline underline-offset-4`).

**Checkpoint**: frame and building blocks exist; pages can be assembled.

---

## Phase 3: User Story 1 · Impressum finden und lesen (Priority: P1) 🎯 MVP

**Goal**: `/impressum` shows every mandatory statement, gaps visibly marked, linked from every public footer.

**Independent Test**: footer link „Impressum“ on the landing page opens the page with the seven sections of contracts/legal-ui.md.

- [X] T007 [US1] Create `lib/legal/messages.ts` with `legalMessages.imprint`: title „Impressum“, meta title „Impressum · FCG Summercamp“, and the seven sections in contract order („Angaben gemäß § 5 DDG“, „Vertreten durch“, „Registereintrag“, „Kontakt“, „Verantwortlich für den Inhalt“, „Verbraucherstreitbeilegung“, „Haftung für Inhalte“ with „Haftung für Links“), referencing operator fields instead of hardcoding values. Also `legalMessages.links` with „Impressum“, „Datenschutz“, „Zur Startseite“, „Inhalt“, „Stand“ and the copyright line builder.
- [X] T008 [US1] Create `app/impressum/page.tsx`: static server component with metadata title from T007, renders `LegalPage` plus `LegalBlocks` for the imprint sections.
- [X] T009 [US1] Extend `components/marketing/site-footer.tsx` with a second, quieter row (`text-xs text-muted-foreground`, border top inside the footer) holding „© {year} FCG Blankenheim Summercamp“, „Impressum“ (`/impressum`) and „Datenschutz“ (`/datenschutz`); labels from `legalMessages.links`. This covers landing page, packing list, payment pages and participant page.

**Checkpoint**: Impressum reachable from four public pages.

---

## Phase 4: User Story 2 · Datenschutzerklärung verstehen (Priority: P1)

**Goal**: `/datenschutz` explains every real data flow with a table of contents.

**Independent Test**: all 15 sections present, each anchor jumps, the five services of research R1 named with purpose and seat.

- [X] T010 [US2] Add `legalMessages.privacy` to `lib/legal/messages.ts`: title „Datenschutz“, meta title „Datenschutz · FCG Summercamp“, intro, and the 15 sections with the exact ids and headings of contracts/legal-ui.md. Content strictly from research R1, R2, R6, R7, R8: Vercel (hosting, logs), Supabase (database, Storage for the signature image), Clerk (team accounts only, script on all pages, only necessary cookies), Stripe (payment, own privacy policy, methods), Resend (mails); self hosted fonts and images, no analytics, no tracking, no cookie banner because only necessary cookies; registration data per form including minors (parents complete or approve for under 16) and voluntary health notes (Art. 9 (2) a); participant page with secret link, messages; school release (sent only to the registration's address, PDF not stored); bus ticket code and boarding log; rooms and tent circles internal; team accounts; retention per R7 including „7 Tage“ for throttling data; rights (Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch, Widerruf, Beschwerde at `supervisoryAuthority`); data protection officer only when set; third country transfer note for US providers (EU US Data Privacy Framework and standard contractual clauses); address form „du“.
- [X] T011 [US2] Create `app/datenschutz/page.tsx`: static server component with metadata, „Inhalt“ as numbered list of 15 anchor links (two columns from `md`), then `LegalBlocks` for all sections; „Verantwortlicher“ uses the same operator data as the imprint.
- [X] T012 [P] [US2] Create `lib/legal/retention.ts` (server only) with `purgeOldSubmissionAttempts()` deleting `submission_attempts` rows where `created_at` is before `attemptRetentionCutoff(new Date())`, using the service client.
- [X] T013 [US2] In `app/api/cron/info-mails/route.ts`, after the `CRON_SECRET` check and before `runInfoMails()`, call `purgeOldSubmissionAttempts()` inside its own try/catch; on failure write a log (`action: "submission_attempts.purge_failed"`, German message) and continue with the mails.

**Checkpoint**: both pages complete; stated retention is real.

---

## Phase 5: User Story 3 · Erreichbar auch vor dem Livegang (Priority: P2)

**Goal**: legal pages pass the prelaunch gate and are linked from the coming soon page.

**Independent Test**: with `COMING_SOON=true`, a private window sees both pages with real content and the links on `/demnaechst`.

- [X] T014 [US3] Add `"/impressum"` and `"/datenschutz"` to `OPEN_PATH_PREFIXES` in `lib/coming-soon/gate.ts` and update the comment.
- [X] T015 [P] [US3] Extend `tests/unit/coming-soon-gate.test.ts`: both paths pass for visitors without admin profile when the gate is on; `/impressumx` and `/datenschutz-alt` stay gated (segment exact).
- [X] T016 [US3] In `app/demnaechst/page.tsx`, add under „Teamzugang“ a row with links „Impressum“ and „Datenschutz“ in the same muted uppercase style, labels from `legalMessages.links`.

**Checkpoint**: gate and coming soon page done.

---

## Phase 6: User Story 4 · Angaben an einer Stelle nachtragen (Priority: P3)

**Goal**: one place for operator data, gaps listed automatically.

**Independent Test**: changing one value in `lib/legal/operator.ts` changes both pages; the gap list shrinks.

- [X] T017 [P] [US4] Create `tests/unit/legal-content.test.ts`: `missingOperatorFields` returns labels for `null` fields and an empty list for a fully filled operator (fixture), ignores `dataProtectionOfficer`; `operatorAddressLines` keeps gaps; `attemptRetentionCutoff` returns exactly 7 days earlier; privacy section ids equal the 15 ids of the contract in order; no string in `legalMessages` contains „–“, „—“ or a hyphen between letters; logs the current gap list with `console.info` so the team sees it in test output.

**Checkpoint**: all stories done.

---

## Phase 7: Polish & Cross Cutting

- [X] T018 [P] Update `specs/025-legal-pages/checklists/requirements.md` only if spec wording changed during implementation.
- [X] T019 Update `AGENTS.md`: section 4 Public list gets „Impressum (`/impressum`) and Datenschutz (`/datenschutz`): static pages, operator data in `lib/legal/operator.ts`, open during the prelaunch gate (specs/025-legal-pages)“; section 5 notes the 7 day retention of `submission_attempts`; quick reference lists both routes.
- [X] T020 Run `npm run lint`, `npm test`, `npm run build` and report the output verbatim.
- [X] T021 Validate in the browser per quickstart.md steps 1 to 7 (desktop and 375 px), screenshot both pages, and report the current gap list for the association.

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → stories. T006 needs T004 and T007's message shape; build T007 before T006 is wired into a page.
- US1 (T007 to T009) is the MVP. US2 needs `lib/legal/messages.ts` from T007. US3 needs both pages to exist for its manual check, but T014 and T015 can run any time. US4 tests need T001 to T003, T007 and T010.
- Polish runs last.

## Parallel Opportunities

- T002, T004, T005 in parallel after T001.
- T012 in parallel with T010 and T011.
- T015 in parallel with T016.

## Implementation Strategy

1. Setup and foundation (T001 to T006).
2. MVP: Impressum with footer links (T007 to T009), check in the browser.
3. Datenschutz and retention fix (T010 to T013).
4. Gate and coming soon (T014 to T016), then tests and docs (T017 to T021).
