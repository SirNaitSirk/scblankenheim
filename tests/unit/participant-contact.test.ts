import { describe, expect, it } from "vitest";
import type { CampFormField } from "@/lib/admin/types";
import {
  allowedChangeFields,
  changePatch,
  checkChangeRequest,
  displayFieldValue,
  parseFieldInput,
  participantMessageInputSchema,
  storedFieldValue,
  type ChangeableRegistration,
} from "@/lib/participant/contact";

const field = (patch: Partial<CampFormField>): CampFormField => ({
  id: patch.key ?? "f",
  campId: "c",
  key: "f",
  label: "Feld",
  fieldType: "text",
  required: false,
  options: null,
  sortOrder: 0,
  config: {},
  ...patch,
});

const shirt = field({ key: "shirt", label: "Shirtgröße", fieldType: "select", options: ["S", "M", "L"], sortOrder: 2 });
const photos = field({ key: "photos", label: "Fotos erlaubt", fieldType: "checkbox", required: true, sortOrder: 3 });
const birthday = field({ key: "birthday", label: "Geburtstag", fieldType: "date", sortOrder: 1 });
const step = field({ key: "step_two", label: "Weiteres", fieldType: "step", sortOrder: 0 });

const registration: ChangeableRegistration = {
  first_name: "Lena",
  last_name: "Muster",
  email: "lena@example.org",
  gender: "female",
  form_data: { shirt: "M", photos: true, birthday: "2010-05-04" },
};

describe("participantMessageInputSchema", () => {
  it("trims and accepts a message", () => {
    expect(participantMessageInputSchema.parse({ kind: "message", text: "  Hallo  " })).toEqual({
      kind: "message",
      text: "Hallo",
    });
  });

  it("rejects an empty or too long message", () => {
    expect(participantMessageInputSchema.safeParse({ kind: "message", text: "   " }).success).toBe(false);
    expect(participantMessageInputSchema.safeParse({ kind: "message", text: "x".repeat(2001) }).success).toBe(false);
  });

  it("defaults the reason of a change request and caps it", () => {
    expect(
      participantMessageInputSchema.parse({ kind: "change_request", fieldKey: "shirt", value: "L" }),
    ).toMatchObject({ reason: "" });
    expect(
      participantMessageInputSchema.safeParse({
        kind: "change_request",
        fieldKey: "shirt",
        value: "L",
        reason: "x".repeat(501),
      }).success,
    ).toBe(false);
  });
});

describe("allowedChangeFields", () => {
  it("puts core fields first and drops step rows", () => {
    const keys = allowedChangeFields([shirt, step, photos]).map((f) => f.key);
    expect(keys).toEqual(["first_name", "last_name", "email", "gender", "shirt", "photos"]);
  });
});

describe("storedFieldValue", () => {
  it("reads core columns, gender as option text and form answers", () => {
    expect(storedFieldValue(registration, "last_name")).toBe("Muster");
    expect(storedFieldValue(registration, "gender")).toBe("Weiblich");
    expect(storedFieldValue(registration, "photos")).toBe(true);
    expect(storedFieldValue(registration, "missing")).toBeNull();
    expect(storedFieldValue({ ...registration, gender: null }, "gender")).toBeNull();
  });
});

describe("checkChangeRequest", () => {
  it("accepts a valid new option", () => {
    expect(checkChangeRequest(shirt, "M", "L")).toEqual({ ok: true });
  });

  it("rejects an unknown option, a bad email and an unchecked required box", () => {
    expect(checkChangeRequest(shirt, "M", "XXL")).toMatchObject({ ok: false, reason: "invalid" });
    const email = allowedChangeFields([]).find((f) => f.key === "email")!;
    expect(checkChangeRequest(email, "a@b.de", "kein mail")).toMatchObject({ reason: "invalid" });
    expect(checkChangeRequest(photos, true, false)).toMatchObject({ reason: "invalid" });
  });

  it("rejects an unchanged value, ignoring surrounding spaces", () => {
    expect(checkChangeRequest(shirt, "M", " M ")).toEqual({ ok: false, reason: "unchanged" });
  });
});

describe("parseFieldInput and changePatch", () => {
  it("turns checkbox input into a boolean", () => {
    expect(parseFieldInput(photos, "false")).toBe(false);
    expect(parseFieldInput(shirt, " L ")).toBe("L");
  });

  it("writes core columns, gender and form answers", () => {
    expect(changePatch(registration, "last_name", " Beispiel ")).toEqual({ last_name: "Beispiel" });
    expect(changePatch(registration, "gender", "Männlich")).toEqual({ gender: "male" });
    expect(changePatch(registration, "shirt", "L")).toEqual({
      form_data: { shirt: "L", photos: true, birthday: "2010-05-04" },
    });
  });
});

describe("displayFieldValue", () => {
  it("formats checkbox, date and text", () => {
    expect(displayFieldValue(photos, true)).toBe("Ja");
    expect(displayFieldValue(photos, false)).toBe("Nein");
    expect(displayFieldValue(birthday, "2010-05-04")).toBe("04.05.2010");
    expect(displayFieldValue(shirt, null)).toBe("");
  });
});
