import { clinic, type TeamMember } from "@/content/clinic";
import { locales, type Locale } from "@/i18n/config";
import { text, type TeamMemberRow } from "@/lib/db/types";

import { getPublicTeam } from "./content";

/**
 * The team as the public website should show it.
 *
 * Same rule as the services: the clinic's own list in `src/content/clinic.ts`
 * is what the site publishes until the dashboard has an active team member,
 * and the shape returned is the shape the `Team` section already renders.
 */

export type PublicTeamMember = TeamMember & {
  /** An uploaded portrait, served from /api/media. Absent for a shipped member. */
  photoUrl?: string;
};

function bothLanguages(
  value: Record<string, string | undefined> | null | undefined,
): { sq: string; en: string } {
  const filled = {} as Record<Locale, string>;
  for (const locale of locales) filled[locale] = text(value ?? {}, locale);
  return filled as { sq: string; en: string };
}

function fromRow(row: TeamMemberRow): PublicTeamMember {
  const bio = bothLanguages(row.bio);

  return {
    name: row.name,
    role: bothLanguages(row.role),
    /* Omitted rather than an empty pair, because the section only renders the
       bio when there is one. */
    ...(bio.sq !== "" || bio.en !== "" ? { bio } : {}),
    ...(row.photo_id ? { photoUrl: `/api/media/${row.photo_id}` } : {}),
  };
}

export async function publicTeam(): Promise<PublicTeamMember[]> {
  const rows = await getPublicTeam();
  return rows.length > 0 ? rows.map(fromRow) : [...clinic.team];
}
