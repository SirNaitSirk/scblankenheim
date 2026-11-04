"use client";

import { ArrowDown, ArrowUp, CopySimple, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { copyFeedbackQuestions, deleteFeedbackQuestion, moveFeedbackQuestion } from "@/app/admin/feedback/actions";
import { FeedbackQuestionDialog } from "@/components/admin/feedback-question-dialog";
import { useFeedbackToast } from "@/components/admin/feedback-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { de } from "@/lib/admin/messages";
import { FEEDBACK_QUESTIONS_MAX } from "@/lib/feedback/limits";
import type { FeedbackQuestion } from "@/lib/feedback/types";

const t = de.feedback.questions;

export type CopySource = { id: string; name: string; questionCount: number };

type Editing = { question: FeedbackQuestion | null } | null;

/**
 * Question list of one camp (specs/038-camp-feedback, US2): create, edit,
 * order, delete and copy from another camp. Read only without permission.
 */
export function FeedbackQuestions({
  campId,
  questions,
  answerCounts,
  copySources,
  canWrite,
}: {
  campId: string;
  questions: FeedbackQuestion[];
  answerCounts: Record<string, number>;
  copySources: CopySource[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const { show, toast } = useFeedbackToast();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<FeedbackQuestion | null>(null);
  const [copyOpen, setCopyOpen] = useState(false);
  const [source, setSource] = useState(copySources[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>, success?: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        if (success) show(success);
        router.refresh();
      } else {
        show(result.error);
      }
    });
  }

  function copy() {
    startTransition(async () => {
      const result = await copyFeedbackQuestions(campId, source);
      setCopyOpen(false);
      if (result.ok) {
        show(t.copied(result.copied));
        router.refresh();
      } else {
        show(result.error);
      }
    });
  }

  return (
    <section aria-labelledby="feedback-questions" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="feedback-questions" className="font-display text-lg font-bold tracking-tight text-foreground">
          {t.title}
        </h2>
        {canWrite && (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setCopyOpen(true)}>
              <CopySimple size={16} weight="bold" />
              {t.copy}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={questions.length >= FEEDBACK_QUESTIONS_MAX}
              onClick={() => setEditing({ question: null })}
            >
              <Plus size={16} weight="bold" />
              {t.add}
            </Button>
          </div>
        )}
      </div>

      {!canWrite && <p className="text-sm text-muted-foreground">{t.readOnly}</p>}

      {questions.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">{t.empty}</Card>
      ) : (
        <ol className="flex flex-col gap-2">
          {questions.map((question, index) => (
            <li key={question.id}>
              <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <p className="font-medium text-foreground">{question.label}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge tone="neutral">{de.feedback.types[question.type]}</Badge>
                    {question.required && <Badge tone="pending">{t.required}</Badge>}
                    <span>
                      {t.key}: <code className="font-mono">{question.key}</code>
                    </span>
                    {(answerCounts[question.key] ?? 0) > 0 && <span>· {de.feedback.camps.responses(answerCounts[question.key] ?? 0)}</span>}
                  </div>
                  {question.options.length > 0 && (
                    <p className="text-xs text-muted-foreground">{question.options.join(" · ")}</p>
                  )}
                </div>
                {canWrite && (
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={t.up}
                      disabled={pending || index === 0}
                      onClick={() => run(() => moveFeedbackQuestion(question.id, "up"))}
                    >
                      <ArrowUp size={16} weight="bold" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={t.down}
                      disabled={pending || index === questions.length - 1}
                      onClick={() => run(() => moveFeedbackQuestion(question.id, "down"))}
                    >
                      <ArrowDown size={16} weight="bold" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" aria-label={t.edit} onClick={() => setEditing({ question })}>
                      <PencilSimple size={16} weight="bold" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" aria-label={t.delete} onClick={() => setDeleting(question)}>
                      <Trash size={16} weight="bold" />
                    </Button>
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ol>
      )}

      {editing && (
        <FeedbackQuestionDialog
          key={editing.question?.id ?? "new"}
          open
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            show(message);
            router.refresh();
          }}
          campId={campId}
          question={editing.question}
          answered={editing.question ? (answerCounts[editing.question.key] ?? 0) > 0 : false}
          takenKeys={questions.map((question) => question.key)}
        />
      )}

      <Dialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={t.deleteTitle}
        description={deleting ? t.deleteBody(answerCounts[deleting.key] ?? 0) : undefined}
        closeLabel={de.feedback.access.cancel}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setDeleting(null)}>
              {de.feedback.access.cancel}
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={pending}
              onClick={() => {
                const target = deleting;
                setDeleting(null);
                if (target) run(() => deleteFeedbackQuestion(target.id), t.deleted);
              }}
            >
              {t.deleteConfirm}
            </Button>
          </>
        }
      >
        <p className="font-medium text-foreground">{deleting?.label}</p>
      </Dialog>

      <Dialog
        open={copyOpen}
        onClose={() => setCopyOpen(false)}
        title={t.copyTitle}
        description={t.copyBody}
        closeLabel={de.feedback.access.cancel}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setCopyOpen(false)}>
              {de.feedback.access.cancel}
            </Button>
            <Button type="button" disabled={pending || !source} onClick={copy}>
              {t.copyConfirm}
            </Button>
          </>
        }
      >
        {copySources.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.copyNone}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {questions.length > 0 && <p className="text-sm text-muted-foreground">{t.copyExisting}</p>}
            <Field label={t.copySource} htmlFor="feedback-copy-source">
              <Select
                id="feedback-copy-source"
                value={source}
                onChange={(event) => setSource(event.target.value)}
                options={copySources.map((camp) => ({ value: camp.id, label: `${camp.name} (${camp.questionCount})` }))}
              />
            </Field>
          </div>
        )}
      </Dialog>

      {toast}
    </section>
  );
}
