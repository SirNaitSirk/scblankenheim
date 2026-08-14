"use client";

import { ArrowDown, ArrowUp, DotsSixVertical } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import { de } from "@/lib/admin/messages";
import type { ColumnDef } from "./registration-columns";

const t = de.registrations.columnsDialog;

export function ColumnSettingsDialog({
  open,
  columns,
  isHidden,
  onToggle,
  onMove,
  onReorder,
  onReset,
  onClose,
}: {
  open: boolean;
  /** Columns in the current (user) order. */
  columns: ColumnDef[];
  isHidden: (key: string) => boolean;
  onToggle: (key: string) => void;
  onMove: (key: string, direction: "up" | "down") => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  // Transient drag state only; the persisted order stays the source of truth.
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const endDrag = () => {
    setDraggingIndex(null);
    setOverIndex(null);
  };

  const drop = (index: number) => {
    if (draggingIndex !== null && draggingIndex !== index) {
      onReorder(draggingIndex, index);
    }
    endDrag();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t.title}
      description={t.description}
      closeLabel={t.close}
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="mr-auto"
          >
            {t.reset}
          </Button>
          <Button type="button" size="sm" onClick={onClose}>
            {t.close}
          </Button>
        </>
      }
    >
      <ul className="flex flex-col gap-1">
        {columns.map((column, index) => {
          const locked = column.alwaysVisible === true;
          return (
            <li
              key={column.key}
              draggable
              onDragStart={(e) => {
                setDraggingIndex(index);
                e.dataTransfer.effectAllowed = "move";
                // Firefox requires data to be set for a drag to start.
                e.dataTransfer.setData("text/plain", column.key);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (overIndex !== index) setOverIndex(index);
              }}
              onDrop={(e) => {
                e.preventDefault();
                drop(index);
              }}
              onDragEnd={endDrag}
              className={cn(
                "flex items-center justify-between gap-3 rounded-input px-2 py-2 transition-colors duration-150",
                draggingIndex === index
                  ? "opacity-50"
                  : overIndex === index && draggingIndex !== null
                    ? "bg-ink-100"
                    : "hover:bg-ink-50",
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  aria-label={t.dragHandle}
                  className="flex h-7 w-6 shrink-0 cursor-grab items-center justify-center text-ink-300 transition-colors duration-150 hover:text-muted-foreground active:cursor-grabbing"
                >
                  <DotsSixVertical size={16} weight="bold" />
                </span>
                <Switch
                  id={`col-${column.key}`}
                  checked={locked || !isHidden(column.key)}
                  onCheckedChange={() => !locked && onToggle(column.key)}
                  label={column.label}
                />
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label={de.fields.moveUp}
                  disabled={index === 0}
                  onClick={() => onMove(column.key, "up")}
                  className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors duration-150 hover:bg-ink-100 hover:text-foreground disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ArrowUp size={14} weight="bold" />
                </button>
                <button
                  type="button"
                  aria-label={de.fields.moveDown}
                  disabled={index === columns.length - 1}
                  onClick={() => onMove(column.key, "down")}
                  className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors duration-150 hover:bg-ink-100 hover:text-foreground disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ArrowDown size={14} weight="bold" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
}
