import { ChatCircleText } from "@phosphor-icons/react/dist/ssr";
import { FeedbackHistoryTable } from "@/components/admin/feedback-history";
import { PageBody, PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/states";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { de } from "@/lib/admin/messages";
import { getFeedbackOverview } from "@/lib/feedback/admin-data";
import { guardFeedbackPage } from "@/lib/feedback/page-guard";
import { buildHistory } from "@/lib/feedback/stats";
import { formatDate } from "@/lib/format";

const t = de.feedback;

/** Feedback overview: history across camps and the camp list (specs/038-camp-feedback, US4). */
export default async function FeedbackOverviewPage() {
  await guardFeedbackPage();
  const overview = await getFeedbackOverview();
  const history = buildHistory(
    overview.map(({ camp, questions, responses }) => ({
      id: camp.id,
      name: camp.name,
      startDate: camp.startDate || null,
      questions,
      responses,
    })),
  );
  const camps = [...overview].sort((a, b) => {
    if (a.camp.isCurrent !== b.camp.isCurrent) return a.camp.isCurrent ? -1 : 1;
    return (b.camp.startDate ?? "").localeCompare(a.camp.startDate ?? "");
  });

  return (
    <PageBody>
      <PageHeader title={t.title} description={t.description} />

      <FeedbackHistoryTable history={history} />

      <section aria-labelledby="feedback-camps" className="flex flex-col gap-3">
        <h2 id="feedback-camps" className="font-display text-lg font-bold tracking-tight text-foreground">
          {t.camps.title}
        </h2>
        {camps.length === 0 ? (
          <Card>
            <EmptyState icon={ChatCircleText} title={t.camps.title} description={t.camps.empty} />
          </Card>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {camps.map(({ camp, settings, questions, responses }) => (
              <li key={camp.id}>
                <a
                  href={`/admin/feedback/${camp.id}`}
                  className="flex h-full flex-col gap-3 rounded-card border border-border bg-surface p-5 shadow-card transition-colors hover:border-ink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-base font-bold tracking-tight text-foreground">{camp.name}</span>
                    {camp.isCurrent && <Badge tone="paid">{t.camps.current}</Badge>}
                  </div>
                  {camp.startDate && (
                    <span className="text-sm text-muted-foreground">
                      {t.camps.dates(formatDate(camp.startDate), camp.endDate ? formatDate(camp.endDate) : null)}
                    </span>
                  )}
                  <div className="mt-auto flex flex-wrap items-center gap-2 text-sm">
                    <Badge tone={settings?.open ? "pending" : "neutral"}>
                      {settings?.open ? t.camps.open : t.camps.closed}
                    </Badge>
                    <span className="text-muted-foreground">{t.camps.responses(responses.length)}</span>
                    <span className="text-muted-foreground">· {t.camps.questionCount(questions.length)}</span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageBody>
  );
}
