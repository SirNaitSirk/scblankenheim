import { describe, expect, it } from "vitest";
import {
  addDays,
  buildCampIcs,
  calendarFileName,
  escapeIcsText,
  foldIcsLine,
  googleCalendarUrl,
  toCampEvent,
  type CampEvent,
} from "@/lib/calendar/ics";

const camp = {
  id: "11111111-2222-3333-4444-555555555555",
  name: "Summercamp 2027",
  start_date: "2027-07-20",
  end_date: "2027-07-31",
  location: "Freizeitheim Blankenheim, Eifel",
};

const event = toCampEvent(camp, "https://camp.example") as CampEvent;
const NOW = new Date("2027-01-02T03:04:05.678Z");

describe("toCampEvent", () => {
  it("returns null for missing or inverted dates", () => {
    expect(toCampEvent({ ...camp, end_date: null }, "x")).toBeNull();
    expect(toCampEvent({ ...camp, start_date: null }, "x")).toBeNull();
    expect(toCampEvent({ ...camp, end_date: "2027-07-19" }, "x")).toBeNull();
  });

  it("accepts a single day camp and drops an empty location", () => {
    const single = toCampEvent({ ...camp, end_date: "2027-07-20", location: " " }, "x");
    expect(single?.end).toBe("2027-07-20");
    expect(single?.location).toBeNull();
  });
});

describe("addDays", () => {
  it("crosses month and year ends", () => {
    expect(addDays("2027-07-31", 1)).toBe("2027-08-01");
    expect(addDays("2027-12-31", 1)).toBe("2028-01-01");
  });
});

describe("escapeIcsText and foldIcsLine", () => {
  it("escapes backslash, semicolon, comma and newlines", () => {
    expect(escapeIcsText("a\\b;c,d\ne")).toBe("a\\\\b\\;c\\,d\\ne");
  });

  it("folds long lines at 75 octets with umlauts intact", () => {
    const line = `SUMMARY:${"Größe ".repeat(30)}`;
    const folded = foldIcsLine(line);
    const encoder = new TextEncoder();
    for (const part of folded.split("\r\n")) {
      expect(encoder.encode(part).length).toBeLessThanOrEqual(75);
    }
    expect(folded.split("\r\n").map((part, i) => (i === 0 ? part : part.slice(1))).join("")).toBe(line);
  });
});

describe("buildCampIcs", () => {
  const ics = buildCampIcs(event, NOW, "camp.example");

  it("uses CRLF line endings only", () => {
    expect(ics.endsWith("\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
  });

  it("writes an all day event with exclusive end", () => {
    expect(ics).toContain("DTSTART;VALUE=DATE:20270720\r\n");
    expect(ics).toContain("DTEND;VALUE=DATE:20270801\r\n");
    expect(ics).toContain("UID:camp-11111111-2222-3333-4444-555555555555@camp.example\r\n");
    expect(ics).toContain("DTSTAMP:20270102T030405Z\r\n");
    expect(ics).toContain("SUMMARY:Summercamp 2027\r\n");
    expect(ics).toContain("LOCATION:Freizeitheim Blankenheim\\, Eifel\r\n");
  });

  it("omits the location line without location", () => {
    expect(buildCampIcs({ ...event, location: null }, NOW, "camp.example")).not.toContain("LOCATION:");
  });
});

describe("googleCalendarUrl", () => {
  it("encodes values and uses the exclusive end date", () => {
    const url = new URL(googleCalendarUrl(event));
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("text")).toBe("Summercamp 2027");
    expect(url.searchParams.get("dates")).toBe("20270720/20270801");
    expect(url.searchParams.get("location")).toBe("Freizeitheim Blankenheim, Eifel");
  });
});

describe("calendarFileName", () => {
  it("slugs the camp name", () => {
    expect(calendarFileName("Summercamp 2027")).toBe("summercamp-2027.ics");
    expect(calendarFileName("Größte Freizeit!")).toBe("groesste-freizeit.ics");
    expect(calendarFileName("!!!")).toBe("camp.ics");
  });
});
