"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_VERSION = 1;

/** A column the settings can order/hide, plus its default treatment. */
export type AvailableColumn = {
  key: string;
  alwaysVisible: boolean;
  /** Start hidden for a fresh user / when newly added (camp-field columns). */
  defaultHidden: boolean;
};

type StoredSettings = {
  v: number;
  order: string[];
  hidden: string[];
};

type ColumnSettingsState = {
  order: string[];
  hidden: string[];
};

function storageKey(userId: string | null): string {
  return `campconnect.registrations.columns.${userId ?? "anon"}`;
}

/** The state a fresh user (no stored payload) sees: full order, defaults hidden. */
function defaultState(available: AvailableColumn[]): ColumnSettingsState {
  return {
    order: available.map((c) => c.key),
    hidden: available.filter((c) => c.defaultHidden).map((c) => c.key),
  };
}

/**
 * Merges a raw stored payload with the columns available now: drops unknown keys,
 * appends newly available columns in their default position (hiding the ones that
 * are `defaultHidden`), and guarantees always-visible columns are never hidden.
 * Malformed input falls back to the default state.
 */
function normalize(raw: unknown, available: AvailableColumn[]): ColumnSettingsState {
  if (
    typeof raw !== "object" ||
    raw === null ||
    !Array.isArray((raw as StoredSettings).order)
  ) {
    return defaultState(available);
  }
  const stored = raw as StoredSettings;
  const byKey = new Map(available.map((c) => [c.key, c]));
  const storedOrder = stored.order.filter((k): k is string => typeof k === "string");
  const knownStored = new Set(storedOrder);

  const seen = new Set<string>();
  const order: string[] = [];
  for (const key of storedOrder) {
    if (byKey.has(key) && !seen.has(key)) {
      seen.add(key);
      order.push(key);
    }
  }
  // Append columns added since the settings were saved, in their default order.
  for (const column of available) {
    if (!seen.has(column.key)) order.push(column.key);
  }

  const storedHidden = new Set(
    (Array.isArray(stored.hidden) ? stored.hidden : []).filter(
      (k): k is string => typeof k === "string",
    ),
  );
  const hidden = order.filter((key) => {
    const column = byKey.get(key);
    if (!column || column.alwaysVisible) return false;
    // Newly available columns follow their default; known ones keep stored state.
    return knownStored.has(key) ? storedHidden.has(key) : column.defaultHidden;
  });

  return { order, hidden };
}

function persist(userId: string | null, next: ColumnSettingsState): void {
  try {
    const payload: StoredSettings = {
      v: STORAGE_VERSION,
      order: next.order,
      hidden: next.hidden,
    };
    window.localStorage.setItem(storageKey(userId), JSON.stringify(payload));
  } catch {
    // Storage unavailable (private mode / quota) — settings stay in-memory.
  }
}

/**
 * Per-user, browser-persisted column order + visibility for the registrations
 * table. Keyed by the Clerk user id in localStorage, so it survives logout/login
 * and reloads on the same device. The set of columns is dynamic (core columns plus
 * the current camp's fields), passed in as `available`. SSR-safe: renders defaults
 * first, then hydrates from localStorage in an effect (no `localStorage` access
 * during render). Mutations write through immediately — no persist effect that
 * could clobber another user's settings on a userId change.
 */
export function useColumnSettings(
  userId: string | null,
  available: AvailableColumn[],
) {
  const [state, setState] = useState<ColumnSettingsState>(() =>
    defaultState(available),
  );

  const alwaysVisible = useMemo(
    () => new Set(available.filter((c) => c.alwaysVisible).map((c) => c.key)),
    [available],
  );

  // Signature of the available columns so the hydrate effect re-runs when the
  // column set changes (e.g. switching camps) without depending on array identity.
  const signature = useMemo(
    () => available.map((c) => `${c.key}:${c.alwaysVisible ? 1 : 0}${c.defaultHidden ? 1 : 0}`).join("|"),
    [available],
  );

  // Hydrate from localStorage on mount / when the user or column set changes.
  useEffect(() => {
    let loaded: ColumnSettingsState;
    try {
      const raw = window.localStorage.getItem(storageKey(userId));
      loaded = raw ? normalize(JSON.parse(raw), available) : defaultState(available);
    } catch {
      loaded = defaultState(available);
    }
    // Canonical localStorage hydration: sync external store → React state once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(loaded);
    // `available` is captured via `signature`; excluded to avoid identity churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, signature]);

  const isHidden = useCallback(
    (key: string) => state.hidden.includes(key),
    [state.hidden],
  );

  const visibleColumns = useMemo(
    () => state.order.filter((key) => !state.hidden.includes(key)),
    [state.order, state.hidden],
  );

  const apply = useCallback(
    (next: ColumnSettingsState) => {
      setState(next);
      persist(userId, next);
    },
    [userId],
  );

  const toggle = useCallback(
    (key: string) => {
      if (alwaysVisible.has(key)) return;
      apply({
        ...state,
        hidden: state.hidden.includes(key)
          ? state.hidden.filter((k) => k !== key)
          : [...state.hidden, key],
      });
    },
    [state, apply, alwaysVisible],
  );

  const move = useCallback(
    (key: string, direction: "up" | "down") => {
      const index = state.order.indexOf(key);
      const target = direction === "up" ? index - 1 : index + 1;
      if (index === -1 || target < 0 || target >= state.order.length) return;
      const order = [...state.order];
      [order[index], order[target]] = [order[target], order[index]];
      apply({ ...state, order });
    },
    [state, apply],
  );

  // Move the column at `fromIndex` to `toIndex` (drag-and-drop reordering).
  const reorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      const { length } = state.order;
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= length ||
        toIndex >= length
      ) {
        return;
      }
      const order = [...state.order];
      const [moved] = order.splice(fromIndex, 1);
      order.splice(toIndex, 0, moved);
      apply({ ...state, order });
    },
    [state, apply],
  );

  // Reorder by column key (drag-and-drop on the table, which only sees the visible
  // columns): resolves both keys against the full order, so hidden columns in
  // between are preserved.
  const reorderKey = useCallback(
    (fromKey: string, toKey: string) =>
      reorder(state.order.indexOf(fromKey), state.order.indexOf(toKey)),
    [reorder, state.order],
  );

  const reset = useCallback(
    () => apply(defaultState(available)),
    [apply, available],
  );

  return {
    order: state.order,
    isHidden,
    visibleColumns,
    toggle,
    move,
    reorder,
    reorderKey,
    reset,
  };
}
