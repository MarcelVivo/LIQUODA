export type ProcessStep = { title: string; text: string };

/**
 * Nummerierte Schrittfolge, wiederverwendet auf «So funktioniert es»
 * (Investoren, Emittenten) und «Für Emittenten» (Projektaufnahme).
 */
export default function ProcessSteps({ steps }: { steps: ProcessStep[] }) {
  return (
    <ol className="relative mt-10 space-y-8 border-l border-navy/15 pl-8">
      {steps.map((step, index) => (
        <li key={step.title} className="relative">
          <span
            className="absolute -left-[2.55rem] flex h-8 w-8 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white ring-4 ring-cream"
            aria-hidden="true"
          >
            {index + 1}
          </span>
          <h3 className="text-base font-semibold text-navy sm:text-lg">{step.title}</h3>
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-navy/80">{step.text}</p>
        </li>
      ))}
    </ol>
  );
}
