"use client";

import { useState, useTransition, type FormEvent } from "react";
import type { ContactState } from "@/app/meine-anmeldung/[token]/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import { MESSAGE_TEXT_MAX, CHANGE_REASON_MAX } from "@/lib/participant/limits";
import { participantMessages } from "@/lib/participant/messages";
import type { EditableField, OwnMessage } from "@/lib/participant/view";
import { berlinDate, formatGermanDate } from "@/lib/time/berlin";

const copy = participantMessages.contact;

// 16px on phones keeps iOS Safari from zooming into the field on focus.
const touchText = "text-base sm:text-sm";

type Mode = "message" | "change";

/**
 * "Fragen oder Korrekturen" on the participant page (specs/018-participant-messages,
 * plan "UI"): a message to the team or a change request for one own field,
 * plus the list of the person's own items.
 */
export function ParticipantContact({
  action,
  fields,
  messages,
}: {
  action: (previous: ContactState, formData: FormData) => Promise<ContactState>;
  fields: EditableField[];
  messages: OwnMessage[];
}) {
  const [mode, setMode] = useState<Mode>("message");
  const [state, setState] = useState<ContactState>({ status: "idle" });
  const [pending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);

  // Submitted by hand so a rejected item keeps what the person typed; only a
  // sent item clears the form (remount through the key).
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await action(state, formData);
      setState(result);
      if (result.status === "sent") setFormKey((key) => key + 1);
    });
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setState({ status: "idle" });
  };

  return (
    <section className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {copy.heading}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy.intro}</p>

      <div
        role="tablist"
        aria-label={copy.heading}
        className="mt-5 grid grid-cols-2 gap-1 rounded-pill bg-ink-100 p-1"
      >
        {(["message", "change"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => switchMode(value)}
            className={cn(
              "h-9 rounded-pill text-sm font-medium transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              mode === value
                ? "bg-surface text-foreground shadow-card"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {value === "message" ? copy.modes.message : copy.modes.change}
          </button>
        ))}
      </div>

      <form key={`${mode}-${formKey}`} onSubmit={submit} className="mt-5 flex flex-col gap-4">
        {mode === "message" ? <MessageFields /> : <ChangeFields fields={fields} fieldError={state.status === "error" ? state.fieldError : undefined} />}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? copy.sending : copy.send}
          </Button>
          <p
            aria-live="polite"
            className={cn("text-sm", state.status === "error" ? "text-danger" : "text-accent-strong")}
          >
            {state.status === "sent" && copy.success}
            {state.status === "error" && !state.fieldError && state.error}
          </p>
        </div>
      </form>

      {messages.length > 0 && <OwnMessages messages={messages} />}
    </section>
  );
}

function MessageFields() {
  const [length, setLength] = useState(0);
  return (
    <>
      <input type="hidden" name="kind" value="message" />
      <Field
        label={copy.messageLabel}
        htmlFor="contact-text"
        hint={copy.counter(length, MESSAGE_TEXT_MAX)}
      >
        <Textarea
          id="contact-text"
          name="text"
          required
          rows={5}
          maxLength={MESSAGE_TEXT_MAX}
          placeholder={copy.messagePlaceholder}
          onChange={(event) => setLength(event.target.value.length)}
          className={touchText}
        />
      </Field>
    </>
  );
}

function ChangeFields({ fields, fieldError }: { fields: EditableField[]; fieldError?: string }) {
  const [key, setKey] = useState("");
  const field = fields.find((candidate) => candidate.key === key) ?? null;

  return (
    <>
      <input type="hidden" name="kind" value="change_request" />
      <Field label={copy.fieldLabel} htmlFor="contact-field">
        <Select
          id="contact-field"
          name="fieldKey"
          required
          value={key}
          onChange={(event) => setKey(event.target.value)}
          className={touchText}
          options={[
            { value: "", label: copy.fieldPlaceholder, disabled: true },
            ...fields.map((candidate) => ({ value: candidate.key, label: candidate.label })),
          ]}
        />
      </Field>

      {field && (
        <>
          <Field
            label={copy.valueLabel}
            htmlFor="contact-value"
            hint={copy.currentValue(field.currentDisplay)}
            error={fieldError}
          >
            <ValueInput key={field.key} field={field} />
          </Field>
          <Field label={copy.reasonLabel} htmlFor="contact-reason">
            <Textarea
              id="contact-reason"
              name="reason"
              rows={2}
              maxLength={CHANGE_REASON_MAX}
              className={cn("min-h-16", touchText)}
            />
          </Field>
        </>
      )}
    </>
  );
}

function ValueInput({ field }: { field: EditableField }) {
  if (field.type === "checkbox") {
    return (
      <Select
        id="contact-value"
        name="value"
        defaultValue={field.current === true ? "false" : "true"}
        className={touchText}
        options={[
          { value: "true", label: participantMessages.answers.yes },
          { value: "false", label: participantMessages.answers.no },
        ]}
      />
    );
  }
  if (field.type === "select" && field.options) {
    return (
      <Select
        id="contact-value"
        name="value"
        required={field.required}
        defaultValue=""
        className={touchText}
        options={[
          { value: "", label: copy.selectPlaceholder, disabled: true },
          ...field.options.map((option) => ({ value: option, label: option })),
        ]}
      />
    );
  }
  if (field.type === "textarea") {
    return <Textarea id="contact-value" name="value" required={field.required} rows={3} className={touchText} />;
  }
  const type = ["email", "tel", "number", "date"].includes(field.type) ? field.type : "text";
  return <Input id="contact-value" name="value" type={type} required={field.required} className={touchText} />;
}

function OwnMessages({ messages }: { messages: OwnMessage[] }) {
  const list = copy.list;
  return (
    <div className="mt-8 border-t border-border pt-6">
      <h3 className="text-sm font-semibold text-foreground">{list.heading}</h3>
      <ul className="mt-3 divide-y divide-border">
        {messages.map((item) => (
          <li key={item.id} className="flex flex-col gap-1 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {list.kinds[item.kind]} · {formatGermanDate(berlinDate(new Date(item.createdAt)))}
              </span>
              <Badge tone={item.status === "open" ? "pending" : "neutral"}>{list.status[item.status]}</Badge>
            </div>
            {item.kind === "change_request" && (
              <p className="text-sm text-foreground">{list.change(item.fieldLabel ?? "", item.proposed ?? "")}</p>
            )}
            {item.text && (
              <p className="whitespace-pre-line break-words text-sm text-muted-foreground">{item.text}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
