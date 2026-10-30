import { describe, expect, it } from "vitest";
import {
  decideGate,
  isComingSoonEnabled,
  isGatedRequest,
  isOpenPath,
} from "@/lib/coming-soon/gate";

describe("isComingSoonEnabled", () => {
  it("turns on only for true", () => {
    expect(isComingSoonEnabled("true")).toBe(true);
    expect(isComingSoonEnabled(" TRUE ")).toBe(true);
    expect(isComingSoonEnabled("1")).toBe(false);
    expect(isComingSoonEnabled("yes")).toBe(false);
    expect(isComingSoonEnabled("")).toBe(false);
    expect(isComingSoonEnabled(undefined)).toBe(false);
  });
});

describe("isOpenPath", () => {
  it("keeps admin, auth, webhook, cron and the gate page open", () => {
    for (const path of [
      "/admin",
      "/admin/finanzen",
      "/api/admin/bus/scan",
      "/sign-in",
      "/sign-in/factor-one",
      "/sign-up",
      "/api/stripe-webhook",
      "/api/cron/info-mails",
      "/demnaechst",
      "/impressum",
      "/datenschutz",
    ]) {
      expect(isOpenPath(path), path).toBe(true);
    }
  });

  it("gates public pages and look alike paths", () => {
    for (const path of [
      "/",
      "/bezahlen",
      "/packzettel",
      "/meine-anmeldung/abc",
      "/busticket/beispiel",
      "/kalender/123",
      "/design-system",
      "/api/register",
      "/api/checkout",
      "/administrator",
      "/api/cronjob",
      "/demnaechstx",
      "/impressumx",
      "/datenschutz-alt",
    ]) {
      expect(isOpenPath(path), path).toBe(false);
    }
  });
});

describe("decideGate", () => {
  const base = { enabled: true, pathname: "/", method: "GET", isAdmin: false };

  it("passes everything while the gate is off", () => {
    expect(decideGate({ ...base, enabled: false })).toBe("pass");
    expect(decideGate({ ...base, enabled: false, method: "POST" })).toBe("pass");
    expect(isGatedRequest(false, "/")).toBe(false);
  });

  it("passes open paths and admins", () => {
    expect(decideGate({ ...base, pathname: "/admin" })).toBe("pass");
    expect(decideGate({ ...base, pathname: "/api/stripe-webhook", method: "POST" })).toBe("pass");
    expect(decideGate({ ...base, isAdmin: true })).toBe("pass");
    // Legal pages stay readable for everyone (specs/025-legal-pages).
    expect(decideGate({ ...base, pathname: "/impressum" })).toBe("pass");
    expect(decideGate({ ...base, pathname: "/datenschutz" })).toBe("pass");
    expect(decideGate({ ...base, isAdmin: true, method: "POST" })).toBe("pass");
  });

  it("rewrites reads and refuses writes of visitors", () => {
    expect(decideGate(base)).toBe("rewrite");
    expect(decideGate({ ...base, method: "head" })).toBe("rewrite");
    expect(decideGate({ ...base, method: "POST" })).toBe("refuse");
    expect(decideGate({ ...base, pathname: "/api/register", method: "POST" })).toBe("refuse");
    expect(decideGate({ ...base, pathname: "/meine-anmeldung/x", method: "PUT" })).toBe("refuse");
  });
});
