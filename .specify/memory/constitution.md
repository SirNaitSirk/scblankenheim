<!--
Sync Impact Report
Version change: 1.0.0 → 1.1.0
Modified principles:
  III. Strict Scope: housing removed from the MUST NOT list; room planning (houses, rooms,
  per camp room gender, assignment of registrations to rooms) is now in scope. The waitlist stays
  excluded.
  IV. Single Source of Truth: clarified that fixed core fields (name, email, gender) belong to the
  one registration form and are backed by `registrations` columns.
Added principles: none
Removed sections: none
Templates: no template changes needed.
Follow-up TODOs:
  - AGENTS.md sections 4, 5, 12 and quick reference updated in the same change (specs/008-room-planning).
-->
# CampConnect (scblankenheim) Constitution

CampConnect is the registration and administration platform for the yearly FCG Blankenheim
Summercamp. Visitors register through a public landing page; admins manage registrations,
payments, camps and other admins through a protected dashboard. The platform is reused every year.

## Core Principles

### I. Fixed Stack, Clerk Owns Auth

- The stack is Next.js (App Router) with TypeScript, Clerk, Supabase (Postgres database and
  Storage only), Tailwind CSS, shadcn/ui, Stripe, Vercel and Vercel Cron. Forms use
  react-hook-form with Zod; client data fetching uses TanStack Query.
- Authentication and admin sessions MUST use Clerk. Supabase Auth, `auth.users` and Supabase Auth
  JWT based RLS MUST NOT be used.
- A separate backend framework, local JSON app storage, scraping stacks and AI SDKs MUST NOT be
  added. Any new runtime dependency outside this list requires a justification in the plan.
- For Next.js behaviour, `node_modules/next/dist/docs/` is authoritative over memory.

Rationale: v1 suffered from mixed auth and stack drift. A fixed stack keeps every spec and plan
comparable and reviewable.

### II. The Server Is the Security Boundary

- The browser MUST NEVER receive the Supabase service role key, Stripe secret key, Clerk secret
  key, email provider credentials, `CRON_SECRET` or any admin secret. Only `NEXT_PUBLIC_*`
  variables reach the client.
- Privileged work (Stripe calls, service role writes, admin create/update/delete, transactional
  email, cron) MUST run in `app/api/*` route handlers or server components.
- Every privileged route MUST verify the Clerk session and the caller's role and permissions in
  `profiles` before touching data, and MUST answer `401`/`403` otherwise.
- The Stripe webhook route MUST verify the Stripe signature; the cron route MUST verify
  `CRON_SECRET`. All route input MUST be validated with Zod.
- RLS stays enabled on every table as defense in depth, but it is never the authorization gate.

Rationale: auth lives in Clerk, so the database cannot see the caller. Only the server can enforce
access correctly.

### III. Strict Scope

- Only features listed in AGENTS.md section 4 (In scope) MAY be specified and built.
- The following MUST NOT be built: a housing waitlist, an email template editor or
  `email_templates` table, custom database backups, A/B or `/v2` landing pages, and more than one
  registration form.
- A spec that needs something outside the scope MUST first amend this constitution or AGENTS.md.

Rationale: v1 accumulated dead weight. Scope discipline keeps the yearly maintenance load small.

### IV. Single Source of Truth

- There is exactly one registration form, driven by `camp_form_fields` of the current camp.
  Fixed core fields the platform depends on (name, email and gender, used by room planning) are
  part of that same form, backed by dedicated `registrations` columns, and cannot be removed by
  admins.
- The schema lives only in `supabase/migrations/`. Every schema change MUST be a migration
  followed by regenerated DB types in `lib/`. Dashboard only changes are forbidden.
- Registration values MUST NOT get rigid CHECK constraints; validation belongs in Zod and the app.
- The current camp is defined by `camp_settings` and read through one shared helper.

Rationale: three competing forms and over strict constraints caused repeated churn in v1.

### V. Language Separation

- Every user facing string (labels, buttons, validation, toasts, emails, empty and loading states,
  date and number formatting) MUST be German.
- German copy MUST live in one central messages module, not scattered across components.
- Code MUST be English only: identifiers, file names, comments, commit messages and DB columns.
  German and English MUST NOT be mixed inside code (no `getAnmeldung`).

Rationale: users are German speakers; code stays readable for any engineer and tool.

### VI. Tolerant Payment, Hidden Pricing

- Registration is intended to be final after Stripe payment, but registered and unpaid is a valid
  state. The system MUST NOT cancel registrations automatically; admins reconcile.
- Payment reminders run through a Vercel Cron route.
- Special prices exist only as `price_tiers` reachable through hidden invitation links and MUST
  NEVER be rendered publicly.

Rationale: the camp community prefers kindness over automation; special prices are personal.

### VII. Simplicity and Honest Quality Gates

- Small functions with explicit types; `any` is forbidden; limits are centralized; errors are
  handled safely. Route handlers stay thin and single purpose; UI and business logic stay apart.
- No speculative abstractions, no unrelated refactors.
- After implementation `npm run lint` MUST run, plus `npm test` where tests exist and
  `npm run build` when routes, config or server code changed. Results are reported verbatim;
  a check is never claimed as passed without running it.

Rationale: a once a year project must stay understandable for whoever maintains it next summer.

## Writing Rules

- User facing texts, documents, commit messages and code comments MUST NOT contain dash
  punctuation (en dash, em dash) or hyphens joining words. Rephrase with comma, period, colon or
  "·", or write compounds as one word.
- Exception: dashes that are technically required (file names, CSS classes, package names,
  command line options, URLs, identifiers).

## Development Workflow (Spec Driven Development)

- Every feature goes through Spec Kit: `/speckit-specify` (what and why, no tech) →
  optional `/speckit-clarify` → `/speckit-plan` (checked against this constitution) →
  `/speckit-tasks` → optional `/speckit-analyze` → `/speckit-implement`.
- Specs live in `specs/<number>-<feature>/`. This replaces the former `prompts/` approval files;
  existing files in `prompts/` remain as historical reference only.
- Implementation starts only after the user approved spec and plan.
- Every plan MUST contain a Constitution Check that lists each principle and whether the design
  complies; any violation MUST be justified in the plan's complexity tracking or rejected.
- UI work additionally covers layout, typography, spacing, color, responsiveness and loading,
  empty and error states, using the project skills `impeccable` and `tasteskill`.

## Governance

- This constitution supersedes AGENTS.md and any other practice where they conflict. AGENTS.md
  remains the runtime guidance for product context, data model and skills.
- Amendments are made through `/speckit-constitution`, approved by the project owner, and recorded
  with a Sync Impact Report.
- Versioning follows semantic versioning: MAJOR for removed or redefined principles, MINOR for new
  principles or materially expanded guidance, PATCH for wording and clarifications.
- Every plan and review verifies compliance with the principles above.

**Version**: 1.1.0 | **Ratified**: 2026-10-27 | **Last Amended**: 2026-10-27
