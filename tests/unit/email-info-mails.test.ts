import { describe, expect, it } from "vitest";
import {
  infoDueDate,
  infoWindow,
  nextInfoMail,
  type InfoMailInput,
} from "@/lib/email/info-mails";
import { DEFAULT_TIMING } from "@/lib/email/settings";

// Camp from 20 to 27 July 2027: teaser opens 25 May, packing 29 June,
// arrival 15 July, thanks 1 August.
const base: InfoMailInput = {
  deleted: false,
  status: "active",
  hasEmail: true,
  registeredDate: "2027-03-01",
  campStartDate: "2027-07-20",
  campEndDate: "2027-07-27",
  enabled: { info_teaser: true, info_packing: true, info_arrival: true, info_thanks: true },
  arrivalReady: true,
  sentKinds: [],
  lastInfoDate: null,
  reminderToday: false,
  timing: DEFAULT_TIMING,
};

describe("infoWindow", () => {
  it("computes the due days and windows", () => {
    expect(infoDueDate("info_teaser", "2027-07-20", null, DEFAULT_TIMING)).toBe("2027-05-25");
    expect(infoWindow("info_teaser", "2027-07-20", null, DEFAULT_TIMING)).toEqual({ opens: "2027-05-25", closes: "2027-06-28" });
    expect(infoWindow("info_packing", "2027-07-20", null, DEFAULT_TIMING)).toEqual({ opens: "2027-06-29", closes: "2027-07-14" });
    expect(infoWindow("info_arrival", "2027-07-20", null, DEFAULT_TIMING)).toEqual({ opens: "2027-07-15", closes: "2027-07-19" });
    expect(infoWindow("info_thanks", null, "2027-07-27", DEFAULT_TIMING)).toEqual({ opens: "2027-08-01", closes: "2027-08-26" });
  });

  it("returns null without the needed camp date", () => {
    expect(infoWindow("info_packing", null, "2027-07-27", DEFAULT_TIMING)).toBeNull();
    expect(infoWindow("info_thanks", "2027-07-20", null, DEFAULT_TIMING)).toBeNull();
  });
});

describe("nextInfoMail", () => {
  const cases: Array<[string, Partial<InfoMailInput>, string, string | null]> = [
    ["nothing before the teaser", {}, "2027-05-24", null],
    ["teaser on its due day", {}, "2027-05-25", "info_teaser"],
    ["teaser until the day before packing", {}, "2027-06-28", "info_teaser"],
    ["packing replaces an unsent teaser", {}, "2027-06-29", "info_packing"],
    ["packing only once", { sentKinds: ["info_packing"] }, "2027-07-01", null],
    ["arrival five days before", { sentKinds: ["info_packing"] }, "2027-07-15", "info_arrival"],
    ["arrival on the day before start", {}, "2027-07-19", "info_arrival"],
    ["nothing on camp start", {}, "2027-07-20", null],
    ["nothing during the camp", {}, "2027-07-24", null],
    ["thanks five days after the end", {}, "2027-08-01", "info_thanks"],
    ["thanks on the last day", {}, "2027-08-26", "info_thanks"],
    ["no thanks after the window", {}, "2027-08-27", null],
    ["late registration seven weeks before gets the teaser", { registeredDate: "2027-06-01" }, "2027-06-02", "info_teaser"],
    ["late registration two weeks before gets only arrival", { registeredDate: "2027-07-06" }, "2027-07-15", "info_arrival"],
    ["late registration three days before gets arrival next day", { registeredDate: "2027-07-17" }, "2027-07-18", "info_arrival"],
    ["registration day sends nothing", { registeredDate: "2027-06-29" }, "2027-06-29", null],
    ["one info mail per day", { lastInfoDate: "2027-06-29" }, "2027-06-29", null],
    ["reminder day sends nothing", { reminderToday: true }, "2027-06-29", null],
    ["disabled stage sends nothing", { enabled: { ...base.enabled, info_packing: false } }, "2027-06-29", null],
    ["disabled packing does not reopen the teaser", { enabled: { ...base.enabled, info_packing: false } }, "2027-07-01", null],
    ["arrival needs the required fields", { arrivalReady: false }, "2027-07-15", null],
    ["missing start date", { campStartDate: null }, "2027-06-29", null],
    ["missing end date", { campEndDate: null }, "2027-08-01", null],
    ["cancelled", { status: "cancelled" }, "2027-06-29", null],
    ["deleted", { deleted: true }, "2027-06-29", null],
    ["no email", { hasEmail: false }, "2027-06-29", null],
    ["active gets info mails", { status: "active" }, "2027-06-29", "info_packing"],
  ];

  it.each(cases)("%s", (_name, overrides, today, expected) => {
    expect(nextInfoMail({ ...base, ...overrides }, today)).toBe(expected);
  });
});

describe("custom timing (specs/016-mail-settings)", () => {
  const custom = { ...DEFAULT_TIMING, packingDaysBefore: 28, arrivalDaysBefore: 7, thanksDaysAfter: 2 };

  it("moves the windows to the camp's own days", () => {
    expect(infoWindow("info_teaser", "2027-07-20", null, custom)).toEqual({ opens: "2027-05-25", closes: "2027-06-21" });
    expect(infoWindow("info_packing", "2027-07-20", null, custom)).toEqual({ opens: "2027-06-22", closes: "2027-07-12" });
    expect(infoWindow("info_arrival", "2027-07-20", null, custom)).toEqual({ opens: "2027-07-13", closes: "2027-07-19" });
    expect(infoWindow("info_thanks", null, "2027-07-27", custom)).toEqual({ opens: "2027-07-29", closes: "2027-08-26" });
  });

  it("sends the packing mail 28 days before start", () => {
    expect(nextInfoMail({ ...base, timing: custom }, "2027-06-22")).toBe("info_packing");
    expect(nextInfoMail({ ...base, timing: custom }, "2027-06-21")).toBe("info_teaser");
  });
});
