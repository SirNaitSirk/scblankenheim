import "server-only";

import { getCamps } from "@/lib/admin/data";
import type { Camp } from "@/lib/admin/types";
import {
  listAllFeedbackQuestions,
  listAllFeedbackResponses,
  listAllFeedbackSettings,
  type FeedbackSettings,
} from "./data";
import type { FeedbackQuestion, FeedbackResponse } from "./types";

/** Everything the feedback overview needs in three reads (specs/038-camp-feedback, US4). */
export type FeedbackOverviewCamp = {
  camp: Camp;
  settings: FeedbackSettings | null;
  questions: FeedbackQuestion[];
  responses: FeedbackResponse[];
};

export async function getFeedbackOverview(): Promise<FeedbackOverviewCamp[]> {
  const [camps, settings, questions, responses] = await Promise.all([
    getCamps(),
    listAllFeedbackSettings(),
    listAllFeedbackQuestions(),
    listAllFeedbackResponses(),
  ]);
  return camps.map((camp) => ({
    camp,
    settings: settings.get(camp.id) ?? null,
    questions: questions.get(camp.id) ?? [],
    responses: responses.get(camp.id) ?? [],
  }));
}

export function campSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "camp"
  );
}
