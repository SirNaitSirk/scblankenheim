import "server-only";

import { getServiceClient } from "@/lib/supabase/server";
import { generateFeedbackCode } from "./code-server";
import {
  FEEDBACK_CAMP_DAILY_MAX,
  FEEDBACK_CAMP_WINDOW_MS,
  FEEDBACK_IP_MAX,
  FEEDBACK_IP_WINDOW_MS,
} from "./limits";
import { isQuestionType, parseAnswers } from "./rules";
import type { FeedbackAnswer, FeedbackQuestion, FeedbackResponse, PublicFeedbackQuestion } from "./types";

/**
 * Server data access of the camp feedback (specs/038-camp-feedback). Service
 * role only; admin callers check the Clerk session and the `feedback` permission
 * first. Nothing here writes a log entry for an answer (research R2).
 */

export type FeedbackSettings = { campId: string; open: boolean; linkCode: string };

const QUESTION_COLUMNS = "id, camp_id, key, label, type, required, allow_comment, options, sort_order";

type QuestionRow = {
  id: string;
  camp_id: string;
  key: string;
  label: string;
  type: string;
  required: boolean;
  allow_comment: boolean;
  options: string[];
  sort_order: number;
};

function toQuestion(row: QuestionRow): FeedbackQuestion | null {
  if (!isQuestionType(row.type)) return null;
  return {
    id: row.id,
    campId: row.camp_id,
    key: row.key,
    label: row.label,
    type: row.type,
    required: row.required,
    options: row.options ?? [],
    allowComment: row.allow_comment ?? false,
    sortOrder: row.sort_order,
  };
}

export function toPublicQuestion(question: FeedbackQuestion): PublicFeedbackQuestion {
  const { key, label, type, required, options, allowComment } = question;
  return { key, label, type, required, options, allowComment };
}

export async function getFeedbackSettings(campId: string): Promise<FeedbackSettings | null> {
  const { data, error } = await getServiceClient()
    .from("camp_feedback_settings")
    .select("camp_id, open, link_code")
    .eq("camp_id", campId)
    .maybeSingle();
  if (error) throw error;
  return data ? { campId: data.camp_id, open: data.open, linkCode: data.link_code } : null;
}

/** Settings row of the camp, created closed with a fresh code when missing. */
export async function ensureFeedbackSettings(campId: string, userId: string): Promise<FeedbackSettings> {
  const existing = await getFeedbackSettings(campId);
  if (existing) return existing;
  const { error } = await getServiceClient()
    .from("camp_feedback_settings")
    .upsert(
      { camp_id: campId, open: false, link_code: generateFeedbackCode(), updated_by: userId },
      { onConflict: "camp_id", ignoreDuplicates: true },
    );
  if (error) throw error;
  const created = await getFeedbackSettings(campId);
  if (!created) throw new Error("feedback settings missing after insert");
  return created;
}

export async function updateFeedbackSettings(
  campId: string,
  patch: { open?: boolean; linkCode?: string },
  userId: string,
): Promise<void> {
  const { error } = await getServiceClient()
    .from("camp_feedback_settings")
    .update({
      ...(patch.open === undefined ? {} : { open: patch.open }),
      ...(patch.linkCode === undefined ? {} : { link_code: patch.linkCode }),
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("camp_id", campId);
  if (error) throw error;
}

export async function listFeedbackQuestions(campId: string): Promise<FeedbackQuestion[]> {
  const { data, error } = await getServiceClient()
    .from("camp_feedback_questions")
    .select(QUESTION_COLUMNS)
    .eq("camp_id", campId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).flatMap((row) => toQuestion(row as QuestionRow) ?? []);
}

export async function getFeedbackQuestion(id: string): Promise<FeedbackQuestion | null> {
  const { data, error } = await getServiceClient()
    .from("camp_feedback_questions")
    .select(QUESTION_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toQuestion(data as QuestionRow) : null;
}

/** All questions of every camp, grouped by camp id. */
export async function listAllFeedbackQuestions(): Promise<Map<string, FeedbackQuestion[]>> {
  const { data, error } = await getServiceClient()
    .from("camp_feedback_questions")
    .select(QUESTION_COLUMNS)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  const byCamp = new Map<string, FeedbackQuestion[]>();
  for (const row of data ?? []) {
    const question = toQuestion(row as QuestionRow);
    if (!question) continue;
    byCamp.set(question.campId, [...(byCamp.get(question.campId) ?? []), question]);
  }
  return byCamp;
}

export async function listFeedbackResponses(campId: string): Promise<FeedbackResponse[]> {
  const { data, error } = await getServiceClient()
    .from("feedback_responses")
    .select("id, answers")
    .eq("camp_id", campId)
    .order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, answers: parseAnswers(row.answers) }));
}

/** All responses of every camp, grouped by camp id. */
export async function listAllFeedbackResponses(): Promise<Map<string, FeedbackResponse[]>> {
  const { data, error } = await getServiceClient()
    .from("feedback_responses")
    .select("id, camp_id, answers")
    .order("id", { ascending: true });
  if (error) throw error;
  const byCamp = new Map<string, FeedbackResponse[]>();
  for (const row of data ?? []) {
    byCamp.set(row.camp_id, [...(byCamp.get(row.camp_id) ?? []), { id: row.id, answers: parseAnswers(row.answers) }]);
  }
  return byCamp;
}

export async function listAllFeedbackSettings(): Promise<Map<string, FeedbackSettings>> {
  const { data, error } = await getServiceClient().from("camp_feedback_settings").select("camp_id, open, link_code");
  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.camp_id, { campId: row.camp_id, open: row.open, linkCode: row.link_code }]));
}

export async function getActiveRegistrationCount(campId: string): Promise<number> {
  const { count, error } = await getServiceClient()
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("camp_id", campId)
    .eq("deleted", false)
    .eq("status", "active");
  if (error) throw error;
  return count ?? 0;
}

export type OpenFeedback = { campId: string; campName: string; questions: FeedbackQuestion[] };

/** The camp behind a page code when it is open and has questions; null otherwise. */
export async function findOpenFeedbackByCode(code: string): Promise<OpenFeedback | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("camp_feedback_settings")
    .select("camp_id, open")
    .eq("link_code", code)
    .maybeSingle();
  if (error) throw error;
  if (!data?.open) return null;
  const [{ data: camp, error: campError }, questions] = await Promise.all([
    supabase.from("camps").select("id, name").eq("id", data.camp_id).maybeSingle(),
    listFeedbackQuestions(data.camp_id),
  ]);
  if (campError) throw campError;
  if (!camp || questions.length === 0) return null;
  return { campId: camp.id, campName: camp.name, questions };
}

/**
 * Counts feedback attempts of this ip and of the camp, then records the current
 * one. The row holds ip, camp and time but never anything of the answer.
 */
export async function isFeedbackThrottled(ip: string | null, campId: string): Promise<boolean> {
  const supabase = getServiceClient();
  const now = Date.now();
  const [ipCount, campCount] = await Promise.all([
    ip
      ? supabase
          .from("submission_attempts")
          .select("id", { count: "exact", head: true })
          .eq("kind", "feedback")
          .eq("ip", ip)
          .eq("camp_id", campId)
          .gte("created_at", new Date(now - FEEDBACK_IP_WINDOW_MS).toISOString())
      : Promise.resolve({ count: 0 }),
    supabase
      .from("submission_attempts")
      .select("id", { count: "exact", head: true })
      .eq("kind", "feedback")
      .eq("camp_id", campId)
      .gte("created_at", new Date(now - FEEDBACK_CAMP_WINDOW_MS).toISOString()),
  ]);
  await supabase.from("submission_attempts").insert({ ip, camp_id: campId, kind: "feedback" });
  return (ipCount.count ?? 0) >= FEEDBACK_IP_MAX || (campCount.count ?? 0) >= FEEDBACK_CAMP_DAILY_MAX;
}

/** Stores one response; a repeated nonce counts as already stored. */
export async function insertFeedbackResponse(campId: string, nonce: string, answers: FeedbackAnswer[]): Promise<void> {
  const { error } = await getServiceClient().from("feedback_responses").insert({ camp_id: campId, nonce, answers });
  if (error && error.code !== "23505") throw error;
}
