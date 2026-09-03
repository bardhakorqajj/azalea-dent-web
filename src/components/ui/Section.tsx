import { cn } from "@/lib/utils";

type SectionProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
  /** Background surface. `ink` also switches focus rings to gold. */
  surface?: "bone" | "bone-warm" | "ink";
  /** Vertical rhythm. */
  spacing?: "default" | "tight" | "loose" | "none";
  as?: "section" | "div" | "footer";
};

const surfaces = {
  bone: "bg-bone-50 text-ink-900 dark:bg-ink-950 dark:text-bone-50",
  "bone-warm": "bg-bone-100 text-ink-900 dark:bg-ink-900 dark:text-bone-50",
  // Already dark by design — unaffected by site theme.
  ink: "bg-ink-950 text-bone-100",
};

const spacings = {
  none: "",
  tight: "py-14 sm:py-16",
  default: "py-20 sm:py-24 lg:py-32",
  loose: "py-24 sm:py-32 lg:py-44",
};

export function Section({
  children,
  className,
  id,
  surface = "bone",
  spacing = "default",
  as: Tag = "section",
}: SectionProps) {
  return (
    <Tag
      id={id}
      data-surface={surface === "ink" ? "dark" : "light"}
      className={cn(surfaces[surface], spacings[spacing], className)}
    >
      {children}
    </Tag>
  );
}
