"use client";

import { useRef, useState, useTransition } from "react";
import { PaymentNotice } from "@/components/payment/payment-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import { FEEDBACK_COMMENT_SUFFIX, FEEDBACK_TEXT_MAX } from "@/lib/feedback/limits";
import { feedbackMessages as copy } from "@/lib/feedback/messages";
import type { SubmitFeedbackInput, SubmitFeedbackResult } from "@/lib/feedback/submit-types";
import type { PublicFeedbackQuestion } from "@/lib/feedback/types";

type Values = Record<string, string | string[]>;
type Done = "thanks" | "unavailable";

const RATINGS = [1, 2, 3, 4, 5] as const;

const choiceClass =
  "flex min-h-11 cursor-pointer items-center gap-3 rounded-input border border-ink-200 bg-surface px-4 py-2.5 text-sm text-foreground " +
  "transition-colors duration-150 hover:border-ink-300 has-[:checked]:border-accent has-[:checked]:bg-accent/10 " +
  "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring";

function hasValue(value: string | string[] | undefined): boolean {
  return value !== undefined && (typeof value === "string" ? value.trim() !== "" : value.length > 0);
}

function Question({
  question,
  value,
  comment,
  error,
  onChange,
  onCommentChange,
}: {
  question: PublicFeedbackQuestion;
  value: string | string[] | undefined;
  comment: string;
  error: string | undefined;
  onChange: (value: string | string[]) => void;
  onCommentChange: (comment: string) => void;
}) {
  const id = `q_${question.key}`;
  const errorId = `${id}_error`;
  const legend = (
    <legend className="mb-3 flex w-full flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <span className="font-display text-lg font-bold tracking-tight text-foreground">{question.label}</span>
      <span className={cn("text-xs", question.required ? "font-medium text-accent-strong" : "text-muted-foreground")}>
        {question.required ? copy.required : copy.optional}
      </span>
    </legend>
  );
  const describedBy = error ? errorId : undefined;

  return (
    <fieldset id={id} tabIndex={-1} aria-describedby={describedBy} aria-invalid={error ? true : undefined} className="scroll-mt-24 outline-none">
      {legend}

      {question.type === "rating" && (
        <div>
          <div className="grid grid-cols-5 gap-2">
            {RATINGS.map((rating) => (
              <label
                key={rating}
                className={cn(
                  "flex h-14 cursor-pointer items-center justify-center rounded-input border border-ink-200 bg-surface font-display text-xl font-bold text-foreground",
                  "transition-colors duration-150 hover:border-ink-300 has-[:checked]:border-accent has-[:checked]:bg-accent has-[:checked]:text-accent-foreground",
                  "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                )}
              >
                <input
                  type="radio"
                  name={id}
                  value={rating}
                  checked={value === String(rating)}
                  onChange={() => onChange(String(rating))}
                  className="sr-only"
                  aria-label={copy.ratingValue(rating)}
                />
                {rating}
              </label>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground" aria-hidden>
            <span>{copy.ratingLow}</span>
            <span>{copy.ratingHigh}</span>
          </div>
        </div>
      )}

      {question.type === "single" && (
        <div className="flex flex-col gap-2">
          {question.options.map((option) => (
            <label key={option} className={choiceClass}>
              <input
                type="radio"
                name={id}
                value={option}
                checked={value === option}
                onChange={() => onChange(option)}
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              {option}
            </label>
          ))}
        </div>
      )}

      {question.type === "multi" && (
        <div className="flex flex-col gap-2">
          <p className="-mt-1 mb-1 text-xs text-muted-foreground">{copy.multiHint}</p>
          {question.options.map((option) => {
            const list = Array.isArray(value) ? value : [];
            return (
              <label key={option} className={choiceClass}>
                <input
                  type="checkbox"
                  value={option}
                  checked={list.includes(option)}
                  onChange={(event) =>
                    onChange(event.target.checked ? [...list, option] : list.filter((item) => item !== option))
                  }
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
                {option}
              </label>
            );
          })}
        </div>
      )}

      {question.type === "text" && (
        <div className="flex flex-col gap-1.5">
          <Textarea
            aria-label={question.label}
            aria-describedby={describedBy}
            value={typeof value === "string" ? value : ""}
            maxLength={FEEDBACK_TEXT_MAX}
            rows={4}
            onChange={(event) => onChange(event.target.value)}
          />
          <span className="self-end text-xs tabular-nums text-muted-foreground">
            {copy.counter(typeof value === "string" ? value.length : 0)}
          </span>
        </div>
      )}

      {question.allowComment && question.type !== "text" && hasValue(value) && (
        <div className="mt-4 flex flex-col gap-1.5">
          <label htmlFor={`${id}_comment`} className="text-sm font-medium text-foreground">
            {copy.commentLabel}
          </label>
          <Textarea
            id={`${id}_comment`}
            value={comment}
            maxLength={FEEDBACK_TEXT_MAX}
            rows={3}
            onChange={(event) => onCommentChange(event.target.value)}
          />
          <span className="self-end text-xs tabular-nums text-muted-foreground">{copy.counter(comment.length)}</span>
        </div>
      )}

      {error && (
        <p id={errorId} className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/**
 * Public feedback form (specs/038-camp-feedback, US1). The server checks
 * everything again; this component only guides and shows the outcome.
 */
export function FeedbackForm({
  initialQuestions,
  nonce,
  formToken,
  action,
}: {
  initialQuestions: PublicFeedbackQuestion[];
  nonce: string;
  formToken: string;
  action: (shownKeys: string[], input: SubmitFeedbackInput) => Promise<SubmitFeedbackResult>;
}) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [values, setValues] = useState<Values>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [sending, startSending] = useTransition();
  const trapRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function focusFirstError(keys: string[]) {
    const first = questions.find((question) => keys.includes(question.key)) ?? null;
    const target = first ? document.getElementById(`q_${first.key}`) : formRef.current;
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function localErrors(): Record<string, string> {
    const found: Record<string, string> = {};
    for (const question of questions) {
      if (question.required && !hasValue(values[question.key])) found[question.key] = copy.errors.required;
    }
    return found;
  }

  function submit() {
    setNotice(null);
    const found = localErrors();
    if (Object.keys(found).length > 0) {
      setErrors(found);
      setNotice(copy.formErrors);
      focusFirstError(Object.keys(found));
      return;
    }
    setErrors({});
    startSending(async () => {
      const result = await action(
        questions.map((question) => question.key),
        { nonce, formToken, trap: trapRef.current?.value ?? "", answers: values },
      );
      switch (result.status) {
        case "ok":
          setDone("thanks");
          window.scrollTo({ top: 0 });
          return;
        case "unavailable":
          setDone("unavailable");
          return;
        case "expired":
          setNotice(copy.expired);
          return;
        case "throttled":
          setNotice(copy.throttled);
          return;
        case "failed":
          setNotice(copy.failed);
          return;
        case "invalid": {
          if (result.questions) setQuestions(result.questions);
          const { _form: formError, ...fieldErrors } = result.errors;
          setErrors(fieldErrors);
          setNotice(result.questions ? copy.questionsChanged : (formError ?? copy.formErrors));
          focusFirstError(Object.keys(fieldErrors));
        }
      }
    });
  }

  if (done === "thanks") return <PaymentNotice tone="success" title={copy.thanks.title} body={copy.thanks.body} />;
  if (done === "unavailable") return <PaymentNotice title={copy.unavailable.title} body={copy.unavailable.body} />;

  return (
    <form
      ref={formRef}
      noValidate
      tabIndex={-1}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex flex-col gap-8 rounded-card border border-border bg-surface p-6 shadow-card outline-none sm:p-8"
    >
      <div aria-hidden className="pointer-events-none absolute -left-[9999px] top-0 h-px w-px overflow-hidden">
        <label>
          {copy.trapLabel}
          <input ref={trapRef} type="text" name="fcg_extra_note" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      {questions.map((question) => (
        <Question
          key={question.key}
          question={question}
          value={values[question.key]}
          comment={String(values[`${question.key}${FEEDBACK_COMMENT_SUFFIX}`] ?? "")}
          error={errors[question.key]}
          onCommentChange={(comment) =>
            setValues((current) => ({ ...current, [`${question.key}${FEEDBACK_COMMENT_SUFFIX}`]: comment }))
          }
          onChange={(value) => {
            setValues((current) => ({ ...current, [question.key]: value }));
            if (errors[question.key]) {
              setErrors((current) => {
                const next = { ...current };
                delete next[question.key];
                return next;
              });
            }
          }}
        />
      ))}

      <div className="flex flex-col gap-3">
        <p aria-live="polite" className={cn("text-sm", notice ? "text-danger" : "sr-only")}>
          {notice}
        </p>
        <Button type="submit" size="lg" className="w-full" disabled={sending}>
          {sending ? copy.sending : copy.submit}
        </Button>
      </div>
    </form>
  );
}
