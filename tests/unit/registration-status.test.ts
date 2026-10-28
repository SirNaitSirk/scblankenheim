import { describe, expect, it } from "vitest";
import { toRegistrationStatus } from "@/lib/admin/registration-status";

describe("toRegistrationStatus", () => {
  it("keeps cancelled", () => {
    expect(toRegistrationStatus("cancelled")).toBe("cancelled");
  });

  it("reads active as active", () => {
    expect(toRegistrationStatus("active")).toBe("active");
  });

  it("maps legacy and unknown values to active", () => {
    expect(toRegistrationStatus("pending")).toBe("active");
    expect(toRegistrationStatus("confirmed")).toBe("active");
    expect(toRegistrationStatus("")).toBe("active");
  });
});
