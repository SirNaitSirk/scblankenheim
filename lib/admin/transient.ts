/**
 * Transient error handling for admin reads. This is the only retry layer:
 * the service client turns supabase's own retry off (see lib/supabase/server.ts),
 * so the time budget until the admin error state stays predictable (about 10s
 * with the 3s read timeout from lib/supabase/fetch.ts).
 *
 * Kept free of `server-only` so unit tests can import it.
 */

/** Retries after the first attempt (3 attempts in total). */
export const READ_RETRIES = 2;

/** Backoff base: 150 ms, then 600 ms. */
export const RETRY_BASE_DELAY_MS = 150;

/**
 * Postgres/PostgREST error codes that are transient: a cold or just restarted
 * Supabase instance (schema cache not yet loaded), a statement timeout, or a
 * dropped connection. These typically succeed on a quick retry.
 */
const TRANSIENT_ERROR_CODES = new Set([
  "PGRST002", // schema cache could not be loaded (instance waking up)
  "PGRST001", // could not connect to the database
  "57014", // statement_timeout
  "08000", // connection_exception
  "08003", // connection_does_not_exist
  "08006", // connection_failure
]);

/**
 * True for transient Supabase read failures worth a retry: an allowlisted
 * PostgREST/Postgres code, a code less network failure (e.g. `TypeError: fetch
 * failed` from a dead keep alive socket after idle, or `TimeoutError: ...` when
 * the read timeout aborts a hanging request), or a contentless error object
 * with neither code nor message (a cold or dropped connection).
 */
export function isTransientError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  if (typeof code === "string" && code.length > 0) {
    return TRANSIENT_ERROR_CODES.has(code);
  }
  const message = (error as { message?: unknown }).message;
  if (
    typeof message === "string" &&
    /fetch failed|network|ECONNRESET|ETIMEDOUT|socket|timeout|abort/i.test(message)
  ) {
    return true;
  }
  // A genuine Postgres rejection always carries a code, so a code less,
  // message less error is treated as transient.
  const hasMessage = typeof message === "string" && message.length > 0;
  return !hasMessage;
}

/**
 * Runs a read thunk, retrying only on transient errors with short backoff.
 * Non transient errors are rethrown immediately, and the last transient error
 * is rethrown after the final attempt, so genuine failures still reach the
 * admin error boundary and retries stay bounded.
 */
export async function retryTransient<T>(
  fn: () => Promise<T>,
  retries = READ_RETRIES,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries || !isTransientError(error)) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_BASE_DELAY_MS * (attempt + 1) ** 2),
      );
    }
  }
  throw lastError;
}
