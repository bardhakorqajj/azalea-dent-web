import type { StaticImageData } from "next/image";

/**
 * Team portraits.
 *
 * Drop each portrait into `src/assets/images/team/`, import it here and
 * reference the key from `clinic.team[].photo`. Members without a portrait get
 * a typographic monogram card instead, so the section still looks intentional.
 *
 * Example:
 *   import drExample from "@/assets/images/team/dr-example.jpg";
 *   export const teamPhotos = { "dr-example": drExample };
 */
export const teamPhotos: Record<string, StaticImageData> = {};
