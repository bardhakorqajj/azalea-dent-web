import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  lead?: string;
  /** `h1` only on hero-less page headers. */
  as?: "h1" | "h2";
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
  /** Rendered under the lead — usually a CTA. */
  children?: React.ReactNode;
};

export function SectionHeading({
  eyebrow,
  title,
  lead,
  as: Heading = "h2",
  align = "left",
  tone = "light",
  className,
  children,
}: SectionHeadingProps) {
  const isDark = tone === "dark";

  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            "eyebrow flex items-center gap-3",
            align === "center" && "justify-center",
            isDark ? "text-gold-400" : "text-gold-700 dark:text-gold-400",
          )}
        >
          <span aria-hidden="true" className="h-px w-8 bg-current opacity-60" />
          {eyebrow}
        </p>
      )}
      <Heading
        className={cn(
          "mt-5 text-[2rem] leading-[1.12] sm:text-[2.6rem] lg:text-[3.1rem]",
          isDark ? "text-bone-50" : "text-ink-900 dark:text-bone-50",
        )}
      >
        {title}
      </Heading>
      {lead && (
        <p
          className={cn(
            "mt-5 text-[1.0625rem] leading-relaxed",
            align === "center" && "mx-auto",
            isDark ? "text-bone-200/80" : "text-ink-600 dark:text-bone-300",
          )}
        >
          {lead}
        </p>
      )}
      {children && <div className="mt-8">{children}</div>}
    </div>
  );
}
