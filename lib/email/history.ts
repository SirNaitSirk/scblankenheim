/**
 * Mail history of one registration (specs/013-registration-mail-history,
 * data-model.md). Pure mapping from `email_deliveries` rows to what the admin
 * dialog shows. Provider ids and raw error codes never leave this function.
 */

export type MailHistoryStatus = "sent" | "failed" | "sending";
export type MailHistoryTrigger = "registration" | "cron" | "admin" | "participant";

export type MailHistoryEntry = {
  id: string;
  kind: string;
  status: MailHistoryStatus;
  trigger: MailHistoryTrigger;
  actorName: string | null;
  at: string; // ISO, updated_at when sent, else created_at
};

/** Result of the admin action that loads one registration's history. */
export type MailHistoryResult =
  | { ok: true; mails: MailHistoryEntry[] }
  | { ok: false; error: string };

export type DeliveryRow = {
  id: string;
  kind: string;
  status: string;
  trigger: string;
  actor: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export const MAIL_HISTORY_LIMIT = 50;

function toStatus(row: DeliveryRow): MailHistoryStatus {
  if (row.status === "sent") return "sent";
  if (row.status === "sending") return "sending";
  return "failed"; // includes stale attempts (error "stale")
}

function toTrigger(trigger: string): MailHistoryTrigger {
  return trigger === "registration" || trigger === "admin" || trigger === "participant"
    ? trigger
    : "cron";
}

export function toMailHistory(
  rows: readonly DeliveryRow[],
  adminNames: ReadonlyMap<string, string>,
): MailHistoryEntry[] {
  return [...rows]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0))
    .slice(0, MAIL_HISTORY_LIMIT)
    .map((row) => {
      const status = toStatus(row);
      return {
        id: row.id,
        kind: row.kind,
        status,
        trigger: toTrigger(row.trigger),
        actorName: row.actor ? (adminNames.get(row.actor) ?? null) : null,
        at: status === "sent" ? row.updated_at : row.created_at,
      };
    });
}
