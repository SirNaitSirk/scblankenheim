# Research: Coming Soon Sperre

## R1 Gate in the proxy with a rewrite

- **Decision**: Decide in `proxy.ts` and `NextResponse.rewrite` gated GET and HEAD requests to the
  internal page `/demnaechst`.
- **Rationale**: One place covers every page, route handler and server action, including future
  ones. A rewrite keeps the requested URL, so the address bar does not reveal an internal path.
- **Alternatives**: Check in the root layout (does not cover route handlers such as the calendar
  file or API routes); Vercel Deployment Protection (Pro plan, blocks the Stripe webhook, no own
  page).

## R2 Allowlist instead of blocklist

- **Decision**: Open paths are `/admin`, `/api/admin`, `/sign-in`, `/sign-up`,
  `/api/stripe-webhook`, `/api/cron`, `/demnaechst` and their sub paths. Everything else is gated.
- **Rationale**: FR-003 asks that future public pages are gated too; a blocklist would silently
  forget them.
- **Alternatives**: Listing every public route (drifts with each new feature).

## R3 Who counts as admin

- **Decision**: A Clerk session whose user id has a `profiles` row. Looked up with the service
  client, selecting `id` only, only when a session exists. Lookup errors count as not admin.
- **Rationale**: Same rule as `getCurrentProfile`; a bare Clerk account from `/sign-up` without an
  invitation has no profile (FR-005). Anonymous visitors cost no database call.
- **Alternatives**: Clerk public metadata (second source of truth); any Clerk session (would let
  self sign ups in).

## R4 Non GET requests

- **Decision**: Gated requests with any method other than GET or HEAD get `503` with a short
  German text and `Retry-After`.
- **Rationale**: Server actions and `POST /api/register` or `/api/checkout` must not run (FR-007);
  rewriting a POST to a page would produce confusing errors.

## R5 Switch value and location

- **Decision**: Server env `COMING_SOON`; only the exact value `true` (trimmed, case insensitive)
  turns the gate on. Set in Vercel for Production only.
- **Rationale**: Fails open to today's behaviour for typos (edge case in spec); no `NEXT_PUBLIC_`
  prefix, so it never reaches the browser. Changing it needs a redeploy, which matches the
  rollout in the spec.

## R6 Search engines

- **Decision**: `/demnaechst` sets `robots: { index: false, follow: false }`; gated responses add
  the header `X-Robots-Tag: noindex`.
- **Rationale**: Prevents the placeholder from being indexed under real URLs.
