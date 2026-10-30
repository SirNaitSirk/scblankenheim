"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { participantPath } from "@/lib/email/links";
import { sendTeamNotification } from "@/lib/email/team";
import { requestIp } from "@/lib/payment/lookup";
import {
  allowedChangeFields,
  checkChangeRequest,
  displayFieldValue,
  parseFieldInput,
  participantMessageInputSchema,
  storedFieldValue,
  toCampFormField,
} from "@/lib/participant/contact";
import { MESSAGE_TEXT_MAX } from "@/lib/participant/limits";
import { participantMessages } from "@/lib/participant/messages";
import {
  findRegistrationForToken,
  insertParticipantMessage,
  isDuplicate,
  isMessageThrottled,
  reachedDayLimit,
  type NewParticipantMessage,
} from "@/lib/participant/submit";
import { normalizeAccessToken } from "@/lib/participant/token";
import { getServiceClient } from "@/lib/supabase/server";
import { lastDeliveryAt } from "@/lib/email/deliveries";
import { canSendSchoolRelease, sendSchoolRelease } from "@/lib/email/send";
import { getReleaseSettings, isReleaseThrottled, upsertSchoolRelease } from "@/lib/school-release/data";
import { RELEASE_DUPLICATE_MS } from "@/lib/school-release/limits";
import { releaseMessages } from "@/lib/school-release/messages";
import { fieldErrorsOf, schoolReleaseInputSchema } from "@/lib/school-release/schema";
import { isReleaseActive, isReleaseUnlocked } from "@/lib/school-release/settings";

/**
 * Public action of the participant page (specs/018-participant-messages,
 * contracts/actions-and-mail.md). The token is the only authorization: the
 * registration is always resolved on the server, never taken from the client.
 */

export type ContactState =
  | { status: "idle" }
  | { status: "sent" }
  | { status: "error"; error: string; fieldError?: string };

const e = participantMessages.contact.errors;

function fail(error: string, fieldError?: string): ContactState {
  return { status: "error", error, fieldError };
}

function readInput(formData: FormData): unknown {
  const kind = formData.get("kind");
  if (kind === "change_request") {
    return {
      kind,
      fieldKey: formData.get("fieldKey") ?? "",
      value: formData.get("value") ?? "",
      reason: formData.get("reason") ?? "",
    };
  }
  return { kind: "message", text: formData.get("text") ?? "" };
}

export async function sendParticipantMessageAction(
  rawToken: string,
  _previous: ContactState,
  formData: FormData,
): Promise<ContactState> {
  try {
    const token = normalizeAccessToken(rawToken);
    if (!token) return fail(e.invalidLink);
    if (await isMessageThrottled(await requestIp())) return fail(e.throttled);

    const registration = await findRegistrationForToken(token);
    if (!registration) return fail(e.invalidLink);

    const parsed = participantMessageInputSchema.safeParse(readInput(formData));
    if (!parsed.success) {
      const text = formData.get("text");
      const tooLong = typeof text === "string" && text.trim().length > MESSAGE_TEXT_MAX;
      return fail(tooLong ? e.tooLong(MESSAGE_TEXT_MAX) : e.empty);
    }
    if (await reachedDayLimit(registration.id)) return fail(e.dayLimit);

    const input = parsed.data;
    let item: NewParticipantMessage;
    let display = { fieldLabel: null as string | null, previous: null as string | null, proposed: null as string | null };

    if (input.kind === "message") {
      item = {
        registration_id: registration.id,
        camp_id: registration.camp_id,
        kind: "message",
        body: input.text,
        field_key: null,
        field_label: null,
        previous_value: null,
        proposed_value: null,
      };
    } else {
      const { data: rows, error } = await getServiceClient()
        .from("camp_form_fields")
        .select("id, camp_id, key, label, field_type, required, options, sort_order")
        .eq("camp_id", registration.camp_id);
      if (error) throw error;
      const field = allowedChangeFields((rows ?? []).map(toCampFormField)).find(
        (candidate) => candidate.key === input.fieldKey,
      );
      if (!field) return fail(e.fieldUnavailable);

      const stored = storedFieldValue(registration, field.key);
      const value = parseFieldInput(field, input.value);
      const check = checkChangeRequest(field, stored, value);
      if (!check.ok) {
        return check.reason === "unchanged" ? fail(e.unchanged) : fail(check.message, check.message);
      }

      item = {
        registration_id: registration.id,
        camp_id: registration.camp_id,
        kind: "change_request",
        body: input.reason,
        field_key: field.key,
        field_label: field.label,
        previous_value: stored,
        proposed_value: value,
      };
      display = {
        fieldLabel: field.label,
        previous: displayFieldValue(field, stored),
        proposed: displayFieldValue(field, value),
      };
    }

    if (await isDuplicate(item)) return { status: "sent" };
    await insertParticipantMessage(item);

    after(() =>
      sendTeamNotification({
        registrationId: registration.id,
        campId: registration.camp_id,
        kind: item.kind,
        name: `${registration.first_name ?? ""} ${registration.last_name ?? ""}`.trim(),
        reference: registration.reference,
        email: registration.email,
        text: item.body,
        ...display,
      }),
    );
    revalidatePath(participantPath(token));
    return { status: "sent" };
  } catch (error) {
    console.error("[participant] message failed", error);
    return fail(e.generic);
  }
}

// --- school release letter (specs/020-school-release, contracts/school-release.md) ---

export type SchoolReleaseState =
  | { status: "idle" }
  | { status: "saved"; mail: "queued" | "skipped" }
  | { status: "error"; error: string; fieldErrors?: Record<string, string> };

const re = releaseMessages.errors;

function readReleaseInput(formData: FormData): Record<string, unknown> {
  const value = (key: string) => {
    const raw = formData.get(key);
    return typeof raw === "string" ? raw : "";
  };
  return {
    teacherName: value("teacherName"),
    schoolName: value("schoolName"),
    schoolAddress: value("schoolAddress"),
    participantAddress: value("participantAddress"),
    className: value("className"),
  };
}

export async function saveSchoolReleaseAction(
  rawToken: string,
  _previous: SchoolReleaseState,
  formData: FormData,
): Promise<SchoolReleaseState> {
  try {
    const token = normalizeAccessToken(rawToken);
    if (!token) return { status: "error", error: re.invalidLink };
    if (await isReleaseThrottled(await requestIp())) return { status: "error", error: re.throttled };

    const registration = await findRegistrationForToken(token);
    if (!registration) return { status: "error", error: re.invalidLink };
    if (registration.status !== "active") return { status: "error", error: re.unavailable };
    if (!isReleaseActive(await getReleaseSettings(registration.camp_id))) {
      return { status: "error", error: re.unavailable };
    }
    const payment = {
      paymentStatus: registration.payment_status,
      amountDue: registration.amount_due,
      amountPaid: registration.amount_paid,
    };
    if (!isReleaseUnlocked(payment)) return { status: "error", error: re.locked };

    const parsed = schoolReleaseInputSchema.safeParse(readReleaseInput(formData));
    if (!parsed.success) {
      return { status: "error", error: re.check, fieldErrors: fieldErrorsOf(parsed.error) };
    }

    const saved = await upsertSchoolRelease(registration.id, registration.camp_id, parsed.data, "participant");
    revalidatePath(participantPath(token));

    // Same data again right after saving or a release mail is a double click: no second mail.
    if (!saved.changed) {
      const last = (await lastDeliveryAt(registration.id, "school_release")) ?? saved.savedAt;
      const recent = Math.max(last.getTime(), saved.savedAt.getTime());
      if (Date.now() - recent < RELEASE_DUPLICATE_MS) return { status: "saved", mail: "queued" };
    }
    if (!(await canSendSchoolRelease(registration.email))) return { status: "saved", mail: "skipped" };

    after(() => sendSchoolRelease(registration.id, "participant"));
    return { status: "saved", mail: "queued" };
  } catch (error) {
    console.error("[participant] school release failed", error);
    return { status: "error", error: re.generic };
  }
}
