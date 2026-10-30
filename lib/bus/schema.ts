import { z } from "zod";
import { ANSWER_MAX, ANSWERS_MAX, FIELD_KEY_MAX, TICKET_CODE_PATTERN, TRIPS } from "./limits";

/** Zod schemas of the bus ticket actions (specs/021-bus-ticket, contracts/bus-ticket.md). */

export const tripSchema = z.enum(TRIPS);

export const scanInputSchema = z.object({
  code: z.string().regex(TICKET_CODE_PATTERN),
  trip: tripSchema,
});

export const boardingInputSchema = z.object({
  registrationId: z.guid(),
  trip: tripSchema,
});

export const busSettingsInputSchema = z.object({
  campId: z.guid(),
  enabled: z.boolean(),
  fieldKey: z.string().trim().min(1).max(FIELD_KEY_MAX).nullable(),
  answers: z.array(z.string().max(ANSWER_MAX)).max(ANSWERS_MAX),
});

export type BusSettingsInput = z.infer<typeof busSettingsInputSchema>;
