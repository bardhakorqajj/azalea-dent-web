import { cn } from "@/lib/utils";

/**
 * Charts, drawn as inline SVG.
 *
 * No charting library: these three shapes are all the dashboard needs, and a
 * dependency would add far more to the bundle than it saves. Everything is
 * plain SVG in the server render, so a chart is visible before any JavaScript
 * loads and prints correctly.
 *
 * Colour is carried by CSS custom properties from the site's own palette, so
 * charts follow the theme rather than hard-coding light-mode colours.
 *
 * These plot only what the database actually holds. A series with nothing in
 * it renders an empty state, never a placeholder curve.
 */

export type Point = { label: string; value: number; hint?: string };

/** Nice round upper bound, so gridlines land on readable numbers. */
function axisMax(values: number[]): number {
  const peak = Math.max(0, ...values);
  if (peak === 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(peak));
  const normalised = peak / magnitude;
  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10;
  return step * magnitude;
}

export function BarChart({
  data,
  emptyLabel,
  className,
  height = 168,
  /** Labels get crowded on a phone, so only every nth is drawn. */
  labelEvery = 1,
}: {
  data: Point[];
  emptyLabel: string;
  className?: string;
  height?: number;
  labelEvery?: number;
}) {
  const hasData = data.some((point) => point.value > 0);
  if (data.length === 0 || !hasData) {
    return <ChartEmpty label={emptyLabel} className={className} height={height} />;
  }

  const max = axisMax(data.map((point) => point.value));

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-end gap-[3px]" style={{ height }} role="presentation">
        {data.map((point, index) => {
          const ratio = point.value / max;
          return (
            <div key={`${point.label}-${index}`} className="flex min-w-0 flex-1 flex-col justify-end">
              <div
                title={point.hint ?? `${point.label}: ${point.value}`}
                className="rounded-t-[2px] bg-ink-800 transition-colors dark:bg-gold-400"
                /* A non-zero value always gets a visible sliver, so "1" does
                   not look the same as "0". */
                style={{ height: `${Math.max(ratio * 100, point.value > 0 ? 3 : 0)}%` }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex gap-[3px] text-[0.6875rem] text-ink-400 dark:text-ink-300">
        {data.map((point, index) => (
          <div
            key={`label-${point.label}-${index}`}
            className="min-w-0 flex-1 truncate text-center"
          >
            {index % labelEvery === 0 ? point.label : ""}
          </div>
        ))}
      </div>

      {/* The numbers themselves, for anyone who cannot see the bars. */}
      <table className="sr-only">
        <tbody>
          {data.map((point, index) => (
            <tr key={`row-${point.label}-${index}`}>
              <th scope="row">{point.label}</th>
              <td>{point.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * A horizontal bar list — the right shape for "most requested services",
 * where the labels are long and the number of rows is small.
 */
export function RankedBars({
  data,
  emptyLabel,
  className,
}: {
  data: Point[];
  emptyLabel: string;
  className?: string;
}) {
  if (data.length === 0) {
    return (
      <p className={cn("py-6 text-center text-[0.875rem] text-ink-400 dark:text-ink-300", className)}>
        {emptyLabel}
      </p>
    );
  }

  const max = Math.max(1, ...data.map((point) => point.value));

  return (
    <ul className={cn("space-y-3", className)}>
      {data.map((point, index) => (
        <li key={`${point.label}-${index}`}>
          <div className="flex items-baseline justify-between gap-3 text-[0.875rem]">
            <span className="min-w-0 truncate text-ink-700 dark:text-bone-200">
              {point.label}
            </span>
            <span className="tnum shrink-0 font-medium text-ink-900 dark:text-bone-50">
              {point.value}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-900/[0.08] dark:bg-bone-100/[0.10]">
            <div
              className="h-full rounded-full bg-oak-400 dark:bg-gold-400"
              style={{ width: `${Math.max((point.value / max) * 100, 2)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * A donut for a breakdown by status.
 *
 * Each slice gets its own colour from a fixed list, and the legend repeats the
 * numbers — colour is never the only thing distinguishing two slices.
 */
export function DonutChart({
  data,
  emptyLabel,
  className,
  centreLabel,
  centreValue,
}: {
  data: (Point & { tone?: string })[];
  emptyLabel: string;
  className?: string;
  centreLabel?: string;
  centreValue?: string | number;
}) {
  const total = data.reduce((sum, point) => sum + point.value, 0);

  if (total === 0) {
    return (
      <p className={cn("py-6 text-center text-[0.875rem] text-ink-400 dark:text-ink-300", className)}>
        {emptyLabel}
      </p>
    );
  }

  const RADIUS = 42;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  /* Each slice's start is the sum of the arcs before it, worked out without a
     running variable: mutating one while rendering gives a different answer on
     a re-render, which for a donut means slices drawn over each other. With at
     most a handful of statuses the repeated sum costs nothing. */
  const arcs = data.map((point) => (point.value / total) * CIRCUMFERENCE);
  const slices = data.map((point, index) => ({
    point,
    length: arcs[index] ?? 0,
    offset: arcs.slice(0, index).reduce((sum, arc) => sum + arc, 0),
    colour: point.tone ?? DONUT_COLOURS[index % DONUT_COLOURS.length],
  }));

  return (
    <div className={cn("flex flex-col items-center gap-6 sm:flex-row sm:justify-center", className)}>
      <div className="relative shrink-0">
        <svg viewBox="0 0 100 100" className="h-[8.5rem] w-[8.5rem] -rotate-90">
          {slices.map((slice, index) =>
            slice.point.value === 0 ? null : (
              <circle
                key={`${slice.point.label}-${index}`}
                cx="50"
                cy="50"
                r={RADIUS}
                fill="none"
                strokeWidth="12"
                stroke={slice.colour}
                strokeDasharray={`${slice.length} ${CIRCUMFERENCE - slice.length}`}
                strokeDashoffset={-slice.offset}
              />
            ),
          )}
        </svg>

        {(centreValue !== undefined || centreLabel) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {centreValue !== undefined && (
              <span className="tnum font-display text-[1.5rem] leading-none text-ink-900 dark:text-bone-50">
                {centreValue}
              </span>
            )}
            {centreLabel && (
              <span className="mt-1 max-w-[5rem] text-[0.6875rem] leading-tight text-ink-400 dark:text-ink-300">
                {centreLabel}
              </span>
            )}
          </div>
        )}
      </div>

      <ul className="min-w-0 space-y-2 text-[0.875rem]">
        {slices.map((slice, index) => (
          <li
            key={`legend-${slice.point.label}-${index}`}
            className="flex items-center gap-2.5"
          >
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: slice.colour }}
            />
            <span className="min-w-0 truncate text-ink-600 dark:text-bone-300">
              {slice.point.label}
            </span>
            <span className="tnum ml-auto shrink-0 font-medium text-ink-900 dark:text-bone-50">
              {slice.point.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Slice colours, drawn from the clinic's palette rather than a generic chart
 * ramp: oak and gold from the reception desk and the sign, with two muted
 * supporting tones. All of them hold up on both the light and the dark ground.
 */
const DONUT_COLOURS = ["#2e3438", "#c9a276", "#e3b657", "#838c91", "#b1885c", "#a9b0b4"];

function ChartEmpty({
  label,
  className,
  height,
}: {
  label: string;
  className?: string;
  height: number;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-sm border border-dashed border-ink-900/12 text-[0.875rem] text-ink-400 dark:border-bone-100/12 dark:text-ink-300",
        className,
      )}
      style={{ height }}
    >
      {label}
    </div>
  );
}
