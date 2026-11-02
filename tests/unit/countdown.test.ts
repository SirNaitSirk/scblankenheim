import { describe, expect, it } from "vitest";
import {
  countdownRemaining,
  formatOpeningDate,
  formatOpeningTime,
} from "@/lib/register/countdown";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const target = Date.UTC(2027, 1, 1, 17, 0);

describe("countdownRemaining", () => {
  it("counts whole days from one day on", () => {
    expect(countdownRemaining(target, target - 90 * DAY - 5 * HOUR)).toEqual({ kind: "days", value: 90 });
    expect(countdownRemaining(target, target - DAY)).toEqual({ kind: "days", value: 1 });
  });

  it("counts whole hours below one day", () => {
    expect(countdownRemaining(target, target - DAY + 60_000)).toEqual({ kind: "hours", value: 23 });
    expect(countdownRemaining(target, target - HOUR)).toEqual({ kind: "hours", value: 1 });
  });

  it("says under an hour below one hour", () => {
    expect(countdownRemaining(target, target - 59 * 60_000)).toEqual({ kind: "underHour" });
    expect(countdownRemaining(target, target - 1)).toEqual({ kind: "underHour" });
  });

  it("returns null once the target is reached", () => {
    expect(countdownRemaining(target, target)).toBeNull();
    expect(countdownRemaining(target, target + 1000)).toBeNull();
  });
});

describe("opening date formatting", () => {
  it("uses Berlin time in winter", () => {
    const date = new Date("2027-02-01T17:00:00Z");
    expect(formatOpeningDate(date)).toBe("Montag, 1. Februar 2027");
    expect(formatOpeningTime(date)).toBe("18:00");
  });

  it("uses Berlin time in summer and across midnight UTC", () => {
    const date = new Date("2027-06-30T22:30:00Z");
    expect(formatOpeningDate(date)).toBe("Donnerstag, 1. Juli 2027");
    expect(formatOpeningTime(date)).toBe("00:30");
  });
});
