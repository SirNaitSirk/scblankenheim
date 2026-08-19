"use client";

import { ArrowDown, ArrowUp, Plus, SlidersHorizontal, X } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  MAX_DASHBOARD_METRICS,
  metricId,
} from "@/lib/admin/dashboard-metrics";
import { de } from "@/lib/admin/messages";
import type {
  ActionResult,
  DashboardMetric,
  DashboardMetricCatalogEntry,
} from "@/lib/admin/types";

const t = de.dashboard.customize;

export function DashboardMetricsDialog({
  catalog,
  initial,
  action,
}: {
  catalog: DashboardMetricCatalogEntry[];
  /** The admin's current effective selection (defaults already applied). */
  initial: DashboardMetric[];
  action: (metrics: DashboardMetric[]) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DashboardMetric[]>(initial);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const byId = useMemo(
    () => new Map(catalog.map((entry) => [entry.id, entry])),
    [catalog],
  );

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  // Reset the draft to the persisted selection each time the dialog opens.
  const openDialog = useCallback(() => {
    setDraft(initial);
    setOpen(true);
  }, [initial]);

  const selectedSet = useMemo(
    () => new Set(draft.map(metricId)),
    [draft],
  );
  const atLimit = draft.length >= MAX_DASHBOARD_METRICS;

  const add = (entry: DashboardMetricCatalogEntry) => {
    if (atLimit || selectedSet.has(entry.id)) return;
    setDraft((prev) => [...prev, entry.metric]);
  };

  const remove = (index: number) => {
    setDraft((prev) => prev.filter((_, i) => i !== index));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draft.length) return;
    setDraft((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  // Available metrics (not yet selected), grouped by their catalog group heading.
  const groups = useMemo(() => {
    const map = new Map<string, DashboardMetricCatalogEntry[]>();
    for (const entry of catalog) {
      if (selectedSet.has(entry.id)) continue;
      const bucket = map.get(entry.group);
      if (bucket) bucket.push(entry);
      else map.set(entry.group, [entry]);
    }
    return [...map.entries()];
  }, [catalog, selectedSet]);

  const handleSave = () => {
    if (saving) return;
    setSaving(true);
    startTransition(async () => {
      const result = await action(draft);
      setSaving(false);
      if (result.ok) {
        setOpen(false);
        router.refresh();
        showToast(t.saved);
      } else {
        showToast(result.error);
      }
    });
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={openDialog}>
        <SlidersHorizontal size={16} weight="bold" />
        {t.trigger}
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t.title}
        description={t.description}
        closeLabel={t.close}
        footer={
          <>
            <span className="mr-auto text-xs text-muted-foreground">
              {atLimit ? t.maxHint : t.emptyHint}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              {t.cancel}
            </Button>
            <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? t.saving : t.save}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          {/* Selected metrics — ordered; first card is the hero on the dashboard. */}
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t.selectedHeading} ({draft.length}/{MAX_DASHBOARD_METRICS})
            </h3>
            {draft.length === 0 ? (
              <p className="rounded-input bg-ink-50 px-3 py-2 text-sm text-muted-foreground">
                {t.emptyHint}
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {draft.map((metric, index) => {
                  const id = metricId(metric);
                  const entry = byId.get(id);
                  return (
                    <li
                      key={id}
                      className="flex items-center justify-between gap-3 rounded-input bg-ink-50 px-2 py-2"
                    >
                      <span className="min-w-0 truncate text-sm text-foreground">
                        {entry?.label ?? id}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={t.moveUp}
                          disabled={index === 0}
                          onClick={() => move(index, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors duration-150 hover:bg-ink-100 hover:text-foreground disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <ArrowUp size={14} weight="bold" />
                        </button>
                        <button
                          type="button"
                          aria-label={t.moveDown}
                          disabled={index === draft.length - 1}
                          onClick={() => move(index, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors duration-150 hover:bg-ink-100 hover:text-foreground disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <ArrowDown size={14} weight="bold" />
                        </button>
                        <button
                          type="button"
                          aria-label={t.remove}
                          onClick={() => remove(index)}
                          className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors duration-150 hover:bg-ink-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <X size={14} weight="bold" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Available metrics — grouped by built-ins and each form field. */}
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t.availableHeading}
            </h3>
            {groups.map(([group, entries]) => (
              <div key={group} className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {group}
                </span>
                <ul className="flex flex-wrap gap-2">
                  {entries.map((entry) => (
                    <li key={entry.id}>
                      <button
                        type="button"
                        disabled={atLimit}
                        onClick={() => add(entry)}
                        className="flex items-center gap-1 rounded-pill border border-border px-3 py-1.5 text-sm text-foreground transition-colors duration-150 hover:bg-ink-100 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Plus size={13} weight="bold" />
                        {entry.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </div>
      </Dialog>

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-pill bg-surface-inverse px-4 py-2 text-sm text-on-inverse shadow-pop"
        >
          {toast}
        </div>
      )}
    </>
  );
}
