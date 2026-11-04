"use client";

import { ChatCircleText, DownloadSimple } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/admin/stat-card";
import { EmptyState } from "@/components/admin/states";
import { de } from "@/lib/admin/messages";
import { feedbackResponsesToCsv } from "@/lib/feedback/csv";
import type { CampFeedbackSummary, FeedbackQuestion, FeedbackResponse, OptionShare, QuestionSummary } from "@/lib/feedback/types";
import { formatAverage, formatNumber, formatPercent } from "@/lib/format";

const t = de.feedback.results;

function Bar({ share }: { share: number }) {
  return (
    <span className="block h-2 w-full overflow-hidden rounded-pill bg-ink-100" aria-hidden>
      <span className="block h-full rounded-pill bg-accent" style={{ width: `${Math.round(Math.min(1, share) * 100)}%` }} />
    </span>
  );
}

function ShareRows({ rows }: { rows: { label: string; count: number; share: number }[] }) {
  return (
    <dl className="flex flex-col gap-2">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[minmax(0,8rem)_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[minmax(0,14rem)_1fr_auto]">
          <dt className="truncate text-foreground">{row.label}</dt>
          <dd>
            <Bar share={row.share} />
          </dd>
          <dd className="tabular-nums text-muted-foreground">
            {row.count} · {formatPercent(row.share)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function optionRows(options: OptionShare[]) {
  return options.map((option) => ({ label: option.option, count: option.count, share: option.share }));
}

function QuestionCard({ summary }: { summary: QuestionSummary }) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium text-foreground">{summary.label}</h3>
          {summary.deleted && <Badge tone="neutral">{t.deleted}</Badge>}
        </div>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{t.count(summary.answered)}</span>
      </div>

      {summary.type === "rating" && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          <div className="flex flex-col">
            <span className="font-display text-3xl font-extrabold tabular-nums tracking-tight text-foreground">
              {summary.average === null ? "·" : formatAverage(summary.average)}
            </span>
            <span className="text-xs text-muted-foreground">{t.average}</span>
          </div>
          <div className="min-w-0 flex-1">
            <ShareRows
              rows={[5, 4, 3, 2, 1].map((value) => {
                const count = summary.distribution[value - 1] ?? 0;
                return { label: String(value), count, share: summary.answered > 0 ? count / summary.answered : 0 };
              })}
            />
          </div>
        </div>
      )}

      {(summary.type === "single" || summary.type === "multi") && (
        <div className="flex flex-col gap-2">
          <ShareRows rows={optionRows(summary.options)} />
          {summary.type === "multi" && <p className="text-xs text-muted-foreground">{t.multiHint}</p>}
        </div>
      )}

      {summary.type === "text" &&
        (summary.texts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.noTexts}</p>
        ) : (
          <ul className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto">
            {summary.texts.map((text, index) => (
              <li key={index} className="whitespace-pre-line rounded-input bg-ink-50 px-3 py-2 text-sm text-foreground">
                {text}
              </li>
            ))}
          </ul>
        ))}

      {summary.type !== "text" && summary.comments.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-foreground">{t.comments(summary.comments.length)}</summary>
          <ul className="mt-2 flex max-h-[28rem] flex-col gap-2 overflow-y-auto">
            {summary.comments.map((comment, index) => (
              <li key={index} className="whitespace-pre-line rounded-input bg-ink-50 px-3 py-2 text-sm text-foreground">
                {comment}
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}

/** Results of one camp (specs/038-camp-feedback, US3) with CSV export in the browser. */
export function FeedbackResults({
  summary,
  questions,
  responses,
  campSlug,
}: {
  summary: CampFeedbackSummary;
  questions: FeedbackQuestion[];
  responses: FeedbackResponse[];
  campSlug: string;
}) {
  function exportCsv() {
    const csv = feedbackResponsesToCsv(questions, responses);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = t.fileName(campSlug);
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <section aria-labelledby="feedback-results" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="feedback-results" className="font-display text-lg font-bold tracking-tight text-foreground">
          {de.feedback.views.results}
        </h2>
        {summary.responseCount > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={exportCsv}>
            <DownloadSimple size={16} weight="bold" />
            {t.export}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard hero label={t.responses} value={formatNumber(summary.responseCount)} />
        <StatCard label={t.registrations} value={formatNumber(summary.activeRegistrations)} delta={t.registrationsHint} />
        <StatCard label={t.state} value={summary.open ? de.feedback.camps.open : de.feedback.camps.closed} />
      </div>

      {summary.responseCount === 0 ? (
        <Card>
          <EmptyState
            icon={ChatCircleText}
            title={summary.questions.length === 0 ? t.noQuestions : de.feedback.views.results}
            description={summary.open ? t.emptyOpen : t.emptyClosed}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {summary.questions.map((question) => (
            <QuestionCard key={`${question.key}:${question.type}`} summary={question} />
          ))}
        </div>
      )}
    </section>
  );
}
