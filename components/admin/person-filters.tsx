"use client";

import { FunnelSimple, MagnifyingGlass, X } from "@phosphor-icons/react";
import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { cn } from "@/lib/cn";
import { de } from "@/lib/admin/messages";
import {
  CHECKBOX_NO,
  CHECKBOX_YES,
  fieldOptions,
  isFilterActive,
} from "@/lib/admin/room-planning";
import type { CampFormField, GenderFilter, PersonFilter } from "@/lib/admin/types";

const t = de.rooms.filters;

const GENDER_SEGMENTS: { value: GenderFilter; label: string }[] = [
  { value: "all", label: t.genderAll },
  { value: "female", label: t.genderFemale },
  { value: "male", label: t.genderMale },
  { value: "missing", label: t.genderMissing },
];

function parseAge(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d{1,2}$/.test(trimmed)) return null;
  return Number(trimmed);
}

function FieldValueControl({
  field,
  value,
  onChange,
  id,
}: {
  field: CampFormField;
  value: string;
  onChange: (value: string) => void;
  id: string;
}) {
  if (field.fieldType === "select" || field.fieldType === "checkbox") {
    const options: SelectOption[] =
      field.fieldType === "checkbox"
        ? [
            { value: "", label: t.any },
            { value: CHECKBOX_YES, label: de.common.yes },
            { value: CHECKBOX_NO, label: de.common.no },
          ]
        : [
            { value: "", label: t.any },
            ...fieldOptions(field).map((option) => ({ value: option, label: option })),
          ];
    return (
      <Select
        id={id}
        aria-label={field.label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        options={options}
        className="h-9"
      />
    );
  }
  return (
    <Input
      id={id}
      aria-label={field.label}
      placeholder={t.fieldText}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9"
    />
  );
}

/**
 * Search and filters for room planning: name, gender, age and any question of
 * the camp's registration form. Pure client state; matching lives in
 * `matchesFilter` (lib/admin/room-planning.ts).
 */
export function PersonFilters({
  filter,
  onChange,
  fields,
  hasAge,
  hits,
}: {
  filter: PersonFilter;
  onChange: (next: PersonFilter) => void;
  fields: CampFormField[];
  hasAge: boolean;
  hits: number;
}) {
  const baseId = useId();
  const fieldsByKey = new Map(fields.map((f) => [f.key, f]));
  const active = isFilterActive(filter);
  const usedKeys = new Set(filter.fields.map((f) => f.key));
  const addable = fields.filter((f) => !usedKeys.has(f.key));

  const patch = (next: Partial<PersonFilter>) => onChange({ ...filter, ...next });

  return (
    <div className="flex flex-col gap-3">
      <Input
        type="search"
        aria-label={t.search}
        placeholder={t.search}
        value={filter.search}
        onChange={(e) => patch({ search: e.target.value })}
        leading={<MagnifyingGlass size={16} />}
      />

      <div
        role="radiogroup"
        aria-label={t.gender}
        className="grid grid-cols-4 gap-1 rounded-input bg-ink-50 p-1"
      >
        {GENDER_SEGMENTS.map((segment) => {
          const checked = filter.gender === segment.value;
          return (
            <button
              key={segment.value}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => patch({ gender: segment.value })}
              className={cn(
                "h-8 rounded-sm text-xs font-medium transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                checked
                  ? "bg-surface text-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {segment.label}
            </button>
          );
        })}
      </div>

      {hasAge && (
        <div className="flex items-center gap-2">
          <span className="w-12 shrink-0 text-xs font-medium text-muted-foreground">{t.age}</span>
          <Input
            inputMode="numeric"
            aria-label={`${t.age} ${t.ageFrom}`}
            placeholder={t.ageFrom}
            value={filter.ageMin ?? ""}
            onChange={(e) => patch({ ageMin: parseAge(e.target.value) })}
            className="h-9 text-center tabular-nums"
          />
          <span aria-hidden="true" className="text-muted-foreground">·</span>
          <Input
            inputMode="numeric"
            aria-label={`${t.age} ${t.ageTo}`}
            placeholder={t.ageTo}
            value={filter.ageMax ?? ""}
            onChange={(e) => patch({ ageMax: parseAge(e.target.value) })}
            className="h-9 text-center tabular-nums"
          />
        </div>
      )}

      {filter.fields.map((ff) => {
        const field = fieldsByKey.get(ff.key);
        if (!field) return null;
        const id = `${baseId}-${ff.id}`;
        return (
          <div key={ff.id} className="flex flex-col gap-1">
            <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
              {field.label}
            </label>
            <div className="flex items-center gap-1.5">
              <div className="min-w-0 flex-1">
                <FieldValueControl
                  id={id}
                  field={field}
                  value={ff.value}
                  onChange={(value) =>
                    patch({
                      fields: filter.fields.map((f) => (f.id === ff.id ? { ...f, value } : f)),
                    })
                  }
                />
              </div>
              <button
                type="button"
                aria-label={`${t.remove}: ${field.label}`}
                onClick={() => patch({ fields: filter.fields.filter((f) => f.id !== ff.id) })}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input text-muted-foreground hover:bg-ink-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          </div>
        );
      })}

      <div className="flex items-center justify-between gap-2">
        {addable.length > 0 ? (
          <div className="relative min-w-0 flex-1">
            <Select
              aria-label={t.addField}
              value=""
              onChange={(e) => {
                const key = e.target.value;
                if (!key) return;
                patch({
                  fields: [...filter.fields, { id: `${key}-${Date.now()}`, key, value: "" }],
                });
              }}
              options={[
                { value: "", label: t.addField },
                ...addable.map((field) => ({ value: field.key, label: field.label })),
              ]}
              className="h-9 pl-8 text-sm"
            />
            <FunnelSimple
              size={14}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
          </div>
        ) : (
          <span />
        )}
        {active && (
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            {t.hits(String(hits))}
          </span>
        )}
      </div>

      {active && (
        <button
          type="button"
          onClick={() => onChange({ search: "", gender: "all", ageMin: null, ageMax: null, fields: [] })}
          className="self-start text-xs font-medium text-accent-strong underline underline-offset-4 hover:text-foreground"
        >
          {t.reset}
        </button>
      )}
    </div>
  );
}
