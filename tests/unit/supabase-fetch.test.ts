import { afterEach, describe, expect, it, vi } from "vitest";
import { READ_TIMEOUT_MS, withReadTimeout } from "@/lib/supabase/fetch";

function stubFetch() {
  const base = vi.fn<typeof fetch>(async () => new Response("[]"));
  const lastInit = (): RequestInit => base.mock.calls.at(-1)?.[1] ?? {};
  return { base, lastInit };
}

describe("withReadTimeout", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // AbortSignal.timeout runs on Node's internal timers, which fake timers do
  // not control, so the test checks the requested limit instead of waiting.
  it("gives reads no-store and a signal bound to the read timeout", async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout");
    const { base, lastInit } = stubFetch();
    await withReadTimeout(base)("https://db.test/rest/v1/camps", { method: "GET" });

    const { cache, signal } = lastInit();
    expect(cache).toBe("no-store");
    expect(timeoutSpy).toHaveBeenCalledWith(READ_TIMEOUT_MS);
    expect(signal).toBe(timeoutSpy.mock.results[0]?.value);
  });

  it("treats a request without method as a read", async () => {
    const { base, lastInit } = stubFetch();
    await withReadTimeout(base)("https://db.test/rest/v1/camps");
    expect(lastInit().signal).toBeInstanceOf(AbortSignal);
  });

  it("leaves writes without a time limit", async () => {
    const { base, lastInit } = stubFetch();
    const caller = new AbortController();
    await withReadTimeout(base)("https://db.test/rest/v1/camps", {
      method: "POST",
      signal: caller.signal,
    });
    expect(lastInit().cache).toBe("no-store");
    expect(lastInit().signal).toBe(caller.signal);
  });

  it("still honours an aborted caller signal on reads", async () => {
    const { base, lastInit } = stubFetch();
    const caller = new AbortController();
    caller.abort();
    await withReadTimeout(base)("https://db.test/rest/v1/camps", {
      signal: caller.signal,
    });
    expect(lastInit().signal?.aborted).toBe(true);
  });
});
