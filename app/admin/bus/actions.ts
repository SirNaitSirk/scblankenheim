"use server";

import { getCurrentCampId, writeLog } from "@/lib/admin/data";
import { AuthError, requirePermission } from "@/lib/admin/guard";
import type { AdminUser } from "@/lib/admin/types";
import {
  boardingsFor,
  busContext,
  busRegistrations,
  deleteBoarding,
  findTicketByCode,
  insertBoarding,
  registrationForBus,
} from "@/lib/bus/data";
import { busMessages } from "@/lib/bus/messages";
import { buildBoardingList, decideScan, fullName, isBusRegistration, isPaymentOpen } from "@/lib/bus/rules";
import { boardingInputSchema, scanInputSchema, tripSchema } from "@/lib/bus/schema";
import type { BoardingListState, BoardingMethod, ScanOutcome, Trip } from "@/lib/bus/types";

/**
 * Scan page actions (specs/021-bus-ticket, US2 and US3, contracts/bus-ticket.md).
 * Every action needs the `bus` permission and works on the current camp. The
 * answers carry only name, reference, outcome, time and the payment hint.
 */

export type ScanResult = { ok: true; outcome: ScanOutcome } | { ok: false; error: string };
export type ListResult = ({ ok: true } & BoardingListState) | { ok: false; error: string };
export type UndoResult = { ok: true } | { ok: false; error: string };

const copy = busMessages;

function actorLabel(admin: AdminUser): string {
  return admin.name?.trim() || admin.email?.trim() || admin.id;
}

async function guarded<T extends { ok: boolean }>(
  failure: T,
  fn: (admin: AdminUser) => Promise<T>,
): Promise<T> {
  let admin: AdminUser;
  try {
    admin = await requirePermission("bus");
  } catch (error) {
    if (!(error instanceof AuthError)) console.error("[bus] auth check failed", error);
    return { ...failure, error: copy.state.noPermission };
  }
  try {
    return await fn(admin);
  } catch (error) {
    console.error("[bus] action failed", error);
    return failure;
  }
}

const SCAN_FAILED: ScanResult = { ok: false, error: copy.list.actionFailed };

/** Stores a boarding for a decided `board` and maps it to `boarded` or `already`. */
async function board(input: {
  registrationId: string;
  campId: string;
  trip: Trip;
  admin: AdminUser;
  method: BoardingMethod;
  name: string;
  reference: string;
  paymentOpen: boolean;
}): Promise<ScanOutcome> {
  const result = await insertBoarding({
    registrationId: input.registrationId,
    campId: input.campId,
    trip: input.trip,
    actor: input.admin.id,
    method: input.method,
  });
  return result.already
    ? { kind: "already", name: input.name, reference: input.reference, at: result.at }
    : { kind: "boarded", name: input.name, reference: input.reference, at: result.at, paymentOpen: input.paymentOpen };
}

export async function scanBusTicket(input: { code: string; trip: Trip }): Promise<ScanResult> {
  return guarded(SCAN_FAILED, async (admin) => {
    const parsed = scanInputSchema.safeParse(input);
    if (!parsed.success) return { ok: true, outcome: { kind: "unknown" } };

    const currentCampId = await getCurrentCampId();
    if (!currentCampId) return { ok: true, outcome: { kind: "other_camp" } };

    const ticket = await findTicketByCode(parsed.data.code);
    const registration = ticket ? await registrationForBus(ticket.registration_id) : null;
    const context = await busContext(currentCampId);
    const decision = decideScan({
      ticket: ticket && { campId: ticket.camp_id, revoked: ticket.revoked_at !== null },
      currentCampId,
      settings: context.settings,
      fields: context.fields,
      registration,
    });
    if (decision.kind !== "board" || !registration) {
      return { ok: true, outcome: decision.kind === "board" ? { kind: "unknown" } : decision };
    }

    const outcome = await board({
      registrationId: registration.id,
      campId: currentCampId,
      trip: parsed.data.trip,
      admin,
      method: "scan",
      name: decision.name,
      reference: decision.reference,
      paymentOpen: decision.paymentOpen,
    });
    return { ok: true, outcome };
  });
}

export async function loadBoardingList(trip: Trip): Promise<ListResult> {
  return guarded<ListResult>({ ok: false, error: copy.list.loadFailed }, async () => {
    const parsedTrip = tripSchema.safeParse(trip);
    if (!parsedTrip.success) return { ok: false, error: copy.list.loadFailed };

    const campId = await getCurrentCampId();
    if (!campId) return { ok: true, state: "no_camp" };
    const context = await busContext(campId);
    if (!context.settings.enabled) return { ok: true, state: "disabled" };
    if (!context.active) return { ok: true, state: "mapping_broken" };

    const [registrations, boardings] = await Promise.all([
      busRegistrations(campId, context),
      boardingsFor(campId, parsedTrip.data),
    ]);
    return { ok: true, state: "ready", ...buildBoardingList(registrations, boardings) };
  });
}

// Manual boarding uses the same rules as a scan, without a code (FR-024).
export async function markBoardedManually(input: { registrationId: string; trip: Trip }): Promise<ScanResult> {
  return guarded(SCAN_FAILED, async (admin) => {
    const parsed = boardingInputSchema.safeParse(input);
    if (!parsed.success) return SCAN_FAILED;

    const campId = await getCurrentCampId();
    const registration = await registrationForBus(parsed.data.registrationId);
    if (!campId || !registration) return { ok: true, outcome: { kind: "unknown" } };
    if (registration.camp_id !== campId) return { ok: true, outcome: { kind: "other_camp" } };

    const context = await busContext(campId);
    if (!context.active) return { ok: true, outcome: { kind: "disabled" } };
    const name = fullName(registration);
    if (registration.deleted || registration.status !== "active") {
      return { ok: true, outcome: { kind: "cancelled", name, reference: registration.reference } };
    }
    if (!isBusRegistration(registration, context.settings, context.fields)) {
      return { ok: true, outcome: { kind: "no_ticket", name, reference: registration.reference } };
    }

    const outcome = await board({
      registrationId: registration.id,
      campId,
      trip: parsed.data.trip,
      admin,
      method: "manual",
      name,
      reference: registration.reference,
      paymentOpen: isPaymentOpen(registration),
    });
    if (outcome.kind === "boarded") {
      await writeLog({
        actor: actorLabel(admin),
        action: "bus.boarding_manual",
        message: `${registration.reference}, ${copy.trips[parsed.data.trip]}`,
      });
    }
    return { ok: true, outcome };
  });
}

export async function undoBoarding(input: { registrationId: string; trip: Trip }): Promise<UndoResult> {
  return guarded<UndoResult>({ ok: false, error: copy.list.actionFailed }, async (admin) => {
    const parsed = boardingInputSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: copy.list.actionFailed };

    const registration = await registrationForBus(parsed.data.registrationId);
    const removed = await deleteBoarding(parsed.data.registrationId, parsed.data.trip);
    if (removed) {
      await writeLog({
        actor: actorLabel(admin),
        action: "bus.boarding_undone",
        message: `${registration?.reference ?? parsed.data.registrationId}, ${copy.trips[parsed.data.trip]}`,
      });
    }
    return { ok: true };
  });
}
