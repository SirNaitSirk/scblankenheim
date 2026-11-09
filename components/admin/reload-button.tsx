"use client";

import { ArrowClockwise } from "@phosphor-icons/react";
import { de } from "@/lib/admin/messages";

/**
 * Reload for the home screen app, which has no pull to refresh and no address
 * bar (specs/040-admin-mobile-app). Hidden by CSS outside standalone mode, so
 * server and client render the same markup. A full reload also recovers from
 * an error page after a lost connection.
 */
export function ReloadButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      aria-label={de.shell.reload}
      title={de.shell.reload}
      className="hidden h-11 w-11 items-center justify-center rounded-input text-muted-foreground transition-colors duration-150 hover:bg-ink-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface standalone:flex md:h-9 md:w-9"
    >
      <ArrowClockwise size={20} weight="bold" />
    </button>
  );
}
