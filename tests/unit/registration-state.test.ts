import { describe, expect, it } from "vitest";
import {
  getRegistrationState,
  type RegistrationWindow,
} from "@/lib/register/registration-state";

const NOW = new Date("2027-03-01T12:00:00Z");
const PAST = "2027-02-01T12:00:00Z";
const FUTURE = "2027-04-01T12:00:00Z";

function camp(overrides: Partial<RegistrationWindow> = {}): RegistrationWindow {
  return {
    registrationOpen: false,
    opensAt: null,
    closesAt: null,
    capacity: null,
    ...overrides,
  };
}

describe("getRegistrationState", () => {
  it("is closed without a current camp", () => {
    expect(getRegistrationState(null, NOW, 0)).toBe("closed");
  });

  it("is open when the switch is on", () => {
    expect(getRegistrationState(camp({ registrationOpen: true }), NOW, 0)).toBe("open");
  });

  it("is closed once the deadline is reached, even when switched on", () => {
    expect(
      getRegistrationState(camp({ registrationOpen: true, closesAt: PAST }), NOW, 0),
    ).toBe("closed");
    expect(
      getRegistrationState(
        camp({ registrationOpen: true, closesAt: NOW.toISOString() }),
        NOW,
        0,
      ),
    ).toBe("closed");
  });

  it("stays open before the deadline", () => {
    expect(
      getRegistrationState(camp({ registrationOpen: true, closesAt: FUTURE }), NOW, 0),
    ).toBe("open");
  });

  it("counts down while the opening time lies in the future", () => {
    expect(getRegistrationState(camp({ opensAt: FUTURE }), NOW, 0)).toBe("countdown");
  });

  it("opens automatically at the opening time", () => {
    expect(
      getRegistrationState(camp({ opensAt: NOW.toISOString() }), NOW, 0),
    ).toBe("open");
    expect(getRegistrationState(camp({ opensAt: PAST }), NOW, 0)).toBe("open");
  });

  it("is closed when switched off without an opening time", () => {
    expect(getRegistrationState(camp(), NOW, 0)).toBe("closed");
  });

  it("lets the deadline win over automatic opening", () => {
    expect(
      getRegistrationState(camp({ opensAt: PAST, closesAt: PAST }), NOW, 0),
    ).toBe("closed");
  });

  it("is never full without a capacity", () => {
    expect(
      getRegistrationState(camp({ registrationOpen: true }), NOW, 10_000),
    ).toBe("open");
  });

  it("is full exactly when active registrations reach the capacity", () => {
    const limited = camp({ registrationOpen: true, capacity: 100 });
    expect(getRegistrationState(limited, NOW, 99)).toBe("open");
    expect(getRegistrationState(limited, NOW, 100)).toBe("full");
    expect(getRegistrationState(limited, NOW, 101)).toBe("full");
  });

  it("shows the countdown before full", () => {
    expect(
      getRegistrationState(camp({ opensAt: FUTURE, capacity: 1 }), NOW, 5),
    ).toBe("countdown");
  });

  it("treats an unparsable date as not set", () => {
    expect(
      getRegistrationState(camp({ registrationOpen: true, closesAt: "kaputt" }), NOW, 0),
    ).toBe("open");
    expect(getRegistrationState(camp({ opensAt: "kaputt" }), NOW, 0)).toBe("closed");
  });
});
