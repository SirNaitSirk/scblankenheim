import { ChartLineUp } from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/admin/states";
import { de } from "@/lib/admin/messages";
import type { FeedbackHistory, HistoryCell } from "@/lib/feedback/types";
import { formatAverage, formatPercent } from "@/lib/format";

const t = de.feedback.history;

function Cell({ cell }: { cell: HistoryCell }) {
  if (!cell) return <span className="text-muted-foreground" title={t.missing}>·</span>;
  if (cell.kind === "rating") {
    const share = cell.average === null ? 0 : cell.average / 5;
    return (
      <div className="flex min-w-[6rem] flex-col gap-1">
        <span className="font-display text-base font-bold tabular-nums text-foreground">
          {cell.average === null ? "·" : formatAverage(cell.average)}
        </span>
        <span className="block h-1.5 w-full overflow-hidden rounded-pill bg-ink-100" aria-hidden>
          <span className="block h-full rounded-pill bg-accent" style={{ width: `${Math.round(share * 100)}%` }} />
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">{t.count(cell.answered)}</span>
      </div>
    );
  }
  return (
    <div className="flex min-w-[8rem] flex-col gap-0.5 text-xs">
      {cell.options.map((option) => (
        <span key={option.option} className="flex justify-between gap-3">
          <span className="truncate text-foreground">{option.option}</span>
          <span className="tabular-nums text-muted-foreground">{formatPercent(option.share)}</span>
        </span>
      ))}
      <span className="mt-1 tabular-nums text-muted-foreground">{t.count(cell.answered)}</span>
    </div>
  );
}

/** History across camps per question key (specs/038-camp-feedback, US4). */
export function FeedbackHistoryTable({ history }: { history: FeedbackHistory }) {
  return (
    <section aria-labelledby="feedback-history" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 id="feedback-history" className="font-display text-lg font-bold tracking-tight text-foreground">
          {t.title}
        </h2>
        <p className="max-w-prose text-sm text-muted-foreground">{t.description}</p>
      </div>
      {history.rows.length === 0 ? (
        <Card>
          <EmptyState icon={ChartLineUp} title={t.title} description={t.empty} />
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-max border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="sticky left-0 bg-surface px-4 py-3 text-xs font-medium text-muted-foreground">
                  {t.question}
                </th>
                {history.camps.map((camp) => (
                  <th key={camp.id} scope="col" className="px-4 py-3 text-xs font-medium text-muted-foreground">
                    <a href={`/admin/feedback/${camp.id}`} className="underline-offset-4 hover:text-foreground hover:underline">
                      {camp.name}
                    </a>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.rows.map((row) => (
                <tr key={`${row.type}:${row.key}`} className="border-b border-border last:border-0 align-top">
                  <th scope="row" className="sticky left-0 max-w-[16rem] bg-surface px-4 py-3 font-medium text-foreground">
                    <span className="block whitespace-normal">{row.label}</span>
                    {row.previousLabels.length > 0 && (
                      <details className="mt-1 text-xs font-normal text-muted-foreground">
                        <summary className="cursor-pointer">{t.previous}</summary>
                        <ul className="mt-1 flex flex-col gap-0.5">
                          {row.previousLabels.map((label) => (
                            <li key={label}>{label}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </th>
                  {row.cells.map((cell, index) => (
                    <td key={history.camps[index]?.id ?? index} className="px-4 py-3">
                      <Cell cell={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </section>
  );
}
