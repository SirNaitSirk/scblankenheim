"use client";

import { type Icon, Plus, UserPlus } from "@phosphor-icons/react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

const PENDING = "Diese Aktion folgt mit der Datenanbindung.";

// Icon registry keyed by string so this client component can be driven from a
// server component (a component function cannot cross the server/client boundary).
const ICONS: Record<string, Icon> = {
  plus: Plus,
  userPlus: UserPlus,
};

/**
 * A present, honest action button for flows that require the (not-yet-wired) data
 * layer. Instead of faking success it states the feature status via a toast.
 */
export function PendingAction({
  label,
  icon,
  variant = "primary",
}: {
  label: string;
  icon?: keyof typeof ICONS;
  variant?: "primary" | "outline" | "ghost";
}) {
  const [toast, setToast] = useState(false);
  const Glyph = icon ? ICONS[icon] : null;

  const trigger = useCallback(() => {
    setToast(true);
    window.setTimeout(() => setToast(false), 2200);
  }, []);

  return (
    <>
      <Button size="sm" variant={variant} onClick={trigger}>
        {Glyph ? <Glyph size={16} weight="bold" /> : null}
        {label}
      </Button>
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-pill bg-surface-inverse px-4 py-2 text-sm text-on-inverse shadow-pop"
        >
          {PENDING}
        </div>
      )}
    </>
  );
}
