# Implementation Plan: Public Camp Registration

**Branch**: `001-registration-form` | **Date**: 2026-10-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-registration-form/spec.md`

## Summary

The public registration form already exists (config driven from `camp_form_fields`, server
revalidation, option seat limits, throttling). This plan closes the gaps from the spec:

1. A shared registration window rule with automatic opening, deadline and a new `full` state
   ([research R1](./research.md#r1--registration-window-rule-fr-001-to-fr-004-fr-011)).
2. Race free total camp capacity and option seat checks through one Postgres function behind an
   advisory lock ([R2](./research.md#r2--race-free-capacity-checks-fr-017-fr-027-to-fr-030-sc-004-sc-004a)).
3. Invitation links `/?einladung=<token>` that reach the form, show a hint without amount and apply
   the hidden price on the server ([R4](./research.md#r4--invitation-link-format-and-transport-fr-018-to-fr-021a)).
4. One isomorphic module for German copy and field validation, rewritten to the writing rules
   ([R5](./research.md#r5--single-source-for-german-copy-and-validation-fr-023-fr-024-sc-005)).
5. Vitest unit tests for the pure rules ([R8](./research.md#r8--testing)).

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.3 (App Router, Turbopack)

**Primary Dependencies**: `@clerk/nextjs` (admin only, untouched here), `@supabase/supabase-js`
2.112, `zod` 4, Tailwind CSS 4, project UI primitives in `components/ui/`

**Storage**: Supabase Postgres; tables `camps`, `camp_settings`, `camp_form_fields`,
`price_tiers`, `registrations`, `submission_attempts`, `logs`; one new migration
`0005_public_registration_capacity.sql`

**Testing**: Vitest (new dev dependency) for pure modules; manual end to end and race checks in
[quickstart.md](./quickstart.md); `npm run lint` and `npm run build`

**Target Platform**: Vercel (Node.js runtime for `app/api/register`), modern mobile and desktop
browsers

**Project Type**: Web application (single Next.js app, frontend and server in one repo)

**Performance Goals**: Registration submit completes in under 1 s at camp scale; landing page stays
dynamic per request

**Constraints**: No secrets or hidden prices in client output; capacity never exceeded under
concurrency; UI fully German; usable from 320 px width

**Scale/Scope**: One camp per year, roughly 100 to 300 registrations, bursts of a few dozen
submissions right after opening

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Fixed Stack, Clerk Owns Auth | PASS with note | Only Supabase, Zod and Next.js are used. Vitest is a dev only addition (R8). react-hook-form is not introduced, see Complexity Tracking. |
| II. Server Is the Security Boundary | PASS | Capacity, window and price are decided in `lib/register/service.ts` and the RPC; the RPC is executable only by `service_role`; `resolveInvitation` returns a boolean, never a price; route input stays Zod validated. |
| III. Strict Scope | PASS | Public form, registration route, price tiers via hidden links are in scope. No waitlist, no second form, no new landing page (link uses a query param, R4). |
| IV. Single Source of Truth | PASS | One form; schema change only via migration plus regenerated `lib/database.types.ts`; no CHECK constraints added; window rule and validation shared between page and server. |
| V. Language Separation | PASS | New German strings live in `lib/register/messages.ts`; identifiers stay English. The query param `einladung` is user visible URL text, not a code identifier. |
| VI. Tolerant Payment, Hidden Pricing | PASS | Unpaid registrations stay valid and count as active; hidden prices never rendered (FR-021a). |
| VII. Simplicity and Honest Quality Gates | PASS | Lazy state evaluation instead of a cron; existing modules extended; lint, test and build run after implementation. |
| Writing Rules | PASS | All public copy is rewritten without dashes during the move (R5). |
| Workflow | PASS | Spec clarified, plan pending user approval before `/speckit-tasks`. |

**Post design re-check (after Phase 1)**: unchanged, all PASS. The RPC adds SQL logic but no new
technology; RLS stays enabled and default deny for `registrations`.

## Project Structure

### Documentation (this feature)

```text
specs/001-registration-form/
├── plan.md              # This file
├── research.md          # Phase 0 decisions R1 to R9
├── data-model.md        # Entities, active definition, state machine
├── quickstart.md        # Manual validation guide
├── contracts/
│   ├── register-api.md          # POST /api/register
│   ├── create-public-registration.md  # Postgres RPC
│   └── landing-registration-ui.md     # Section states and invitation link
├── checklists/
│   └── requirements.md
└── tasks.md             # Created by /speckit-tasks
```

### Source Code (repository root)

```text
app/
├── page.tsx                              # read `einladung` search param, pass down
└── api/register/route.ts                 # map new result `camp_full`, use shared messages

components/marketing/
├── registration-section.tsx              # new `full` state, invitation resolution
├── registration-form.tsx                 # shared validation/messages, token state, hint
└── countdown-panel.tsx                   # router.refresh() at zero

lib/register/
├── messages.ts                           # NEW isomorphic German copy (public area)
├── validation.ts                         # NEW isomorphic core fields + validateField
├── registration-state.ts                 # NEW pure getRegistrationState (R1)
├── invitation.ts                         # NEW server only resolveInvitation (R4)
└── service.ts                            # use shared modules, window rule, RPC insert

lib/marketing/
├── current-camp.ts                       # load closes_at + capacity, delegate state rule
└── availability.ts                       # exclude cancelled, add active count helper

lib/database.types.ts                     # regenerated after migration

supabase/migrations/
└── 0005_public_registration_capacity.sql # NEW create_public_registration RPC

tests/unit/
├── registration-state.test.ts            # NEW
└── validation.test.ts                    # NEW

package.json                              # vitest dev dependency, "test" script
```

**Structure Decision**: Single Next.js application as defined in AGENTS.md. New pure logic goes to
`lib/register/` next to the existing service so the public registration domain stays in one folder;
unit tests live in a top level `tests/unit/` because the repo has no test layout yet.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Form keeps `useState` instead of react-hook-form (constitution I lists react-hook-form) | Fields are fully data driven; the form already works and validates through the shared `validateField` | Migrating now is an unrelated refactor without user visible gain and adds a dependency (constitution VII). Revisit when the form is redesigned. |
| SQL function with advisory lock | Only way to make the count and insert atomic through supabase.js (SC-004, SC-004a) | JS count then insert races; counter columns drift on admin edits (research R2). |
