# Implementation Plan: Impressum und Datenschutzerklärung

**Branch**: `024-landing-structure` (no own branch yet) | **Date**: 2026-10-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/025-legal-pages/spec.md`

## Summary

Two static public pages, `/impressum` and `/datenschutz`, in one shared reading frame. All operator
data live in one typed module where unknown values are `null` and render as highlighted gaps. The
privacy text is written from the services and tables the code really uses (research R1, R2). The
site footer and the coming soon page link both pages, and the prelaunch gate lets them through.
One honest fix comes with it: IP addresses in `submission_attempts` were kept forever, now the
daily cron deletes rows older than 7 days, so the privacy text can state a real retention.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.4 (App Router)

**Primary Dependencies**: existing only (Tailwind CSS 4, Supabase client for the retention query)

**Storage**: no schema change; one delete query on `submission_attempts`

**Testing**: Vitest 4 (`tests/unit`), manual checks per [quickstart.md](quickstart.md)

**Target Platform**: Vercel, modern browsers, print

**Project Type**: web application

**Performance Goals**: static pages, no data fetching

**Constraints**: German copy, writing rules, no invented operator data, text must match the code

**Scale/Scope**: 2 pages, 1 frame component, 1 marker component, 3 lib modules, 4 edited files

## Constitution Check

| Principle | Status |
|---|---|
| I. Fixed stack | Complies: no new dependency. |
| II. Server is the boundary | Complies: pages are static; the retention delete runs in the cron route behind `CRON_SECRET` with the service client. |
| III. Strict scope | Complies after the AGENTS.md section 4 line „Impressum and Datenschutz“ is added in this change (task T019). |
| IV. Single source of truth | Complies: operator data in one module; no migration needed. |
| V. Language separation | Complies: German copy in `lib/legal/messages.ts`, code English. |
| VI. Tolerant payment, hidden pricing | Not touched; no prices on the pages. |
| VII. Simplicity, honest gates | Complies: plain data plus two small helpers; lint, test and build run. |
| Writing rules | Enforced by a unit test over all legal strings. |

Post design check: unchanged, no violation.

## Existing code inspected

- `components/marketing/site-footer.tsx`: one row with brand and links; used by the landing page,
  `app/packzettel/page.tsx` and `components/payment/payment-shell.tsx`, which also frames the
  participant page. Adding the legal row here covers four of five pages.
- `app/demnaechst/page.tsx`: no footer, centered card with „Teamzugang“.
- `lib/coming-soon/gate.ts`: `OPEN_PATH_PREFIXES` decides what bypasses the gate.
- `app/layout.tsx`: `ClerkProvider` around everything, `next/font/google` (self hosted).
- `next.config.ts`: Unsplash and picsum placeholders through the image optimizer.
- `supabase/migrations`: tables with personal data per research R2; `submission_attempts.ip`
  without retention; registration delete is a soft delete plus removal of release and bus data.
- `app/api/cron/info-mails/route.ts`: daily, `CRON_SECRET` checked, thin wrapper.
- `app/packzettel/page.tsx`: reading page pattern reused for the legal frame.

## Decisions and assumptions

See [research.md](research.md): R1 services, R2 stored data, R3 operator module, R4 gap marker,
R5 gate, R6 retention fix, R7 retention wording, R8 legal bases and minors, R9 placement, R10 copy.
Assumption: the texts are a careful draft, the association reviews them before go live.

## UI

- **Layout**: like the packing list: home link on top, `max-w-[46rem]` column, generous top
  spacing (`pt-12 md:pt-20`), footer at the bottom.
- **Typography**: `h1` `font-display text-5xl font-black md:text-6xl`, `h2`
  `font-display text-2xl font-extrabold`, body `text-base leading-relaxed text-foreground`,
  meta lines `text-sm text-muted-foreground`. Line length stays under about 72 characters.
- **Spacing**: sections `mt-12`, paragraphs `mt-3`, lists `mt-3 space-y-1.5 pl-5 list-disc`.
- **Color**: existing tokens only; links `text-accent-strong underline underline-offset-4`; gaps
  `bg-amber-100 text-amber-700` in a `<mark>`.
- **Table of contents** (Datenschutz): numbered list of 15 anchor links in two columns from `md`.
- **Responsive**: one column on phones, `break-words` on addresses and mail links.
- **States**: no loading or error state (static); the only state is a gap, shown by the marker.
- **Print**: header link and footer hidden, links printed as text.
- **Footer row**: second line under the main footer row, `text-xs text-muted-foreground`, with
  „© {year} FCG Blankenheim Summercamp“, „Impressum“, „Datenschutz“.

## Project Structure

### Documentation (this feature)

```text
specs/025-legal-pages/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/legal-ui.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
lib/legal/
├── operator.ts          # new: LegalOperator constant, missingOperatorFields, operatorAddressLines
├── messages.ts          # new: German copy of both pages as structured sections
└── limits.ts            # new: SUBMISSION_ATTEMPT_RETENTION_DAYS, attemptRetentionCutoff
lib/legal/retention.ts   # new: purgeOldSubmissionAttempts (service client, server only)
components/legal/
├── legal-page.tsx       # new: shared reading frame
├── legal-blocks.tsx     # new: renders sections (paragraphs, lists, address lines)
└── operator-value.tsx   # new: value or highlighted gap
app/impressum/page.tsx   # new
app/datenschutz/page.tsx # new
components/marketing/site-footer.tsx   # edit: legal row
app/demnaechst/page.tsx                # edit: legal links
lib/coming-soon/gate.ts                # edit: open paths
lib/coming-soon/messages.ts            # edit: link labels (if copy lives there)
app/api/cron/info-mails/route.ts       # edit: purge before the mail run
lib/marketing/messages.ts              # edit: footer labels
tests/unit/legal-content.test.ts       # new
tests/unit/coming-soon-gate.test.ts    # edit
AGENTS.md                              # edit: section 4 and quick reference
```

**Structure Decision**: follows the existing split: copy and pure data in `lib/legal`, rendering in
`components/legal`, routes in `app/`.

## Security requirements

- No secrets or personal data on the pages; operator data are public by nature.
- The retention delete runs only inside the cron route after the `CRON_SECRET` check and uses the
  service client on the server.
- The gate change opens exactly two static paths, segment exact like the existing prefixes.

## Acceptance criteria

Spec FR-001 to FR-011 and SC-001 to SC-005, checked by [quickstart.md](quickstart.md).

## Checks to run

`npm run lint`, `npm test`, `npm run build` (new routes and a changed cron route).

## Complexity Tracking

No violations. The retention fix is the one change beyond the pages; it is needed so the privacy
text does not state a false retention (FR-006).
