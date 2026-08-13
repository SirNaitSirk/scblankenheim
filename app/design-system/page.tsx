import type { Metadata } from "next";
import { MountainHero } from "@/components/marketing/mountain-hero";
import { SiteNav } from "@/components/marketing/site-nav";
import { DashboardPreview } from "@/components/admin/dashboard-preview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";

export const metadata: Metadata = {
  title: "Design-System — CampConnect",
};

const inkSwatches = [
  { name: "ink-950", className: "bg-ink-950" },
  { name: "ink-700", className: "bg-ink-700" },
  { name: "ink-500", className: "bg-ink-500" },
  { name: "ink-300", className: "bg-ink-300" },
  { name: "ink-100", className: "bg-ink-100" },
  { name: "canvas", className: "bg-canvas" },
  { name: "paper", className: "bg-paper" },
];

const amberSwatches = [
  { name: "amber-600", className: "bg-amber-600" },
  { name: "amber-500", className: "bg-amber-500" },
  { name: "amber-400", className: "bg-amber-400" },
  { name: "amber-100", className: "bg-amber-100" },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border py-14">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <h2 className="mb-8 font-display text-2xl font-extrabold tracking-tight text-foreground">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="bg-canvas">
      {/* Hero — the Persuade surface */}
      <MountainHero />

      {/* Palette */}
      <Section title="Farben">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <Eyebrow>Monochrom · Ink</Eyebrow>
            <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-7">
              {inkSwatches.map((s) => (
                <div key={s.name} className="flex flex-col gap-2">
                  <div
                    className={`h-16 rounded-sm border border-border ${s.className}`}
                  />
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {s.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Eyebrow>Akzent · Amber</Eyebrow>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {amberSwatches.map((s) => (
                <div key={s.name} className="flex flex-col gap-2">
                  <div
                    className={`h-16 rounded-sm border border-border ${s.className}`}
                  />
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {s.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Typography */}
      <Section title="Typografie">
        <div className="flex flex-col gap-6">
          <div>
            <Eyebrow>Display · Archivo</Eyebrow>
            <p className="mt-3 font-display text-6xl font-black leading-none tracking-tight text-foreground">
              Ein Sommer in den Bergen
            </p>
          </div>
          <div>
            <Eyebrow>Fließtext · Geist</Eyebrow>
            <p className="mt-3 max-w-[60ch] text-base text-muted-foreground">
              Eine Woche Gemeinschaft, Abenteuer und Glaube — hier findest du
              alle Informationen zur Anmeldung, zur Packliste und zum Ablauf des
              Camps.
            </p>
          </div>
          <div>
            <Eyebrow>Label · Geist Mono</Eyebrow>
            <p className="mt-3 font-mono text-sm uppercase tracking-[0.2em] text-foreground">
              Anmeldung geöffnet
            </p>
          </div>
        </div>
      </Section>

      {/* Navigation */}
      <Section title="Navigation">
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <SiteNav variant="solid" />
        </div>
      </Section>

      {/* Buttons */}
      <Section title="Buttons">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Jetzt anmelden</Button>
            <Button variant="inverse">Zur Übersicht</Button>
            <Button variant="outline">Mehr erfahren</Button>
            <Button variant="ghost">Abbrechen</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Klein</Button>
            <Button size="md">Mittel</Button>
            <Button size="lg">Groß</Button>
            <Button disabled>Deaktiviert</Button>
          </div>
        </div>
      </Section>

      {/* Cards & badges */}
      <Section title="Karten & Status">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Sommercamp 2026</CardTitle>
              <CardDescription>12.–19. Juli · Blankenheim</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Noch 44 freie Plätze. Die Anmeldung ist bis zum 30. Juni
                geöffnet.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Status-Badges</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge tone="paid">Bezahlt</Badge>
              <Badge tone="pending">Offen</Badge>
              <Badge tone="neutral">Entwurf</Badge>
              <Badge tone="danger">Storniert</Badge>
            </CardContent>
          </Card>
          <Card className="bg-surface-inverse text-on-inverse">
            <CardHeader>
              <CardTitle className="text-on-inverse">
                Upgrade auf Pro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-on-inverse/70">
                Der dunkle Akzent-Card-Stil aus dem Dashboard.
              </p>
              <Button size="sm">Freischalten</Button>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Admin / Operate surface */}
      <Section title="Dashboard (Admin)">
        <DashboardPreview />
      </Section>

      <footer className="border-t border-border py-10">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
          <p className="text-xs text-muted-foreground">
            CampConnect Design-System · FCG Blankenheim Summercamp
          </p>
        </div>
      </footer>
    </main>
  );
}
