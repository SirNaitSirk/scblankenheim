"use client";

import { ArrowLeft, Eye, FloppyDisk } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { saveCampMailInfoAction } from "@/app/admin/camps/[campId]/infomails/actions";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ARRIVAL_REQUIRED,
  TEXT_LIMITS,
  type MailTextKey,
  type CampMailInfoFormValues,
  type CampMailTextKey,
} from "@/lib/admin/camp-mail-info";
import { de } from "@/lib/admin/messages";
import { cn } from "@/lib/cn";
import { infoDueDate, type InfoMailKind } from "@/lib/email/info-mails";
import { MAIL_TEXT_LIMITS, SENDER_NAME_MAX, TIMING_BOUNDS } from "@/lib/email/limits";
import {
  DEFAULT_TIMING,
  MAIL_TIMING_KEYS,
  resolveTiming,
  type MailTiming,
  type MailTimingKey,
  type StoredMailTiming,
} from "@/lib/email/settings";
import { emailMessages } from "@/lib/email/messages";
import { formatGermanDate } from "@/lib/time/berlin";

const t = de.campMailInfo;

type FieldSpec = {
  key: CampMailTextKey;
  multiline?: boolean;
  type?: "text" | "tel" | "url";
  placeholder?: string;
  hint?: string;
  wide?: boolean;
};

type CardSpec = {
  kind: InfoMailKind;
  switchKey: "teaserEnabled" | "packingEnabled" | "arrivalEnabled" | "thanksEnabled";
  needs: "start" | "end";
  timingKey: MailTimingKey;
  fields: FieldSpec[];
};

// Text blocks in display order; contact fields share one hint about the contact sentence.
const TEXT_BLOCKS: {
  key: MailTextKey;
  placeholder: `${MailTextKey}Placeholder`;
  multiline?: boolean;
  contact?: boolean;
}[] = [
  { key: "textGreeting", placeholder: "textGreetingPlaceholder", multiline: true },
  { key: "contactName", placeholder: "contactNamePlaceholder", contact: true },
  { key: "contactPhone", placeholder: "contactPhonePlaceholder", contact: true },
  { key: "textClosing", placeholder: "textClosingPlaceholder", multiline: true },
];

const REMINDER_TIMING_KEYS = [
  "reminderFirstAfterDays",
  "reminderBeforeDueDays",
  "reminderMinGapDays",
] as const satisfies readonly MailTimingKey[];

// Live timing for the send day hints: an unparsable or empty field shows the default.
function liveTiming(values: CampMailInfoFormValues): MailTiming {
  const stored = {} as StoredMailTiming;
  for (const key of MAIL_TIMING_KEYS) {
    const raw = values[key].trim();
    stored[key] = /^\d{1,3}$/.test(raw) ? Number(raw) : null;
  }
  return resolveTiming(stored);
}

// Timeline order; each card lists the fields that feed its mail.
const CARDS: CardSpec[] = [
  {
    kind: "info_teaser",
    switchKey: "teaserEnabled",
    needs: "start",
    timingKey: "teaserDaysBefore",
    fields: [
      { key: "highlights", multiline: true, hint: t.fields.highlightsHint, wide: true },
      { key: "teamGreeting", multiline: true, wide: true },
    ],
  },
  {
    kind: "info_packing",
    switchKey: "packingEnabled",
    needs: "start",
    timingKey: "packingDaysBefore",
    fields: [],
  },
  {
    kind: "info_arrival",
    switchKey: "arrivalEnabled",
    needs: "start",
    timingKey: "arrivalDaysBefore",
    fields: [
      { key: "arrivalAddress", multiline: true, wide: true },
      { key: "arrivalTime", placeholder: t.fields.arrivalTimePlaceholder },
      { key: "pickupTime", placeholder: t.fields.pickupTimePlaceholder },
      { key: "emergencyPhone", type: "tel" },
      { key: "firstDay", multiline: true, wide: true },
      { key: "phoneRules", multiline: true, wide: true },
    ],
  },
  {
    kind: "info_thanks",
    switchKey: "thanksEnabled",
    needs: "end",
    timingKey: "thanksDaysAfter",
    fields: [
      { key: "photosUrl", type: "url", placeholder: t.fields.urlPlaceholder },
      { key: "feedbackUrl", type: "url", placeholder: t.fields.urlPlaceholder },
      { key: "nextCampNote", placeholder: t.fields.nextCampNotePlaceholder, wide: true },
    ],
  },
];

export function CampMailInfoForm({
  campId,
  campName,
  startDate,
  endDate,
  initial,
  senderDefaults,
  canWrite,
}: {
  campId: string;
  campName: string;
  startDate: string | null;
  endDate: string | null;
  initial: CampMailInfoFormValues;
  senderDefaults: { address: string | null; name: string; replyTo: string | null };
  canWrite: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<CampMailInfoFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const setText = (key: CampMailTextKey | MailTimingKey, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));
  const timing = useMemo(() => liveTiming(values), [values]);

  const save = () => {
    startTransition(async () => {
      const result = await saveCampMailInfoAction(campId, values);
      if (result.ok) {
        setErrors({});
        showToast(t.toast.saved);
        router.refresh();
      } else {
        setErrors(result.fieldErrors ?? {});
        showToast(result.error);
        // Bring the first marked field into view once the errors have rendered.
        window.requestAnimationFrame(() => {
          const invalid = document.querySelector<HTMLElement>('[aria-invalid="true"]');
          invalid?.focus();
          invalid?.scrollIntoView({ block: "center", behavior: "smooth" });
        });
      }
    });
  };

  return (
    <>
      <PageHeader
        title={t.title}
        description={t.description(campName)}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => router.push("/admin/camps")}>
              <ArrowLeft size={16} weight="bold" />
              {t.back}
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push("/admin/mail")}>
              <Eye size={16} weight="bold" />
              {t.preview}
            </Button>
          </>
        }
      />

      {!canWrite && <p className="text-sm text-muted-foreground">{t.readOnly}</p>}

      <section aria-labelledby="mail-group-all" className="flex flex-col gap-4">
        <h2 id="mail-group-all" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t.groups.all}
        </h2>

        <Card className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
              {t.sender.title}
            </h3>
            <p className="text-sm text-muted-foreground">{t.sender.intro}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {senderDefaults.address ? t.sender.fixedAddress(senderDefaults.address) : t.sender.noAddress}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label={t.sender.name} htmlFor="mail-senderName" hint={t.sender.nameHint} error={errors.senderName}>
              <Input
                id="mail-senderName"
                value={values.senderName}
                maxLength={SENDER_NAME_MAX}
                placeholder={senderDefaults.name}
                disabled={!canWrite}
                aria-invalid={errors.senderName ? true : undefined}
                onChange={(e) => setValues((current) => ({ ...current, senderName: e.target.value }))}
                className={cn(errors.senderName && "border-danger focus-visible:border-danger")}
              />
            </Field>
            <Field label={t.sender.replyTo} htmlFor="mail-replyTo" hint={t.sender.replyToHint} error={errors.replyTo}>
              <Input
                id="mail-replyTo"
                type="email"
                inputMode="email"
                value={values.replyTo}
                placeholder={senderDefaults.replyTo ?? ""}
                disabled={!canWrite}
                aria-invalid={errors.replyTo ? true : undefined}
                onChange={(e) => setValues((current) => ({ ...current, replyTo: e.target.value }))}
                className={cn(errors.replyTo && "border-danger focus-visible:border-danger")}
              />
            </Field>
          </div>
        </Card>
      </section>

      <section aria-labelledby="mail-group-payment" className="mt-4 flex flex-col gap-4">
        <h2 id="mail-group-payment" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t.groups.payment}
        </h2>

        <Card className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
              {t.texts.title}
            </h3>
            <p className="text-sm text-muted-foreground">{t.texts.intro}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {TEXT_BLOCKS.map((block) => {
              const id = `mail-${block.key}`;
              const value = values[block.key];
              const max = MAIL_TEXT_LIMITS[block.key];
              const common = {
                id,
                value,
                maxLength: max,
                placeholder: t.texts[block.placeholder],
                disabled: !canWrite,
                "aria-invalid": errors[block.key] ? true : undefined,
                className: cn(errors[block.key] && "border-danger focus-visible:border-danger"),
                onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setValues((current) => ({ ...current, [block.key]: e.target.value })),
              };
              return (
                <Field
                  key={block.key}
                  label={t.texts[block.key]}
                  htmlFor={id}
                  hint={block.contact ? undefined : t.texts.counter(value.length, max)}
                  error={errors[block.key]}
                  className={cn(block.multiline && "md:col-span-2")}
                >
                  {block.multiline ? (
                    <Textarea {...common} rows={block.key === "textClosing" ? 2 : 3} />
                  ) : (
                    <Input {...common} type={block.key === "contactPhone" ? "tel" : "text"} />
                  )}
                </Field>
              );
            })}
            <p className="text-xs text-muted-foreground md:col-span-2 md:-mt-1 md:row-start-3">
              {values.contactName.trim() || values.contactPhone.trim()
                ? t.texts.contactPreview(
                    emailMessages.contactLine(
                      values.contactName.trim() || null,
                      values.contactPhone.trim() || null,
                    ),
                  )
                : t.texts.contactHint}
            </p>
          </div>
        </Card>

        <Card className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-col gap-1">
              <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
                {t.reminders.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t.reminders.intro(timing.reminderFirstAfterDays, timing.reminderBeforeDueDays)}
              </p>
              <p className="text-sm text-muted-foreground">{t.reminders.pauseHint}</p>
            </div>
            <div className={cn("shrink-0 whitespace-nowrap", !canWrite && "pointer-events-none opacity-60")}>
              <Switch
                id="switch-reminders"
                checked={values.remindersEnabled}
                label={t.enabled}
                onCheckedChange={(checked) =>
                  setValues((current) => ({ ...current, remindersEnabled: checked }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {REMINDER_TIMING_KEYS.map((key) => (
              <TimingField
                key={key}
                timingKey={key}
                label={t.timing[key]}
                value={values[key]}
                error={errors[key]}
                disabled={!canWrite}
                onChange={(value) => setText(key, value)}
              />
            ))}
          </div>
        </Card>
      </section>

      <section aria-labelledby="mail-group-info" className="mt-4 flex flex-col gap-4 pb-24 sm:pb-0">
        <h2 id="mail-group-info" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t.groups.info}
        </h2>

        <ol className="flex flex-col gap-4">
          {CARDS.map((card) => {
            const due = infoDueDate(card.kind, startDate, endDate, timing);
            const days = timing[card.timingKey];
            const missingDate = card.needs === "start" ? !startDate : !endDate;
            const enabled = values[card.switchKey];
            return (
              <li key={card.kind}>
                <Card className="flex flex-col gap-5 p-5 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 flex-col gap-1">
                      <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
                        {t.cards[card.kind]}
                      </h3>
                      <p className="text-sm font-medium text-accent">
                        {card.needs === "start"
                          ? t.sendDay.beforeStart(days, due ? formatGermanDate(due) : null)
                          : t.sendDay.afterEnd(days, due ? formatGermanDate(due) : null)}
                      </p>
                      <p className="text-sm text-muted-foreground">{t.intro[card.kind]}</p>
                    </div>
                    <div className={cn("shrink-0 whitespace-nowrap", !canWrite && "pointer-events-none opacity-60")}>
                      <Switch
                        id={`switch-${card.kind}`}
                        checked={enabled}
                        label={t.enabled}
                        onCheckedChange={(checked) =>
                          setValues((current) => ({ ...current, [card.switchKey]: checked }))
                        }
                      />
                    </div>
                  </div>

                  <TimingField
                    timingKey={card.timingKey}
                    label={card.needs === "start" ? t.timing.daysBeforeStart : t.timing.daysAfterEnd}
                    value={values[card.timingKey]}
                    error={errors[card.timingKey]}
                    disabled={!canWrite}
                    onChange={(value) => setText(card.timingKey, value)}
                    className="sm:max-w-xs"
                  />

                  {missingDate && (
                    <p className="rounded-input border border-border bg-ink-50 px-3 py-2 text-sm text-muted-foreground">
                      {card.needs === "start" ? t.missingStart : t.missingEnd}
                    </p>
                  )}

                  {card.fields.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {card.fields.map((field) => {
                        const id = `mail-${field.key}`;
                        const required = card.kind === "info_arrival" && ARRIVAL_REQUIRED.includes(field.key);
                        const label = required ? `${t.fields[field.key]} · ${t.required}` : t.fields[field.key];
                        const common = {
                          id,
                          value: values[field.key],
                          maxLength: TEXT_LIMITS[field.key],
                          placeholder: field.placeholder,
                          disabled: !canWrite,
                          "aria-invalid": errors[field.key] ? true : undefined,
                          className: cn(errors[field.key] && "border-danger focus-visible:border-danger"),
                        };
                        return (
                          <Field
                            key={field.key}
                            label={label}
                            htmlFor={id}
                            hint={field.hint}
                            error={errors[field.key]}
                            className={cn(field.wide && "md:col-span-2")}
                          >
                            {field.multiline ? (
                              <Textarea {...common} onChange={(e) => setText(field.key, e.target.value)} />
                            ) : (
                              <Input
                                {...common}
                                type={field.type ?? "text"}
                                inputMode={field.type === "tel" ? "tel" : field.type === "url" ? "url" : undefined}
                                onChange={(e) => setText(field.key, e.target.value)}
                              />
                            )}
                          </Field>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ol>
      </section>

      {canWrite && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur sm:static sm:z-auto sm:flex sm:justify-end sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
          <Button onClick={save} disabled={pending} className="w-full sm:w-auto">
            <FloppyDisk size={16} weight="bold" />
            {pending ? t.saving : t.save}
          </Button>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-20 left-1/2 z-[60] -translate-x-1/2 rounded-pill bg-surface-inverse px-4 py-2 text-sm text-on-inverse shadow-pop sm:bottom-6"
        >
          {toast}
        </div>
      )}
    </>
  );
}

/** Days for one send moment; empty uses the default shown as placeholder. */
function TimingField({
  timingKey,
  label,
  value,
  error,
  disabled,
  onChange,
  className,
}: {
  timingKey: MailTimingKey;
  label: string;
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
  className?: string;
}) {
  const id = `timing-${timingKey}`;
  const { min, max } = TIMING_BOUNDS[timingKey];
  return (
    <Field
      label={label}
      htmlFor={id}
      hint={t.timing.range(min, max)}
      error={error}
      className={className}
    >
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={1}
          value={value}
          placeholder={t.timing.placeholder(DEFAULT_TIMING[timingKey])}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={cn("w-28 font-mono tabular-nums", error && "border-danger focus-visible:border-danger")}
        />
        {value.trim() !== "" && !disabled && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            {t.timing.reset}
          </Button>
        )}
      </div>
    </Field>
  );
}
