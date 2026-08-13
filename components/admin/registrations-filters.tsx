"use client";

import { MagnifyingGlass, Plus, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  PAYMENT_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
  de,
} from "@/lib/admin/messages";
import type { PaymentStatus, RegistrationStatus } from "@/lib/admin/types";

export type CustomField = "name" | "email" | "city" | "id";
export type CustomFilter = { id: string; field: CustomField; value: string };

export type RegistrationFilterState = {
  search: string;
  status: RegistrationStatus | "all";
  payment: PaymentStatus | "all";
  tier: string;
  showDeleted: boolean;
};

const statusOptions: SelectOption[] = [
  { value: "all", label: de.common.all },
  ...(Object.entries(REGISTRATION_STATUS_LABELS) as [
    RegistrationStatus,
    string,
  ][]).map(([value, label]) => ({ value, label })),
];

const paymentOptions: SelectOption[] = [
  { value: "all", label: de.common.all },
  ...(Object.entries(PAYMENT_STATUS_LABELS) as [PaymentStatus, string][]).map(
    ([value, label]) => ({ value, label }),
  ),
];

const customFieldOptions: SelectOption[] = [
  { value: "name", label: de.registrations.columns.name },
  { value: "email", label: de.registrations.columns.contact },
  { value: "city", label: de.registrations.columns.city },
  { value: "id", label: de.registrations.columns.id },
];

export function RegistrationsFilters({
  filters,
  onChange,
  tierOptions,
  customFilters,
  onAddCustom,
  onUpdateCustom,
  onRemoveCustom,
  hasActiveFilters,
  onClear,
}: {
  filters: RegistrationFilterState;
  onChange: (patch: Partial<RegistrationFilterState>) => void;
  tierOptions: SelectOption[];
  customFilters: CustomFilter[];
  onAddCustom: () => void;
  onUpdateCustom: (id: string, patch: Partial<CustomFilter>) => void;
  onRemoveCustom: (id: string) => void;
  hasActiveFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="md:col-span-2 lg:col-span-1">
          <Input
            type="search"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder={de.registrations.searchPlaceholder}
            aria-label={de.common.search}
            leading={<MagnifyingGlass size={16} />}
          />
        </div>
        <Select
          aria-label={de.registrations.status}
          value={filters.status}
          onChange={(e) =>
            onChange({ status: e.target.value as RegistrationFilterState["status"] })
          }
          options={statusOptions}
        />
        <Select
          aria-label={de.registrations.payment}
          value={filters.payment}
          onChange={(e) =>
            onChange({ payment: e.target.value as RegistrationFilterState["payment"] })
          }
          options={paymentOptions}
        />
        <Select
          aria-label={de.registrations.tier}
          value={filters.tier}
          onChange={(e) => onChange({ tier: e.target.value })}
          options={tierOptions}
        />
      </div>

      {customFilters.length > 0 && (
        <div className="flex flex-col gap-2">
          {customFilters.map((cf) => (
            <div key={cf.id} className="flex items-center gap-2">
              <div className="w-40 shrink-0">
                <Select
                  aria-label={de.registrations.addFilter}
                  value={cf.field}
                  onChange={(e) =>
                    onUpdateCustom(cf.id, {
                      field: e.target.value as CustomField,
                    })
                  }
                  options={customFieldOptions}
                />
              </div>
              <Input
                value={cf.value}
                onChange={(e) =>
                  onUpdateCustom(cf.id, { value: e.target.value })
                }
                placeholder={de.common.search}
                aria-label={de.registrations.addFilter}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => onRemoveCustom(cf.id)}
                aria-label={de.common.delete}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input text-muted-foreground transition-colors duration-150 hover:bg-ink-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Switch
          id="show-deleted"
          checked={filters.showDeleted}
          onCheckedChange={(v) => onChange({ showDeleted: v })}
          label={de.registrations.showDeleted}
        />
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              {de.registrations.clearFilters}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onAddCustom}>
            <Plus size={16} weight="bold" />
            {de.registrations.addFilter}
          </Button>
        </div>
      </div>
    </div>
  );
}
