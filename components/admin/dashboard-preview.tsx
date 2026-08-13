import { StatCard } from "@/components/admin/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type Registration = {
  name: string;
  camp: string;
  id: string;
  amount: string;
  status: "paid" | "pending";
};

const rows: Registration[] = [
  { name: "Lena Fischer", camp: "Sommercamp 2026", id: "#A-3471", amount: "195,00 €", status: "paid" },
  { name: "Jonas Weber", camp: "Sommercamp 2026", id: "#A-3472", amount: "195,00 €", status: "pending" },
  { name: "Mia Schulz", camp: "Sommercamp 2026", id: "#A-3473", amount: "150,00 €", status: "paid" },
];

/** Compact preview of the admin (Operate) surface built on the same tokens. */
export function DashboardPreview() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Anmeldungen" value="2.023" delta="+9,3 % ggü. Vorwoche" tone="positive" hero />
        <StatCard label="Bezahlt" value="1.457" delta="+1,7 %" tone="positive" />
        <StatCard label="Offen" value="566" delta="−2,9 %" tone="positive" />
        <StatCard label="Einnahmen" value="284.200 €" delta="+4,2 %" tone="positive" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="font-display text-base font-bold tracking-tight">
              Letzte Anmeldungen
            </h3>
            <span className="text-xs text-muted-foreground">Alle anzeigen</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="hidden px-6 py-3 font-medium sm:table-cell">Camp</th>
                <th className="hidden px-6 py-3 font-medium sm:table-cell">ID</th>
                <th className="px-6 py-3 font-medium">Betrag</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id} className="text-foreground">
                  <td className="px-6 py-4 font-medium">{row.name}</td>
                  <td className="hidden px-6 py-4 text-muted-foreground sm:table-cell">
                    {row.camp}
                  </td>
                  <td className="hidden px-6 py-4 font-mono text-xs text-muted-foreground sm:table-cell">
                    {row.id}
                  </td>
                  <td className="px-6 py-4">{row.amount}</td>
                  <td className="px-6 py-4">
                    <Badge tone={row.status === "paid" ? "paid" : "pending"}>
                      {row.status === "paid" ? "Bezahlt" : "Offen"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
