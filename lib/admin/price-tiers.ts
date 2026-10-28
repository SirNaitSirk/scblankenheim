import { z } from "zod";
import { de } from "./messages";
import type { PriceTierInput, PriceTierStatus } from "./types";

/**
 * Shared, client safe price tier rules: the status badge and the dialog
 * validation. The status mirrors `findValidTier` in `lib/register/invitation.ts`,
 * so the badge always matches what the invitation link actually does.
 */

export const MAX_TIER_NAME_LENGTH = 80;
export const MAX_TIER_PRICE = 9999;

export function getTierStatus(
  validFrom: string | null,
  validUntil: string | null,
  now: number = Date.now(),
): PriceTierStatus {
  if (validFrom && new Date(validFrom).getTime() > now) return "scheduled";
  if (validUntil && new Date(validUntil).getTime() < now) return "expired";
  return "active";
}

function isValidDate(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

function isoOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : new Date(trimmed).toISOString();
}

// Raw dialog strings in → validated `PriceTierInput` out. Validity values are
// ISO date-times (the dialog converts its local inputs) or "".
export const priceTierSchema = z
  .object({
    name: z.string(),
    price: z.string(),
    validFrom: z.string(),
    validUntil: z.string(),
  })
  .superRefine((values, ctx) => {
    const name = values.name.trim();
    if (name === "") {
      ctx.addIssue({ code: "custom", path: ["name"], message: de.pricing.errors.nameRequired });
    } else if (name.length > MAX_TIER_NAME_LENGTH) {
      ctx.addIssue({ code: "custom", path: ["name"], message: de.pricing.errors.nameTooLong });
    }

    const price = values.price.trim();
    if (!/^\d+$/.test(price) || Number(price) > MAX_TIER_PRICE) {
      ctx.addIssue({ code: "custom", path: ["price"], message: de.pricing.errors.invalidPrice });
    }

    for (const key of ["validFrom", "validUntil"] as const) {
      const raw = values[key].trim();
      if (raw !== "" && !isValidDate(raw)) {
        ctx.addIssue({ code: "custom", path: [key], message: de.pricing.errors.invalidDate });
      }
    }

    const from = values.validFrom.trim();
    const until = values.validUntil.trim();
    if (
      from !== "" &&
      until !== "" &&
      isValidDate(from) &&
      isValidDate(until) &&
      new Date(until).getTime() < new Date(from).getTime()
    ) {
      ctx.addIssue({ code: "custom", path: ["validUntil"], message: de.pricing.errors.endBeforeStart });
    }
  })
  .transform(
    (values): PriceTierInput => ({
      name: values.name.trim(),
      price: Number(values.price.trim()),
      validFrom: isoOrNull(values.validFrom),
      validUntil: isoOrNull(values.validUntil),
    }),
  );
