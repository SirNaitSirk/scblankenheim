"use client";

import { useCallback, useState } from "react";

/** Small status toast shared by the feedback admin cards, in the style of the bus settings. */
export function useFeedbackToast() {
  const [message, setMessage] = useState<string | null>(null);
  const show = useCallback((text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 3000);
  }, []);
  const toast = message ? (
    <div
      role="status"
      className="fixed bottom-20 left-1/2 z-[60] -translate-x-1/2 rounded-pill bg-surface-inverse px-4 py-2 text-sm text-on-inverse shadow-pop sm:bottom-6"
    >
      {message}
    </div>
  ) : null;
  return { show, toast };
}
