import { describe, expect, it } from "vitest";
import {
  filterFinanceRows,
  financeRowsToCsv,
  financeUpdateSchema,
  isActiveRegistration,
  isOverdue,
  outstandingOf,
  suggestPaymentStatus,
  summarizeFinance,
  toFinanceRow,
  todayInBerlin,
  type FinanceRow,
} from "@/lib/admin/finance";
import type { Registration } from "@/lib/admin/types";

function row(reference: string, overrides: Partial<FinanceRow> = {}): FinanceRow {
  return {
    reference,
    firstName: "Lena",
    lastName: "Muster",
    email: "lena@example.org",
    priceTierName: null,
    amountDue: 250,
    amountPaid: 0,
    payment: "unpaid",
    reminderCount: 0,
    lastReminderAt: null,
    remindersPaused: false,
    ...overrides,
  };
}

function registration(overrides: Partial<Registration> = {}): Registration {
  return {
    id: "REG-1",
    firstName: "Jörg",
    lastName: "Müller",
    email: "j@example.org",
    gender: "male",
    campId: "c1",
    priceTierId: "t1",
    registeredAt: "2026-05-01T10:00:00Z",
    status: "active",
    payment: "partial",
    amountDue: 250,
    amountPaid: 100,
    deleted: false,
    formData: { allergies: "Nüsse", emergencyContact: "0170 123" },
    reminderCount: 2,
    lastReminderAt: "2026-06-01T08:00:00Z",
    remindersPaused: false,
    openMessages: 0,
    ...overrides,
  };
}

describe("toFinanceRow", () => {
  it("keeps only finance fields and drops every form answer", () => {
    const result = toFinanceRow(registration(), new Map([["t1", "Mitarbeitende"]]));
    expect(Object.keys(result).sort()).toEqual(
      [
        "amountDue",
        "amountPaid",
        "email",
        "firstName",
        "lastName",
        "lastReminderAt",
        "payment",
        "priceTierName",
        "reference",
        "reminderCount",
        "remindersPaused",
      ].sort(),
    );
    expect(JSON.stringify(result)).not.toContain("Nüsse");
    expect(result.priceTierName).toBe("Mitarbeitende");
  });

  it("returns null for an unknown or missing tier", () => {
    expect(toFinanceRow(registration({ priceTierId: "" }), new Map()).priceTierName).toBeNull();
  });
});

describe("isActiveRegistration", () => {
  it("excludes deleted and cancelled registrations", () => {
    expect(isActiveRegistration({ deleted: false, status: "active" })).toBe(true);
    expect(isActiveRegistration({ deleted: true, status: "active" })).toBe(false);
    expect(isActiveRegistration({ deleted: false, status: "cancelled" })).toBe(false);
  });
});

describe("isOverdue", () => {
  const today = "2027-06-20";

  it("is false without a due date", () => {
    expect(isOverdue(row("a"), null, today)).toBe(false);
  });

  it("is true after the due date while money is owed", () => {
    expect(isOverdue(row("a"), "2027-06-15", today)).toBe(true);
    expect(isOverdue(row("a", { payment: "partial", amountPaid: 100 }), "2027-06-15", today)).toBe(true);
  });

  it("is false on the due date itself", () => {
    expect(isOverdue(row("a"), "2027-06-20", today)).toBe(false);
  });

  it("is false when fully paid, processing or refunded", () => {
    expect(isOverdue(row("a", { amountPaid: 250, payment: "paid" }), "2027-06-15", today)).toBe(false);
    expect(isOverdue(row("a", { payment: "processing" }), "2027-06-15", today)).toBe(false);
    expect(isOverdue(row("a", { payment: "refunded" }), "2027-06-15", today)).toBe(false);
  });
});

describe("suggestPaymentStatus", () => {
  it("maps the amount to unpaid, partial or paid", () => {
    expect(suggestPaymentStatus(250, 0)).toBe("unpaid");
    expect(suggestPaymentStatus(250, 100)).toBe("partial");
    expect(suggestPaymentStatus(250, 250)).toBe("paid");
    expect(suggestPaymentStatus(250, 300)).toBe("paid");
  });
});

describe("summarizeFinance", () => {
  it("sums amounts and counts states", () => {
    const rows = [
      row("a"),
      row("b", { amountPaid: 100, payment: "partial" }),
      row("c", { amountPaid: 250, payment: "paid" }),
    ];
    expect(summarizeFinance(rows, "2027-06-15", "2027-06-20")).toEqual({
      expected: 750,
      collected: 350,
      outstanding: 400,
      openCount: 2,
      unpaidCount: 1,
      partialCount: 1,
      overdueCount: 2,
    });
  });

  it("treats overpayment as credit", () => {
    expect(outstandingOf(row("a", { amountPaid: 270 }))).toBe(-20);
  });
});

describe("filterFinanceRows", () => {
  const rows = [
    row("REG-AAA", { firstName: "Anna", lastName: "Becker" }),
    row("REG-BBB", { firstName: "Ben", lastName: "Kühn", amountPaid: 100, payment: "partial" }),
    row("REG-CCC", { firstName: "Clara", lastName: "Wolf", amountPaid: 250, payment: "paid", remindersPaused: true }),
  ];
  const refs = (list: FinanceRow[]) => list.map((r) => r.reference);

  it("filters by state", () => {
    expect(refs(filterFinanceRows(rows, "all", "", null, "2027-06-20"))).toHaveLength(3);
    expect(refs(filterFinanceRows(rows, "open", "", null, "2027-06-20"))).toEqual(["REG-AAA", "REG-BBB"]);
    expect(refs(filterFinanceRows(rows, "partial", "", null, "2027-06-20"))).toEqual(["REG-BBB"]);
    expect(filterFinanceRows(rows, "overdue", "", null, "2027-06-20")).toHaveLength(0);
    expect(refs(filterFinanceRows(rows, "overdue", "", "2027-06-01", "2027-06-20"))).toEqual([
      "REG-AAA",
      "REG-BBB",
    ]);
    expect(refs(filterFinanceRows(rows, "paused", "", null, "2027-06-20"))).toEqual(["REG-CCC"]);
  });

  it("searches name and reference case insensitively", () => {
    expect(refs(filterFinanceRows(rows, "all", "kühn", null, "2027-06-20"))).toEqual(["REG-BBB"]);
    expect(refs(filterFinanceRows(rows, "all", "reg-ccc", null, "2027-06-20"))).toEqual(["REG-CCC"]);
  });
});

describe("financeRowsToCsv", () => {
  it("writes a BOM, German headers and plain numbers", () => {
    const csv = financeRowsToCsv(
      [row("REG-1", { firstName: "Jörg", lastName: "Müller; Sohn", amountPaid: 100, payment: "partial" })],
      "2027-06-01",
      "2027-06-20",
    );
    expect(csv.startsWith("﻿")).toBe(true);
    const [header, line] = csv.slice(1).split("\r\n");
    expect(header).toBe("Name;Referenz;Preisstufe;Fällig;Bezahlt;Offen;Status;Mahnungen;Überfällig");
    expect(line).toBe('"Jörg Müller; Sohn";REG-1;Keine;250;100;150;Teilweise;0;ja');
  });
});

describe("financeUpdateSchema", () => {
  it("rejects negative, fractional and unknown values", () => {
    expect(financeUpdateSchema.safeParse({ reference: "R", amountPaid: -5, payment: "paid" }).success).toBe(false);
    expect(financeUpdateSchema.safeParse({ reference: "R", amountPaid: 1.5, payment: "paid" }).success).toBe(false);
    expect(financeUpdateSchema.safeParse({ reference: "R", amountPaid: 5, payment: "lost" }).success).toBe(false);
    expect(financeUpdateSchema.safeParse({ reference: "R", amountPaid: 5, payment: "paid" }).success).toBe(true);
  });
});

describe("todayInBerlin", () => {
  it("uses the Berlin calendar day", () => {
    expect(todayInBerlin(new Date("2027-06-19T22:30:00Z"))).toBe("2027-06-20");
  });
});
