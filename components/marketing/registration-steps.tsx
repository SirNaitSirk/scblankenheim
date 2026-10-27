"use client";

import { motion, useReducedMotion } from "motion/react";
import { PencilSimple } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { registerMessages } from "@/lib/register/messages";
import type { FormStep } from "@/lib/register/steps";
import type { FieldValue } from "@/lib/register/validation";

const copy = registerMessages.steps;

/** Shared motion timing for the stepped form (research R4). */
export const STEP_EASE = [0.22, 1, 0.36, 1] as const;
export const STEP_DURATION = 0.32;

/**
 * Progress header. Wide screens show one labelled segment per station; phones
 * show "Schritt n von m" with a single bar. The text is the accessible label,
 * the segments are decoration.
 */
export function StepProgress({
  titles,
  current,
}: {
  /** Step titles including the review as the last station. */
  titles: string[];
  current: number;
}) {
  const reduceMotion = useReducedMotion();
  const total = titles.length;
  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: STEP_DURATION, ease: STEP_EASE };

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-medium text-accent-strong">
        {copy.progress(current + 1, total)}
      </span>

      {/* Phone: one continuous bar. */}
      <div aria-hidden className="h-1 overflow-hidden rounded-pill bg-ink-100 sm:hidden">
        <motion.div
          className="h-full origin-left rounded-pill bg-accent"
          initial={false}
          animate={{ scaleX: (current + 1) / total }}
          transition={transition}
        />
      </div>

      {/* Wide: one segment per station with its title. */}
      <ol aria-hidden className="hidden gap-2 sm:flex">
        {titles.map((title, index) => (
          <li key={`${index}-${title}`} className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="h-1 overflow-hidden rounded-pill bg-ink-100">
              <motion.div
                className="h-full origin-left rounded-pill bg-accent"
                initial={false}
                animate={{ scaleX: index <= current ? 1 : 0 }}
                transition={transition}
              />
            </div>
            <span
              className={cn(
                "truncate text-xs transition-colors duration-200",
                index === current
                  ? "font-semibold text-foreground"
                  : index < current
                    ? "text-muted-foreground"
                    : "text-ink-300",
              )}
            >
              {title}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

const DATE_FORMAT = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatValue(fieldType: string, value: FieldValue | undefined): string {
  if (fieldType === "checkbox") return value === true ? copy.yes : copy.no;
  const text = typeof value === "string" ? value.trim() : "";
  if (text === "") return copy.empty;
  if (fieldType === "date") {
    const date = new Date(`${text}T00:00:00`);
    return Number.isNaN(date.getTime()) ? text : DATE_FORMAT.format(date);
  }
  return text;
}

/** Compact read back of every answer, grouped like the steps. */
export function ReviewList({
  steps,
  values,
  onEdit,
}: {
  steps: FormStep[];
  values: Record<string, FieldValue>;
  onEdit: (stepIndex: number) => void;
}) {
  return (
    <div className="flex flex-col divide-y divide-border rounded-input border border-border">
      {steps.map((step, index) => (
        <section key={step.id} className="flex flex-col gap-3 px-4 py-4 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-foreground">{step.title}</h4>
            <button
              type="button"
              onClick={() => onEdit(index)}
              aria-label={copy.editStep(step.title)}
              className="inline-flex h-8 items-center gap-1.5 rounded-pill px-3 text-xs font-medium text-accent-strong transition-colors duration-150 hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <PencilSimple size={14} weight="bold" aria-hidden />
              {copy.edit}
            </button>
          </div>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            {step.fields.map((field) => {
              const shown = formatValue(field.fieldType, values[field.key]);
              return (
                <div key={field.key} className="contents">
                  <dt className="text-muted-foreground">
                    {field.label || registerMessages.fields.checkboxFallback}
                  </dt>
                  <dd
                    className={cn(
                      "mb-1 break-words sm:mb-0",
                      shown === copy.empty ? "text-ink-300" : "text-foreground",
                    )}
                  >
                    {shown}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      ))}
    </div>
  );
}
