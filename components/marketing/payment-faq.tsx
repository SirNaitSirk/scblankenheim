import { Reveal } from "@/components/marketing/reveal";

const methods = ["Karte", "Apple Pay", "Google Pay", "PayPal"];

/**
 * Payment reassurance (Persuade): short, centered trust block explaining that
 * payment happens securely during registration.
 */
export function PaymentFaq() {
  return (
    <section className="border-t border-border bg-surface">
      <div className="mx-auto max-w-[52rem] px-6 py-24 text-center md:px-10 lg:py-32">
        <Reveal>
          <h2 className="mx-auto max-w-[22ch] font-display text-4xl font-black leading-[1.04] tracking-tight text-foreground md:text-5xl">
            Sicher bezahlen, direkt bei der Anmeldung
          </h2>
          <p className="mx-auto mt-6 max-w-[46ch] text-lg leading-relaxed text-muted-foreground">
            Die Bezahlung läuft sicher online direkt bei der Anmeldung. Im
            Teilnahmebeitrag sind Übernachtung und Verpflegung für die ganze
            Woche enthalten.
          </p>
        </Reveal>

        <Reveal delay={120} className="mt-10">
          <ul className="flex flex-wrap items-center justify-center gap-3">
            {methods.map((method) => (
              <li
                key={method}
                className="rounded-pill border border-border bg-canvas px-5 py-2 text-sm font-medium text-foreground"
              >
                {method}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
