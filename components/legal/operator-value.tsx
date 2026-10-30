import { legalMessages } from "@/lib/legal/messages";
import { operatorFieldLabels, type OperatorField } from "@/lib/legal/operator";

const linkClass =
  "text-accent-strong underline underline-offset-4 transition-colors duration-150 hover:text-foreground";

/**
 * An operator value, or a highlighted gap while the association has not provided
 * it yet (specs/025-legal-pages, research R4). Mail and phone render as links.
 */
export function OperatorValue({
  field,
  value,
  link,
}: {
  field: OperatorField;
  value: string | string[] | null;
  link?: "mailto" | "tel";
}) {
  const text = Array.isArray(value) ? value.join(", ") : value;
  if (!text) {
    return (
      <mark className="rounded-sm bg-amber-100 px-1.5 py-0.5 font-medium text-amber-700 print:bg-transparent print:text-black">
        {legalMessages.links.gap}: {operatorFieldLabels[field]}
      </mark>
    );
  }
  if (link === "mailto") {
    return (
      <a href={`mailto:${text}`} className={linkClass}>
        {text}
      </a>
    );
  }
  if (link === "tel") {
    return (
      <a href={`tel:${text.replace(/[^\d+]/g, "")}`} className={linkClass}>
        {text}
      </a>
    );
  }
  return <>{text}</>;
}
