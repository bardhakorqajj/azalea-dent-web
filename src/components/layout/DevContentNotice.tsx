import { missingClinicFacts } from "@/content/clinic";

/**
 * Development-only reminder of the clinic details that are still unset.
 * Never rendered in a production build.
 */
export function DevContentNotice() {
  if (process.env.NODE_ENV !== "development") return null;

  const missing = missingClinicFacts();
  if (missing.length === 0) return null;

  return (
    <aside className="fixed bottom-24 left-4 z-[60] max-w-xs rounded-sm border border-gold-500/60 bg-ink-950/95 p-4 text-[0.75rem] leading-relaxed text-bone-100 shadow-lg lg:bottom-4">
      <p className="font-semibold text-gold-300">Content still to fill in</p>
      <p className="mt-1 text-bone-300/80">
        Set these in <code className="text-gold-300">src/content/clinic.ts</code> — see
        CONTENT.md. Sections without data stay hidden.
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {missing.map((field) => (
          <li
            key={field}
            className="rounded-xs border border-bone-100/20 px-1.5 py-0.5 text-bone-200"
          >
            {field}
          </li>
        ))}
      </ul>
    </aside>
  );
}
