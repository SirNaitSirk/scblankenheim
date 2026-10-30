"use client";

import { EnvelopeSimple, FilePdf, PencilSimpleLine } from "@phosphor-icons/react";
import { useCallback, useEffect, useState, useTransition, type KeyboardEvent } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { de } from "@/lib/admin/messages";
import type { ActionResult } from "@/lib/admin/types";
import { formatDateTimeBerlin } from "@/lib/format";
import {
  ADDRESS_MAX,
  CLASS_NAME_MAX,
  SCHOOL_NAME_MAX,
  TEACHER_NAME_MAX,
} from "@/lib/school-release/limits";
import type { AdminSchoolRelease, AdminSchoolReleaseResult } from "@/lib/school-release/types";

const t = de.schoolRelease.panel;

const RELEASE_FIELDS = ["teacherName", "schoolName", "schoolAddress", "participantAddress", "className"] as const;

type State =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; release: AdminSchoolRelease };

/**
 * Section „Schulbefreiung“ in the registration dialog (specs/020-school-release,
 * US4): read view with the last change, edit form, PDF download and sending
 * the letter by mail. Hidden while the release is off and nothing is saved.
 */
export function SchoolReleasePanel({
  reference,
  load,
  save,
  send,
  onMailSent,
}: {
  reference: string;
  load: (reference: string) => Promise<AdminSchoolReleaseResult>;
  save: (reference: string, input: Record<string, string>) => Promise<ActionResult>;
  send: (reference: string) => Promise<ActionResult>;
  onMailSent?: () => void;
}) {
  const [state, setState] = useState<State>({ phase: "loading" });
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const fetchRelease = useCallback(async () => {
    try {
      const result = await load(reference);
      setState(result.ok ? { phase: "ready", release: result.release } : { phase: "error", message: result.error });
    } catch {
      setState({ phase: "error", message: t.loadFailed });
    }
  }, [load, reference]);

  useEffect(() => {
    // Loading the release is a fetch on mount, not derived state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchRelease();
  }, [fetchRelease]);

  if (state.phase === "ready" && !state.release.available && !state.release.data) return null;

  // The panel sits inside the dialog form, so it reads its fields itself instead of nesting a form.
  const submit = (container: HTMLElement) => {
    const input: Record<string, string> = {};
    for (const key of RELEASE_FIELDS) {
      const field = container.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${key}"]`);
      input[key] = field?.value ?? "";
    }
    setFeedback(null);
    startTransition(async () => {
      const result = await save(reference, input);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFeedback({ tone: "error", text: result.error });
        return;
      }
      setErrors({});
      setEditing(false);
      setFeedback({ tone: "ok", text: t.saved });
      await fetchRelease();
    });
  };

  const sendMail = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await send(reference);
      setFeedback(result.ok ? { tone: "ok", text: t.sent } : { tone: "error", text: result.error });
      // A failed attempt is recorded too, so the history refreshes either way.
      onMailSent?.();
    });
  };

  return (
    <section className="flex flex-col gap-3 rounded-input border border-border bg-ink-50/60 p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.title}</h3>
        <p className="text-sm text-muted-foreground">{t.hint}</p>
      </div>

      {state.phase === "loading" && <p className="text-sm text-muted-foreground">{t.loading}</p>}
      {state.phase === "error" && <p className="text-sm text-danger">{state.message}</p>}

      {state.phase === "ready" && (
        <ReleaseBody
          release={state.release}
          reference={reference}
          editing={editing}
          errors={errors}
          pending={pending}
          onEdit={() => {
            setFeedback(null);
            setEditing(true);
          }}
          onCancel={() => {
            setErrors({});
            setEditing(false);
          }}
          onSubmit={submit}
          onSend={sendMail}
        />
      )}

      <p
        aria-live="polite"
        className={feedback?.tone === "error" ? "text-sm text-danger" : "text-sm text-muted-foreground"}
      >
        {feedback?.text ?? ""}
      </p>
    </section>
  );
}

function ReleaseBody({
  release,
  reference,
  editing,
  errors,
  pending,
  onEdit,
  onCancel,
  onSubmit,
  onSend,
}: {
  release: AdminSchoolRelease;
  reference: string;
  editing: boolean;
  errors: Record<string, string>;
  pending: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSubmit: (container: HTMLElement) => void;
  onSend: () => void;
}) {
  const { data } = release;

  if (editing && release.canEdit) {
    return (
      <div
        role="group"
        aria-label={t.title}
        className="flex flex-col gap-3"
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          // Enter in a single line field saves this section, never the whole dialog.
          if (event.key !== "Enter" || !(event.target instanceof HTMLInputElement)) return;
          event.preventDefault();
          if (!pending) onSubmit(event.currentTarget);
        }}
      >
        <div className="grid gap-3 sm:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
          <Field label={t.teacher} htmlFor="release-admin-teacher" error={errors.teacherName}>
            <Input
              id="release-admin-teacher"
              name="teacherName"
              maxLength={TEACHER_NAME_MAX}
              defaultValue={data?.teacherName ?? ""}
            />
          </Field>
          <Field label={t.className} htmlFor="release-admin-class" error={errors.className}>
            <Input
              id="release-admin-class"
              name="className"
              maxLength={CLASS_NAME_MAX}
              defaultValue={data?.className ?? ""}
            />
          </Field>
        </div>
        <Field label={t.school} htmlFor="release-admin-school" error={errors.schoolName}>
          <Input
            id="release-admin-school"
            name="schoolName"
            maxLength={SCHOOL_NAME_MAX}
            defaultValue={data?.schoolName ?? ""}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t.schoolAddress} htmlFor="release-admin-school-address" error={errors.schoolAddress}>
            <Textarea
              id="release-admin-school-address"
              name="schoolAddress"
              rows={2}
              maxLength={ADDRESS_MAX}
              defaultValue={data?.schoolAddress ?? ""}
              className="min-h-16"
            />
          </Field>
          <Field
            label={t.participantAddress}
            htmlFor="release-admin-participant-address"
            error={errors.participantAddress}
          >
            <Textarea
              id="release-admin-participant-address"
              name="participantAddress"
              rows={2}
              maxLength={ADDRESS_MAX}
              defaultValue={data?.participantAddress ?? release.prefillAddress}
              className="min-h-16"
            />
          </Field>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={(event) => {
              const container = event.currentTarget.closest<HTMLElement>("[role=group]");
              if (container) onSubmit(container);
            }}
          >
            {pending ? t.saving : t.save}
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={pending} onClick={onCancel}>
            {t.cancel}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {!release.available && <p className="text-sm text-muted-foreground">{t.off}</p>}
      {release.available && release.participantLocked && (
        <p className="text-sm text-muted-foreground">{t.participantLocked}</p>
      )}
      {release.dates && <p className="text-sm text-foreground">{t.dates(release.dates)}</p>}

      {data ? (
        <div className="flex flex-col gap-2 rounded-input border border-border bg-surface p-3">
          <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
            <Fact label={t.teacher} value={data.teacherName} />
            <Fact label={t.school} value={data.schoolName} />
            <Fact label={t.schoolAddress} value={data.schoolAddress} />
            <Fact label={t.participantAddress} value={data.participantAddress} />
            {data.className && <Fact label={t.className} value={data.className} />}
          </dl>
          {release.updatedAt && (
            <p className="text-xs text-muted-foreground">
              {release.updatedBy === "participant"
                ? t.changedByParticipant(formatDateTimeBerlin(release.updatedAt))
                : t.changedByAdmin(release.updatedByName, formatDateTimeBerlin(release.updatedAt))}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t.empty}</p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {release.canEdit && (
          <Button type="button" size="sm" variant="outline" disabled={pending} onClick={onEdit}>
            <PencilSimpleLine size={16} aria-hidden />
            {data ? t.edit : t.create}
          </Button>
        )}
        {data && (
          <ButtonLink
            href={`/api/admin/school-release/${encodeURIComponent(reference)}`}
            size="sm"
            variant="outline"
            download
          >
            <FilePdf size={16} aria-hidden />
            {t.download}
          </ButtonLink>
        )}
        {data && release.canEdit && (
          <Button type="button" size="sm" variant="outline" disabled={pending} onClick={onSend}>
            <EnvelopeSimple size={16} aria-hidden />
            {pending ? t.sending : t.send}
          </Button>
        )}
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="whitespace-pre-line break-words text-foreground">{value}</dd>
    </div>
  );
}
