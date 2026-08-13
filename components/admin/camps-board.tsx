"use client";

import { GearSix, Plus } from "@phosphor-icons/react";
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";
import { formatCurrency, formatDateLong, formatNumber } from "@/lib/format";
import { de } from "@/lib/admin/messages";
import type { Camp } from "@/lib/admin/types";

const PENDING = "Diese Aktion folgt mit der Datenanbindung.";

export function CampsBoard({ camps: initialCamps }: { camps: Camp[] }) {
  const [camps, setCamps] = useState(initialCamps);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const setCurrent = useCallback((id: string) => {
    setCamps((cs) => cs.map((c) => ({ ...c, isCurrent: c.id === id })));
  }, []);

  return (
    <>
      <PageHeader
        title={de.camps.title}
        description={de.camps.description}
        actions={
          <Button size="sm" onClick={() => showToast(PENDING)}>
            <Plus size={16} weight="bold" />
            {de.camps.create}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {camps.map((camp) => {
          const fill = Math.min(
            100,
            Math.round((camp.registrations / camp.capacity) * 100),
          );
          return (
            <Card key={camp.id} className="flex flex-col gap-4 p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
                      {camp.name}
                    </h2>
                    {camp.isCurrent && (
                      <Badge tone="paid">{de.camps.current}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {camp.location}
                  </p>
                </div>
                <Badge tone={camp.registrationOpen ? "pending" : "neutral"}>
                  {camp.registrationOpen
                    ? de.camps.registrationOpen
                    : de.camps.registrationClosed}
                </Badge>
              </div>

              <p className="text-sm text-foreground">
                {formatDateLong(camp.startDate)} bis{" "}
                {formatDateLong(camp.endDate)}
              </p>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{de.camps.capacity}</span>
                  <span className="font-mono tabular-nums">
                    {formatNumber(camp.registrations)} {de.common.of}{" "}
                    {formatNumber(camp.capacity)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-pill bg-ink-100">
                  <div
                    className="h-full rounded-pill bg-accent"
                    style={{ width: `${fill}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <div className="flex flex-col">
                  <span className="font-display text-base font-bold tracking-tight text-foreground">
                    {formatCurrency(camp.basePrice)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {de.camps.formFields(camp.formFieldCount)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => showToast(PENDING)}
                  >
                    <GearSix size={16} weight="regular" />
                    {de.camps.configureFields}
                  </Button>
                  {!camp.isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrent(camp.id)}
                    >
                      {de.camps.setCurrent}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

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
