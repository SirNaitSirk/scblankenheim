"use client";

import { CheckCircle, FilePdf, LockSimple, PencilSimple } from "@phosphor-icons/react";
import { useState, useTransition, type FormEvent } from "react";
import type { SchoolReleaseState } from "@/app/meine-anmeldung/[token]/actions";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import type { ParticipantRelease } from "@/lib/participant/view";
import {
  ADDRESS_MAX,
  CLASS_NAME_MAX,
  RELEASE_ANCHOR,
  SCHOOL_NAME_MAX,
  TEACHER_NAME_MAX,
} from "@/lib/school-release/limits";
import { releaseMessages } from "@/lib/school-release/messages";

const copy = releaseMessages.card;

// 16px on phones keeps iOS Safari from zooming into the field on focus.
const touchText = "text-base sm:text-sm";

/**
 * "Schulbefreiung" on the participant page (specs/020-school-release, US1,
 * plan "UI"): the person enters teacher and school, gets the letter as PDF
 * right away and by mail. Saved data show as a short summary with the
 * download; „Angaben ändern“ opens the form again.
 */
export function SchoolReleaseForm({
  action,
  release,
  pdfHref,
  payHref,
}: {
  action: (previous: SchoolReleaseState, formData: FormData) => Promise<SchoolReleaseState>;
  release: ParticipantRelease;
  pdfHref: string;
  /** Pay link while something is open; null while a payment is processing. */
  payHref: string | null;
}) {
  const [editing, setEditing] = useState(release.data === null);
  const [state, setState] = useState<SchoolReleaseState>({ status: "idle" });
  const [pending, startTransition] = useTransition();
  const data = release.data;

  // Submitted by hand so a rejected form keeps what the person typed.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await action(state, formData);
      setState(result);
      if (result.status === "saved") setEditing(false);
    });
  };

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <section
      id={RELEASE_ANCHOR}
      aria-labelledby="release-heading"
      className="scroll-mt-6 rounded-card border border-border bg-surface p-6 shadow-card sm:p-8"
    >
      <h2 id="release-heading" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {copy.heading}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-foreground">{copy.intro(release.dates)}</p>

      {release.locked ? (
        <div className="mt-5 flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-input border border-border bg-canvas px-4 py-3">
            <LockSimple size={20} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0 text-sm leading-relaxed">
              <p className="font-medium text-foreground">{copy.lockedTitle}</p>
              <p className="text-muted-foreground">{copy.locked}</p>
            </div>
          </div>
          {payHref && (
            <ButtonLink href={payHref} size="lg" className="w-full sm:w-auto sm:self-start">
              {copy.pay}
            </ButtonLink>
          )}
        </div>
      ) : !editing && data ? (
        <div className="mt-5 flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-input border border-accent/30 bg-accent/5 px-4 py-3">
            <CheckCircle size={22} weight="fill" className="mt-0.5 shrink-0 text-accent" aria-hidden />
            <div className="min-w-0 text-sm leading-relaxed">
              <p className="font-medium text-foreground">{copy.saved}</p>
              <p className="break-words text-muted-foreground">{copy.savedFor(data.schoolName, data.teacherName)}</p>
              {state.status === "saved" && (
                <p aria-live="polite" className="mt-1 text-muted-foreground">
                  {state.mail === "queued" ? copy.mailQueued : copy.mailSkipped}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <ButtonLink href={pdfHref} size="lg" className="w-full sm:w-auto" download>
              <FilePdf size={18} weight="bold" aria-hidden />
              {copy.download}
            </ButtonLink>
            <Button
              type="button"
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={() => {
                setState({ status: "idle" });
                setEditing(true);
              }}
            >
              <PencilSimple size={16} aria-hidden />
              {copy.edit}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="mt-5 flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.steps}</p>

          <div className="rounded-input border border-border bg-canvas px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">{copy.name}</p>
            <p className="mt-1 text-sm text-foreground">{release.participantName}</p>
          </div>

          <Field
            label={copy.participantAddress}
            htmlFor="release-participant-address"
            hint={copy.participantAddressHint}
            error={errors.participantAddress}
          >
            <Textarea
              id="release-participant-address"
              name="participantAddress"
              rows={2}
              required
              maxLength={ADDRESS_MAX}
              autoComplete="street-address"
              defaultValue={data?.participantAddress ?? release.prefillAddress}
              aria-invalid={Boolean(errors.participantAddress)}
              className={cn("min-h-16", touchText)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
            <Field
              label={copy.teacherName}
              htmlFor="release-teacher"
              hint={copy.teacherNameHint}
              error={errors.teacherName}
            >
              <Input
                id="release-teacher"
                name="teacherName"
                required
                maxLength={TEACHER_NAME_MAX}
                defaultValue={data?.teacherName ?? ""}
                aria-invalid={Boolean(errors.teacherName)}
                className={touchText}
              />
            </Field>
            <Field label={`${copy.className} (${copy.optional})`} htmlFor="release-class" error={errors.className}>
              <Input
                id="release-class"
                name="className"
                maxLength={CLASS_NAME_MAX}
                defaultValue={data?.className ?? ""}
                aria-invalid={Boolean(errors.className)}
                className={touchText}
              />
            </Field>
          </div>

          <Field label={copy.schoolName} htmlFor="release-school" error={errors.schoolName}>
            <Input
              id="release-school"
              name="schoolName"
              required
              maxLength={SCHOOL_NAME_MAX}
              defaultValue={data?.schoolName ?? ""}
              aria-invalid={Boolean(errors.schoolName)}
              className={touchText}
            />
          </Field>

          <Field
            label={copy.schoolAddress}
            htmlFor="release-school-address"
            hint={copy.schoolAddressHint}
            error={errors.schoolAddress}
          >
            <Textarea
              id="release-school-address"
              name="schoolAddress"
              rows={2}
              required
              maxLength={ADDRESS_MAX}
              defaultValue={data?.schoolAddress ?? ""}
              aria-invalid={Boolean(errors.schoolAddress)}
              className={cn("min-h-16", touchText)}
            />
          </Field>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
              {pending ? copy.submitting : data ? copy.update : copy.submit}
            </Button>
            {data && (
              <Button
                type="button"
                variant="ghost"
                className="w-full sm:w-auto"
                disabled={pending}
                onClick={() => {
                  setState({ status: "idle" });
                  setEditing(false);
                }}
              >
                {copy.cancel}
              </Button>
            )}
            {state.status === "error" && (
              <p aria-live="polite" className="text-sm text-danger">
                {state.error}
              </p>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
