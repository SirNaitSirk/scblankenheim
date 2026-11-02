import { describe, expect, it } from "vitest";
import {
  checkFormToken,
  classifySubmission,
  createFormToken,
} from "@/lib/register/form-token";
import { FORM_MIN_FILL_MS, FORM_TOKEN_MAX_AGE_MS } from "@/lib/register/limits";

const KEY = Buffer.from("test key for the form token");
const OTHER_KEY = Buffer.from("another key");
const ISSUED = 1_800_000_000_000;

describe("checkFormToken", () => {
  const token = createFormToken(ISSUED, KEY);

  it("accepts a genuine token after the minimum fill time", () => {
    expect(checkFormToken(token, ISSUED + FORM_MIN_FILL_MS, KEY)).toBe("ok");
    expect(checkFormToken(token, ISSUED + 10 * 60 * 1000, KEY)).toBe("ok");
  });

  it("treats a missing or malformed token as missing", () => {
    expect(checkFormToken(undefined, ISSUED + 5000, KEY)).toBe("missing");
    expect(checkFormToken("", ISSUED + 5000, KEY)).toBe("missing");
    expect(checkFormToken("abc", ISSUED + 5000, KEY)).toBe("missing");
    expect(checkFormToken(`${ISSUED}.`, ISSUED + 5000, KEY)).toBe("missing");
  });

  it("rejects a token signed with another key or a changed timestamp", () => {
    expect(checkFormToken(createFormToken(ISSUED, OTHER_KEY), ISSUED + 5000, KEY)).toBe("forged");
    const signature = token.split(".")[1];
    expect(checkFormToken(`${ISSUED - 60_000}.${signature}`, ISSUED + 5000, KEY)).toBe("forged");
  });

  it("flags a submission faster than the minimum fill time", () => {
    expect(checkFormToken(token, ISSUED + FORM_MIN_FILL_MS - 1, KEY)).toBe("too_fast");
  });

  it("flags a timestamp in the future as too fast", () => {
    expect(checkFormToken(token, ISSUED - 60_000, KEY)).toBe("too_fast");
  });

  it("marks a genuine but old token as expired", () => {
    expect(checkFormToken(token, ISSUED + FORM_TOKEN_MAX_AGE_MS + 1, KEY)).toBe("expired");
  });
});

describe("classifySubmission", () => {
  const formToken = createFormToken(ISSUED, KEY);
  const now = ISSUED + 30_000;

  it("passes a person with an empty trap and a valid token", () => {
    expect(classifySubmission({ trap: "", formToken, now, key: KEY })).toEqual({ kind: "pass" });
    expect(classifySubmission({ trap: undefined, formToken, now, key: KEY })).toEqual({ kind: "pass" });
  });

  it("silently rejects a filled trap even with a valid token", () => {
    expect(classifySubmission({ trap: "spam", formToken, now, key: KEY })).toEqual({
      kind: "silent",
      reason: "trap",
    });
  });

  it("silently rejects missing, forged and too fast tokens", () => {
    expect(classifySubmission({ trap: "", formToken: undefined, now, key: KEY })).toEqual({
      kind: "silent",
      reason: "token",
    });
    expect(classifySubmission({ trap: "", formToken, now, key: OTHER_KEY })).toEqual({
      kind: "silent",
      reason: "token",
    });
    expect(classifySubmission({ trap: "", formToken, now: ISSUED + 100, key: KEY })).toEqual({
      kind: "silent",
      reason: "fast",
    });
  });

  it("tells an expired form apart so the person can reload", () => {
    const later = ISSUED + FORM_TOKEN_MAX_AGE_MS + 1;
    expect(classifySubmission({ trap: "", formToken, now: later, key: KEY })).toEqual({
      kind: "expired",
    });
  });
});
