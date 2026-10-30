import { describe, expect, it } from "vitest";
import { formatOpeningDay, registrationCta } from "@/lib/register/registration-cta";

describe("registrationCta", () => {
  it("invites to register when open", () => {
    expect(registrationCta("open", null)).toEqual({
      label: "Jetzt anmelden",
      shortLabel: "Anmelden",
      href: "#anmelden",
    });
  });

  it("names the opening day during the countdown", () => {
    const cta = registrationCta("countdown", "2026-11-30T09:00:00Z");
    expect(cta.label).toBe("Anmeldung ab 30. November");
    expect(cta.shortLabel).toBe("Ab 30.11.");
  });

  it("uses the Berlin day for an opening shortly before midnight UTC", () => {
    const cta = registrationCta("countdown", "2026-11-29T23:30:00Z");
    expect(cta.label).toBe("Anmeldung ab 30. November");
    expect(cta.shortLabel).toBe("Ab 30.11.");
  });

  it("falls back without a valid opening date", () => {
    for (const opensAt of [null, "not a date"]) {
      const cta = registrationCta("countdown", opensAt);
      expect(cta.label).toBe("Anmeldung bald");
      expect(cta.shortLabel).toBe("Anmeldung");
    }
  });

  it("never promises a registration when closed or full", () => {
    expect(registrationCta("closed", null).label).toBe("Anmeldung geschlossen");
    expect(registrationCta("full", null).label).toBe("Ausgebucht");
    expect(registrationCta("closed", null).shortLabel).toBe("Anmeldung");
    expect(registrationCta("full", null).shortLabel).toBe("Anmeldung");
  });

  it("always targets the registration section", () => {
    for (const state of ["open", "countdown", "closed", "full"] as const) {
      expect(registrationCta(state, "2026-11-30T09:00:00Z").href).toBe("#anmelden");
    }
  });
});

describe("formatOpeningDay", () => {
  it("formats the Berlin day or returns null", () => {
    expect(formatOpeningDay("2026-11-30T09:00:00Z")).toBe("30. November");
    expect(formatOpeningDay(null)).toBeNull();
    expect(formatOpeningDay("x")).toBeNull();
  });
});
