"use client";

import { Bus, FloppyDisk, WarningCircle } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveBusSettingsAction } from "@/app/admin/camps/[campId]/felder/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { de } from "@/lib/admin/messages";
import { CHECKBOX_FALSE, CHECKBOX_TRUE } from "@/lib/bus/limits";
import { cn } from "@/lib/cn";
import type { BusSettingsView, MappingProblem } from "@/lib/bus/types";

const t = de.bus.settings;

function answerLabel(value: string, fieldType: "select" | "checkbox"): string {
  if (fieldType !== "checkbox") return value;
  if (value === CHECKBOX_TRUE) return t.yes;
  if (value === CHECKBOX_FALSE) return t.no;
  return value;
}

/** Problem of the unsaved selection, mirroring `mappingProblem` for instant feedback. */
function draftProblem(
  fieldKey: string,
  answers: string[],
  questions: BusSettingsView["questions"],
): MappingProblem | null {
  if (!fieldKey) return "no_field";
  const question = questions.find((candidate) => candidate.key === fieldKey);
  if (!question) return "field_missing";
  if (answers.length === 0) return "no_answers";
  if (answers.some((answer) => !question.options.includes(answer))) return "answers_missing";
  return null;
}

/**
 * Per camp bus ticket settings (specs/021-bus-ticket, US1): switch, the bus
 * question of the registration form and the answers that mean bus. The switch
 * stays locked while the mapping does not fit.
 */
export function BusSettingsCard({
  campId,
  view,
  canWrite,
}: {
  campId: string;
  view: BusSettingsView;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(view.settings.enabled);
  const [fieldKey, setFieldKey] = useState(view.settings.fieldKey ?? "");
  const [answers, setAnswers] = useState<string[]>(view.settings.answers);
  const [counts, setCounts] = useState({ busPersons: view.busPersons, withoutAnswer: view.withoutAnswer });
  const [toast, setToast] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const question = view.questions.find((candidate) => candidate.key === fieldKey) ?? null;
  const problem = draftProblem(fieldKey, answers, view.questions);
  const locked = problem !== null;
  const savedBroken = view.settings.enabled && view.problem !== null;

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  }

  function chooseQuestion(key: string) {
    setFieldKey(key);
    setAnswers([]);
  }

  function toggleAnswer(value: string) {
    setAnswers((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  function save() {
    startSaving(async () => {
      const result = await saveBusSettingsAction({
        campId,
        enabled: enabled && !locked,
        fieldKey: fieldKey || null,
        answers,
      });
      if (result.ok) {
        setCounts({ busPersons: result.busPersons, withoutAnswer: result.withoutAnswer });
        showToast(t.toast.saved);
        router.refresh();
      } else {
        showToast(result.error);
      }
    });
  }

  return (
    <section aria-labelledby="bus-settings" className="mt-8 flex flex-col gap-4 pb-24 sm:pb-0">
      <h2 id="bus-settings" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t.title}
      </h2>
      <Card className="flex flex-col gap-6 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-input bg-accent/10 text-accent">
              <Bus size={20} weight="bold" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <h3 className="font-display text-lg font-bold tracking-tight text-foreground">{t.title}</h3>
              <p className="max-w-prose text-sm text-muted-foreground">{t.intro}</p>
            </div>
          </div>
          <Switch
            id="bus-enabled"
            checked={enabled && !locked}
            onCheckedChange={setEnabled}
            label={t.enabled}
            disabled={!canWrite || locked}
          />
        </div>

        {!canWrite && <p className="text-sm text-muted-foreground">{t.readOnly}</p>}

        {(locked || savedBroken) && (
          <div
            className={cn(
              "flex gap-2 rounded-input border px-4 py-3 text-sm",
              savedBroken ? "border-danger/30 bg-danger/5 text-danger" : "border-border bg-ink-50 text-muted-foreground",
            )}
          >
            <WarningCircle size={18} className="mt-0.5 shrink-0" />
            <p>
              {t.problems[problem ?? view.problem ?? "no_field"]}
              {savedBroken && ` ${t.brokenWhileOn}`}
            </p>
          </div>
        )}

        {view.questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.noQuestions}</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label={t.question} htmlFor="bus-question">
              <Select
                id="bus-question"
                value={fieldKey}
                disabled={!canWrite}
                onChange={(event) => chooseQuestion(event.target.value)}
                options={[
                  { value: "", label: t.questionPlaceholder },
                  ...view.questions.map((item) => ({ value: item.key, label: item.label })),
                ]}
              />
            </Field>

            <Field label={t.answers} hint={t.answersHint}>
              {question ? (
                <div className="flex flex-wrap gap-2">
                  {question.options.map((option) => {
                    const selected = answers.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={selected}
                        disabled={!canWrite}
                        onClick={() => toggleAnswer(option)}
                        className={cn(
                          "inline-flex min-h-9 items-center rounded-pill border px-3 py-1.5 text-sm transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
                          selected
                            ? "border-accent bg-accent/10 text-foreground"
                            : "border-ink-200 text-muted-foreground hover:border-ink-300",
                        )}
                      >
                        {answerLabel(option, question.fieldType)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t.problems.no_field}</p>
              )}
            </Field>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{t.busPersons(counts.busPersons)}</span>
            {counts.withoutAnswer > 0 && <> · {t.withoutAnswer(counts.withoutAnswer)}</>}
          </p>
          {canWrite && (
            <Button type="button" onClick={save} disabled={saving} className="w-full sm:w-auto">
              <FloppyDisk size={16} weight="bold" />
              {saving ? t.saving : t.save}
            </Button>
          )}
        </div>
      </Card>

      {toast && (
        <div
          role="status"
          className="fixed bottom-20 left-1/2 z-[60] -translate-x-1/2 rounded-pill bg-surface-inverse px-4 py-2 text-sm text-on-inverse shadow-pop sm:bottom-6"
        >
          {toast}
        </div>
      )}
    </section>
  );
}
