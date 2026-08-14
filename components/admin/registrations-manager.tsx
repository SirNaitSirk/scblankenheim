"use client";

import { Columns, DownloadSimple, Plus } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import {
  createRegistrationAction,
  setRegistrationDeletedAction,
  setRegistrationPaymentAction,
  updateRegistrationAction,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import type { SelectOption } from "@/components/ui/select";
import { useColumnSettings } from "@/hooks/use-column-settings";
import { de } from "@/lib/admin/messages";
import type {
  ActionResult,
  CampFormField,
  PaymentStatus,
  PriceTier,
  Registration,
  RegistrationFormValues,
} from "@/lib/admin/types";
import { ColumnSettingsDialog } from "./column-settings-dialog";
import {
  buildColumns,
  type ColumnDef,
  formatFieldValue,
} from "./registration-columns";
import { RegistrationFormDialog } from "./registration-form-dialog";
import {
  type CustomFilter,
  RegistrationsFilters,
  type RegistrationFilterState,
} from "./registrations-filters";
import {
  RegistrationsTable,
  type SortDir,
} from "./registrations-table";

type DialogState = { mode: "create" | "edit"; registration: Registration | null } | null;

const DEFAULT_SORT_COLUMN = "registeredAt";

const INITIAL_FILTERS: RegistrationFilterState = {
  search: "",
  status: "all",
  payment: "all",
  tier: "all",
  showDeleted: false,
};

/** Does a registration satisfy one custom filter? `fieldByKey` resolves camp fields. */
function matchesCustom(
  reg: Registration,
  cf: CustomFilter,
  fieldByKey: Map<string, CampFormField>,
): boolean {
  const needle = cf.value.trim().toLowerCase();
  if (!needle) return true;
  let haystack: string;
  if (cf.field === "name") {
    haystack = `${reg.firstName} ${reg.lastName}`;
  } else if (cf.field === "email") {
    haystack = reg.email;
  } else if (cf.field === "id") {
    haystack = reg.id;
  } else {
    const field = fieldByKey.get(cf.field);
    haystack = field ? formatFieldValue(field, reg.formData[field.key]) : "";
  }
  return haystack.toLowerCase().includes(needle);
}

/** asc-order comparison of two rows by a resolved column (dir applied by caller). */
function compareRows(a: Registration, b: Registration, column: ColumnDef): number {
  if (column.kind === "field" && column.field) {
    const field = column.field;
    const va = a.formData[field.key];
    const vb = b.formData[field.key];
    if (field.fieldType === "number") {
      const na = Number(va);
      const nb = Number(vb);
      const sa = Number.isFinite(na) ? na : Number.POSITIVE_INFINITY;
      const sb = Number.isFinite(nb) ? nb : Number.POSITIVE_INFINITY;
      return sa - sb;
    }
    if (field.fieldType === "checkbox") {
      return (va === true ? 1 : 0) - (vb === true ? 1 : 0);
    }
    return formatFieldValue(field, va).localeCompare(
      formatFieldValue(field, vb),
      "de",
    );
  }

  switch (column.key) {
    case "name":
      return `${a.lastName} ${a.firstName}`.localeCompare(
        `${b.lastName} ${b.firstName}`,
        "de",
      );
    case "amount":
      return a.amountDue - b.amountDue;
    case "registeredAt":
    default:
      return a.registeredAt.localeCompare(b.registeredAt);
  }
}

/** CSV value for a single column of a row, mirroring what the table shows. */
function csvValue(column: ColumnDef, r: Registration): string | number {
  if (column.kind === "field" && column.field) {
    return formatFieldValue(column.field, r.formData[column.field.key]);
  }
  switch (column.key) {
    case "name":
      return `${r.firstName} ${r.lastName}`.trim();
    case "contact":
      return r.email;
    case "id":
      return r.id;
    case "registeredAt":
      return r.registeredAt;
    case "amount":
      return r.amountDue;
    case "payment":
      return r.payment;
    case "status":
      return r.status;
    default:
      return "";
  }
}

/** Builds a CSV of `rows` restricted to `columns`, in the given order. */
function toCsv(rows: Registration[], columns: ColumnDef[]): string {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => c.label);
  const lines = rows.map((r) =>
    columns.map((c) => escape(csvValue(c, r))).join(";"),
  );
  return [header.join(";"), ...lines].join("\n");
}

export function RegistrationsManager({
  initialRegistrations,
  priceTiers,
  formFields,
  canWrite,
  userId,
}: {
  initialRegistrations: Registration[];
  priceTiers: PriceTier[];
  formFields: CampFormField[];
  canWrite: boolean;
  userId: string | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [filters, setFilters] = useState<RegistrationFilterState>(INITIAL_FILTERS);
  const [customFilters, setCustomFilters] = useState<CustomFilter[]>([]);
  const [sortColumn, setSortColumn] = useState<string>(DEFAULT_SORT_COLUMN);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Registration | null>(null);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Core columns + one column per current-camp field (single source of truth).
  const allColumns = useMemo(() => buildColumns(formFields), [formFields]);
  const colByKey = useMemo(
    () => new Map(allColumns.map((c) => [c.key, c])),
    [allColumns],
  );
  const availableColumns = useMemo(
    () =>
      allColumns.map((c) => ({
        key: c.key,
        alwaysVisible: c.alwaysVisible === true,
        defaultHidden: c.kind === "field",
      })),
    [allColumns],
  );

  const { order, isHidden, visibleColumns, toggle, move, reorder, reorderKey, reset } =
    useColumnSettings(userId, availableColumns);

  // Resolve the persisted key lists back to column defs (ignore stale keys).
  const orderedColumns = useMemo(
    () => order.map((key) => colByKey.get(key)).filter((c): c is ColumnDef => !!c),
    [order, colByKey],
  );
  const visibleColumnDefs = useMemo(
    () =>
      visibleColumns
        .map((key) => colByKey.get(key))
        .filter((c): c is ColumnDef => !!c),
    [visibleColumns, colByKey],
  );

  const fieldByKey = useMemo(
    () => new Map(formFields.map((f) => [f.key, f])),
    [formFields],
  );

  // Writes persist via Server Actions and `router.refresh()` re-fetches, so the
  // list renders straight from the `initialRegistrations` prop — no local copy.

  const tierOptions: SelectOption[] = useMemo(
    () => [
      { value: "all", label: de.common.all },
      ...priceTiers.map((t) => ({ value: t.id, label: t.name })),
    ],
    [priceTiers],
  );

  // Core filter fields + every camp field (value = key, label = field label).
  const fieldOptions: SelectOption[] = useMemo(
    () => [
      { value: "name", label: de.registrations.columns.name },
      { value: "email", label: de.registrations.columns.contact },
      { value: "id", label: de.registrations.columns.id },
      ...allColumns
        .filter((c) => c.kind === "field" && c.field)
        .map((c) => ({ value: c.field!.key, label: c.label })),
    ],
    [allColumns],
  );

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const result = initialRegistrations.filter((r) => {
      if (!filters.showDeleted && r.deleted) return false;
      if (filters.status !== "all" && r.status !== filters.status) return false;
      if (filters.payment !== "all" && r.payment !== filters.payment)
        return false;
      if (filters.tier !== "all" && r.priceTierId !== filters.tier) return false;
      if (
        search &&
        !`${r.firstName} ${r.lastName} ${r.email}`
          .toLowerCase()
          .includes(search)
      )
        return false;
      return customFilters.every((cf) => matchesCustom(r, cf, fieldByKey));
    });

    // Fall back to the default sort if the active column vanished (e.g. camp switch).
    const active = colByKey.get(sortColumn);
    const sortDef =
      active && active.sortable ? active : colByKey.get(DEFAULT_SORT_COLUMN);
    if (!sortDef) return result;

    const dir = sortDir === "asc" ? 1 : -1;
    return [...result].sort((a, b) => dir * compareRows(a, b, sortDef));
  }, [
    initialRegistrations,
    filters,
    customFilters,
    fieldByKey,
    colByKey,
    sortColumn,
    sortDir,
  ]);

  const hasActiveFilters =
    filters.search !== "" ||
    filters.status !== "all" ||
    filters.payment !== "all" ||
    filters.tier !== "all" ||
    filters.showDeleted ||
    customFilters.length > 0;

  const patchFilters = useCallback(
    (patch: Partial<RegistrationFilterState>) =>
      setFilters((f) => ({ ...f, ...patch })),
    [],
  );

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setCustomFilters([]);
  }, []);

  const addCustom = useCallback(
    () =>
      setCustomFilters((cf) => [
        ...cf,
        { id: crypto.randomUUID(), field: "name", value: "" },
      ]),
    [],
  );

  const updateCustom = useCallback(
    (id: string, patch: Partial<CustomFilter>) =>
      setCustomFilters((cf) =>
        cf.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      ),
    [],
  );

  const removeCustom = useCallback(
    (id: string) => setCustomFilters((cf) => cf.filter((f) => f.id !== id)),
    [],
  );

  // Two independent top-level setState calls — never a setState inside another
  // updater (that double-fires under Strict Mode and cancels the toggle out).
  const onSort = useCallback(
    (key: string) => {
      if (key === sortColumn) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortColumn(key);
        setSortDir("asc");
      }
    },
    [sortColumn],
  );

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2000);
  }, []);

  // Runs a registrations Server Action, then refreshes so the table reflects the
  // persisted state. `startTransition` keeps the UI responsive during the write.
  const runAction = useCallback(
    (action: Promise<ActionResult>, successMessage: string) => {
      startTransition(async () => {
        const result = await action;
        if (result.ok) {
          showToast(successMessage);
          router.refresh();
        } else {
          showToast(result.error);
        }
      });
    },
    [router, showToast],
  );

  const onRestore = useCallback(
    (id: string) =>
      runAction(setRegistrationDeletedAction(id, false), de.registrations.toast.restored),
    [runAction],
  );

  const onPaymentChange = useCallback(
    (id: string, payment: PaymentStatus) =>
      runAction(
        setRegistrationPaymentAction(id, payment),
        de.registrations.toast.paymentUpdated,
      ),
    [runAction],
  );

  const onEdit = useCallback(
    (registration: Registration) => setDialog({ mode: "edit", registration }),
    [],
  );

  const submitRegistration = useCallback(
    (values: RegistrationFormValues): Promise<ActionResult> =>
      dialog?.mode === "edit" && dialog.registration
        ? updateRegistrationAction(dialog.registration.id, values)
        : createRegistrationAction(values),
    [dialog],
  );

  const onFormSuccess = useCallback(() => {
    showToast(
      dialog?.mode === "edit"
        ? de.registrations.toast.updated
        : de.registrations.toast.created,
    );
    setDialog(null);
    router.refresh();
  }, [dialog, router, showToast]);

  // Clicking "Löschen" in the edit dialog opens a confirmation instead of
  // deleting straight away.
  const onDeleteFromDialog = useCallback(() => {
    const target = dialog?.registration;
    if (!target) return;
    setDialog(null);
    setDeleteTarget(target);
  }, [dialog]);

  const onRestoreFromDialog = useCallback(() => {
    const target = dialog?.registration;
    if (!target) return;
    setDialog(null);
    onRestore(target.id);
  }, [dialog, onRestore]);

  const onExport = useCallback(() => {
    const csv = toCsv(filtered, visibleColumnDefs);
    const blob = new Blob([`﻿${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "anmeldungen.csv";
    link.click();
    URL.revokeObjectURL(url);
  }, [filtered, visibleColumnDefs]);

  return (
    <Card className="flex flex-col">
      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
            {de.registrations.title}
            <span className="ml-2 font-sans text-sm font-normal text-muted-foreground">
              {de.registrations.resultCount(filtered.length)}
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setColumnsOpen(true)}
            >
              <Columns size={16} weight="bold" />
              {de.registrations.columnsButton}
            </Button>
            <Button variant="outline" size="sm" onClick={onExport}>
              <DownloadSimple size={16} weight="bold" />
              {de.common.exportCsv}
            </Button>
            {canWrite && (
              <Button
                size="sm"
                onClick={() => setDialog({ mode: "create", registration: null })}
              >
                <Plus size={16} weight="bold" />
                {de.registrations.add}
              </Button>
            )}
          </div>
        </div>
        <RegistrationsFilters
          filters={filters}
          onChange={patchFilters}
          tierOptions={tierOptions}
          fieldOptions={fieldOptions}
          customFilters={customFilters}
          onAddCustom={addCustom}
          onUpdateCustom={updateCustom}
          onRemoveCustom={removeCustom}
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
        />
      </div>

      <div className="border-t border-border">
        <RegistrationsTable
          rows={filtered}
          columns={visibleColumnDefs}
          sortColumn={sortColumn}
          sortDir={sortDir}
          onSort={onSort}
          onReorderColumn={reorderKey}
          onEdit={onEdit}
          onPaymentChange={onPaymentChange}
          onResetFilters={clearFilters}
          canWrite={canWrite}
        />
      </div>

      <ColumnSettingsDialog
        open={columnsOpen}
        columns={orderedColumns}
        isHidden={isHidden}
        onToggle={toggle}
        onMove={move}
        onReorder={reorder}
        onReset={reset}
        onClose={() => setColumnsOpen(false)}
      />

      {canWrite && (
        <RegistrationFormDialog
          key={dialog ? `${dialog.mode}-${dialog.registration?.id ?? "new"}` : "closed"}
          open={dialog !== null}
          mode={dialog?.mode ?? "create"}
          registration={dialog?.registration ?? null}
          formFields={formFields}
          priceTiers={priceTiers}
          onClose={() => setDialog(null)}
          onSubmit={submitRegistration}
          onSuccess={onFormSuccess}
          onDelete={onDeleteFromDialog}
          onRestore={onRestoreFromDialog}
        />
      )}

      <DeleteRegistrationDialog
        key={deleteTarget?.id ?? "none"}
        registration={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={(registration) => {
          setDeleteTarget(null);
          runAction(
            setRegistrationDeletedAction(registration.id, true),
            de.registrations.toast.deleted,
          );
        }}
      />

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-pill bg-surface-inverse px-4 py-2 text-sm text-on-inverse shadow-pop"
        >
          {toast}
        </div>
      )}
    </Card>
  );
}

function DeleteRegistrationDialog({
  registration,
  onClose,
  onConfirm,
}: {
  registration: Registration | null;
  onClose: () => void;
  onConfirm: (registration: Registration) => void;
}) {
  const name = registration
    ? `${registration.firstName} ${registration.lastName}`.trim() ||
      registration.email
    : "";
  return (
    <Dialog
      open={registration !== null}
      onClose={onClose}
      title={de.registrations.remove.title}
      closeLabel={de.registrations.remove.cancel}
      footer={
        <>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {de.registrations.remove.cancel}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => registration && onConfirm(registration)}
          >
            {de.registrations.remove.confirm}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">
        {registration ? de.registrations.remove.description(name) : null}
      </p>
    </Dialog>
  );
}
