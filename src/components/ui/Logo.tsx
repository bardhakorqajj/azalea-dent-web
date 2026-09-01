import { AzaleaMark } from "./AzaleaMark";

type LogoProps = {
  className?: string;
  /** Hides the wordmark and shows the flower only (used in tight spaces). */
  markOnly?: boolean;
};

/**
 * The full clinic lockup: azalea mark + "AZALEA DENT / DENTAL CLINIC" wordmark,
 * matching the arrangement used on the shopfront and the reception wall.
 */
export function Logo({ className, markOnly = false }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className ?? ""}`}>
      <AzaleaMark className="h-9 w-9 shrink-0 text-gold-500" />
      {!markOnly && (
        <span className="flex flex-col leading-none">
          <span className="text-[0.98rem] font-semibold tracking-[0.16em] uppercase">
            Azalea Dent
          </span>
          <span className="mt-1 text-[0.5rem] tracking-[0.34em] uppercase opacity-70">
            Dental Clinic
          </span>
        </span>
      )}
    </span>
  );
}
