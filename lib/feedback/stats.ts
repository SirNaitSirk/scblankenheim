import type {
  CampFeedbackSummary,
  FeedbackAnswer,
  FeedbackHistory,
  FeedbackHistoryRow,
  FeedbackQuestion,
  FeedbackQuestionType,
  FeedbackResponse,
  HistoryCell,
  HistoryInput,
  OptionShare,
  QuestionSummary,
} from "./types";

/**
 * Results and history of the camp feedback (specs/038-camp-feedback, research
 * R9). Pure, so every number is unit tested. Shares and averages relate only to
 * the responses that answered the question.
 */

type Column = { key: string; label: string; type: FeedbackQuestionType; options: string[]; deleted: boolean };

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Current questions in order, then keys only found in stored answers. */
function columnsOf(questions: readonly FeedbackQuestion[], responses: readonly FeedbackResponse[]): Column[] {
  const columns: Column[] = [...questions]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((q) => ({ key: q.key, label: q.label, type: q.type, options: [...q.options], deleted: false }));
  const known = new Set(columns.map((column) => column.key));
  const extra = new Map<string, Column>();
  for (const response of responses) {
    for (const answer of response.answers) {
      if (known.has(answer.key)) continue;
      // The last stored label wins; responses come ordered by id.
      extra.set(answer.key, { key: answer.key, label: answer.label, type: answer.type, options: [], deleted: true });
    }
  }
  return [...columns, ...extra.values()];
}

function answersFor(column: Column, responses: readonly FeedbackResponse[]): FeedbackAnswer[] {
  const found: FeedbackAnswer[] = [];
  for (const response of responses) {
    const answer = response.answers.find((item) => item.key === column.key && item.type === column.type);
    if (answer) found.push(answer);
  }
  return found;
}

function shares(options: readonly string[], picked: readonly string[][], answered: number): OptionShare[] {
  const counts = new Map<string, number>(options.map((option) => [option, 0]));
  for (const list of picked) for (const option of list) counts.set(option, (counts.get(option) ?? 0) + 1);
  return [...counts.entries()].map(([option, count]) => ({
    option,
    count,
    share: answered > 0 ? count / answered : 0,
  }));
}

function commentsOf(answers: readonly FeedbackAnswer[]): string[] {
  return answers.flatMap((answer) =>
    answer.type !== "text" && answer.comment && answer.comment.trim() !== "" ? [answer.comment] : [],
  );
}

function summarizeColumn(column: Column, responses: readonly FeedbackResponse[]): QuestionSummary {
  const answers = answersFor(column, responses);
  const comments = commentsOf(answers);
  const base = { key: column.key, label: column.label, answered: answers.length, deleted: column.deleted };
  switch (column.type) {
    case "rating": {
      const distribution: [number, number, number, number, number] = [0, 0, 0, 0, 0];
      let sum = 0;
      for (const answer of answers) {
        if (answer.type !== "rating") continue;
        distribution[answer.value - 1] += 1;
        sum += answer.value;
      }
      return {
        ...base,
        type: "rating",
        average: answers.length > 0 ? roundOne(sum / answers.length) : null,
        distribution,
        comments,
      };
    }
    case "single":
    case "multi": {
      const picked = answers.map((answer) =>
        answer.type === "multi" ? answer.value : answer.type === "single" ? [answer.value] : [],
      );
      return { ...base, type: column.type, options: shares(column.options, picked, answers.length), comments };
    }
    case "text": {
      const texts = answers.flatMap((answer) => (answer.type === "text" && answer.value.trim() !== "" ? [answer.value] : []));
      return { ...base, type: "text", texts };
    }
  }
}

export function summarizeCamp(
  questions: readonly FeedbackQuestion[],
  responses: readonly FeedbackResponse[],
  activeRegistrations: number,
  open: boolean,
): CampFeedbackSummary {
  const sorted = [...responses].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return {
    responseCount: sorted.length,
    activeRegistrations,
    open,
    questions: columnsOf(questions, sorted).map((column) => summarizeColumn(column, sorted)),
  };
}

function compareCamps(a: HistoryInput, b: HistoryInput): number {
  if (a.startDate === b.startDate) return a.name.localeCompare(b.name, "de");
  if (a.startDate === null) return 1;
  if (b.startDate === null) return -1;
  return a.startDate < b.startDate ? -1 : 1;
}

/** One row per key of rating or choice questions across all camps with responses, oldest camp first. */
export function buildHistory(inputs: readonly HistoryInput[]): FeedbackHistory {
  const camps = inputs.filter((input) => input.responses.length > 0).sort(compareCamps);
  const rows = new Map<string, FeedbackHistoryRow & { labels: string[] }>();

  camps.forEach((camp, index) => {
    const summary = summarizeCamp(camp.questions, camp.responses, 0, false);
    for (const question of summary.questions) {
      if (question.type === "text") continue;
      const kind = question.type === "rating" ? "rating" : "choice";
      const id = `${kind}:${question.key}`;
      let row = rows.get(id);
      if (!row) {
        row = { key: question.key, type: kind, label: question.label, previousLabels: [], labels: [], cells: camps.map(() => null) };
        rows.set(id, row);
      }
      row.labels.push(question.label);
      const cell: HistoryCell =
        question.type === "rating"
          ? { kind: "rating", answered: question.answered, average: question.average }
          : { kind: "choice", answered: question.answered, options: question.options };
      row.cells[index] = question.answered > 0 ? cell : null;
    }
  });

  const result = [...rows.values()].map(({ labels, ...row }) => {
    const label = labels[labels.length - 1] ?? row.label;
    const previousLabels = [...new Set(labels.slice(0, -1))].filter((text) => text !== label);
    return { ...row, label, previousLabels };
  });

  return { camps: camps.map(({ id, name, startDate }) => ({ id, name, startDate })), rows: result };
}
