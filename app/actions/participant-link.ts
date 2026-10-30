"use server";

import { after } from "next/server";
import { sendParticipantLink } from "@/lib/email/send";
import { requestIp } from "@/lib/payment/lookup";
import { findLinkTargets, isLinkThrottled, mayReceiveLink } from "@/lib/school-release/link-request";
import { linkRequestSchema } from "@/lib/school-release/link-rules";
import { releaseMessages } from "@/lib/school-release/messages";

/**
 * Landing page request for the link to one's participant page
 * (specs/020-school-release, US2, contracts/school-release.md). The answer is
 * the same whether a registration matches or not; lookup and sending run after
 * the response, one mail per matching registration.
 */

export type ParticipantLinkState =
  | { status: "idle" }
  | { status: "done" }
  | { status: "error"; error: string };

const copy = releaseMessages.landing;

export async function requestParticipantLinkAction(
  _previous: ParticipantLinkState,
  formData: FormData,
): Promise<ParticipantLinkState> {
  const parsed = linkRequestSchema.safeParse({
    email: formData.get("email") ?? "",
    target: formData.get("target") ?? "school_release",
  });
  if (!parsed.success) return { status: "error", error: copy.invalidEmail };

  try {
    if (await isLinkThrottled(await requestIp())) return { status: "error", error: copy.throttled };
  } catch (error) {
    console.error("[participant link] throttle check failed", error);
  }

  const { email } = parsed.data;
  after(async () => {
    try {
      for (const registrationId of await findLinkTargets(email)) {
        if (await mayReceiveLink(registrationId)) await sendParticipantLink(registrationId);
      }
    } catch (error) {
      console.error("[participant link] lookup failed", error);
    }
  });
  return { status: "done" };
}
