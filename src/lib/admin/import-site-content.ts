import { services as staticServices } from "@/content/services";
import { clinic } from "@/content/clinic";
import { en } from "@/i18n/dictionaries/en";
import { sq } from "@/i18n/dictionaries/sq";
import { createFaqItem, faqCount } from "@/lib/db/repos/content";
import { createService, serviceCount, serviceSlugAvailable } from "@/lib/db/repos/services";
import { createTeamMember, teamCount, teamSlugAvailable } from "@/lib/db/repos/team";
import { slugify } from "@/lib/admin/forms";

/**
 * Imports the content the website is published with into the database, so it
 * becomes editable in the dashboard.
 *
 * This exists because of how the fallback works. The public site reads the
 * database and falls back to `src/content` and `src/i18n` when a table is
 * empty, which means a fresh deployment looks exactly right and the dashboard
 * looks empty. That is correct but not useful: the clinic wants to *edit* the
 * eight services already on the site, not retype them.
 *
 * It is additive and idempotent. Nothing is overwritten and nothing is
 * duplicated — a slug that already exists is skipped — so pressing the button
 * twice imports nothing the second time, and it cannot undo an edit made after
 * the first import.
 */

export type ImportResult = {
  services: number;
  team: number;
  faq: number;
  total: number;
};

export async function importSiteContent(): Promise<ImportResult> {
  const result: ImportResult = { services: 0, team: 0, faq: 0, total: 0 };

  /* --- Services -------------------------------------------------------- */
  for (const [index, service] of staticServices.entries()) {
    if (!(await serviceSlugAvailable(service.slug))) continue;

    await createService({
      slug: service.slug,
      title: { sq: service.title.sq, en: service.title.en },
      summary: { sq: service.summary.sq, en: service.summary.en },
      /* The site stores body copy as an array of paragraphs; the dashboard
         edits it as one field with blank lines between them. */
      body: {
        sq: service.body.map((paragraph) => paragraph.sq).join("\n\n"),
        en: service.body.map((paragraph) => paragraph.en).join("\n\n"),
      },
      highlights: service.highlights.map((highlight) => ({
        sq: highlight.sq,
        en: highlight.en,
      })),
      priceText: {},
      durationMinutes: null,
      imageId: null,
      seoTitle: {},
      seoDescription: {},
      isActive: true,
      isFeatured: index < 3,
    });

    result.services += 1;
  }

  /* --- Team ------------------------------------------------------------ */
  for (const member of clinic.team) {
    const slug = slugify(member.name);
    if (slug === "" || !(await teamSlugAvailable(slug))) continue;

    await createTeamMember({
      name: member.name,
      slug,
      role: { sq: member.role.sq, en: member.role.en },
      bio: member.bio ? { sq: member.bio.sq, en: member.bio.en } : {},
      qualifications: [],
      specialties: [],
      photoId: null,
      socials: {},
      isActive: true,
    });

    result.team += 1;
  }

  /* --- FAQ ------------------------------------------------------------- */
  /* Only when the table is empty: the questions have no slug to match on, so
     re-importing would duplicate them. */
  if ((await faqCount()) === 0) {
    for (const [index, item] of sq.faq.items.entries()) {
      const english = en.faq.items[index];

      await createFaqItem({
        question: { sq: item.question, en: english?.question ?? item.question },
        answer: { sq: item.answer, en: english?.answer ?? item.answer },
        isActive: true,
      });

      result.faq += 1;
    }
  }

  result.total = result.services + result.team + result.faq;
  return result;
}

/** Whether there is anything left to import, for the button's hint. */
export async function siteContentImportable(): Promise<boolean> {
  const [services, team, faq] = await Promise.all([
    serviceCount(),
    teamCount(),
    faqCount(),
  ]);

  return (
    services < staticServices.length ||
    team < clinic.team.length ||
    (faq === 0 && sq.faq.items.length > 0)
  );
}
