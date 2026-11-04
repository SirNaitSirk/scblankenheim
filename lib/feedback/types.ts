/** Shared types of the camp feedback (specs/038-camp-feedback, data-model.md). */

export const FEEDBACK_QUESTION_TYPES = ["rating", "single", "multi", "text"] as const;

export type FeedbackQuestionType = (typeof FEEDBACK_QUESTION_TYPES)[number];

export type FeedbackQuestion = {
  id: string;
  campId: string;
  key: string;
  label: string;
  type: FeedbackQuestionType;
  required: boolean;
  options: string[];
  allowComment: boolean;
  sortOrder: number;
};

/** What the public page needs of a question; no ids. */
export type PublicFeedbackQuestion = Pick<FeedbackQuestion, "key" | "label" | "type" | "required" | "options" | "allowComment">;

export type RatingValue = 1 | 2 | 3 | 4 | 5;

/**
 * One answered question inside a stored response; label is the text at submit
 * time. Rating and choice answers may carry a voluntary comment (US6).
 */
export type FeedbackAnswer =
  | { key: string; label: string; type: "rating"; value: RatingValue; comment?: string }
  | { key: string; label: string; type: "single"; value: string; comment?: string }
  | { key: string; label: string; type: "multi"; value: string[]; comment?: string }
  | { key: string; label: string; type: "text"; value: string };

/** A stored response as read back; only the id, never a person or time. */
export type FeedbackResponse = { id: string; answers: FeedbackAnswer[] };

export type OptionShare = { option: string; count: number; share: number };

type SummaryBase = { key: string; label: string; answered: number; deleted: boolean };

export type QuestionSummary =
  | (SummaryBase & {
      type: "rating";
      average: number | null;
      distribution: [number, number, number, number, number];
      comments: string[];
    })
  | (SummaryBase & { type: "single" | "multi"; options: OptionShare[]; comments: string[] })
  | (SummaryBase & { type: "text"; texts: string[] });

export type CampFeedbackSummary = {
  responseCount: number;
  activeRegistrations: number;
  open: boolean;
  questions: QuestionSummary[];
};

export type HistoryCell =
  | { kind: "rating"; answered: number; average: number | null }
  | { kind: "choice"; answered: number; options: OptionShare[] }
  | null;

export type HistoryCamp = { id: string; name: string; startDate: string | null };

export type FeedbackHistoryRow = {
  key: string;
  type: "rating" | "choice";
  label: string;
  previousLabels: string[];
  cells: HistoryCell[];
};

export type FeedbackHistory = { camps: HistoryCamp[]; rows: FeedbackHistoryRow[] };

/** Input of the history: one camp with its questions and responses. */
export type HistoryInput = HistoryCamp & { questions: FeedbackQuestion[]; responses: FeedbackResponse[] };
