/** Joins class names, dropping falsy values. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Replaces `{token}` placeholders in a dictionary string. */
export function interpolate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/**
 * Initials for a monogram, ignoring titles.
 *
 * Abbreviations such as "Dr." and "Spec." are dropped, so
 * "Dr. Spec. Arbëreshë Korqaj" gives "AK" rather than "DS".
 */
export function initials(fullName: string): string {
  const names = fullName
    .split(/\s+/)
    .filter((part) => part.length > 0 && !part.endsWith("."));

  return names
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("sq") ?? "")
    .join("");
}
