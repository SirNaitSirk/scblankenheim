# Implementation Plan: Coming Soon Sperre vor dem Livegang

**Branch**: `023-coming-soon` | **Date**: 2026-10-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/023-coming-soon/spec.md`

## Summary

A server environment switch `COMING_SOON=true` turns on a gate in `proxy.ts`. While it is on,
every path that is not on a short allowlist (admin, sign in and sign up, Stripe webhook, cron, the
gate page itself) is answered for visitors without an admin profile: GET and HEAD are rewritten to
a German coming soon page at the internal route `/demnaechst` (the address bar keeps the requested
URL), every other method gets `503`. Admin means a signed in Clerk user with a `profiles` row,
looked up with the service client only when a Clerk session exists. Without the switch nothing
changes and `/demnaechst` returns 404. No schema, mail or data change.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.4 (App Router, Proxy on Node.js runtime)

**Primary Dependencies**: `@clerk/nextjs` (existing `clerkMiddleware`), Supabase service client; no
new dependency

**Storage**: N/A (reads `profiles` by Clerk user id, reads the current camp name)

**Testing**: Vitest 4 (`tests/unit`) for the pure gate decision, manual checks per quickstart

**Target Platform**: Vercel production; local and preview stay ungated unless the variable is set

**Project Type**: web application (Next.js full stack)

**Performance Goals**: anonymous visitors cost no database call; signed in users one indexed
lookup per request while the gate is on

**Constraints**: allowlist approach so future public pages are gated automatically; Stripe webhook
and cron must never be gated

**Scale/Scope**: one new page, one new lib module, `proxy.ts` changed, one unit test

## Constitution Check

*GATE: Must pass before Phase 0 research. Checked again after Phase 1 design.*

| Principle | Check | Result |
|-----------|-------|--------|
| I. Fixed stack | Clerk session in the existing proxy, Supabase only as data layer | Pass |
| II. Server security boundary | Gate decided on the server in the proxy; service client stays server only; public actions refused before they run (non GET → 503) | Pass |
| III. Strict scope | Prelaunch gate requested by the project owner; no preview link, no admin switch | Pass |
| IV. Single source of truth | Switch only in env; allowlist in one module; camp name from `getCurrentCamp` | Pass |
| V. Language separation | Copy in `lib/coming-soon/messages.ts`; code and route segment `demnaechst` follow the German public route style (`bezahlen`, `packzettel`) | Pass |
| VI. Tolerant payment | Stripe webhook stays open, payments reconcile as before | Pass |
| VII. Simplicity, quality gates | Pure `decideGate` with unit tests; lint, test, build after implementation | Pass |
| Writing rules | Copy and comments without dash punctuation | Pass |

Second check after Phase 1: unchanged, all pass. No complexity tracking needed.

## Existing code inspected

- `proxy.ts`: `clerkMiddleware` protects `/admin(.*)` and `/api/admin(.*)` with `auth.protect()`;
  matcher skips `_next` and static files, always runs for `/api`. Extended here.
- `lib/admin/data.ts`: `getCurrentProfile` (admin = `profiles` row for the Clerk user id, role from
  `user_roles`), `getCurrentCamp`. The gate reuses the same rule but queries `profiles` directly,
  because `getCurrentProfile` also writes `last_active_at`.
- `lib/supabase/server.ts`: `getServiceClient()` (server only).
- Public surface: `app/page.tsx`, `app/bezahlen/*`, `app/packzettel`, `app/meine-anmeldung/[token]`
  (+ `actions.ts` server actions), `app/busticket`, `app/kalender/[campId]/route.ts`,
  `app/design-system`, `app/actions/participant-link.ts`, `app/api/register`, `app/api/checkout`.
- Open by design: `app/sign-in`, `app/sign-up`, `app/admin/*`, `app/api/admin/*`,
  `app/api/stripe-webhook`, `app/api/cron/*`.
- `components/marketing/site-footer.tsx`, `mountain-hero.tsx`: brand look to reuse.

## Decisions and assumptions

See [research.md](research.md): R1 gate in proxy with rewrite, R2 allowlist instead of blocklist,
R3 admin check via `profiles`, R4 non GET gets 503, R5 switch value and location, R6 noindex.

## UI

- **Layout**: one centered column on the full viewport (`min-h-dvh grid place-items-center`),
  max width 32rem, 16 px gutter on phones.
- **Content**: small eyebrow „FCG Blankenheim“, heading with the camp name, one paragraph
  „Die Anmeldung startet bald. Schau in ein paar Tagen wieder vorbei.“, then a quiet text link
  „Teamzugang“ to `/sign-in?redirect_url=/`.
- **Typography and colors**: existing tokens and display font of the landing page; heading uses the
  hero style, body muted foreground; no new colors.
- **States**: no loading or error state needed (static apart from the camp name); camp name falls
  back to „Summercamp“ when no camp can be read.
- **Responsive**: same layout on all widths, no horizontal scroll from 320 px.

## Project Structure

### Documentation (this feature)

```text
specs/023-coming-soon/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/gate.md
└── tasks.md             # next: /speckit-tasks
```

### Source Code (repository root)

```text
lib/coming-soon/
├── gate.ts                      # NEW: isComingSoonEnabled(), decideGate() (pure)
├── admin.ts                     # NEW: server only isAdminUserId()
└── messages.ts                  # NEW: German copy
app/demnaechst/page.tsx          # NEW: coming soon page, 404 when switch is off
proxy.ts                         # CHANGED: apply the gate
tests/unit/coming-soon-gate.test.ts  # NEW: decision table
.env.example                     # CHANGED: document COMING_SOON
AGENTS.md                        # CHANGED: one line in section 4 Public
```

**Structure Decision**: Existing single Next.js project; pure logic in `lib/coming-soon`, request
handling in `proxy.ts`.

## Security requirements

- The gate decision runs on the server only; nothing about the switch reaches the browser.
- Allowlist is exact and prefix based on path segments (`/admin`, `/admin/...`), so `/administrator`
  style paths are not accidentally open.
- Server actions of public pages are POST requests to public paths and therefore refused with 503
  before any action code runs.
- The admin lookup selects only `id` from `profiles`; errors count as „not admin“ (fail closed).

## Acceptance criteria

All acceptance scenarios of [spec.md](spec.md) US1 to US4, FR-001 to FR-009 and SC-001 to SC-005,
verified through [quickstart.md](quickstart.md).

## Checks to run

`npm run lint`, `npm test`, `npm run build`.

## Rollout

1. Merge to `main` (switch not set yet, behaviour unchanged).
2. Set `COMING_SOON=true` for the Production environment in Vercel and redeploy.
3. Livegang: delete the variable in Vercel and redeploy.

## Complexity Tracking

None.
