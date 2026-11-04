import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";
import { FeedbackLinkCard } from "@/components/admin/feedback-link-card";
import { FeedbackQuestions } from "@/components/admin/feedback-questions";
import { FeedbackResults } from "@/components/admin/feedback-results";
import { PageBody, PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { canUseSection } from "@/lib/admin/access";
import { de } from "@/lib/admin/messages";
import { cn } from "@/lib/cn";
import { campSlug, getFeedbackOverview } from "@/lib/feedback/admin-data";
import { feedbackUrl } from "@/lib/feedback/code-server";
import { ensureFeedbackSettings, getActiveRegistrationCount } from "@/lib/feedback/data";
import { guardFeedbackPage } from "@/lib/feedback/page-guard";
import { answerCountForKey } from "@/lib/feedback/rules";
import { summarizeCamp } from "@/lib/feedback/stats";

const t = de.feedback;

type View = "results" | "questions";

/** Feedback of one camp: access, results and questions (specs/038-camp-feedback, US2 and US3). */
export default async function CampFeedbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ campId: string }>;
  searchParams: Promise<{ ansicht?: string }>;
}) {
  const profile = await guardFeedbackPage();
  const [{ campId }, { ansicht }] = await Promise.all([params, searchParams]);
  const overview = await getFeedbackOverview();
  const current = overview.find((entry) => entry.camp.id === campId);
  if (!current) notFound();

  const view: View = ansicht === "fragen" ? "questions" : "results";
  const canWrite = canUseSection(profile, "feedback");
  const [settings, activeRegistrations] = await Promise.all([
    ensureFeedbackSettings(campId, profile.id),
    getActiveRegistrationCount(campId),
  ]);
  const { camp, questions, responses } = current;
  const summary = summarizeCamp(questions, responses, activeRegistrations, settings.open);
  const answerCounts = Object.fromEntries(questions.map((question) => [question.key, answerCountForKey(responses, question.key)]));
  const copySources = overview
    .filter((entry) => entry.camp.id !== campId && entry.questions.length > 0)
    .map((entry) => ({ id: entry.camp.id, name: entry.camp.name, questionCount: entry.questions.length }));

  const tabs: { id: View; label: string; href: string }[] = [
    { id: "results", label: t.views.results, href: `/admin/feedback/${campId}` },
    { id: "questions", label: `${t.views.questions} (${questions.length})`, href: `/admin/feedback/${campId}?ansicht=fragen` },
  ];

  return (
    <PageBody>
      <div>
        <ButtonLink href="/admin/feedback" variant="ghost" size="sm" className="-ml-3">
          <ArrowLeft size={16} weight="bold" />
          {t.back}
        </ButtonLink>
      </div>
      <PageHeader
        title={`${t.title} · ${camp.name}`}
        badge={<Badge tone={settings.open ? "pending" : "neutral"}>{settings.open ? t.camps.open : t.camps.closed}</Badge>}
      />

      <FeedbackLinkCard
        key={settings.linkCode}
        campId={campId}
        open={settings.open}
        url={feedbackUrl(settings.linkCode)}
        hasQuestions={questions.length > 0}
        canWrite={canWrite}
      />

      <nav aria-label={t.views.label} className="flex gap-1 self-start rounded-pill border border-border bg-surface p-1">
        {tabs.map((tab) => (
          <a
            key={tab.id}
            href={tab.href}
            aria-current={view === tab.id ? "page" : undefined}
            className={cn(
              "rounded-pill px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              view === tab.id ? "bg-surface-inverse text-on-inverse" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </a>
        ))}
      </nav>

      {view === "results" ? (
        <FeedbackResults summary={summary} questions={questions} responses={responses} campSlug={campSlug(camp.name)} />
      ) : (
        <FeedbackQuestions
          campId={campId}
          questions={questions}
          answerCounts={answerCounts}
          copySources={copySources}
          canWrite={canWrite}
        />
      )}
    </PageBody>
  );
}
