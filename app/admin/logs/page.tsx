import { ClipboardText } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/admin/states";
import { PageBody, PageHeader } from "@/components/admin/page-header";
import { getLogs } from "@/lib/admin/data";
import { formatDateTime } from "@/lib/format";
import { LOG_LEVEL_LABELS, de } from "@/lib/admin/messages";
import type { LogLevel } from "@/lib/admin/types";

const levelTone: Record<LogLevel, "neutral" | "pending" | "danger"> = {
  info: "neutral",
  warning: "pending",
  error: "danger",
};

export default async function LogsPage() {
  // MOCK BOUNDARY: swap for real Supabase reads (server-side).
  const logs = await getLogs();

  return (
    <PageBody>
      <PageHeader title={de.logs.title} description={de.logs.description} />

      <Card className="flex flex-col">
        {logs.length === 0 ? (
          <EmptyState
            icon={ClipboardText}
            title={de.logs.empty.title}
            description={de.logs.empty.description}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-6 py-3 text-left font-medium">
                    {de.logs.columns.level}
                  </th>
                  <th className="hidden px-6 py-3 text-left font-medium sm:table-cell">
                    {de.logs.columns.actor}
                  </th>
                  <th className="px-6 py-3 text-left font-medium">
                    {de.logs.columns.event}
                  </th>
                  <th className="hidden px-6 py-3 text-right font-medium md:table-cell">
                    {de.logs.columns.time}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="align-top text-foreground">
                    <td className="px-6 py-4">
                      <Badge tone={levelTone[log.level]}>
                        {LOG_LEVEL_LABELS[log.level]}
                      </Badge>
                    </td>
                    <td className="hidden px-6 py-4 text-muted-foreground sm:table-cell">
                      {log.actor}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-xs text-muted-foreground">
                          {log.action}
                        </span>
                        <span>{log.message}</span>
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 text-right font-mono text-xs text-muted-foreground md:table-cell">
                      {formatDateTime(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageBody>
  );
}
