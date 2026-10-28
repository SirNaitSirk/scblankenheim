# Contract: Admin data reads

Guarantees every admin read (`lib/admin/data.ts`) gives after this feature.

| Guarantee | Value |
|-----------|-------|
| Freshness | every page render reads from the database (`no-store`), no server side reuse |
| Per request time limit (reads) | 3000 ms, then aborted as transient error |
| Writes | no time limit (unchanged) |
| Retry | only `retryTransient`: 2 retries after 150 ms and 600 ms, only for transient errors |
| Transient | allowlisted Postgres or PostgREST codes; code less errors whose message mentions fetch failed, network, ECONNRESET, ETIMEDOUT, socket, timeout or abort; contentless errors |
| Worst case until error state | about 10 s |
| Dedupe | current camp id, camp list and current profile at most once per render |

# Contract: Admin client cache

| Situation | Behaviour |
|-----------|-----------|
| Sidebar visible (production) | every visible tab is fully prefetched |
| Prefetched or visited tab | reused for up to 30 s |
| Any admin Server Action | whole client cache purged (`revalidatePath`) |
| Full reload or sign out | cache gone |
