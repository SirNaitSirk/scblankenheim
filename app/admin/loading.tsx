import { Card } from "@/components/ui/card";
import { CardSkeleton, TableSkeleton } from "@/components/admin/states";
import { PageBody } from "@/components/admin/page-header";

/** Shown while an admin route's server data resolves. */
export default function AdminLoading() {
  return (
    <PageBody>
      <div className="flex flex-col gap-2">
        <div className="h-7 w-48 animate-pulse rounded-sm bg-ink-100" />
        <div className="h-4 w-72 animate-pulse rounded-sm bg-ink-100" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <Card className="p-0">
        <div className="border-b border-border p-6">
          <div className="h-5 w-40 animate-pulse rounded-sm bg-ink-100" />
        </div>
        <TableSkeleton />
      </Card>
    </PageBody>
  );
}
