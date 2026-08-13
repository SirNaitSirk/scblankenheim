"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { de } from "@/lib/admin/messages";
import type { CampFormField } from "@/lib/admin/types";

// `options`/`config` arrive as `unknown`/`Record<string, unknown>` from the row;
// read them defensively so a malformed value never breaks the preview.
function readOptions(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function readString(config: Record<string, unknown>, key: string): string | null {
  const value = config[key];
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

/** One read-only field rendered as attendees would see it on the public form. */
function PreviewField({ field }: { field: CampFormField }) {
  const placeholder = readString(field.config, "placeholder") ?? undefined;
  const helpText = readString(field.config, "helpText");

  if (field.fieldType === "checkbox") {
    return (
      <label className="flex items-start gap-2.5 text-sm text-foreground">
        <input
          type="checkbox"
          disabled
          className="mt-0.5 h-4 w-4 rounded-sm border-ink-200 accent-accent"
        />
        <span>
          {field.label || de.fields.preview.checkboxFallback}
          {field.required && <span className="text-danger"> *</span>}
        </span>
      </label>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">
        {field.label}
        {field.required && <span className="text-danger"> *</span>}
      </span>
      {field.fieldType === "textarea" ? (
        <Textarea disabled placeholder={placeholder} />
      ) : field.fieldType === "select" ? (
        <Select
          disabled
          value=""
          onChange={() => {}}
          options={[
            { value: "", label: de.fields.preview.selectPlaceholder },
            ...readOptions(field.options).map((opt) => ({ value: opt, label: opt })),
          ]}
        />
      ) : (
        <Input
          disabled
          type={inputTypeFor(field.fieldType)}
          placeholder={placeholder}
        />
      )}
      {helpText && <span className="text-xs text-muted-foreground">{helpText}</span>}
    </div>
  );
}

// Maps a field type to the native <input> type. Non-input types are handled above.
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

export function FieldPreview({ fields }: { fields: CampFormField[] }) {
  if (fields.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{de.fields.preview.empty}</p>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {fields.map((field) => (
        <PreviewField key={field.id} field={field} />
      ))}
    </div>
  );
}
