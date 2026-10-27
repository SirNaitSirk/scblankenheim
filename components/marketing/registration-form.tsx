"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ReviewList,
  STEP_DURATION,
  STEP_EASE,
  StepProgress,
} from "@/components/marketing/registration-steps";
import { cn } from "@/lib/cn";
import { registerMessages } from "@/lib/register/messages";
import { buildSteps, stepIndexOf, type FormStep } from "@/lib/register/steps";
import { validateField, type FieldValue } from "@/lib/register/validation";
import type { CampFormField } from "@/lib/admin/types";
import type { FieldAvailability } from "@/lib/marketing/availability";

const copy = registerMessages;

/** Reads the field's config extras defensively (config is `Record<string, unknown>`). */
function readString(config: Record<string, unknown>, key: string): string | undefined {
  const value = config[key];
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function readOptions(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
}

// Maps a field type to the native <input> type. Other types are handled separately.
function inputTypeFor(fieldType: string): string {
  switch (fieldType) {
    case "email":
      return "email";
    case "tel":
      return "tel";
    case "number":
      return "number";
    case "date":
      return "date";
    default:
      return "text";
  }
}

function initialValue(field: CampFormField): FieldValue {
  return field.fieldType === "checkbox" ? false : "";
}

function emptyValues(fields: CampFormField[]): Record<string, FieldValue> {
  return Object.fromEntries(fields.map((f) => [f.key, initialValue(f)]));
}

/** Per key messages for the given fields; empty when all are valid. */
function validateStep(
  fields: CampFormField[],
  values: Record<string, FieldValue>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const message = validateField(field, values[field.key]);
    if (message) errors[field.key] = message;
  }
  return errors;
}

/** Lowest step holding one of the keys, with the first such key in form order. */
function firstErrorTarget(
  steps: FormStep[],
  keys: string[],
): { index: number; key: string } | null {
  for (let index = 0; index < steps.length; index++) {
    const field = steps[index].fields.find((f) => keys.includes(f.key));
    if (field) return { index, key: field.key };
  }
  const known = keys.find((key) => stepIndexOf(steps, key) >= 0);
  return known ? { index: stepIndexOf(steps, known), key: known } : null;
}

/** Tracks the rendered height of an element so its wrapper can ease to it. */
function useMeasuredHeight<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setHeight(entry.borderBoxSize?.[0]?.blockSize ?? node.offsetHeight);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, height] as const;
}

export function RegistrationForm({
  fields,
  availability = {},
  invitationToken,
}: {
  fields: CampFormField[];
  availability?: Record<string, FieldAvailability>;
  /** Already validated on the server; kept across "Noch jemanden anmelden". */
  invitationToken?: string;
}) {
  const steps = useMemo(() => buildSteps(fields), [fields]);
  const allFields = useMemo(() => steps.flatMap((step) => step.fields), [steps]);
  const reviewIndex = steps.length;
  const titles = useMemo(
    () => [...steps.map((step) => step.title), copy.steps.reviewTitle],
    [steps],
  );

  const [values, setValues] = useState<Record<string, FieldValue>>(() =>
    emptyValues(allFields),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reference, setReference] = useState<string | null>(null);
  const [free, setFree] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [returnToReview, setReturnToReview] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const reduceMotion = useReducedMotion();
  const formRef = useRef<HTMLFormElement>(null);
  const navigated = useRef(false);
  const focusKey = useRef<string | null>(null);
  const [bodyRef, bodyHeight] = useMeasuredHeight<HTMLDivElement>();

  const isReview = stepIndex === reviewIndex;
  const step = isReview ? null : steps[stepIndex];

  // After a step change: keep the card in view, then focus the first invalid
  // field (when one was requested) or the step heading (research R5).
  useEffect(() => {
    if (!navigated.current) return;
    const form = formRef.current;
    if (form && form.getBoundingClientRect().top < 0) {
      form.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
    }
    const key = focusKey.current;
    focusKey.current = null;
    // The leaving step is still mounted during its exit, so target the new one.
    const target = key
      ? document.getElementById(`reg-${key}`)
      : form?.querySelector<HTMLElement>(`[data-step="${stepIndex}"] h3`);
    target?.focus({ preventScroll: true });
  }, [stepIndex, reduceMotion]);

  function goTo(index: number, nextDirection: 1 | -1, fieldKey?: string) {
    navigated.current = true;
    focusKey.current = fieldKey ?? null;
    setDirection(nextDirection);
    setStepIndex(index);
    setAnnouncement(copy.steps.announce(index + 1, titles.length, titles[index]));
  }

  function focusField(key: string) {
    document.getElementById(`reg-${key}`)?.focus();
  }

  function resetForm() {
    setValues(emptyValues(allFields));
    setErrors({});
    setServerError(null);
    setReference(null);
    setFree(false);
    setRedirecting(false);
    navigated.current = false;
    setStepIndex(0);
    setDirection(1);
    setReturnToReview(false);
    setAnnouncement("");
  }

  function setValue(key: string, value: FieldValue) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setServerError(null);
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function goBack() {
    setReturnToReview(false);
    setServerError(null);
    goTo(stepIndex - 1, -1);
  }

  function editStep(index: number) {
    setReturnToReview(true);
    setServerError(null);
    goTo(index, -1);
  }

  // Next on a question step: validate only this step, then move on.
  function advance(current: FormStep) {
    const stepErrors = validateStep(current.fields, values);
    const invalid = current.fields.find((f) => stepErrors[f.key]);
    if (invalid) {
      setErrors((prev) => ({ ...prev, ...stepErrors }));
      focusField(invalid.key);
      return;
    }
    if (returnToReview) {
      setReturnToReview(false);
      goTo(reviewIndex, 1);
    } else {
      goTo(stepIndex + 1, 1);
    }
  }

  async function submit() {
    const allErrors = validateStep(allFields, values);
    const target = firstErrorTarget(steps, Object.keys(allErrors));
    if (target) {
      setErrors(allErrors);
      goTo(target.index, -1, target.key);
      return;
    }

    setSubmitting(true);
    setServerError(null);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          invitationToken ? { values, priceTierToken: invitationToken } : { values },
        ),
      });
      const data = (await response.json().catch(() => ({}))) as {
        reference?: string;
        free?: boolean;
        checkoutUrl?: string | null;
        error?: string;
        fieldErrors?: Record<string, string>;
      };

      if (response.ok && data.reference) {
        // Straight on to Stripe; without a URL (free, or Stripe unavailable)
        // the success notice offers paying later (constitution VI).
        if (data.checkoutUrl) {
          setRedirecting(true);
          window.location.assign(data.checkoutUrl);
        }
        setFree(data.free === true);
        setReference(data.reference);
        return;
      }
      setServerError(data.error ?? copy.api.generic);
      // Field errors send the person to the step that holds the field (FR-008).
      if (data.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
        setErrors(data.fieldErrors);
        const fieldTarget = firstErrorTarget(steps, Object.keys(data.fieldErrors));
        if (fieldTarget) {
          setReturnToReview(true);
          goTo(fieldTarget.index, -1, fieldTarget.key);
        }
      }
    } catch {
      setServerError(copy.api.generic);
    } finally {
      setSubmitting(false);
    }
  }

  // One <form>: Enter in a single line input runs Next, only the review sends.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (step) advance(step);
    else void submit();
  }

  if (reference && redirecting) {
    return (
      <Notice
        tone="muted"
        title={copy.form.redirectingTitle}
        body={copy.form.redirectingBody}
      />
    );
  }

  if (reference) {
    return (
      <Notice
        tone="success"
        title={copy.form.successTitle}
        body={free ? copy.form.successFree(reference) : copy.form.successBody(reference)}
      >
        {!free && (
          <ButtonLink
            href={`/bezahlen?ref=${encodeURIComponent(reference)}`}
            size="lg"
            className="mt-6 mr-3"
          >
            {copy.form.payNow}
          </ButtonLink>
        )}
        <Button
          type="button"
          size="lg"
          variant="outline"
          onClick={resetForm}
          className="mt-6"
        >
          {copy.form.registerAnother}
        </Button>
      </Notice>
    );
  }

  const slide = reduceMotion ? 0 : 24;
  const variants = {
    enter: (d: 1 | -1) => ({ opacity: 0, x: slide * d }),
    center: { opacity: 1, x: 0 },
    exit: (d: 1 | -1) => ({ opacity: 0, x: -slide * d }),
  };
  const transition = reduceMotion
    ? { duration: 0.15, ease: "easeOut" as const }
    : { duration: STEP_DURATION, ease: STEP_EASE };

  const primaryLabel = isReview
    ? submitting
      ? copy.form.submitting
      : copy.steps.submit
    : returnToReview
      ? copy.steps.backToReview
      : copy.steps.next;

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={handleSubmit}
      className="scroll-mt-24 rounded-card border border-border bg-surface p-6 shadow-card sm:p-8"
    >
      <StepProgress titles={titles} current={stepIndex} />

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <motion.div
        initial={false}
        animate={{ height: bodyHeight ?? "auto" }}
        transition={reduceMotion ? { duration: 0 } : transition}
        className="-mx-1 overflow-hidden px-1"
      >
        <div ref={bodyRef} className="relative pt-7">
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.div
              key={stepIndex}
              data-step={stepIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="pb-1"
            >
              <h3
                tabIndex={-1}
                className="font-display text-2xl font-extrabold tracking-tight text-foreground outline-none"
              >
                {step ? step.title : copy.steps.reviewTitle}
              </h3>
              {(step ? step.subtitle : copy.steps.reviewIntro) && (
                <p className="mt-1.5 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
                  {step ? step.subtitle : copy.steps.reviewIntro}
                </p>
              )}

              {step && stepIndex === 0 && invitationToken && (
                <p className="mt-5 rounded-input border border-border bg-sand-50 px-4 py-3 text-sm text-muted-foreground">
                  {copy.invitationHint}
                </p>
              )}

              <div className="mt-6">
                {step ? (
                  <div className="flex flex-col gap-5">
                    {step.fields.map((field) => (
                      <FormField
                        key={field.id}
                        field={field}
                        value={values[field.key]}
                        error={errors[field.key]}
                        availability={availability[field.key]}
                        onChange={(value) => setValue(field.key, value)}
                      />
                    ))}
                  </div>
                ) : (
                  <ReviewList steps={steps} values={values} onEdit={editStep} />
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {serverError && (
        <p
          role="alert"
          className="mt-6 rounded-input border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger"
        >
          {serverError}
        </p>
      )}

      <div
        className={cn(
          "mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center",
          stepIndex > 0 ? "sm:justify-between" : "sm:justify-end",
        )}
      >
        {stepIndex > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={goBack}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            <ArrowLeft size={18} weight="bold" aria-hidden />
            {copy.steps.back}
          </Button>
        )}
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="w-full sm:w-auto"
        >
          {primaryLabel}
          {!isReview && <ArrowRight size={18} weight="bold" aria-hidden />}
        </Button>
      </div>
    </form>
  );
}

function FormField({
  field,
  value,
  error,
  availability,
  onChange,
}: {
  field: CampFormField;
  value: FieldValue;
  error?: string;
  availability?: FieldAvailability;
  onChange: (value: FieldValue) => void;
}) {
  const id = `reg-${field.key}`;
  const errorId = error ? `${id}-error` : undefined;
  const placeholder = readString(field.config, "placeholder");
  const helpText = readString(field.config, "helpText");
  const required = field.required;

  if (field.fieldType === "checkbox") {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="flex items-start gap-2.5 text-sm text-foreground">
          <input
            id={id}
            type="checkbox"
            checked={value === true}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            onChange={(e) => onChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded-sm border-ink-200 accent-accent"
          />
          <span>
            {field.label || copy.fields.checkboxFallback}
            {required && <span className="text-danger"> *</span>}
          </span>
        </label>
        {helpText && !error && (
          <span className="pl-[26px] text-xs text-muted-foreground">
            {helpText}
          </span>
        )}
        {error && (
          <span id={errorId} className="pl-[26px] text-xs text-danger">
            {error}
          </span>
        )}
      </div>
    );
  }

  const label = required ? `${field.label} *` : field.label;
  const stringValue = typeof value === "string" ? value : "";

  return (
    <Field label={label} htmlFor={id} hint={helpText} error={error}>
      {field.fieldType === "textarea" ? (
        <Textarea
          id={id}
          value={stringValue}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          onChange={(e) => onChange(e.target.value)}
          className={cn(error && "border-danger focus-visible:border-danger")}
        />
      ) : field.fieldType === "select" ? (
        <>
          <Select
            id={id}
            value={stringValue}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            onChange={(e) => onChange(e.target.value)}
            className={cn(error && "border-danger focus-visible:border-danger")}
            options={[
              { value: "", label: placeholder ?? copy.fields.selectPlaceholder },
              ...readOptions(field.options).map((opt) => {
                const soldOut =
                  availability?.option === opt && availability.remaining <= 0;
                return {
                  value: opt,
                  label: soldOut ? copy.seats.soldOutOption(opt) : opt,
                  disabled: soldOut,
                };
              }),
            ]}
          />
          {availability && <SeatNote availability={availability} />}
        </>
      ) : (
        <Input
          id={id}
          type={inputTypeFor(field.fieldType)}
          value={stringValue}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          onChange={(e) => onChange(e.target.value)}
          className={cn(error && "border-danger focus-visible:border-danger")}
        />
      )}
    </Field>
  );
}

/** Small live seat indicator under a select with a seat limit. */
function SeatNote({ availability }: { availability: FieldAvailability }) {
  const { option, limit, remaining } = availability;
  const soldOut = remaining <= 0;
  return (
    <span
      className={cn(
        "mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium",
        soldOut ? "text-danger" : "text-accent-strong",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          soldOut ? "bg-danger" : "bg-accent",
        )}
      />
      {soldOut ? copy.seats.soldOut(option) : copy.seats.left(remaining, limit, option)}
    </span>
  );
}

function Notice({
  tone,
  title,
  body,
  children,
}: {
  tone: "success" | "muted";
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-card border bg-surface p-8 text-center shadow-card",
        tone === "success" ? "border-accent/40" : "border-border",
      )}
    >
      <p
        className={cn(
          "font-display text-2xl font-extrabold tracking-tight",
          tone === "success" ? "text-accent-strong" : "text-foreground",
        )}
      >
        {title}
      </p>
      <p className="mx-auto mt-3 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
      {children}
    </div>
  );
}
