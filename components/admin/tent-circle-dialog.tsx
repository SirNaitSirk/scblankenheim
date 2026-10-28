"use client";

import { Check, MagnifyingGlass } from "@phosphor-icons/react";
import { useMemo, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { GENDER_LABELS, de } from "@/lib/admin/messages";
import { MAX_NAME_LENGTH, compareByName, fullName } from "@/lib/admin/room-planning";
import { KINDS, fitsCircle } from "@/lib/admin/tent-circles";
import type { ActionResult, CirclePerson, TentCircle, TentCircleKind } from "@/lib/admin/types";
import { toneFor } from "./room-styles";

const t = de.tentCircles;

export type TentCircleFormValues = { name: string; kind: TentCircleKind; leaderId: string };

/**
 * Create or edit a tent circle: name, kind and leader. The leader list only
 * offers active people of the camp who fit the kind and lead no other circle;
 * people who take part somewhere say where (they move out when saved). Rules
 * are checked again on the server.
 */
export function TentCircleDialog({
  circle,
  circles,
  people,
  ageOf,
  onClose,
  onSubmit,
  onSaved,
}: {
  /** null creates a new circle. */
  circle: TentCircle | null;
  circles: TentCircle[];
  people: CirclePerson[];
  ageOf: (person: CirclePerson) => number | null;
  onClose: () => void;
  onSubmit: (values: TentCircleFormValues) => Promise<ActionResult>;
  onSaved: (result: ActionResult, values: TentCircleFormValues) => void;
}) {
  const [values, setValues] = useState<TentCircleFormValues>({
    name: circle?.name ?? "",
    kind: circle?.kind ?? "mixed",
    leaderId: circle?.leaderId ?? "",
  });
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const circleName = useMemo(() => new Map(circles.map((c) => [c.id, c.name])), [circles]);

  const candidates = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return people
      .filter((p) => !p.leads || p.leads === circle?.id)
      .filter((p) => fitsCircle(values.kind, p.gender))
      .filter((p) => !needle || fullName(p).toLowerCase().includes(needle))
      .sort(compareByName);
  }, [people, circle?.id, values.kind, search]);

  const selected = people.find((p) => p.id === values.leaderId) ?? null;
  // A leader who no longer fits a changed kind is shown as an error, not silently dropped.
  const selectedFits = selected ? fitsCircle(values.kind, selected.gender) : true;

  function submit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await onSubmit(values);
      if (result.ok) {
        onSaved(result, values);
        return;
      }
      setErrors(result.fieldErrors ?? {});
      setFormError(result.fieldErrors ? null : result.error);
    });
  }

  const formId = "tent-circle-form";
  const leaderError = errors.leaderId ?? (!selectedFits ? t.errors.leaderMismatch : undefined);

  return (
    <Dialog
      open
      onClose={onClose}
      title={circle ? t.dialog.edit : t.dialog.create}
      closeLabel={t.dialog.cancel}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t.dialog.cancel}
          </Button>
          <Button type="submit" form={formId} disabled={pending || !selectedFits}>
            {t.dialog.save}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-5" noValidate>
        {formError && (
          <p className="rounded-input border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        )}

        <Field label={t.dialog.name} htmlFor={`${formId}-name`} error={errors.name}>
          <Input
            id={`${formId}-name`}
            value={values.name}
            maxLength={MAX_NAME_LENGTH}
            placeholder={t.dialog.namePlaceholder}
            aria-invalid={errors.name ? true : undefined}
            onChange={(e) => {
              setValues((v) => ({ ...v, name: e.target.value }));
              setErrors((current) => ({ ...current, name: "" }));
            }}
            className={cn(errors.name && "border-danger focus-visible:border-danger")}
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <span id={`${formId}-kind`} className="text-sm font-medium text-foreground">
            {t.dialog.kind}
          </span>
          <div
            role="radiogroup"
            aria-labelledby={`${formId}-kind`}
            className="grid grid-cols-3 gap-1 rounded-input bg-ink-50 p-1"
          >
            {KINDS.map((kind) => {
              const checked = values.kind === kind;
              const tone = toneFor(kind === "mixed" ? null : kind);
              return (
                <button
                  key={kind}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => {
                    setValues((v) => ({ ...v, kind }));
                    setErrors((e) => ({ ...e, kind: "" }));
                  }}
                  className={cn(
                    "inline-flex h-9 items-center justify-center gap-1.5 rounded-sm text-xs font-semibold transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    checked ? "bg-surface text-foreground shadow-card" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", tone.dot)} />
                  {t.kinds[kind]}
                </button>
              );
            })}
          </div>
          {errors.kind && <p className="text-sm text-danger">{errors.kind}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <span id={`${formId}-leader`} className="text-sm font-medium text-foreground">
              {t.dialog.leader}
            </span>
            {selected && (
              <span className="truncate text-xs font-semibold text-foreground">{fullName(selected)}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{t.dialog.leaderHint}</p>
          <div className="relative">
            <MagnifyingGlass
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.dialog.leaderSearch}
              aria-label={t.dialog.leaderSearch}
              className="h-9 pl-9"
            />
          </div>
          <ul
            role="radiogroup"
            aria-labelledby={`${formId}-leader`}
            className="flex max-h-60 flex-col gap-1 overflow-y-auto overscroll-contain rounded-input border border-border p-1"
          >
            {candidates.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-muted-foreground">{t.dialog.leaderNone}</li>
            ) : (
              candidates.map((person) => {
                const checked = person.id === values.leaderId;
                const age = ageOf(person);
                const note =
                  person.leads === circle?.id && person.leads
                    ? t.dialog.leaderCurrent
                    : person.circleId
                      ? t.dialog.leaderIsMember(circleName.get(person.circleId) ?? "")
                      : null;
                return (
                  <li key={person.id}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      onClick={() => {
                        setValues((v) => ({ ...v, leaderId: person.id }));
                        setErrors((e) => ({ ...e, leaderId: "" }));
                      }}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-sm transition-colors duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        checked ? "bg-accent/15" : "hover:bg-ink-50",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn("h-2 w-2 shrink-0 rounded-full", toneFor(person.gender).dot)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-foreground">{fullName(person)}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {[
                            person.gender ? GENDER_LABELS[person.gender] : de.rooms.panel.missing,
                            age != null ? de.rooms.person.age(String(age)) : null,
                            note,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      {checked && <Check size={16} weight="bold" className="shrink-0 text-accent-strong" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          {leaderError && <p className="text-sm text-danger">{leaderError}</p>}
        </div>
      </form>
    </Dialog>
  );
}
