import { describe, expect, it } from "vitest";
import { isTicketCode, parseTicketCode, scanUrl } from "@/lib/bus/code";

const CODE = "AbCdEfGhIjKlMnOpQr_-12";

describe("ticket code", () => {
  it("accepts 22 base64url characters only", () => {
    expect(isTicketCode(CODE)).toBe(true);
    expect(isTicketCode(CODE.slice(1))).toBe(false);
    expect(isTicketCode(`${CODE}x`)).toBe(false);
    expect(isTicketCode("AbCdEfGhIjKlMnOpQr+/12")).toBe(false);
    expect(isTicketCode(null)).toBe(false);
  });

  it("builds the scan URL without a double slash", () => {
    expect(scanUrl("https://camp.example.org/", CODE)).toBe(`https://camp.example.org/admin/bus?t=${CODE}`);
  });

  it("parses the scan URL of any host and a bare code", () => {
    expect(parseTicketCode(scanUrl("https://camp.example.org", CODE))).toBe(CODE);
    expect(parseTicketCode(`http://localhost:3000/admin/bus/?t=${CODE}&fahrt=hin`)).toBe(CODE);
    expect(parseTicketCode(`  ${CODE} `)).toBe(CODE);
  });

  it("rejects foreign URLs and garbage", () => {
    expect(parseTicketCode(`https://camp.example.org/meine-anmeldung/abc?t=${CODE}`)).toBeNull();
    expect(parseTicketCode("https://camp.example.org/admin/bus?t=kurz")).toBeNull();
    expect(parseTicketCode("WIFI:S:Camp;T:WPA;P:geheim;;")).toBeNull();
    expect(parseTicketCode("")).toBeNull();
  });
});
