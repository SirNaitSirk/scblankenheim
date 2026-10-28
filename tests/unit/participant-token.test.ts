import { describe, expect, it } from "vitest";
import { participantPath } from "@/lib/email/links";
import { isAccessToken, normalizeAccessToken } from "@/lib/participant/token";

const TOKEN = "0123456789abcdef".repeat(4);

describe("normalizeAccessToken", () => {
  it("accepts a 64 character hex token", () => {
    expect(normalizeAccessToken(TOKEN)).toBe(TOKEN);
  });

  it("lowercases and trims", () => {
    expect(normalizeAccessToken(` ${TOKEN.toUpperCase()} `)).toBe(TOKEN);
  });

  it("takes the first value of an array", () => {
    expect(normalizeAccessToken([TOKEN, "x"])).toBe(TOKEN);
  });

  it.each([
    ["too short", TOKEN.slice(1)],
    ["too long", `${TOKEN}0`],
    ["not hex", `${TOKEN.slice(1)}g`],
    ["empty", ""],
  ])("rejects a token that is %s", (_, value) => {
    expect(normalizeAccessToken(value)).toBeNull();
  });

  it("rejects undefined", () => {
    expect(normalizeAccessToken(undefined)).toBeNull();
  });
});

describe("isAccessToken", () => {
  it("rejects non strings", () => {
    expect(isAccessToken(42)).toBe(false);
    expect(isAccessToken(null)).toBe(false);
  });
});

describe("participantPath", () => {
  it("builds the page path", () => {
    expect(participantPath(TOKEN)).toBe(`/meine-anmeldung/${TOKEN}`);
  });
});
