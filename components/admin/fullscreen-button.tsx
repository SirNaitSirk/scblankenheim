"use client";

import { ArrowsOut } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

/** Puts the element with `targetId` into full screen, for the beamer (specs/038-camp-feedback). */
export function FullscreenButton({ targetId, label }: { targetId: string; label: string }) {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => {
        const element = document.getElementById(targetId);
        void element?.requestFullscreen?.().catch(() => undefined);
      }}
    >
      <ArrowsOut size={16} weight="bold" />
      {label}
    </Button>
  );
}
