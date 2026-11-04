"use client";

import { Plus, X } from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import { createFeedbackQuestion, updateFeedbackQuestion } from "@/app/admin/feedback/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { de } from "@/lib/admin/messages";
import { FEEDBACK_KEY_MAX, FEEDBACK_LABEL_MAX, FEEDBACK_OPTION_MAX, FEEDBACK_OPTIONS_MAX } from "@/lib/feedback/limits";
import { suggestKey } from "@/lib/feedback/rules";
import { FEEDBACK_QUESTION_TYPES, type FeedbackQuestion, type FeedbackQuestionType } from "@/lib/feedback/types";

const t = de.feedback.dialog;

function isChoice(type: FeedbackQuestionType): boolean {
  return type === "single" || type === "multi";
}

/**
 * Create or edit one feedback question (specs/038-camp-feedback, US2). When the
 * question already has answers, type and key stay fixed and existing options
 * cannot be removed; the server enforces the same rule.
 */
export function FeedbackQuestionDialog({
  open,
  onClose,
  onSaved,
  campId,
  question,
  answered,
  takenKeys,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
  campId: string;
  question: FeedbackQuestion | null;
  answered: boolean;
  takenKeys: string[];
}) {
  const [label, setLabel] = useState(question?.label ?? "");
  const [type, setType] = useState<FeedbackQuestionType>(question?.type ?? "rating");
  const [required, setRequired] = useState(question?.required ?? false);
  const [options, setOptions] = useState<string[]>(question?.options.length ? question.options : ["", ""]);
  const [key, setKey] = useState(question?.key ?? "");
  const [keyTouched, setKeyTouched] = useState(question !== null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const locked = question !== null && answered;
  const fixedOptions = locked ? question.options : [];
  const otherKeys = takenKeys.filter((taken) => taken !== question?.key);

  function changeLabel(value: string) {
    setLabel(value);
    if (!keyTouched) setKey(suggestKey(value, otherKeys));
  }

  function setOption(index: number, value: string) {
    setOptions((current) => current.map((option, i) => (i === index ? value : option)));
  }

  function save() {
    setErrors({});
    setFormError(null);
    const input = { label, type, required, key: key.trim() || suggestKey(label, otherKeys), options };
    startSaving(async () => {
      const result = question ? await updateFeedbackQuestion(question.id, input) : await createFeedbackQuestion(campId, input);
      if (result.ok) {
        onSaved(de.feedback.questions.saved);
        onClose();
        return;
      }
      if (result.fieldErrors) setErrors(result.fieldErrors);
      else setFormError(result.error);
    });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={question ? t.editTitle : t.createTitle}
      closeLabel={t.cancel}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {t.save}
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        {locked && <p className="rounded-input bg-ink-50 px-3 py-2 text-sm text-muted-foreground">{t.lockedHint}</p>}

        <Field label={t.label} htmlFor="feedback-label" error={errors.label}>
          <Input
            id="feedback-label"
            value={label}
            maxLength={FEEDBACK_LABEL_MAX}
            onChange={(event) => changeLabel(event.target.value)}
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label={t.type} htmlFor="feedback-type" error={errors.type}>
            <Select
              id="feedback-type"
              value={type}
              disabled={locked}
              onChange={(event) => setType(event.target.value as FeedbackQuestionType)}
              options={FEEDBACK_QUESTION_TYPES.map((value) => ({ value, label: de.feedback.types[value] }))}
            />
          </Field>
          <div className="flex items-end pb-2">
            <Switch id="feedback-required" checked={required} onCheckedChange={setRequired} label={t.required} />
          </div>
        </div>

        {isChoice(type) && (
          <Field label={t.options} error={errors.options}>
            <div className="flex flex-col gap-2">
              {options.map((option, index) => {
                const fixed = fixedOptions.includes(option) && index < fixedOptions.length;
                return (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      aria-label={`${t.optionPlaceholder} ${index + 1}`}
                      placeholder={t.optionPlaceholder}
                      value={option}
                      maxLength={FEEDBACK_OPTION_MAX}
                      disabled={fixed}
                      onChange={(event) => setOption(index, event.target.value)}
                    />
                    {!fixed && options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={t.removeOption}
                        onClick={() => setOptions((current) => current.filter((_, i) => i !== index))}
                      >
                        <X size={16} weight="bold" />
                      </Button>
                    )}
                  </div>
                );
              })}
              {options.length < FEEDBACK_OPTIONS_MAX && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => setOptions((current) => [...current, ""])}
                >
                  <Plus size={16} weight="bold" />
                  {t.addOption}
                </Button>
              )}
            </div>
          </Field>
        )}

        <Field label={t.key} htmlFor="feedback-key" hint={t.keyHint} error={errors.key}>
          <Input
            id="feedback-key"
            value={key}
            maxLength={FEEDBACK_KEY_MAX}
            disabled={locked}
            className="font-mono"
            onChange={(event) => {
              setKeyTouched(true);
              setKey(event.target.value);
            }}
          />
        </Field>

        {formError && <p className="text-sm text-danger">{formError}</p>}
      </form>
    </Dialog>
  );
}
