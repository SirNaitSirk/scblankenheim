# Implementation Plan: Adminbereich zuverlässig und schnell

**Branch**: `004-admin-fast-reliable` | **Date**: 2026-10-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-admin-fast-reliable/spec.md`

## Summary

Admin tabs sometimes show no data although the database returns every registration reliably
(probe: 45 parallel reads, always 20 rows, under 0.5s). The weak points are in the read chain:

1. No time limit per request: a dead connection after idle can hang a tab indefinitely
   ([R1](./research.md#r1--why-tabs-end-up-empty)).
2. Two stacked retry layers (supabase internal 1s, 2s, 4s plus our own) can stretch one failure to
   over 20s ([R2](./research.md#r2--one-retry-layer-with-a-time-budget)).
3. In local development the HMR fetch cache reuses old responses after code edits
   ([R3](./research.md#r3--no-server-side-reuse-of-responses)).
4. One render asks the same thing several times (dashboard: 19 requests, camp list twice, current
   camp id three times, profile twice) ([R4](./research.md#r4--dedupe-reads-per-render)).
5. Every tab switch renders from scratch; nothing is prefetched for dynamic admin routes
   ([R5](./research.md#r5--instant-tab-switches)).

Approach:

- One small fetch wrapper for the service client: `cache: "no-store"` and a 3s timeout for reads
  (GET only, writes unchanged); supabase internal retry off; our `retryTransient` stays the single
  retry layer and also treats timeouts and aborts as transient. Worst case about 10s until the
  German error state.
- `React.cache` for the current camp id, the camp list and the current profile, so each is read once
  per render (dashboard 19 → 11 requests).
- Sidebar links prefetch the full tab (`prefetch={true}`) and the client cache keeps prefetched and
  visited tabs for 30s (`staleTimes`). Every existing Server Action already calls `revalidatePath`,
  which purges the whole client cache, so own changes stay instantly visible.
- Dev only: `serverComponentsHmrCache: false`.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.3 (App Router, no Cache Components)

**Primary Dependencies**: `@supabase/supabase-js` 2.112.3 (`db.retry`, `global.fetch`), `@clerk/nextjs` 7

**Storage**: Supabase Postgres, existing tables only, no migration

**Testing**: Vitest (`tests/unit/`), manual scenarios in [quickstart.md](./quickstart.md)

**Target Platform**: Vercel; desktop and mobile browsers

**Project Type**: Web application (single Next.js app)

**Performance Goals**: prefetched or recently visited tab visible under 0.5s; dashboard requests
reduced by at least one third; failure surfaced within about 10s

**Constraints**: no new dependency, no migration, no change to content, copy, permissions or routes

**Scale/Scope**: a handful of admins, dozens to a few hundred registrations, 7 admin tabs

## Constitution Check

*Gate before Phase 0 and rechecked after Phase 1.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Fixed stack, Clerk owns auth | Pass | Only configuration of installed Next.js and supabase-js; no new dependency. |
| II. Server is the security boundary | Pass | Service client stays server only. Prefetch requests go through `proxy.ts` (Clerk) and each page still runs `guardTab`; prefetching renders on the server with the caller's session. |
| III. Strict scope | Pass | Reliability and speed of the in scope admin dashboard; no new feature. |
| IV. Single source of truth | Pass | No schema change; current camp still read from `camp_settings` through one helper. |
| V. Language separation | Pass | No new user facing copy; the existing German error state is reused. Code English. |
| VI. Tolerant payment, hidden pricing | Pass | Untouched. |
| VII. Simplicity, honest gates | Pass | Two small pure modules with unit tests, limits as named constants; lint, test and build after implementation. |
| Writing rules | Pass | No new copy; comments without dashes. |

Post design recheck: no violations, Complexity Tracking empty.

## Project Structure

### Documentation (this feature)

```text
specs/004-admin-fast-reliable/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/admin-data-reads.md
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks
```

### Source Code (files likely to change)

```text
lib/supabase/
├── server.ts              # service client: db.retry off, global.fetch = admin fetch wrapper
└── fetch.ts               # NEW pure: withReadTimeout (no-store, 3s timeout for GET)
lib/admin/
├── transient.ts           # NEW pure: isTransientError (+ timeout/abort), retryTransient (moved from data.ts)
└── data.ts                # React.cache for current camp id, camps, current profile; uses transient.ts
components/admin/
└── admin-sidebar.tsx      # nav links prefetch={true}
next.config.ts             # experimental.staleTimes { dynamic: 30, static: 30 }, serverComponentsHmrCache: false
tests/unit/
├── transient.test.ts      # NEW
└── supabase-fetch.test.ts # NEW
```

**Structure Decision**: single Next.js app as before. The pure helpers move out of `data.ts`
(which imports `server-only`) so Vitest can import them without a server runtime.

## Security

- Service role key, Clerk secret: unchanged, server only.
- Prefetched admin pages are rendered for the signed in caller and stored only in that browser tab's
  memory; signing out through Clerk performs a full navigation, which drops the client cache.
- A permission change by a superadmin reaches an already open session after at most 30s or on
  reload; every Server Action still checks permissions on the server, so no write can slip through.

## Acceptance Criteria

Spec SC-001 to SC-005, verified via [quickstart.md](./quickstart.md).

## Checks to Run

`npm run lint`, `npm test`, `npm run build` (config and server code change).

## Complexity Tracking

No violations.
