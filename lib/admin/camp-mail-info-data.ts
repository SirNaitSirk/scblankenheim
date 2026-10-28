import "server-only";

import { getServiceClient } from "@/lib/supabase/server";
import {
  EMPTY_MAIL_INFO,
  mailInfoToRow,
  mapMailInfoRow,
  type CampMailInfo,
} from "./camp-mail-info";

/**
 * Service role reads and writes of `camp_mail_info` (specs/012-info-mails).
 * Callers must have passed `requirePermission("camps")` before writing.
 */

export async function getCampMailInfo(campId: string): Promise<CampMailInfo> {
  const { data, error } = await getServiceClient()
    .from("camp_mail_info")
    .select("*")
    .eq("camp_id", campId)
    .maybeSingle();
  if (error) throw error;
  return mapMailInfoRow(data);
}

/** Mail info per camp id; camps without a row get `EMPTY_MAIL_INFO`. */
export async function getCampMailInfos(
  campIds: readonly string[],
): Promise<Map<string, CampMailInfo>> {
  const infos = new Map<string, CampMailInfo>();
  if (campIds.length === 0) return infos;

  const { data, error } = await getServiceClient()
    .from("camp_mail_info")
    .select("*")
    .in("camp_id", campIds);
  if (error) throw error;

  for (const id of campIds) infos.set(id, EMPTY_MAIL_INFO);
  for (const row of data ?? []) infos.set(row.camp_id, mapMailInfoRow(row));
  return infos;
}

export async function upsertCampMailInfo(campId: string, info: CampMailInfo): Promise<void> {
  const { error } = await getServiceClient()
    .from("camp_mail_info")
    .upsert(mailInfoToRow(campId, info), { onConflict: "camp_id" });
  if (error) throw error;
}
