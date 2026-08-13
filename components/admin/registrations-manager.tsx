"use client";

import { DownloadSimple } from "@phosphor-icons/react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SelectOption } from "@/components/ui/select";
import { de } from "@/lib/admin/messages";
import type { PriceTier, Registration } from "@/lib/admin/types";
import {
  type CustomFilter,
  RegistrationsFilters,
  type RegistrationFilterState,
} from "./registrations-filters";
import {
  RegistrationsTable,
  type SortDir,
  type SortKey,
} from "./registrations-table";

const INITIAL_FILTERS: RegistrationFilterState = {
  search: "",
  status: "all",
  payment: "all",
  tier: "all",
  showDeleted: false,
};

function matchesCustom(reg: Registration, cf: CustomFilter): boolean {
  const needle = cf.value.trim().toLowerCase();
  if (!needle) return true;
  const haystack =
    cf.field === "name"
      ? `${reg.firstName} ${reg.lastName}`
      : cf.field === "email"
        ? reg.email
        : cf.field === "city"
          ? reg.city
          : reg.id;
  return haystack.toLowerCase().includes(needle);
}

function toCsv(rows: Registration[], tierName: (id: string) => string): string {
  const header = [
    "ID",
    "Vorname",
    "Nachname",
    "E-Mail",
    "Ort",
    "Preistufe",
    "Angemeldet",
    "Betrag",
    "Bezahlt",
    "Status",
    "Zahlung",
  ];
  const escape = (v: string | number) => {
    const s = String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((r) =>
    [
      r.id,
      r.firstName,
      r.lastName,
      r.email,
      r.city,
      tierName(r.priceTierId),
      r.registeredAt,
      r.amountDue,
      r.amountPaid,
      r.status,
      r.payment,
    ]
      .map(escape)
      .join(";"),
  );
  return [header.join(";"), ...lines].join("\n");
}

export function RegistrationsManager({
  initialRegistrations,
  priceTiers,
}: {
  initialRegistrations: Registration[];
  priceTiers: PriceTier[];
}) {
  const [registrations, setRegistrations] = useState(initialRegistrations);
  const [filters, setFilters] = useState<RegistrationFilterState>(INITIAL_FILTERS);
  const [customFilters, setCustomFilters] = useState<CustomFilter[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("registeredAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [toast, setToast] = useState<string | null>(null);

  const tierName = useCallback(
    (id: string) => priceTiers.find((t) => t.id === id)?.name ?? id,
    [priceTiers],
  );

  const tierOptions: SelectOption[] = useMemo(
    () => [
      { value: "all", label: de.common.all },
      ...priceTiers.map((t) => ({ value: t.id, label: t.name })),
    ],
    [priceTiers],
  );

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const result = registrations.filter((r) => {
      if (!filters.showDeleted && r.deleted) return false;
      if (filters.status !== "all" && r.status !== filters.status) return false;
      if (filters.payment !== "all" && r.payment !== filters.payment)
        return false;
      if (filters.tier !== "all" && r.priceTierId !== filters.tier) return false;
      if (
        search &&
        !`${r.firstName} ${r.lastName} ${r.email} ${r.city}`
          .toLowerCase()
          .includes(search)
      )
        return false;
      return customFilters.every((cf) => matchesCustom(r, cf));
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return [...result].sort((a, b) => {
      if (sortKey === "name") {
        return (
          dir *
          `${a.lastName} ${a.firstName}`.localeCompare(
            `${b.lastName} ${b.firstName}`,
            "de",
          )
        );
      }
      if (sortKey === "amountDue") return dir * (a.amountDue - b.amountDue);
      return dir * a.registeredAt.localeCompare(b.registeredAt);
    });
  }, [registrations, filters, customFilters, sortKey, sortDir]);

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

  const onSort = useCallback((key: SortKey) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prevKey;
      }
      setSortDir("asc");
      return key;
    });
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2000);
  }, []);

  const onDelete = useCallback(
    (id: string) =>
      setRegistrations((rs) =>
        rs.map((r) => (r.id === id ? { ...r, deleted: true } : r)),
      ),
    [],
  );

  const onRestore = useCallback(
    (id: string) =>
      setRegistrations((rs) =>
        rs.map((r) => (r.id === id ? { ...r, deleted: false } : r)),
      ),
    [],
  );

  const onCopyEmail = useCallback(
    (email: string) => {
      navigator.clipboard?.writeText(email);
      showToast(`${de.common.copied}: ${email}`);
    },
    [showToast],
  );

  const onExport = useCallback(() => {
    const csv = toCsv(filtered, tierName);
    const blob = new Blob([`﻿${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "anmeldungen.csv";
    link.click();
    URL.revokeObjectURL(url);
  }, [filtered, tierName]);

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
          <Button variant="outline" size="sm" onClick={onExport}>
            <DownloadSimple size={16} weight="bold" />
            {de.common.exportCsv}
          </Button>
        </div>
        <RegistrationsFilters
          filters={filters}
          onChange={patchFilters}
          tierOptions={tierOptions}
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
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={onSort}
          onDelete={onDelete}
          onRestore={onRestore}
          onCopyEmail={onCopyEmail}
          onResetFilters={clearFilters}
        />
      </div>

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
