"use client";

import { WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/states";
import { PageBody } from "@/components/admin/page-header";
import { de } from "@/lib/admin/messages";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageBody>
      <EmptyState
        icon={WarningCircle}
        title={de.states.errorTitle}
        description={de.states.errorDescription}
        action={
          <Button variant="outline" size="sm" onClick={reset}>
            {de.common.retry}
          </Button>
        }
      />
    </PageBody>
  );
}
