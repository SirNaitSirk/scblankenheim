import { describe, expect, it } from "vitest";
import { EMPTY_MAIL_INFO, resolveMailSettings } from "@/lib/admin/camp-mail-info";
import {
  DEFAULT_MAIL_SETTINGS,
  DEFAULT_TIMING,
  resolveTiming,
} from "@/lib/email/settings";

describe("resolveTiming", () => {
  it("uses every default when nothing is set", () => {
    expect(
      resolveTiming({
        teaserDaysBefore: null,
        packingDaysBefore: null,
        arrivalDaysBefore: null,
        thanksDaysAfter: null,
        reminderFirstAfterDays: null,
        reminderBeforeDueDays: null,
        reminderMinGapDays: null,
      }),
    ).toEqual(DEFAULT_TIMING);
  });

  it("keeps set values and fills the rest", () => {
    const timing = resolveTiming({
      teaserDaysBefore: null,
      packingDaysBefore: 28,
      arrivalDaysBefore: null,
      thanksDaysAfter: null,
      reminderFirstAfterDays: 10,
      reminderBeforeDueDays: null,
      reminderMinGapDays: null,
    });
    expect(timing).toEqual({ ...DEFAULT_TIMING, packingDaysBefore: 28, reminderFirstAfterDays: 10 });
  });

  it("defaults match today's fixed values", () => {
    expect(DEFAULT_TIMING).toEqual({
      teaserDaysBefore: 56,
      packingDaysBefore: 21,
      arrivalDaysBefore: 5,
      thanksDaysAfter: 5,
      reminderFirstAfterDays: 7,
      reminderBeforeDueDays: 7,
      reminderMinGapDays: 3,
    });
  });
});

describe("resolveMailSettings", () => {
  it("a camp without settings behaves like the defaults", () => {
    expect(resolveMailSettings(EMPTY_MAIL_INFO)).toEqual(DEFAULT_MAIL_SETTINGS);
  });
});
