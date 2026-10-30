import { Fragment } from "react";
import type { Inline, LegalBlock, LegalSection } from "@/lib/legal/messages";
import { legalOperator, operatorAddressLines } from "@/lib/legal/operator";
import { OperatorValue } from "./operator-value";

function InlineParts({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((part, index) => {
        if (typeof part === "string") return <Fragment key={index}>{part}</Fragment>;
        if ("href" in part) {
          return (
            <a
              key={index}
              href={part.href}
              rel="noopener noreferrer"
              className="text-accent-strong underline underline-offset-4 transition-colors duration-150 hover:text-foreground"
            >
              {part.label}
            </a>
          );
        }
        return (
          <OperatorValue
            key={index}
            field={part.field}
            value={legalOperator[part.field]}
            link={part.link}
          />
        );
      })}
    </>
  );
}

function Block({ block }: { block: LegalBlock }) {
  switch (block.kind) {
    case "p":
      if (block.onlyIf && !legalOperator[block.onlyIf]) return null;
      return (
        <p className="mt-3 text-base leading-relaxed text-foreground">
          <InlineParts parts={block.parts} />
        </p>
      );
    case "list":
      return (
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-base leading-relaxed text-foreground marker:text-muted-foreground">
          {block.items.map((item, index) => (
            <li key={index}>
              <InlineParts parts={item} />
            </li>
          ))}
        </ul>
      );
    case "address":
      return (
        <address className="mt-3 flex flex-col gap-1 text-base not-italic leading-relaxed text-foreground">
          {operatorAddressLines(legalOperator).map((line) => (
            <span key={line.field}>
              <OperatorValue field={line.field} value={line.value} />
            </span>
          ))}
        </address>
      );
    case "sub":
      return (
        <h3 className="mt-6 text-base font-semibold text-foreground">{block.heading}</h3>
      );
  }
}

/** Sections of a legal page; each heading carries its anchor id. */
export function LegalBlocks({ sections }: { sections: readonly LegalSection[] }) {
  return (
    <div className="flex flex-col gap-12">
      {sections.map((section) => (
        <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`}>
          <h2
            id={`${section.id}-heading`}
            className="font-display text-2xl font-extrabold tracking-tight text-foreground"
          >
            {section.heading}
          </h2>
          {section.blocks.map((block, index) => (
            <Block key={index} block={block} />
          ))}
        </section>
      ))}
    </div>
  );
}
