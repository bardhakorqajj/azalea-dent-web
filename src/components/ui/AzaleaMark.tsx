type AzaleaMarkProps = {
  className?: string;
  /** Stroke weight in viewBox units. Lighter reads better at large sizes. */
  weight?: number;
};

/**
 * The clinic's azalea flower mark — five notched petals with radiating stamens —
 * redrawn as a vector from the illuminated shopfront sign and the etched glass panels.
 * It inherits `currentColor`, so it works on both the bone and ink surfaces.
 */
export function AzaleaMark({ className, weight = 3.1 }: AzaleaMarkProps) {
  const petal =
    "M50 40 C46 40.5 42.5 38 40.5 33 C37.5 26 38.5 16.8 43.5 16 C47 15.5 48 20 47.5 25 " +
    "C47.3 27.2 48.7 28.4 50 26.2 C51.3 28.4 52.7 27.2 52.5 25 C52 20 53 15.5 56.5 16 " +
    "C61.5 16.8 62.5 26 59.5 33 C57.5 38 54 40.5 50 40 Z";

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={weight}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {[0, 72, 144, 216, 288].map((angle) => (
        <path key={`petal-${angle}`} d={petal} transform={`rotate(${angle} 50 50)`} />
      ))}
      {[36, 108, 180, 252, 324].map((angle) => (
        <g key={`stamen-${angle}`} transform={`rotate(${angle} 50 50)`} strokeWidth={weight * 0.86}>
          <path d="M50 27 V10" transform="rotate(-7 50 50)" />
          <path d="M50 27 V10" transform="rotate(7 50 50)" />
        </g>
      ))}
    </svg>
  );
}
