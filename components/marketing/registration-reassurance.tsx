import { Check } from "@phosphor-icons/react";
import { registerMessages } from "@/lib/register/messages";

const copy = registerMessages.steps.reassurance;

/**
 * „So geht es weiter“ on the review step, right above the binding submit
 * (specs/031-landing-review-fixes US2): what happens next and whom to write
 * when plans change. Static, no promises beyond what the system does.
 */
export function RegistrationReassurance() {
  return (
    <div className="mt-6 rounded-input border border-border bg-sand-50 px-5 py-4 text-sm leading-relaxed">
      <p className="font-semibold text-foreground">{copy.title}</p>
      <ul className="mt-2 flex flex-col gap-1.5 text-muted-foreground">
        {copy.items.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <Check size={16} weight="bold" className="mt-0.5 shrink-0 text-amber-700" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-muted-foreground">
        {copy.contactLead}{" "}
        <a
          href={`mailto:${copy.contactEmail}`}
          className="font-medium text-foreground underline decoration-amber-500/60 underline-offset-2 hover:decoration-amber-600"
        >
          {copy.contactEmail}
        </a>
        .
      </p>
    </div>
  );
}
