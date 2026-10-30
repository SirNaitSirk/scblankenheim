import { describe, expect, it } from "vitest";
import { LINK_COOLDOWN_MS, LINK_DAY_MAX } from "@/lib/school-release/limits";
import { linkRequestSchema, mayReceiveLinkMail, normalizeEmail } from "@/lib/school-release/link-rules";

describe("linkRequestSchema", () => {
  it("trims and lowercases the address", () => {
    expect(linkRequestSchema.parse({ email: "  Lena@Example.ORG ", target: "school_release" }).email).toBe(
      "lena@example.org",
    );
  });

  it("rejects invalid addresses, overlong input and unknown targets", () => {
    expect(linkRequestSchema.safeParse({ email: "kein mail", target: "school_release" }).success).toBe(false);
    expect(
      linkRequestSchema.safeParse({ email: `${"a".repeat(250)}@x.de`, target: "school_release" }).success,
    ).toBe(false);
    expect(linkRequestSchema.safeParse({ email: "lena@example.org", target: "payment" }).success).toBe(false);
  });
});

describe("normalizeEmail", () => {
  it("matches stored addresses regardless of case and spaces", () => {
    expect(normalizeEmail(" Lena@Example.org")).toBe("lena@example.org");
    expect(normalizeEmail(null)).toBe("");
  });
});

describe("mayReceiveLinkMail", () => {
  const now = new Date("2027-05-01T10:00:00Z");

  it("allows the first mail", () => {
    expect(mayReceiveLinkMail(null, 0, now)).toBe(true);
  });

  it("waits for the cooldown", () => {
    expect(mayReceiveLinkMail(new Date(now.getTime() - LINK_COOLDOWN_MS + 1000), 1, now)).toBe(false);
    expect(mayReceiveLinkMail(new Date(now.getTime() - LINK_COOLDOWN_MS), 1, now)).toBe(true);
  });

  it("stops at the day limit", () => {
    expect(mayReceiveLinkMail(new Date(now.getTime() - 2 * LINK_COOLDOWN_MS), LINK_DAY_MAX, now)).toBe(false);
  });
});
