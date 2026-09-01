import Link from "next/link";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "onDark" | "onDarkOutline";
type Size = "md" | "sm";

const variants: Record<Variant, string> = {
  primary: "bg-ink-900 text-bone-50 hover:bg-ink-700",
  secondary:
    "border border-ink-900/25 text-ink-900 hover:border-ink-900 hover:bg-ink-900 hover:text-bone-50",
  onDark: "bg-bone-50 text-ink-950 hover:bg-gold-300",
  onDarkOutline:
    "border border-bone-100/30 text-bone-100 hover:border-gold-400 hover:text-gold-300",
};

const sizes: Record<Size, string> = {
  md: "min-h-12 px-7 py-3.5 text-[0.72rem]",
  sm: "min-h-11 px-5 py-3 text-[0.68rem]",
};

const shared =
  "group inline-flex items-center justify-center gap-2.5 rounded-sm font-medium uppercase tracking-[0.14em] transition-colors duration-300";

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  /** Renders an arrow that nudges on hover. */
  withArrow?: boolean;
  external?: boolean;
} & Omit<React.ComponentProps<typeof Link>, "href" | "children" | "className">;

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  withArrow = false,
  external = false,
  ...rest
}: ButtonLinkProps) {
  const classes = cn(shared, variants[variant], sizes[size], className);
  const content = (
    <>
      {children}
      {withArrow && (
        <span
          aria-hidden="true"
          className="transition-transform duration-300 group-hover:translate-x-1"
        >
          &rarr;
        </span>
      )}
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...rest}>
      {content}
    </Link>
  );
}

type ButtonProps = {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        shared,
        variants[variant],
        sizes[size],
        "disabled:cursor-not-allowed disabled:opacity-55",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
