"use client";

import { Check, Copy } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { registerMessages } from "@/lib/register/messages";

const copy = registerMessages.form;
const RESET_MS = 2000;

type CopyStatus = "idle" | "copied" | "failed";

/**
 * Reference number on the success view with a copy button
 * (specs/031-landing-review-fixes research R7). The number stays selectable
 * text, so copying by hand still works when the clipboard is unavailable.
 */
export function CopyReference({ reference }: { reference: string }) {
  const [status, setStatus] = useState<CopyStatus>("idle");

  useEffect(() => {
    if (status === "idle") return;
    const id = setTimeout(() => setStatus("idle"), RESET_MS);
    return () => clearTimeout(id);
  }, [status]);

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(reference);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div className="mx-auto mt-6 max-w-sm">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {copy.referenceLabel}
      </p>
      <div className="mt-2 flex items-center justify-center gap-3">
        <span className="select-all font-display text-2xl font-extrabold tabular-nums tracking-tight text-foreground">
          {reference}
        </span>
        <Button type="button" size="sm" variant="outline" onClick={copyReference}>
          {status === "copied" ? (
            <Check size={16} weight="bold" aria-hidden />
          ) : (
            <Copy size={16} weight="bold" aria-hidden />
          )}
          {status === "copied" ? copy.copied : copy.copy}
        </Button>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {status === "failed" ? copy.copyFailed : copy.referenceMailHint}
      </p>
      <p role="status" className="sr-only">
        {status === "copied" ? copy.copiedStatus : status === "failed" ? copy.copyFailed : ""}
      </p>
    </div>
  );
}
