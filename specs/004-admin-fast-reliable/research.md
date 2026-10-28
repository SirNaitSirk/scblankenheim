# Research: Adminbereich zuverlässig und schnell

## R1 · Why tabs end up empty

**Findings**

- Direct probe against Supabase with the service key: 3 rounds of 15 parallel reads of
  `registrations`, every read returned all 20 rows in 189 to 401 ms. The data is there.
- The service client (`lib/supabase/server.ts`) has no request timeout. After idle a pooled keep
  alive socket can be dead; a request on it can hang until the runtime gives up (minutes). The tab
  then stays in the `loading.tsx` skeleton or the page function fails and `error.tsx` shows
  "Die Daten konnten nicht geladen werden".
- Each page loads everything in one `Promise.all`; one stuck or failed request blocks or fails the
  whole tab. That matches "happened on all tabs, also Finanzen".
- The existing `retryTransient` only acts when a request finishes with an error; it cannot rescue a
  hanging one.

**Decision**: give every read a hard time limit (R2) so a hang turns into a fast, retryable error.

## R2 · One retry layer with a time budget

**Findings**: supabase-js 2.112 (`postgrest-js`) retries GET requests by itself on network errors
and on 503/520 with delays of 1s, 2s and 4s (`DEFAULT_MAX_RETRIES = 3`). Combined with our
`retryTransient` (3 attempts) a single failure can take over 20s, and with no timeout even forever.
`createClient(url, key, { db: { retry: false } })` turns the internal retry off.

**Decision**

- `db: { retry: false }`; `retryTransient` stays the only retry layer (2 retries, 150 ms and 600 ms
  backoff).
- Custom `global.fetch`: GET requests get `AbortSignal.timeout(3000)` combined with any caller
  signal (`AbortSignal.any`). Writes (POST, PATCH, DELETE) get no timeout, so an aborted but
  committed write can never be reported as failed.
- Budget: 3 × 3s + 0.75s ≈ 9.8s until the error state (SC-005). Normal reads take under 0.5s, so 3s
  is a wide margin.
- `isTransientError` additionally matches `timeout` and `abort` in the message (postgrest wraps
  fetch errors as `TimeoutError: …` with an empty code).

**Alternatives**: keeping supabase retry and dropping ours (fixed 1s/2s/4s delays, too slow);
a global undici agent with shorter keep alive (touches runtime internals, not portable to Vercel).

## R3 · No server side reuse of responses

**Findings** (`node_modules/next/dist/docs`, fetch.md and serverComponentsHmrCache.md): without Cache
Components, `fetch` defaults to `auto no cache` and admin routes are `force-dynamic`, so production
does not reuse responses. In development the HMR cache reuses fetch responses, also `no-store` ones,
across HMR refreshes, so after editing code the admin can see old data until a full reload.

**Decision**: the wrapper sets `cache: "no-store"` explicitly and `experimental.serverComponentsHmrCache = false`.

## R4 · Dedupe reads per render

**Findings**: dashboard render today: layout profile (2) + page profile (2) + `getCurrentCamp`
(camps, current id, registrations, fields = 4) + `getRegistrations` (1) + `getPriceTiers` (id + 2)
+ `getFinanceSummary` (id + full `buildCamps` 4 + 1) + form fields (1) = 19 requests.

**Decision**: `React.cache` (request scoped memo, see fetching-data.md "Reusing data with
React.cache") around the retried loaders: `loadCurrentCampId`, `loadCamps`, `getCurrentProfile`.
The cache wraps the retried function, so a retry never reuses a cached rejection. Result: profile 2,
current id 1, camps 3, registrations 1, tiers 2, finance 1, fields 1 = 11 requests (minus 42 %,
SC-003). Outside a render (Server Actions) `cache` does not memoize, so guards always read fresh.

## R5 · Instant tab switches

**Findings** (link.md, staleTimes.md, revalidatePath.md, use-router.md, Next 16.3):

- Default `prefetch="auto"` on dynamic routes only prefetches down to `loading.tsx`, so every click
  still waits for the server. `prefetch={true}` prefetches the full route; prefetch runs only in
  production.
- Full prefetches use the `static` stale time (default 5 min), visited dynamic pages the `dynamic`
  stale time (default 0s).
- A Server Action calling `revalidatePath` purges the whole client cache; `router.refresh()`
  refreshes the current route. All admin Server Actions already call `revalidatePath`.

**Decision**: sidebar `Link`s get `prefetch={true}`; `experimental.staleTimes = { dynamic: 30,
static: 30 }`. External changes (public registrations) appear after at most 30s or on reload, as
accepted in the spec. Server load: up to 6 prefetch renders when the admin opens, then at most one
per tab per 30s, negligible for a handful of admins.

**Alternatives**: client side data fetching with TanStack Query (large refactor of every page, not
needed); Cache Components with `use cache` (bigger migration, would need tag based invalidation in
every action).
