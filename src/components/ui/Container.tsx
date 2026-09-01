import { cn } from "@/lib/utils";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
  /** `wide` for full layouts, `text` for reading-width prose. */
  width?: "wide" | "default" | "text";
};

const widths = {
  wide: "max-w-[100rem]",
  default: "max-w-[88rem]",
  text: "max-w-[46rem]",
};

export function Container({ children, className, width = "default" }: ContainerProps) {
  return (
    <div className={cn("mx-auto w-full px-6 sm:px-8 lg:px-12", widths[width], className)}>
      {children}
    </div>
  );
}
