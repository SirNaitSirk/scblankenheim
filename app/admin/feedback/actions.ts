"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeLog } from "@/lib/admin/data";
import { AuthError, requirePermission } from "@/lib/admin/guard";
import { de } from "@/lib/admin/messages";
import type { ActionResult, AdminUser } from "@/lib/admin/types";
import { generateFeedbackCode } from "@/lib/feedback/code-server";
import {
  ensureFeedbackSettings,
  getFeedbackQuestion,
  listFeedbackQuestions,
  listFeedbackResponses,
  updateFeedbackSettings,
} from "@/lib/feedback/data";
import { FEEDBACK_QUESTIONS_MAX } from "@/lib/feedback/limits";
import { answeredKeys, questionChangeProblem, questionsToCopy, type QuestionChangeProblem } from "@/lib/feedback/rules";
import { feedbackQuestionInputSchema, uuidSchema, type FeedbackQuestionInput } from "@/lib/feedback/schema";
import { getServiceClient } from "@/lib/supabase/server";

/**
 * Admin actions of the camp feedback (specs/038-camp-feedback,
 * contracts/feedback-routes.md). Every action needs the `feedback` permission.
 * Log entries cover admin actions only, never answers or the link code.
 */

const e = de.feedback.errors;

export type CopyQuestionsResult = { ok: true; copied: number } | { ok: false; error: string };

const PROBLEM_FIELDS: Record<QuestionChangeProblem, { field: string; message: string }> = {
  locked_type: { field: "type", message: e.lockedType },
  locked_key: { field: "key", message: e.lockedKey },
  options_removed: { field: "options", message: e.optionsRemoved },
};

async function guarded<T extends { ok: boolean }>(fn: (admin: AdminUser) => Promise<T>): Promise<T | { ok: false; error: string }> {
  let admin: AdminUser;
  try {
    admin = await requirePermission("feedback");
  } catch (error) {
    if (!(error instanceof AuthError)) console.error("[feedback] auth check failed", error);
    return { ok: false, error: de.feedback.noPermission };
  }
  try {
    return await fn(admin);
  } catch (error) {
    console.error("[feedback] action failed", error);
    return { ok: false, error: de.feedback.actionFailed };
  }
}

function actorLabel(admin: AdminUser): string {
  return admin.name?.trim() || admin.email?.trim() || admin.id;
}

function revalidateCamp(campId: string): void {
  revalidatePath(`/admin/feedback/${campId}`);
  revalidatePath("/admin/feedback");
}

async function campExists(campId: string): Promise<boolean> {
  if (!uuidSchema.safeParse(campId).success) return false;
  const { data, error } = await getServiceClient().from("camps").select("id").eq("id", campId).maybeSingle();
  if (error) throw error;
  return data !== null;
}

function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "label");
    errors[field] ??= issue.message;
  }
  return errors;
}

function toRow(input: FeedbackQuestionInput) {
  const { allowComment, ...rest } = input;
  return { ...rest, allow_comment: allowComment };
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "23505";
}

export async function createFeedbackQuestion(campId: string, raw: unknown): Promise<ActionResult> {
  return guarded(async () => {
    if (!(await campExists(campId))) return { ok: false, error: e.campNotFound };
    const parsed = feedbackQuestionInputSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: e.label, fieldErrors: fieldErrorsOf(parsed.error) };
    const questions = await listFeedbackQuestions(campId);
    if (questions.length >= FEEDBACK_QUESTIONS_MAX) return { ok: false, error: e.tooMany };
    if (questions.some((question) => question.key === parsed.data.key)) {
      return { ok: false, error: e.duplicateKey, fieldErrors: { key: e.duplicateKey } };
    }
    const sortOrder = questions.reduce((max, question) => Math.max(max, question.sortOrder), -1) + 1;
    const { data, error } = await getServiceClient()
      .from("camp_feedback_questions")
      .insert({ ...toRow(parsed.data), camp_id: campId, sort_order: sortOrder })
      .select("id")
      .single();
    if (isUniqueViolation(error)) return { ok: false, error: e.duplicateKey, fieldErrors: { key: e.duplicateKey } };
    if (error) throw error;
    revalidateCamp(campId);
    return { ok: true, id: data.id };
  });
}

export async function updateFeedbackQuestion(id: string, raw: unknown): Promise<ActionResult> {
  return guarded(async () => {
    const existing = uuidSchema.safeParse(id).success ? await getFeedbackQuestion(id) : null;
    if (!existing) return { ok: false, error: e.notFound };
    const parsed = feedbackQuestionInputSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: e.label, fieldErrors: fieldErrorsOf(parsed.error) };

    const [questions, responses] = await Promise.all([
      listFeedbackQuestions(existing.campId),
      listFeedbackResponses(existing.campId),
    ]);
    const problem = questionChangeProblem(existing, parsed.data, answeredKeys(responses));
    if (problem) {
      const { field, message } = PROBLEM_FIELDS[problem];
      return { ok: false, error: message, fieldErrors: { [field]: message } };
    }
    if (questions.some((question) => question.id !== id && question.key === parsed.data.key)) {
      return { ok: false, error: e.duplicateKey, fieldErrors: { key: e.duplicateKey } };
    }
    const { error } = await getServiceClient()
      .from("camp_feedback_questions")
      .update({ ...toRow(parsed.data), updated_at: new Date().toISOString() })
      .eq("id", id);
    if (isUniqueViolation(error)) return { ok: false, error: e.duplicateKey, fieldErrors: { key: e.duplicateKey } };
    if (error) throw error;
    revalidateCamp(existing.campId);
    return { ok: true, id };
  });
}

export async function deleteFeedbackQuestion(id: string): Promise<ActionResult> {
  return guarded(async () => {
    const existing = uuidSchema.safeParse(id).success ? await getFeedbackQuestion(id) : null;
    if (!existing) return { ok: false, error: e.notFound };
    const { error } = await getServiceClient().from("camp_feedback_questions").delete().eq("id", id);
    if (error) throw error;
    revalidateCamp(existing.campId);
    return { ok: true };
  });
}

export async function moveFeedbackQuestion(id: string, direction: "up" | "down"): Promise<ActionResult> {
  return guarded(async () => {
    const existing = uuidSchema.safeParse(id).success ? await getFeedbackQuestion(id) : null;
    if (!existing) return { ok: false, error: e.notFound };
    const questions = await listFeedbackQuestions(existing.campId);
    const index = questions.findIndex((question) => question.id === id);
    const neighbour = questions[direction === "up" ? index - 1 : index + 1];
    const current = questions[index];
    if (!neighbour || !current) return { ok: true };
    const supabase = getServiceClient();
    // Positions are rewritten as 0..n so equal sort orders cannot block a swap.
    const order = questions.map((question) => question.id);
    order[index] = neighbour.id;
    order[questions.indexOf(neighbour)] = current.id;
    const results = await Promise.all(
      order.map((questionId, position) =>
        supabase.from("camp_feedback_questions").update({ sort_order: position }).eq("id", questionId),
      ),
    );
    const failed = results.find((result) => result.error);
    if (failed?.error) throw failed.error;
    revalidateCamp(existing.campId);
    return { ok: true };
  });
}

export async function copyFeedbackQuestions(targetCampId: string, sourceCampId: string): Promise<CopyQuestionsResult> {
  return guarded(async (admin): Promise<CopyQuestionsResult> => {
    if (targetCampId === sourceCampId) return { ok: false, error: e.sameCamp };
    if (!(await campExists(targetCampId)) || !(await campExists(sourceCampId))) return { ok: false, error: e.campNotFound };
    const [source, target] = await Promise.all([listFeedbackQuestions(sourceCampId), listFeedbackQuestions(targetCampId)]);
    const copies = questionsToCopy(source, target);
    if (target.length + copies.length > FEEDBACK_QUESTIONS_MAX) return { ok: false, error: e.tooMany };
    if (copies.length > 0) {
      const { error } = await getServiceClient()
        .from("camp_feedback_questions")
        .insert(
          copies.map((question) => ({
            camp_id: targetCampId,
            key: question.key,
            label: question.label,
            type: question.type,
            required: question.required,
            options: question.options,
            allow_comment: question.allowComment,
            sort_order: question.sortOrder,
          })),
        );
      if (error) throw error;
      await writeLog({
        actor: actorLabel(admin),
        action: "feedback.questions_copied",
        message: `${copies.length} Feedbackfragen übernommen.`,
      });
    }
    revalidateCamp(targetCampId);
    return { ok: true, copied: copies.length };
  });
}

export async function setFeedbackOpen(campId: string, open: boolean): Promise<ActionResult> {
  return guarded(async (admin) => {
    if (!(await campExists(campId))) return { ok: false, error: e.campNotFound };
    if (open && (await listFeedbackQuestions(campId)).length === 0) return { ok: false, error: e.noQuestions };
    await ensureFeedbackSettings(campId, admin.id);
    await updateFeedbackSettings(campId, { open }, admin.id);
    await writeLog({
      actor: actorLabel(admin),
      action: open ? "feedback.opened" : "feedback.closed",
      message: open ? "Feedback geöffnet." : "Feedback geschlossen.",
    });
    revalidateCamp(campId);
    return { ok: true };
  });
}

export async function renewFeedbackLink(campId: string): Promise<ActionResult> {
  return guarded(async (admin) => {
    if (!(await campExists(campId))) return { ok: false, error: e.campNotFound };
    await ensureFeedbackSettings(campId, admin.id);
    await updateFeedbackSettings(campId, { linkCode: generateFeedbackCode() }, admin.id);
    await writeLog({ actor: actorLabel(admin), action: "feedback.link_renewed", message: "Feedbacklink erneuert." });
    revalidateCamp(campId);
    return { ok: true };
  });
}
