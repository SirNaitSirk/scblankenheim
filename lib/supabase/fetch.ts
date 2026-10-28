/**
 * Fetch wrapper for the service role Supabase client.
 *
 * Every request opts out of any Next.js response reuse (`no-store`), so admin
 * pages always render fresh database state. Reads (GET/HEAD) additionally get a
 * hard time limit: a dead keep alive socket after idle would otherwise hang a
 * page indefinitely. The resulting abort is a transient error that
 * `retryTransient` (lib/admin/transient.ts) retries. Writes get no time limit,
 * so a slow but committed write is never reported as failed.
 *
 * Kept free of `server-only` so unit tests can import it.
 */

/** Per request time limit for reads. Normal reads take well under 0.5s. */
export const READ_TIMEOUT_MS = 3000;

const READ_METHODS = new Set(["GET", "HEAD"]);

function requestMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) return init.method.toUpperCase();
  if (typeof Request !== "undefined" && input instanceof Request) {
    return input.method.toUpperCase();
  }
  return "GET";
}

export function withReadTimeout(baseFetch: typeof fetch): typeof fetch {
  return (input, init) => {
    const method = requestMethod(input, init);
    if (!READ_METHODS.has(method)) {
      return baseFetch(input, { ...init, cache: "no-store" });
    }
    const timeout = AbortSignal.timeout(READ_TIMEOUT_MS);
    const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
    return baseFetch(input, { ...init, cache: "no-store", signal });
  };
}
