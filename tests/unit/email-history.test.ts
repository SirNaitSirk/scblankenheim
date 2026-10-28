import { describe, expect, it } from "vitest";
import { MAIL_HISTORY_LIMIT, toMailHistory, type DeliveryRow } from "@/lib/email/history";

const row = (overrides: Partial<DeliveryRow>): DeliveryRow => ({
  id: "d1",
  kind: "confirmation",
  status: "sent",
  trigger: "registration",
  actor: null,
  error: null,
  created_at: "2027-03-01T10:00:00.000Z",
  updated_at: "2027-03-01T10:00:02.000Z",
  ...overrides,
});

const names = new Map([["user_admin", "Kim Beispiel"]]);

describe("toMailHistory", () => {
  it("uses the send time for sent mails and the attempt time otherwise", () => {
    const [sent] = toMailHistory([row({})], names);
    expect(sent).toMatchObject({ status: "sent", at: "2027-03-01T10:00:02.000Z" });
    const [failed] = toMailHistory([row({ status: "failed", error: "provider" })], names);
    expect(failed).toMatchObject({ status: "failed", at: "2027-03-01T10:00:00.000Z" });
  });

  it("treats stale attempts as failed and keeps in flight ones", () => {
    expect(toMailHistory([row({ status: "failed", error: "stale" })], names)[0]!.status).toBe("failed");
    expect(toMailHistory([row({ status: "sending" })], names)[0]!.status).toBe("sending");
    expect(toMailHistory([row({ status: "weird" })], names)[0]!.status).toBe("failed");
  });

  it("resolves admin names and falls back to null", () => {
    const [known] = toMailHistory([row({ kind: "payment_link", trigger: "admin", actor: "user_admin" })], names);
    expect(known).toMatchObject({ trigger: "admin", actorName: "Kim Beispiel" });
    const [gone] = toMailHistory([row({ kind: "payment_link", trigger: "admin", actor: "user_gone" })], names);
    expect(gone!.actorName).toBeNull();
  });

  it("maps unknown triggers to automatic and keeps unknown kinds", () => {
    const [entry] = toMailHistory([row({ kind: "something_new", trigger: "other" })], names);
    expect(entry).toMatchObject({ kind: "something_new", trigger: "cron" });
  });

  it("orders newest first and caps the list", () => {
    const rows = Array.from({ length: MAIL_HISTORY_LIMIT + 5 }, (_, i) =>
      row({ id: `d${i}`, created_at: `2027-03-01T10:${String(i).padStart(2, "0")}:00.000Z` }),
    );
    const history = toMailHistory(rows, names);
    expect(history).toHaveLength(MAIL_HISTORY_LIMIT);
    expect(history[0]!.id).toBe(`d${MAIL_HISTORY_LIMIT + 4}`);
  });

  it("returns only the public fields", () => {
    const [entry] = toMailHistory([row({ error: "provider" })], names);
    expect(Object.keys(entry!).sort()).toEqual(["actorName", "at", "id", "kind", "status", "trigger"]);
  });
});
