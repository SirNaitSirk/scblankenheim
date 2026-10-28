import { afterEach, describe, expect, it, vi } from "vitest";
import { isTransientError, retryTransient } from "@/lib/admin/transient";

describe("isTransientError", () => {
  it("accepts allowlisted codes and rejects genuine Postgres errors", () => {
    expect(isTransientError({ code: "PGRST002", message: "schema cache" })).toBe(true);
    expect(isTransientError({ code: "57014", message: "timeout" })).toBe(true);
    expect(isTransientError({ code: "23505", message: "duplicate key" })).toBe(false);
  });

  it("accepts code less network, timeout and abort failures", () => {
    for (const message of [
      "TypeError: fetch failed",
      "TimeoutError: The operation was aborted due to timeout",
      "AbortError: This operation was aborted",
    ]) {
      expect(isTransientError({ code: "", message })).toBe(true);
    }
  });

  it("treats a contentless error as transient and other code less errors as final", () => {
    expect(isTransientError({})).toBe(true);
    expect(isTransientError({ code: "", message: "permission denied" })).toBe(false);
    expect(isTransientError(null)).toBe(false);
  });
});

describe("retryTransient", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("succeeds after one transient failure", async () => {
    vi.useFakeTimers();
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce({ code: "", message: "TypeError: fetch failed" })
      .mockResolvedValueOnce("ok");
    const result = retryTransient(fn);
    await vi.runAllTimersAsync();
    await expect(result).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("rethrows a non transient error without retrying", async () => {
    const error = { code: "23505", message: "duplicate key" };
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(error);
    await expect(retryTransient(fn)).rejects.toBe(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("gives up after three attempts", async () => {
    vi.useFakeTimers();
    const error = { code: "PGRST001", message: "could not connect" };
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(error);
    const result = retryTransient(fn);
    const assertion = expect(result).rejects.toBe(error);
    await vi.runAllTimersAsync();
    await assertion;
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
