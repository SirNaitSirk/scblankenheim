import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { formatFrom, sendEmail } from "@/lib/email/provider";

const email = { to: "lena@example.com", subject: "Betreff", html: "<p>Hallo</p>", text: "Hallo" };

function stubFetch(response: Response | Error) {
  const mock = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  vi.stubGlobal("fetch", mock);
  return mock;
}

beforeEach(() => {
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("EMAIL_FROM", "Camp <camp@example.com>");
  vi.stubEnv("EMAIL_REPLY_TO", "team@example.com");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("sendEmail", () => {
  it("returns the provider id and sends the idempotency key", async () => {
    const mock = stubFetch(new Response(JSON.stringify({ id: "msg_1" }), { status: 200 }));
    await expect(sendEmail(email, "confirmation/abc")).resolves.toEqual({ ok: true, id: "msg_1" });

    const [, init] = mock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["Idempotency-Key"]).toBe("confirmation/abc");
    expect(headers.Authorization).toBe("Bearer re_test");
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({ to: ["lena@example.com"], reply_to: "team@example.com" });
  });

  it("maps 422 to rejected with the status as detail", async () => {
    stubFetch(new Response("{}", { status: 422 }));
    await expect(sendEmail(email, "k")).resolves.toEqual({
      ok: false,
      error: "rejected",
      detail: "422",
    });
  });

  it("keeps the provider message of a rejection", async () => {
    stubFetch(
      new Response(JSON.stringify({ statusCode: 403, message: "Domain not verified" }), {
        status: 403,
      }),
    );
    await expect(sendEmail(email, "k")).resolves.toEqual({
      ok: false,
      error: "rejected",
      detail: "403: Domain not verified",
    });
  });

  it("maps 429 to rate_limited", async () => {
    stubFetch(new Response("{}", { status: 429 }));
    await expect(sendEmail(email, "k")).resolves.toEqual({ ok: false, error: "rate_limited" });
  });

  it("maps a thrown fetch to network", async () => {
    stubFetch(new Error("offline"));
    await expect(sendEmail(email, "k")).resolves.toEqual({ ok: false, error: "network" });
  });

  it("does not call the provider without configuration", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const mock = stubFetch(new Response("{}", { status: 200 }));
    await expect(sendEmail(email, "k")).resolves.toEqual({ ok: false, error: "not_configured" });
    expect(mock).not.toHaveBeenCalled();
  });
});

describe("sender override (specs/016-mail-settings)", () => {
  it("keeps the env sender without a name", () => {
    expect(formatFrom("Camp <camp@example.com>", null)).toBe("Camp <camp@example.com>");
    expect(formatFrom("camp@example.com", "  ")).toBe("camp@example.com");
  });

  it("puts the camp name in front of the fixed address", () => {
    expect(formatFrom("Camp <camp@example.com>", "Summercamp 2027")).toBe('"Summercamp 2027" <camp@example.com>');
    expect(formatFrom("camp@example.com", "Summercamp 2027")).toBe('"Summercamp 2027" <camp@example.com>');
  });

  it("drops quotes from the name", () => {
    expect(formatFrom("camp@example.com", 'A "B"')).toBe('"A B" <camp@example.com>');
  });

  it("sends the camp name and reply address", async () => {
    const mock = stubFetch(new Response(JSON.stringify({ id: "msg_2" }), { status: 200 }));
    await sendEmail(email, "k", { name: "Summercamp 2027", replyTo: "leitung@example.com" });
    const [, init] = mock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({ from: '"Summercamp 2027" <camp@example.com>', reply_to: "leitung@example.com" });
  });

  it("falls back to the env reply address", async () => {
    const mock = stubFetch(new Response(JSON.stringify({ id: "msg_3" }), { status: 200 }));
    await sendEmail(email, "k", { name: null, replyTo: null });
    const [, init] = mock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({ from: "Camp <camp@example.com>", reply_to: "team@example.com" });
  });
});
