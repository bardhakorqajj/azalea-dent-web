import { en } from "@/i18n/dictionaries/en";
import { sq } from "@/i18n/dictionaries/sq";
import type { LocalisedValue } from "@/lib/db/types";

/**
 * Which pieces of the public website the dashboard can edit.
 *
 * The set of editable blocks is declared here in code, not discovered from the
 * database, and each one carries the text the site is *already* published
 * with. That gives the whole CMS its most important property: a block with no
 * row in `content_block` renders the shipped copy, so the public website
 * cannot be emptied by an unset field, a failed migration, or an unreachable
 * database. Editing is an override, never a replacement.
 *
 * Only the headline copy is exposed. Body paragraphs, the price list and the
 * service descriptions live in their own tables or files where they can be
 * edited with the structure they actually have — a single textarea is the
 * wrong shape for those, and pretending otherwise makes the dashboard worse.
 */

export type ContentGroup = "home" | "about" | "contact" | "footer";

export type ContentKind = "text" | "textarea";

export type ContentBlockDefinition = {
  /** Stable storage key. Renaming one orphans its edit, so they do not change. */
  key: string;
  group: ContentGroup;
  kind: ContentKind;
  /** Shown as the field's label, in both languages. */
  label: LocalisedValue;
  /** The copy the site ships with, per language. */
  fallback: LocalisedValue;
};

function block(
  key: string,
  group: ContentGroup,
  kind: ContentKind,
  label: LocalisedValue,
  fallback: LocalisedValue,
): ContentBlockDefinition {
  return { key, group, kind, label, fallback };
}

export const contentBlocks: ContentBlockDefinition[] = [
  // --- Home page ---------------------------------------------------------
  block(
    "home.hero.eyebrow",
    "home",
    "text",
    { sq: "Kryefaqja — mbititulli", en: "Home — eyebrow" },
    { sq: sq.hero.eyebrow, en: en.hero.eyebrow },
  ),
  block(
    "home.hero.title",
    "home",
    "textarea",
    { sq: "Kryefaqja — titulli kryesor", en: "Home — headline" },
    { sq: sq.hero.title, en: en.hero.title },
  ),
  block(
    "home.hero.lead",
    "home",
    "textarea",
    { sq: "Kryefaqja — paragrafi hyrës", en: "Home — opening paragraph" },
    { sq: sq.hero.lead, en: en.hero.lead },
  ),
  block(
    "home.intro.eyebrow",
    "home",
    "text",
    { sq: "Klinika — mbititulli", en: "The clinic — eyebrow" },
    { sq: sq.intro.eyebrow, en: en.intro.eyebrow },
  ),
  block(
    "home.intro.title",
    "home",
    "textarea",
    { sq: "Klinika — titulli", en: "The clinic — title" },
    { sq: sq.intro.title, en: en.intro.title },
  ),
  block(
    "home.services.eyebrow",
    "home",
    "text",
    { sq: "Shërbimet — mbititulli", en: "Services — eyebrow" },
    { sq: sq.services.eyebrow, en: en.services.eyebrow },
  ),
  block(
    "home.services.title",
    "home",
    "textarea",
    { sq: "Shërbimet — titulli", en: "Services — title" },
    { sq: sq.services.title, en: en.services.title },
  ),
  block(
    "home.why.eyebrow",
    "home",
    "text",
    { sq: "Përse ne — mbititulli", en: "Why us — eyebrow" },
    { sq: sq.why.eyebrow, en: en.why.eyebrow },
  ),
  block(
    "home.why.title",
    "home",
    "textarea",
    { sq: "Përse ne — titulli", en: "Why us — title" },
    { sq: sq.why.title, en: en.why.title },
  ),
  block(
    "home.gallery.eyebrow",
    "home",
    "text",
    { sq: "Galeria — mbititulli", en: "Gallery — eyebrow" },
    { sq: sq.gallery.eyebrow, en: en.gallery.eyebrow },
  ),
  block(
    "home.gallery.title",
    "home",
    "textarea",
    { sq: "Galeria — titulli", en: "Gallery — title" },
    { sq: sq.gallery.title, en: en.gallery.title },
  ),
  block(
    "home.team.eyebrow",
    "home",
    "text",
    { sq: "Ekipi — mbititulli", en: "Team — eyebrow" },
    { sq: sq.team.eyebrow, en: en.team.eyebrow },
  ),
  block(
    "home.team.title",
    "home",
    "textarea",
    { sq: "Ekipi — titulli", en: "Team — title" },
    { sq: sq.team.title, en: en.team.title },
  ),
  block(
    "home.testimonials.eyebrow",
    "home",
    "text",
    { sq: "Vlerësimet — mbititulli", en: "Reviews — eyebrow" },
    { sq: sq.testimonials.eyebrow, en: en.testimonials.eyebrow },
  ),
  block(
    "home.testimonials.title",
    "home",
    "textarea",
    { sq: "Vlerësimet — titulli", en: "Reviews — title" },
    { sq: sq.testimonials.title, en: en.testimonials.title },
  ),

  // --- About -------------------------------------------------------------
  block(
    "about.eyebrow",
    "about",
    "text",
    { sq: "Për ne — mbititulli", en: "About — eyebrow" },
    { sq: sq.about.eyebrow, en: en.about.eyebrow },
  ),
  block(
    "about.title",
    "about",
    "textarea",
    { sq: "Për ne — titulli", en: "About — title" },
    { sq: sq.about.title, en: en.about.title },
  ),
  block(
    "about.lead",
    "about",
    "textarea",
    { sq: "Për ne — paragrafi hyrës", en: "About — opening paragraph" },
    { sq: sq.about.lead, en: en.about.lead },
  ),

  // --- Contact -----------------------------------------------------------
  block(
    "contact.eyebrow",
    "contact",
    "text",
    { sq: "Kontakti — mbititulli", en: "Contact — eyebrow" },
    { sq: sq.contact.eyebrow, en: en.contact.eyebrow },
  ),
  block(
    "contact.title",
    "contact",
    "textarea",
    { sq: "Kontakti — titulli", en: "Contact — title" },
    { sq: sq.contact.title, en: en.contact.title },
  ),
  block(
    "contact.lead",
    "contact",
    "textarea",
    { sq: "Kontakti — paragrafi hyrës", en: "Contact — opening paragraph" },
    { sq: sq.contact.lead, en: en.contact.lead },
  ),

  // --- Footer ------------------------------------------------------------
  block(
    "footer.tagline",
    "footer",
    "text",
    { sq: "Fundi i faqes — nënshkrimi", en: "Footer — tagline" },
    { sq: sq.footer.tagline, en: en.footer.tagline },
  ),
  block(
    "footer.credit",
    "footer",
    "textarea",
    { sq: "Fundi i faqes — shënimi", en: "Footer — note" },
    { sq: sq.footer.credit, en: en.footer.credit },
  ),
];

export const contentGroups: ContentGroup[] = ["home", "about", "contact", "footer"];

export function blocksInGroup(group: ContentGroup): ContentBlockDefinition[] {
  return contentBlocks.filter((definition) => definition.group === group);
}

export function findContentBlock(key: string): ContentBlockDefinition | undefined {
  return contentBlocks.find((definition) => definition.key === key);
}

/** Every declared key, used to discard rows for keys that no longer exist. */
export const contentKeys: string[] = contentBlocks.map((definition) => definition.key);
