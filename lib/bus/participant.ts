import "server-only";

import { appBaseUrl } from "@/lib/email/links";
import { scanUrl } from "./code";
import { codeVersion } from "./code-server";
import { busContext, ensureTicket, registrationForBus } from "./data";
import { qrSvg } from "./qr";
import { isBusRegistration } from "./rules";
import type { BusRegistration, ParticipantBusTicket } from "./types";

/**
 * Ticket of one registration for the participant page and mails
 * (specs/021-bus-ticket, US4). Null when the registration is no bus person.
 */

type TicketSource = Pick<BusRegistration, "id" | "camp_id" | "status" | "deleted" | "form_data">;

/** Active code of a bus person (created on first need), `blocked`, or null when no bus person. */
export async function busTicketCode(
  registration: TicketSource,
): Promise<{ blocked: false; code: string } | { blocked: true } | null> {
  const context = await busContext(registration.camp_id);
  if (!isBusRegistration(registration, context.settings, context.fields)) return null;
  const ticket = await ensureTicket(registration.id, registration.camp_id);
  return ticket ? { blocked: false, code: ticket.code } : { blocked: true };
}

export async function participantBusTicket(registration: TicketSource): Promise<ParticipantBusTicket | null> {
  const base = appBaseUrl();
  if (!base) return null;
  const ticket = await busTicketCode(registration);
  if (!ticket) return null;
  if (ticket.blocked) return ticket;
  return { blocked: false, svg: await qrSvg(scanUrl(base, ticket.code)) };
}

/** Mail block data: image URL with a version tag so a new code gets a new URL (research R5). */
export async function mailBusTicket(
  registration: TicketSource,
  participantUrl: string,
): Promise<{ imageUrl: string; pageUrl: string } | null> {
  const ticket = await busTicketCode(registration);
  if (!ticket || ticket.blocked) return null;
  return {
    imageUrl: `${participantUrl}/busticket?v=${codeVersion(ticket.code)}`,
    pageUrl: `${participantUrl}#busticket`,
  };
}

/** Mail block data for a registration id; null when no bus person or blocked. */
export async function mailBusTicketFor(
  registrationId: string,
  participantUrl: string,
): Promise<{ imageUrl: string; pageUrl: string } | null> {
  const registration = await registrationForBus(registrationId);
  return registration ? mailBusTicket(registration, participantUrl) : null;
}
