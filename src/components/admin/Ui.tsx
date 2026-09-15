import Link from "next/link";

import { cn } from "@/lib/utils";

import { IconInfo, IconWarning } from "./Icons";

/**
 * The dashboard's presentational building blocks.
 *
 * All server components — none of them holds state. Anything that needs a
 * click handler lives in its own `"use client"` file, so the dashboard ships
 * as little JavaScript as it can get away with.
 */

// === Page furniture =======================================================

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-[1.75rem] leading-tight text-ink-900 sm:text-[2rem] dark:text-bone-50">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-[0.9375rem] text-ink-500 dark:text-bone-300">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2.5">{actions}</div>}
    </div>
  );
}

export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-[0.8125rem] text-ink-500 dark:text-bone-300">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="hover:text-ink-900 hover:underline dark:hover:text-bone-50"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={last ? "text-ink-700 dark:text-bone-100" : undefined}>
                  {item.label}
                </span>
              )}
              {!last && (
                <span aria-hidden="true" className="text-ink-300 dark:text-ink-500">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// === Cards ================================================================

export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  return <Tag className={cn("admin-card", className)}>{children}</Tag>;
}

export function CardHeader({
  title,
  hint,
  actions,
  className,
}: {
  title: string;
  hint?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "admin-divide flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-[0.9375rem] font-medium text-ink-900 dark:text-bone-50">
          {title}
        </h2>
        {hint && (
          <p className="mt-0.5 text-[0.8125rem] text-ink-500 dark:text-bone-300">{hint}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({
  children,
  className,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return <div className={cn(padded && "px-5 py-4", className)}>{children}</div>;
}

// === Buttons ==============================================================

type ButtonTone = "primary" | "secondary" | "quiet" | "danger";
type ButtonSize = "md" | "sm";

const tones: Record<ButtonTone, string> = {
  primary:
    "bg-ink-900 text-bone-50 hover:bg-ink-700 dark:bg-gold-400 dark:text-ink-950 dark:hover:bg-gold-300",
  secondary:
    "border border-ink-900/20 text-ink-800 hover:border-ink-900/45 hover:bg-ink-900/[0.04] dark:border-bone-100/25 dark:text-bone-100 dark:hover:border-bone-100/45 dark:hover:bg-bone-100/[0.06]",
  quiet:
    "text-ink-600 hover:bg-ink-900/[0.05] hover:text-ink-900 dark:text-bone-300 dark:hover:bg-bone-100/[0.07] dark:hover:text-bone-50",
  danger:
    "border border-[#b4442f]/35 text-[#96371f] hover:border-[#b4442f] hover:bg-[#b4442f]/[0.07] dark:border-[#e0806b]/40 dark:text-[#e8a08d] dark:hover:bg-[#e0806b]/10",
};

const buttonSizes: Record<ButtonSize, string> = {
  md: "min-h-10 px-4 text-[0.875rem]",
  sm: "min-h-9 px-3 text-[0.8125rem]",
};

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55";

export function buttonClass(
  tone: ButtonTone = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(buttonBase, tones[tone], buttonSizes[size], className);
}

export function ActionLink({
  href,
  children,
  tone = "secondary",
  size = "md",
  className,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  tone?: ButtonTone;
  size?: ButtonSize;
  className?: string;
  external?: boolean;
}) {
  const classes = buttonClass(tone, size, className);

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

// === Badges ===============================================================

type BadgeTone = "neutral" | "positive" | "warning" | "danger" | "info" | "gold";

const badgeTones: Record<BadgeTone, string> = {
  neutral:
    "bg-ink-900/[0.07] text-ink-600 dark:bg-bone-100/[0.09] dark:text-bone-200",
  positive: "bg-[#1f7a4d]/12 text-[#1a6640] dark:bg-[#4cb383]/15 dark:text-[#7fd0a8]",
  warning: "bg-[#b58224]/14 text-[#8a6217] dark:bg-[#e3b657]/15 dark:text-[#eece8a]",
  danger: "bg-[#b4442f]/12 text-[#96371f] dark:bg-[#e0806b]/15 dark:text-[#e8a08d]",
  info: "bg-[#2f6fb4]/12 text-[#255a91] dark:bg-[#6ba3dd]/15 dark:text-[#9cc4ea]",
  gold: "bg-gold-400/22 text-gold-700 dark:bg-gold-400/15 dark:text-gold-300",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.75rem] font-medium whitespace-nowrap",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export type { BadgeTone };

// === Callouts =============================================================

type CalloutTone = "info" | "warning" | "success" | "danger";

const calloutTones: Record<CalloutTone, string> = {
  info: "border-[#2f6fb4]/25 bg-[#2f6fb4]/[0.06] text-[#20486f] dark:border-[#6ba3dd]/25 dark:bg-[#6ba3dd]/[0.08] dark:text-[#b9d5ef]",
  warning:
    "border-gold-500/35 bg-gold-400/[0.10] text-[#6f4f12] dark:border-gold-400/30 dark:bg-gold-400/[0.09] dark:text-gold-300",
  success:
    "border-[#1f7a4d]/25 bg-[#1f7a4d]/[0.07] text-[#175637] dark:border-[#4cb383]/25 dark:bg-[#4cb383]/[0.09] dark:text-[#9fdcbe]",
  danger:
    "border-[#b4442f]/30 bg-[#b4442f]/[0.07] text-[#8a3219] dark:border-[#e0806b]/30 dark:bg-[#e0806b]/[0.09] dark:text-[#eaab99]",
};

export function Callout({
  title,
  children,
  tone = "info",
  className,
}: {
  title?: string;
  children?: React.ReactNode;
  tone?: CalloutTone;
  className?: string;
}) {
  const Icon = tone === "info" || tone === "success" ? IconInfo : IconWarning;

  return (
    <div
      className={cn(
        "flex gap-3 rounded-sm border px-4 py-3 text-[0.875rem] leading-relaxed",
        calloutTones[tone],
        className,
      )}
    >
      <Icon className="mt-0.5 h-[1.0625rem] w-[1.0625rem] shrink-0" />
      <div className="min-w-0">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cn(title && "mt-1")}>{children}</div>}
      </div>
    </div>
  );
}

// === Empty and loading states =============================================

export function EmptyState({
  title,
  hint,
  action,
  icon,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-ink-900/[0.06] text-ink-400 dark:bg-bone-100/[0.08] dark:text-ink-300">
          {icon}
        </div>
      )}
      <p className="font-display text-[1.125rem] text-ink-800 dark:text-bone-100">{title}</p>
      {hint && (
        <p className="mt-2 max-w-sm text-[0.875rem] leading-relaxed text-ink-500 dark:text-bone-300">
          {hint}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/**
 * Placeholder blocks for a `loading.tsx`. Deliberately plain grey rather than
 * an animated shimmer — an appointment list that pulses looks like something
 * is wrong with it.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-sm bg-ink-900/[0.07] dark:bg-bone-100/[0.08]", className)}
    />
  );
}

export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <Card>
      <div className="admin-divide border-b px-5 py-3.5">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="divide-y admin-divide">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="hidden h-4 w-28 sm:block" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </Card>
  );
}

// === Tables ===============================================================

export function TableWrap({ children }: { children: React.ReactNode }) {
  /* The table scrolls inside its own box rather than making the page scroll
     sideways, which is what keeps a wide table usable on a phone. */
  return (
    <div className="-mx-px overflow-x-auto">
      <table className="admin-table">{children}</table>
    </div>
  );
}

// === Misc =================================================================

export function FieldValue({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[0.75rem] font-medium tracking-wide text-ink-500 uppercase dark:text-ink-300">
        {label}
      </dt>
      <dd className="mt-1 text-[0.9375rem] text-ink-800 dark:text-bone-100">{children}</dd>
    </div>
  );
}

/** A dash, so an empty cell reads as "nothing here" rather than as a gap. */
export function Dash() {
  return (
    <span aria-hidden="true" className="text-ink-300 dark:text-ink-500">
      —
    </span>
  );
}
