"use client";

import { Printer } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

/** Opens the browser print dialog for the page's `.print-sheet`. */
export function PrintButton({ label }: { label: string }) {
  return (
    <Button size="sm" onClick={() => window.print()}>
      <Printer size={16} weight="bold" />
      {label}
    </Button>
  );
}
