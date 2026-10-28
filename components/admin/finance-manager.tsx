"use client";

import { DownloadSimple, MagnifyingGlass, Receipt } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/admin/states";
import { StatCard } from "@/components/admin/stat-card";
import {
  sendFinancePaymentLinkAction,
  setFinanceReminderPauseAction,
  updateRegistrationFinanceAction,
} from "@/app/admin/finanzen/actions";
import { cn } from "@/lib/cn";
import {
  filterFinanceRows,
  financeRowsToCsv,
  matchesFinanceFilter,
  summarizeFinance,
  type FinanceFilter,
  type FinanceRow,
} from "@/lib/admin/finance";
import { de } from "@/lib/admin/messages";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/lib/format";
import { FinanceTable } from "./finance-table";
import type { FinanceEdit } from "./finance-row-editor";

const t = de.finances;
const FILTERS: FinanceFilter[] = ["all", "open", "partial", "overdue", "paused"];

/** Locally saved values shown until refreshed server data arrives. */
type RowOverride = Partial<FinanceEdit & Pick<FinanceRow, "remindersPaused">>;

/**
 * Finance tab client (specs/009-finance-tab): stats, filters, search, inline
 * payment edits and CSV export. Rows arrive already stripped of form answers.
 */
export function FinanceManager({
  rows,
  dueDate,
  today,
  canEdit,
  appUrl,
  campSlug,
}: {
  rows: FinanceRow[];
  dueDate: string | null;
  today: string;
  canEdit: boolean;
  appUrl: string | null;
  campSlug: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [filter, setFilter] = useState<FinanceFilter>("all");
  const [search, setSearch] = useState("");
  const [editingRef, setEditingRef] = useState<string | null>(null);
  const [pendingRef, setPendingRef] = useState<string | null>(null);
  // Saved values shown until refreshed server data arrives; tied to the `rows`
  // they were made on, so new server data replaces them automatically.
  const [optimistic, setOptimistic] = useState<{
    base: FinanceRow[];
    values: Record<string, RowOverride>;
  }>({ base: rows, values: {} });
  const overrides = useMemo(
    () => (optimistic.base === rows ? optimistic.values : {}),
    [optimistic, rows],
  );
  const [sendTarget, setSendTarget] = useState<FinanceRow | null>(null);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  const liveRows = useMemo(
    () => rows.map((r) => (overrides[r.reference] ? { ...r, ...overrides[r.reference] } : r)),
    [rows, overrides],
  );
  const summary = useMemo(() => summarizeFinance(liveRows, dueDate, today), [liveRows, dueDate, today]);
  const counts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((f) => [f, liveRows.filter((r) => matchesFinanceFilter(r, f, dueDate, today)).length]),
      ) as Record<FinanceFilter, number>,
    [liveRows, dueDate, today],
  );
  const visible = useMemo(
    () => filterFinanceRows(liveRows, filter, search, dueDate, today),
    [liveRows, filter, search, dueDate, today],
  );

  // Merges a patch into the row's override; `undo` removes exactly those keys again.
  const setOverride = (reference: string, patch: RowOverride, undo = false) =>
    setOptimistic((prev) => {
      const values = prev.base === rows ? { ...prev.values } : {};
      const next: RowOverride = { ...values[reference] };
      for (const key of Object.keys(patch) as (keyof RowOverride)[]) {
        if (undo) delete next[key];
        else Object.assign(next, { [key]: patch[key] });
      }
      if (Object.keys(next).length > 0) values[reference] = next;
      else delete values[reference];
      return { base: rows, values };
    });

  const onSave = (row: FinanceRow, edit: FinanceEdit) => {
    setPendingRef(row.reference);
    setOverride(row.reference, edit);
    startTransition(async () => {
      const result = await updateRegistrationFinanceAction({ reference: row.reference, ...edit });
      setPendingRef(null);
      if (result.ok) {
        setEditingRef(null);
        showToast(t.toast.saved);
        router.refresh();
      } else {
        setOverride(row.reference, edit, true);
        showToast(result.error);
      }
    });
  };

  const onTogglePause = (row: FinanceRow) => {
    const patch = { remindersPaused: !row.remindersPaused };
    setPendingRef(row.reference);
    setOverride(row.reference, patch);
    startTransition(async () => {
      const result = await setFinanceReminderPauseAction(row.reference, patch.remindersPaused);
      setPendingRef(null);
      if (result.ok) {
        showToast(patch.remindersPaused ? de.registrations.reminderPause.paused : de.registrations.reminderPause.resumed);
        router.refresh();
      } else {
        setOverride(row.reference, patch, true);
        showToast(result.error);
      }
    });
  };

  const onCopyLink = async (row: FinanceRow) => {
    if (!appUrl) return;
    try {
      await navigator.clipboard.writeText(`${appUrl}/bezahlen?ref=${encodeURIComponent(row.reference)}`);
      showToast(de.paymentLink.copied);
    } catch {
      showToast(de.paymentLink.copyFailed);
    }
  };

  const confirmSend = () => {
    const target = sendTarget;
    if (!target) return;
    setSending(true);
    startTransition(async () => {
      const result = await sendFinancePaymentLinkAction(target.reference);
      setSending(false);
      setSendTarget(null);
      showToast(result.ok ? de.paymentLink.sent : result.error);
      if (result.ok) router.refresh();
    });
  };

  const onExport = () => {
    const csv = financeRowsToCsv(visible, dueDate, today);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = t.csv.fileName(campSlug, today);
    link.click();
    URL.revokeObjectURL(url);
  };

  const collectedRatio = summary.expected > 0 ? summary.collected / summary.expected : 0;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          hero
          label={t.stats.collected}
          value={formatCurrency(summary.collected)}
          delta={t.stats.collectedOf(formatPercent(collectedRatio), formatCurrency(summary.expected))}
          tone="positive"
        />
        <StatCard
          label={t.stats.outstanding}
          value={formatCurrency(summary.outstanding)}
          delta={t.stats.outstandingHint(summary.openCount)}
        />
        <StatCard
          label={t.stats.openCounts}
          value={`${formatNumber(summary.unpaidCount)} · ${formatNumber(summary.partialCount)}`}
          delta={t.stats.openCountsHint}
        />
        <StatCard
          label={t.stats.overdue}
          value={formatNumber(summary.overdueCount)}
          delta={summary.overdueCount > 0 ? t.stats.overdueHint : t.stats.noOverdueHint}
        />
      </div>

      <Card className="flex flex-col">
        {rows.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={t.noRegistrations.title}
            description={t.noRegistrations.description}
          />
        ) : (
          <>
            <div className="flex flex-col gap-4 p-4 md:p-6">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div
                  role="group"
                  aria-label={t.filters.label}
                  className="flex w-full gap-1 overflow-x-auto rounded-pill bg-ink-100 p-1 sm:w-fit xl:shrink-0"
                >
                  {FILTERS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      aria-pressed={filter === f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        "flex h-8 shrink-0 items-center gap-2 rounded-pill px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        filter === f
                          ? "bg-surface text-foreground shadow-card"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t.filters[f]}
                      <span
                        className={cn(
                          "font-mono text-xs tabular-nums",
                          f === "overdue" && counts.overdue > 0 ? "text-danger" : "text-muted-foreground",
                        )}
                      >
                        {counts[f]}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1 xl:w-72 xl:flex-none">
                    <Input
                      type="search"
                      aria-label={t.search}
                      placeholder={t.search}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      leading={<MagnifyingGlass size={16} />}
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={onExport} disabled={visible.length === 0}>
                    <DownloadSimple size={16} weight="bold" />
                    {de.common.exportCsv}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground" aria-live="polite">
                {t.resultCount(visible.length)}
              </p>
            </div>

            <div className="border-t border-border">
              {visible.length === 0 ? (
                <EmptyState
                  icon={MagnifyingGlass}
                  title={t.noResults.title}
                  description={t.noResults.description}
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilter("all");
                        setSearch("");
                      }}
                    >
                      {t.resetFilters}
                    </Button>
                  }
                />
              ) : (
                <FinanceTable
                  rows={visible}
                  dueDate={dueDate}
                  today={today}
                  canEdit={canEdit}
                  canCopyLink={appUrl !== null}
                  editingRef={editingRef}
                  pendingRef={pendingRef}
                  onStartEdit={setEditingRef}
                  onCancelEdit={() => setEditingRef(null)}
                  onSave={onSave}
                  onCopyLink={onCopyLink}
                  onSendLink={setSendTarget}
                  onTogglePause={onTogglePause}
                />
              )}
            </div>
          </>
        )}
      </Card>

      <Dialog
        open={sendTarget !== null}
        onClose={() => (sending ? undefined : setSendTarget(null))}
        title={t.sendConfirm.title}
        description={
          sendTarget
            ? t.sendConfirm.description(
                `${sendTarget.firstName} ${sendTarget.lastName}`.trim(),
                sendTarget.email,
              )
            : undefined
        }
        closeLabel={t.sendConfirm.cancel}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setSendTarget(null)} disabled={sending}>
              {t.sendConfirm.cancel}
            </Button>
            <Button size="sm" onClick={confirmSend} disabled={sending}>
              {sending ? de.paymentLink.sending : t.sendConfirm.confirm}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          {sendTarget && sendTarget.reminderCount > 0 && sendTarget.lastReminderAt
            ? de.paymentLink.reminders(sendTarget.reminderCount, formatDate(sendTarget.lastReminderAt))
            : de.paymentLink.noReminder}
        </p>
      </Dialog>

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-pill bg-surface-inverse px-4 py-2 text-sm text-on-inverse shadow-pop"
        >
          {toast}
        </div>
      )}
    </>
  );
}
