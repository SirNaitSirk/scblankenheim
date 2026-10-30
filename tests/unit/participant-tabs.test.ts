import { describe, expect, it } from "vitest";
import { resolveTab, type ParticipantTab } from "@/lib/participant/tabs";

const ALL: ParticipantTab[] = ["overview", "details", "documents"];
const NO_DOCUMENTS: ParticipantTab[] = ["overview", "details"];

describe("resolveTab with documents available", () => {
  it.each([
    ["", "overview", null],
    ["#uebersicht", "overview", null],
    ["#angaben", "details", null],
    ["#dokumente", "documents", null],
    ["#busticket", "documents", "busticket"],
    ["#schulbefreiung", "documents", "schulbefreiung"],
    ["#quatsch", "overview", null],
  ])("maps %j to %s", (hash, tab, scrollTo) => {
    expect(resolveTab(hash, ALL)).toEqual({ tab, scrollTo });
  });
});

describe("resolveTab without documents", () => {
  it.each([
    ["", "overview"],
    ["#uebersicht", "overview"],
    ["#angaben", "details"],
    ["#dokumente", "overview"],
    ["#busticket", "overview"],
    ["#schulbefreiung", "overview"],
    ["#quatsch", "overview"],
  ])("maps %j to %s", (hash, tab) => {
    expect(resolveTab(hash, NO_DOCUMENTS)).toEqual({ tab, scrollTo: null });
  });
});

describe("resolveTab input handling", () => {
  it("ignores case", () => {
    expect(resolveTab("#Dokumente", ALL)).toEqual({ tab: "documents", scrollTo: null });
    expect(resolveTab("#BUSTICKET", ALL)).toEqual({ tab: "documents", scrollTo: "busticket" });
  });

  it("works without a leading hash", () => {
    expect(resolveTab("angaben", ALL)).toEqual({ tab: "details", scrollTo: null });
  });
});
