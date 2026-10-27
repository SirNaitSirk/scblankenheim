import { paymentPath, paymentUrl } from "./links";
import {
  confirmationEmail,
  paymentLinkEmail,
  reminderEmail,
  type EmailContext,
  type RenderedEmail,
} from "./templates";

/**
 * Sample data for the read only admin tab "Mail" (specs/007-transactional-emails,
 * US4, research R12). Previews come from the real template functions, so they
 * always match what is sent. Only a fixed sample person and the current camp's
 * public data appear; never a real registration or a hidden price.
 */

export type PreviewId =
  | "confirmation"
  | "confirmation_free"
  | "payment_link"
  | "reminder_1"
  | "reminder_2"
  | "reminder_3";

export type MailPreview = RenderedEmail & { id: PreviewId };

export type PreviewCamp = {
  name: string;
  startDate: string | null;
  endDate: string | null;
  basePrice: number;
  paymentDueDate: string | null;
};

export const SAMPLE_FIRST_NAME = "Lena";
export const SAMPLE_REFERENCE = "REG-BEISPIEL";

export function sampleContext(camp: PreviewCamp): EmailContext {
  return {
    firstName: SAMPLE_FIRST_NAME,
    campName: camp.name,
    campStart: camp.startDate,
    campEnd: camp.endDate,
    reference: SAMPLE_REFERENCE,
    amountDue: camp.basePrice,
    outstanding: camp.basePrice,
    paymentDueDate: camp.paymentDueDate,
    payUrl: paymentUrl(SAMPLE_REFERENCE) ?? paymentPath(SAMPLE_REFERENCE),
  };
}

export function buildMailPreviews(camp: PreviewCamp): MailPreview[] {
  const ctx = sampleContext(camp);
  const free = { ...ctx, amountDue: 0, outstanding: 0 };
  return [
    { id: "confirmation", ...confirmationEmail(ctx) },
    { id: "confirmation_free", ...confirmationEmail(free) },
    { id: "payment_link", ...paymentLinkEmail(ctx) },
    { id: "reminder_1", ...reminderEmail("reminder_1", ctx) },
    { id: "reminder_2", ...reminderEmail("reminder_2", ctx) },
    { id: "reminder_3", ...reminderEmail("reminder_3", ctx) },
  ];
}
