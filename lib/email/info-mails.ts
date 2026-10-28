import { addDays, compareDates } from "@/lib/time/berlin";
import { INFO_THANKS_LAST_DAY } from "./limits";
import type { MailTiming } from "./settings";

/**
 * Info mail stage rules (specs/012-info-mails, research R3). Pure and
 * deterministic; all dates are Berlin calendar dates (`YYYY-MM-DD`). Each
 * stage is open from its due day until the day before the next stage is due,
 * so a stage counts as missed once the next one is due and is never sent late.
 * Stage days come from the camp's resolved timing (specs/016-mail-settings).
 */

export type InfoMailKind = "info_teaser" | "info_packing" | "info_arrival" | "info_thanks";

export const INFO_KINDS: readonly InfoMailKind[] = [
  "info_teaser",
  "info_packing",
  "info_arrival",
  "info_thanks",
];

export function isInfoKind(kind: string): kind is InfoMailKind {
  return (INFO_KINDS as readonly string[]).includes(kind);
}

export type InfoWindow = { opens: string; closes: string };

/** Day the stage becomes due, or null when the camp date it needs is missing. */
export function infoDueDate(
  kind: InfoMailKind,
  startDate: string | null,
  endDate: string | null,
  timing: MailTiming,
): string | null {
  switch (kind) {
    case "info_teaser":
      return startDate ? addDays(startDate, -timing.teaserDaysBefore) : null;
    case "info_packing":
      return startDate ? addDays(startDate, -timing.packingDaysBefore) : null;
    case "info_arrival":
      return startDate ? addDays(startDate, -timing.arrivalDaysBefore) : null;
    case "info_thanks":
      return endDate ? addDays(endDate, timing.thanksDaysAfter) : null;
  }
}

/** First and last day (inclusive) on which the stage may go out. */
export function infoWindow(
  kind: InfoMailKind,
  startDate: string | null,
  endDate: string | null,
  timing: MailTiming,
): InfoWindow | null {
  const opens = infoDueDate(kind, startDate, endDate, timing);
  if (!opens) return null;
  switch (kind) {
    case "info_teaser":
      return { opens, closes: addDays(startDate!, -timing.packingDaysBefore - 1) };
    case "info_packing":
      return { opens, closes: addDays(startDate!, -timing.arrivalDaysBefore - 1) };
    case "info_arrival":
      return { opens, closes: addDays(startDate!, -1) };
    case "info_thanks":
      return { opens, closes: addDays(endDate!, INFO_THANKS_LAST_DAY) };
  }
}

export type InfoMailInput = {
  deleted: boolean;
  status: string;
  hasEmail: boolean;
  registeredDate: string;
  campStartDate: string | null;
  campEndDate: string | null;
  enabled: Record<InfoMailKind, boolean>;
  /** Address, arrival time and emergency phone are filled. */
  arrivalReady: boolean;
  sentKinds: readonly InfoMailKind[];
  lastInfoDate: string | null;
  /** A payment reminder went out today or is due today for this registration. */
  reminderToday: boolean;
  timing: MailTiming;
};

function isOpen(window: InfoWindow | null, today: string): boolean {
  return (
    window !== null &&
    compareDates(today, window.opens) >= 0 &&
    compareDates(today, window.closes) <= 0
  );
}

/** The stage whose window is open today, ignoring per registration rules. */
export function openInfoStage(
  startDate: string | null,
  endDate: string | null,
  today: string,
  timing: MailTiming,
): InfoMailKind | null {
  return (
    INFO_KINDS.find((kind) => isOpen(infoWindow(kind, startDate, endDate, timing), today)) ?? null
  );
}

export function nextInfoMail(input: InfoMailInput, today: string): InfoMailKind | null {
  if (input.deleted || input.status === "cancelled" || !input.hasEmail) return null;
  if (compareDates(today, input.registeredDate) <= 0) return null;
  if (input.lastInfoDate && compareDates(today, input.lastInfoDate) === 0) return null;
  if (input.reminderToday) return null;

  const kind = openInfoStage(input.campStartDate, input.campEndDate, today, input.timing);
  if (!kind || !input.enabled[kind]) return null;
  if (input.sentKinds.includes(kind)) return null;
  if (kind === "info_arrival" && !input.arrivalReady) return null;
  return kind;
}
