/**
 * Dashboard metric catalog + resolution. Pure/isomorphic (no DB, no secrets) so
 * both the server dashboard and the client "Kacheln anpassen" dialog share one
 * source of truth for ids, labels and validation.
 *
 * Two metric families:
 *  - built-in figures (registrations, paid, open, revenue, outstanding, capacity)
 *  - form-field figures derived from the current camp's `camp_form_fields`
 *    answers (one per `select` option, one per `checkbox` field).
 */

import { z } from "zod";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { de } from "./messages";
import type {
  BuiltinMetricKey,
  Camp,
  CampFormField,
  DashboardMetric,
  DashboardMetricCatalogEntry,
  FinanceSummary,
  Registration,
} from "./types";

/** Max cards allowed in the top row. */
export const MAX_DASHBOARD_METRICS = 6;

/** Ordered built-in metric keys — also the dialog order. */
export const BUILTIN_METRIC_KEYS: BuiltinMetricKey[] = [
  "registrations",
  "paid",
  "open",
  "revenue",
  "outstanding",
  "capacity",
];

/** The default selection for an admin who has not customised anything. */
export const DEFAULT_METRICS: DashboardMetric[] = [
  { kind: "builtin", key: "registrations" },
  { kind: "builtin", key: "paid" },
  { kind: "builtin", key: "open" },
  { kind: "builtin", key: "revenue" },
];

/** Stable, collision-free id for a descriptor (React keys + selection matching). */
export function metricId(metric: DashboardMetric): string {
  switch (metric.kind) {
    case "builtin":
      return `builtin:${metric.key}`;
    case "fieldOption":
      return `field:${metric.field}:opt:${metric.value}`;
    case "fieldChecked":
      return `field:${metric.field}:checked`;
  }
}

// --- validation -------------------------------------------------------------

const dashboardMetricSchema: z.ZodType<DashboardMetric> = z.discriminatedUnion(
  "kind",
  [
    z.object({
      kind: z.literal("builtin"),
      key: z.enum([
        "registrations",
        "paid",
        "open",
        "revenue",
        "outstanding",
        "capacity",
      ]),
    }),
    z.object({
      kind: z.literal("fieldOption"),
      field: z.string().min(1),
      value: z.string().min(1),
    }),
    z.object({ kind: z.literal("fieldChecked"), field: z.string().min(1) }),
  ],
);

export const dashboardMetricsSchema = z.array(dashboardMetricSchema);

/** Parse an unknown JSON value (from the DB) into a metric list, tolerantly. */
export function parseStoredMetrics(value: unknown): DashboardMetric[] {
  const result = dashboardMetricsSchema.safeParse(value);
  return result.success ? result.data : [];
}

// --- catalog ----------------------------------------------------------------

const builtinLabel = (key: BuiltinMetricKey): string => de.dashboard.stats[key];

/**
 * Build the full catalog of selectable metrics for a camp's form fields. The
 * order here is the dialog's order (built-ins first, then per field).
 */
export function buildMetricCatalog(
  fields: CampFormField[],
): DashboardMetricCatalogEntry[] {
  const entries: DashboardMetricCatalogEntry[] = BUILTIN_METRIC_KEYS.map(
    (key) => {
      const metric: DashboardMetric = { kind: "builtin", key };
      return {
        id: metricId(metric),
        label: builtinLabel(key),
        group: de.dashboard.customize.builtinGroup,
        metric,
      };
    },
  );

  for (const field of fields) {
    if (field.fieldType === "select" && Array.isArray(field.options)) {
      for (const raw of field.options) {
        if (typeof raw !== "string") continue;
        const metric: DashboardMetric = {
          kind: "fieldOption",
          field: field.key,
          value: raw,
        };
        entries.push({
          id: metricId(metric),
          label: `${field.label}: ${raw}`,
          group: field.label,
          metric,
        });
      }
    } else if (field.fieldType === "checkbox") {
      const metric: DashboardMetric = { kind: "fieldChecked", field: field.key };
      entries.push({
        id: metricId(metric),
        label: field.label,
        group: field.label,
        metric,
      });
    }
  }

  return entries;
}

/**
 * Drop metrics not present in the catalog (stale field references, unknown
 * kinds), de-duplicate by id, and cap at MAX_DASHBOARD_METRICS. Order preserved.
 */
export function sanitizeSelection(
  metrics: DashboardMetric[],
  catalog: DashboardMetricCatalogEntry[],
): DashboardMetric[] {
  const known = new Map(catalog.map((entry) => [entry.id, entry.metric]));
  const seen = new Set<string>();
  const result: DashboardMetric[] = [];
  for (const metric of metrics) {
    const id = metricId(metric);
    if (!known.has(id) || seen.has(id)) continue;
    seen.add(id);
    result.push(metric);
    if (result.length >= MAX_DASHBOARD_METRICS) break;
  }
  return result;
}

// --- resolution -------------------------------------------------------------

/** Props for a rendered `StatCard` (values already German-formatted). */
export type ResolvedMetric = {
  id: string;
  label: string;
  value: string;
  delta?: string;
  hero?: boolean;
};

export type MetricContext = {
  active: Registration[]; // non-deleted registrations of the current camp
  finance: FinanceSummary;
  camp: Camp;
  catalog: DashboardMetricCatalogEntry[];
};

const ratio = (part: number, whole: number): number =>
  whole > 0 ? part / whole : 0;

/**
 * Compute a card's props for a descriptor. Returns null when the metric is not
 * in the catalog (stale field reference) so the dashboard can skip it silently.
 */
export function resolveMetric(
  metric: DashboardMetric,
  ctx: MetricContext,
  isHero: boolean,
): ResolvedMetric | null {
  const id = metricId(metric);
  const entry = ctx.catalog.find((e) => e.id === id);
  if (!entry) return null;

  const { active, finance, camp } = ctx;
  const total = active.length;
  const base = { id, label: entry.label, hero: isHero };

  if (metric.kind === "builtin") {
    switch (metric.key) {
      case "registrations":
        return {
          ...base,
          value: formatNumber(total),
          delta: `${formatNumber(camp.registrations)} ${de.common.of} ${formatNumber(camp.capacity)} ${de.camps.capacity.toLowerCase()}`,
        };
      case "paid":
        return {
          ...base,
          value: formatNumber(finance.paidCount),
          delta: `${formatPercent(ratio(finance.paidCount, total))} ${de.registrations.title.toLowerCase()}`,
        };
      case "open": {
        const openCount = active.filter((r) => r.payment !== "paid").length;
        return {
          ...base,
          value: formatNumber(openCount),
          delta: `${formatCurrency(finance.outstanding)} ${de.payments.outstanding.toLowerCase()}`,
        };
      }
      case "revenue":
        return {
          ...base,
          value: formatCurrency(finance.collected),
          delta: `${formatPercent(ratio(finance.collected, finance.expected))} ${de.payments.expected.toLowerCase()}`,
        };
      case "outstanding":
        return {
          ...base,
          value: formatCurrency(finance.outstanding),
          delta: `${formatPercent(ratio(finance.outstanding, finance.expected))} ${de.payments.expected.toLowerCase()}`,
        };
      case "capacity":
        return {
          ...base,
          value: `${formatNumber(total)} / ${formatNumber(camp.capacity)}`,
          delta: `${formatPercent(ratio(total, camp.capacity))} ${de.camps.capacity.toLowerCase()}`,
        };
    }
  }

  // Field-derived counts over the active registrations' dynamic answers.
  const count =
    metric.kind === "fieldChecked"
      ? active.filter((r) => r.formData[metric.field] === true).length
      : active.filter(
          (r) => String(r.formData[metric.field] ?? "") === metric.value,
        ).length;

  return {
    ...base,
    value: formatNumber(count),
    delta: `${formatPercent(ratio(count, total))} ${de.registrations.title.toLowerCase()}`,
  };
}
