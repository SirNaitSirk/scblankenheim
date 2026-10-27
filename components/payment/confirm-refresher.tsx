"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  CONFIRM_POLL_INTERVAL_MS,
  CONFIRM_POLL_MAX_MS,
} from "@/lib/payment/limits";

/**
 * Re-renders the server page every few seconds while Stripe's confirmation is
 * on its way (research R12). The page itself decides what to show from the
 * stored state; after the time limit the `fallback` replaces `children`.
 */
export function ConfirmRefresher({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  const router = useRouter();
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => router.refresh(), CONFIRM_POLL_INTERVAL_MS);
    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
      setExpired(true);
    }, CONFIRM_POLL_MAX_MS);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [router]);

  return <>{expired ? fallback : children}</>;
}
