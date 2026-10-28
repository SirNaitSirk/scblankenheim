import "server-only";

import {
  arrivalMissingFields,
  resolveMailSettings,
  type CampMailInfo,
} from "@/lib/admin/camp-mail-info";
import { getCampMailInfos } from "@/lib/admin/camp-mail-info-data";
import { writeLog } from "@/lib/admin/data";
import { getServiceClient } from "@/lib/supabase/server";
import { addDays, berlinDate, berlinDayStartIso, compareDates } from "@/lib/time/berlin";
import {
  countDeliveriesSince,
  failStaleDeliveries,
  infoHistory,
  reminderHistory,
} from "./deliveries";
import { INFO_KINDS, infoWindow, nextInfoMail, type InfoMailKind } from "./info-mails";
import { INFO_TEMPLATES, type InfoMailContext } from "./info-templates";
import {
  CONFIRMATION_RESERVE,
  DAILY_EMAIL_BUDGET,
  INFO_THANKS_LAST_DAY,
  SEND_SPACING_MS,
} from "./limits";
import { packingUrl } from "./links";
import { nextReminder } from "./reminders";
import type { CampMailSettings } from "./settings";
import {
  buildMailTarget,
  deliver,
  REGISTRATION_COLUMNS,
  type CampRow,
  type RegistrationRow,
} from "./send";

/**
 * Daily info mail run (specs/012-info-mails, research R5 to R7). Runs after the
 * payment reminders and only spends what is left of the daily quota, oldest
 * registrations of the current camp first. Never changes a registration.
 * Throws only when camps or registrations cannot be loaded; the route logs it.
 */

export type InfoRunSummary = {
  sent: number;
  failed: number;
  skipped: number;
  budget: number;
  capped: boolean;
};

type InfoCamp = CampRow & { id: string; tagline: string | null };

const CAMP_COLUMNS = "id, name, start_date, end_date, payment_due_date, location, tagline";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function currentCampId(): Promise<string | null> {
  const { data, error } = await getServiceClient()
    .from("camp_settings")
    .select("current_camp_id")
    .maybeSingle();
  if (error) throw error;
  return data?.current_camp_id ?? null;
}

/**
 * Current camp plus camps that ended 1 to 30 days ago (research R7). The thank
 * you day differs per camp (specs/016-mail-settings), so the caller keeps an
 * ended camp only while its own window is open.
 */
async function loadRunCamps(campId: string | null, today: string): Promise<InfoCamp[]> {
  const supabase = getServiceClient();
  const camps = new Map<string, InfoCamp>();

  if (campId) {
    const { data, error } = await supabase.from("camps").select(CAMP_COLUMNS).eq("id", campId).maybeSingle();
    if (error) throw error;
    if (data) camps.set(data.id, data);
  }

  const { data: ended, error } = await supabase
    .from("camps")
    .select(CAMP_COLUMNS)
    .gte("end_date", addDays(today, -INFO_THANKS_LAST_DAY))
    .lte("end_date", addDays(today, -1));
  if (error) throw error;
  for (const camp of ended ?? []) if (!camps.has(camp.id)) camps.set(camp.id, camp);

  return [...camps.values()];
}

function enabledKinds(info: CampMailInfo): Record<InfoMailKind, boolean> {
  return {
    info_teaser: info.teaserEnabled,
    info_packing: info.packingEnabled,
    info_arrival: info.arrivalEnabled,
    info_thanks: info.thanksEnabled,
  };
}

/** Mail target plus the info context; context is null without `APP_URL`. */
function buildInfoTarget(
  registration: RegistrationRow,
  camp: InfoCamp,
  mailInfo: CampMailInfo,
  settings: CampMailSettings,
) {
  const target = buildMailTarget(registration, camp, settings);
  const packing = packingUrl();
  const context: InfoMailContext | null =
    target.context && packing
      ? { ...target.context, mailInfo, motto: camp.tagline?.trim() || null, packingUrl: packing }
      : null;
  return { target, context };
}

export async function runInfoMails(
  now: Date = new Date(),
): Promise<InfoRunSummary> {
  const today = berlinDate(now);
  const summary: InfoRunSummary = { sent: 0, failed: 0, skipped: 0, budget: 0, capped: false };

  await failStaleDeliveries(now);

  const sentToday = await countDeliveriesSince(berlinDayStartIso(now));
  summary.budget = Math.max(0, DAILY_EMAIL_BUDGET - CONFIRMATION_RESERVE - sentToday);

  const campId = await currentCampId();
  const candidates = await loadRunCamps(campId, today);
  const infos = await getCampMailInfos(candidates.map((camp) => camp.id));
  const settingsById = new Map(
    candidates.map((camp) => [camp.id, resolveMailSettings(infos.get(camp.id)!)]),
  );
  const camps = candidates.filter((camp) => {
    if (camp.id === campId) return true;
    const thanks = infoWindow("info_thanks", camp.start_date, camp.end_date, settingsById.get(camp.id)!.timing);
    return (
      thanks !== null &&
      compareDates(today, thanks.opens) >= 0 &&
      compareDates(today, thanks.closes) <= 0
    );
  });
  if (camps.length === 0) {
    await writeLog({ action: "info_mails.run", message: "Kein Camp mit offener Infomail, nichts verschickt" });
    return summary;
  }

  const campById = new Map(camps.map((camp) => [camp.id, camp]));

  const { data, error } = await getServiceClient()
    .from("registrations")
    .select(REGISTRATION_COLUMNS)
    .in("camp_id", [...campById.keys()])
    .eq("deleted", false)
    .order("registered_at", { ascending: true });
  if (error) throw error;

  // Current camp first, each camp oldest registration first (FR-009).
  const rows = (data ?? []).sort(
    (a, b) => Number(b.camp_id === campId) - Number(a.camp_id === campId),
  );
  const ids = rows.map((row) => row.id);
  const reminders = await reminderHistory(ids);
  const sentInfo = await infoHistory(ids);

  for (const row of rows) {
    const camp = campById.get(row.camp_id)!;
    const mailInfo = infos.get(row.camp_id)!;
    const settings = settingsById.get(row.camp_id)!;
    const { target, context } = buildInfoTarget(row, camp, mailInfo, settings);
    const pastReminders = reminders.get(row.id);
    const pastInfo = sentInfo.get(row.id);
    const registeredDate = berlinDate(new Date(row.registered_at));
    const lastReminder = pastReminders?.lastSentAt ?? null;
    const reminderSentToday = lastReminder !== null && berlinDate(new Date(lastReminder)) === today;

    const reminderDue = nextReminder(
      {
        paymentStatus: row.payment_status,
        outstanding: target.context?.outstanding ?? 0,
        deleted: row.deleted,
        status: row.status,
        hasEmail: target.email !== null,
        registeredDate,
        campStartDate: camp.start_date,
        paymentDueDate: camp.payment_due_date,
        sentKinds: pastReminders?.kinds ?? [],
        lastReminderDate: lastReminder ? berlinDate(new Date(lastReminder)) : null,
        paused: row.reminders_paused,
        campEnabled: settings.remindersEnabled,
        timing: settings.timing,
      },
      today,
    );

    const kind = nextInfoMail(
      {
        deleted: row.deleted,
        status: row.status,
        hasEmail: target.email !== null,
        registeredDate,
        campStartDate: camp.start_date,
        campEndDate: camp.end_date,
        enabled: enabledKinds(mailInfo),
        arrivalReady: arrivalMissingFields(mailInfo).length === 0,
        sentKinds: pastInfo?.kinds ?? [],
        lastInfoDate: pastInfo?.lastSentAt ? berlinDate(new Date(pastInfo.lastSentAt)) : null,
        reminderToday: reminderDue !== null || reminderSentToday,
        timing: settings.timing,
      },
      today,
    );
    if (!kind) continue;

    if (summary.sent + summary.failed >= summary.budget) {
      summary.capped = true;
      break;
    }
    if (summary.sent + summary.failed > 0) await sleep(SEND_SPACING_MS);

    // `deliver` skips a target without context, so `render` only runs with one.
    const render = INFO_TEMPLATES[kind];
    const outcome = await deliver({
      target: { ...target, context },
      kind,
      trigger: "cron",
      render: () => render(context!),
    });
    summary[outcome] += 1;
  }

  await writeLog({
    action: "info_mails.run",
    message: `Verschickt ${summary.sent}, fehlgeschlagen ${summary.failed}, übersprungen ${summary.skipped}, Kontingent ${summary.budget}${summary.capped ? ", Kontingent erreicht" : ""}`,
  });
  return summary;
}

export type InfoMailCounts = Record<
  InfoMailKind,
  { received: number; notReceived: number; withoutEmail: number }
>;

/** Delivery counts per info mail for one camp's active registrations (US5). */
export async function infoMailCounts(campId: string): Promise<InfoMailCounts> {
  const { data, error } = await getServiceClient()
    .from("registrations")
    .select("id, email, status, deleted")
    .eq("camp_id", campId)
    .eq("deleted", false);
  if (error) throw error;

  const active = (data ?? []).filter((row) => row.status !== "cancelled");
  const withEmail = active.filter((row) => (row.email ?? "").trim() !== "");
  const history = await infoHistory(withEmail.map((row) => row.id));

  const counts = {} as InfoMailCounts;
  for (const kind of INFO_KINDS) {
    const received = withEmail.filter((row) => history.get(row.id)?.kinds.includes(kind)).length;
    counts[kind] = {
      received,
      notReceived: withEmail.length - received,
      withoutEmail: active.length - withEmail.length,
    };
  }
  return counts;
}
