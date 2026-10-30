import { describe, expect, it } from "vitest";
import {
  buildParticipantView,
  type ParticipantCampInput,
  type ParticipantFieldInput,
  type ParticipantRegistrationInput,
} from "@/lib/participant/view";

const registration: ParticipantRegistrationInput = {
  reference: "REG-ABC123",
  first_name: "Lena",
  last_name: "Muster",
  email: "lena@example.org",
  gender: "female",
  form_data: {
    birthday: "2010-05-04",
    allergies: "Nüsse",
    photos: true,
    shirt: "M",
    removed_field: "alt",
    empty: "  ",
  },
  status: "active",
  payment_status: "partial",
  amount_due: 180,
  amount_paid: 120,
  deleted: false,
};

const camp: ParticipantCampInput = {
  name: "Summercamp 2027",
  start_date: "2027-07-20",
  end_date: "2027-07-27",
  location: "Blankenheim",
};

const fields: ParticipantFieldInput[] = [
  { key: "shirt", label: "Shirtgröße", field_type: "select", sort_order: 4 },
  { key: "step_two", label: "Weiteres", field_type: "step", sort_order: 2 },
  { key: "birthday", label: "Geburtstag", field_type: "date", sort_order: 1 },
  { key: "email", label: "Mail", field_type: "email", sort_order: 0 },
  { key: "photos", label: "Fotos erlaubt", field_type: "checkbox", sort_order: 3 },
  { key: "allergies", label: "Allergien", field_type: "textarea", sort_order: 5 },
  { key: "empty", label: "Leer", field_type: "text", sort_order: 6 },
];

const view = (patch: Partial<ParticipantRegistrationInput> = {}, campPatch = {}) =>
  buildParticipantView({
    registration: { ...registration, ...patch },
    camp: { ...camp, ...campPatch },
    fields,
  });

describe("buildParticipantView rows", () => {
  it("lists core fields first, then answers in sort order", () => {
    expect(view().rows).toEqual([
      { label: "Vorname", value: "Lena" },
      { label: "Nachname", value: "Muster" },
      { label: "Mail", value: "lena@example.org" },
      { label: "Geschlecht", value: "weiblich" },
      { label: "Geburtstag", value: "04.05.2010" },
      { label: "Fotos erlaubt", value: "Ja" },
      { label: "Shirtgröße", value: "M" },
      { label: "Allergien", value: "Nüsse" },
    ]);
  });

  it("shows an unchecked checkbox as Nein and skips a missing gender", () => {
    const rows = view({ gender: null, form_data: { photos: false } }).rows;
    expect(rows).toContainEqual({ label: "Fotos erlaubt", value: "Nein" });
    expect(rows.map((row) => row.label)).not.toContain("Geschlecht");
  });

  it("ignores form data that is not an object", () => {
    expect(view({ form_data: null }).rows).toHaveLength(4);
  });
});

describe("buildParticipantView camp", () => {
  it("keeps dates only when both exist", () => {
    expect(view().campDates).toEqual({ start: "2027-07-20", end: "2027-07-27" });
    expect(view({}, { end_date: null }).campDates).toBeNull();
  });

  it("drops an empty location", () => {
    expect(view({}, { location: " " }).campLocation).toBeNull();
  });
});

describe("buildParticipantView payment", () => {
  it("offers payment for an open amount", () => {
    const result = view();
    expect(result.amounts).toEqual({ total: 180, paid: 120, outstanding: 60 });
    expect(result.payState).toBe("pay");
    expect(result.payHref).toBe("/bezahlen?ref=REG-ABC123");
  });

  it("treats an overpayment as paid", () => {
    const result = view({ amount_paid: 200, payment_status: "partial" });
    expect(result.amounts.outstanding).toBe(0);
    expect(result.payState).toBe("paid");
    expect(result.payHref).toBeNull();
  });

  it("marks a free registration", () => {
    expect(view({ amount_due: 0, amount_paid: 0, payment_status: "unpaid" }).payState).toBe("free");
  });

  it.each([
    ["paid", "paid"],
    ["processing", "processing"],
    ["refunded", "refunded"],
  ])("maps payment status %s", (status, expected) => {
    const result = view({ payment_status: status });
    expect(result.payState).toBe(expected);
    expect(result.payHref).toBeNull();
  });

  it("keeps the paid amount of a cancelled registration without a pay link", () => {
    const result = view({ status: "cancelled" });
    expect(result.status).toBe("cancelled");
    expect(result.payState).toBe("cancelled");
    expect(result.amounts.paid).toBe(120);
    expect(result.payHref).toBeNull();
  });
});

describe("buildParticipantView privacy", () => {
  it("returns only the documented keys", () => {
    expect(Object.keys(view()).sort()).toEqual(
      [
        "amounts",
        "calendar",
        "campDates",
        "campLocation",
        "campName",
        "editableFields",
        "firstName",
        "messages",
        "payHref",
        "payState",
        "rows",
        "schoolRelease",
        "status",
      ].sort(),
    );
  });
});

describe("school release card (specs/020-school-release)", () => {
  const settings = {
    enabled: true,
    dates: ["2027-07-23"],
    signerName: "Maria Schulz",
    signerRole: null,
    signaturePath: "camp/signature-1.png",
    addressKeys: ["shirt", "allergies"],
  };
  const withRelease = (patch: Partial<ParticipantRegistrationInput> = {}, enabled = true) =>
    buildParticipantView({
      registration: { ...registration, ...patch },
      camp,
      fields,
      release: { settings: { ...settings, enabled }, data: null },
    });

  it("shows dates, name and prefilled address when active", () => {
    expect(withRelease().schoolRelease).toEqual({
      dates: "Freitag, 23. Juli 2027",
      locked: false,
      participantName: "Lena Muster",
      data: null,
      prefillAddress: "M\nNüsse",
    });
  });

  it("locks the card until a first payment arrives", () => {
    expect(withRelease({ payment_status: "unpaid", amount_paid: 0 }).schoolRelease?.locked).toBe(true);
    expect(withRelease({ payment_status: "processing", amount_paid: 0 }).schoolRelease?.locked).toBe(true);
    expect(withRelease({ payment_status: "unpaid", amount_due: 0, amount_paid: 0 }).schoolRelease?.locked).toBe(false);
  });

  it("is hidden after a refund", () => {
    expect(withRelease({ payment_status: "refunded" }).schoolRelease).toBeNull();
  });

  it("is hidden when switched off, cancelled or without settings", () => {
    expect(withRelease({}, false).schoolRelease).toBeNull();
    expect(withRelease({ status: "cancelled" }).schoolRelease).toBeNull();
    expect(view().schoolRelease).toBeNull();
  });
});
