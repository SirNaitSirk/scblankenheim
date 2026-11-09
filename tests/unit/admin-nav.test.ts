import { describe, expect, it } from "vitest";
import { BOTTOM_BAR_HREFS, NAV_ITEMS, isActive } from "@/components/admin/nav-items";

describe("isActive", () => {
  it("matches the overview only exactly", () => {
    expect(isActive("/admin", "/admin")).toBe(true);
    expect(isActive("/admin/finanzen", "/admin")).toBe(false);
  });

  it("matches other entries by path prefix", () => {
    expect(isActive("/admin/finanzen", "/admin/finanzen")).toBe(true);
    expect(isActive("/admin/finanzen/x", "/admin/finanzen")).toBe(true);
    expect(isActive("/admin/finanzenx", "/admin/finanzen")).toBe(false);
  });
});

describe("BOTTOM_BAR_HREFS", () => {
  it("only lists existing nav entries", () => {
    const hrefs = NAV_ITEMS.map((item) => item.href);
    for (const href of BOTTOM_BAR_HREFS) expect(hrefs).toContain(href);
  });
});
