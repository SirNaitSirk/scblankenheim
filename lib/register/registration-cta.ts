import { registerMessages } from "@/lib/register/messages";
import type { RegistrationState } from "@/lib/register/registration-state";

/**
 * Label and target of every registration button on the landing page (hero, nav,
 * campfire band), derived from the one registration state rule so no button
 * promises a registration that is not possible (specs/024-landing-structure R5).
 * Pure and isomorphic.
 */

export type RegistrationCta = {
  label: string;
  shortLabel: string;
  href: "#anmelden";
};

const copy = registerMessages.cta;

const dayMonth = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "long",
  timeZone: "Europe/Berlin",
});

const dayMonthNumeric = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Berlin",
});

/** Parses an ISO instant; null when missing or invalid. */
function toDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Opening day as „30. November“ in Berlin time, or null without a valid date. */
export function formatOpeningDay(opensAt: string | null): string | null {
  const date = toDate(opensAt);
  return date ? dayMonth.format(date) : null;
}

export function registrationCta(
  state: RegistrationState,
  opensAt: string | null,
): RegistrationCta {
  const href = "#anmelden";
  switch (state) {
    case "open":
      return { label: copy.open, shortLabel: copy.openShort, href };
    case "countdown": {
      const date = toDate(opensAt);
      if (!date) return { label: copy.countdownUndated, shortLabel: copy.neutralShort, href };
      return {
        label: copy.countdown(dayMonth.format(date)),
        shortLabel: copy.countdownShort(dayMonthNumeric.format(date)),
        href,
      };
    }
    case "closed":
      return { label: copy.closed, shortLabel: copy.neutralShort, href };
    case "full":
      return { label: copy.full, shortLabel: copy.neutralShort, href };
  }
}
