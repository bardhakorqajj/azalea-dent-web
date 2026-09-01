/**
 * ---------------------------------------------------------------------------
 * SINGLE SOURCE OF TRUTH FOR EVERY CLINIC FACT ON THE WEBSITE.
 * ---------------------------------------------------------------------------
 *
 * Everything the site states about Azalea Dent lives here. Edit this file to
 * update the website — no component needs to be touched.
 *
 * Fields set to `null` or `[]` are details that could NOT be verified from the
 * material provided (the clinic photographs and the Instagram handle). They are
 * deliberately left empty rather than invented: every section of the site hides
 * itself when its data is missing, so nothing false is ever published.
 *
 * Run `npm run dev` and the site shows a development-only checklist of anything
 * still missing. See CONTENT.md for the full fill-in guide.
 */

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type OpeningHours = {
  /** Days this rule applies to, e.g. ["mon","tue","wed","thu","fri"]. */
  days: Weekday[];
  /** 24h "HH:MM", or `null` for a closed day. */
  opens: string | null;
  closes: string | null;
};

export type TeamMember = {
  /** Full name exactly as the clinic writes it. */
  name: string;
  /** Role, e.g. "Dentist" / "Dentiste". Keep it factual. */
  role: { sq: string; en: string };
  /** Optional short bio. Only add what the clinic has actually published. */
  bio?: { sq: string; en: string };
  /**
   * Portrait in `src/assets/images/team/`, imported in `src/content/images.ts`.
   * Leave undefined and a typographic monogram card is shown instead.
   */
  photo?: string;
};

export type Testimonial = {
  quote: { sq: string; en: string };
  /** Patient's own attribution — never invent one. */
  author: string;
  source?: string;
};

export const clinic = {
  /** Verified — the shopfront and reception signage. */
  name: "Azalea Dent",
  descriptor: "Dental Clinic",

  /** Verified — the clinic's Instagram profile. */
  social: {
    instagram: {
      handle: "azalea.dent",
      url: "https://www.instagram.com/azalea.dent/",
    },
    facebook: "https://www.facebook.com/profile.php?id=61578310892844" as
      | string
      | null,
    /** TODO: add the TikTok profile URL if there is one. */
    tiktok: null as string | null,
  },

  /**
   * Published phone numbers, in full international form so `tel:` links work
   * from abroad. The first is treated as the primary line.
   */
  phones: ["+383 48 306 376", "+383 43 779 909"] as string[],

  /** WhatsApp number — international digits only, no spaces or "+". */
  whatsapp: "38348306376" as string | null,

  /** Viber number — international form, used to build `viber://` links. */
  viber: "+38348306376" as string | null,

  email: "azaleadent@hotmail.com" as string | null,

  /** TODO — the street address shown on the contact page and in local SEO. */
  address: null as {
    street: string;
    locality: string;
    region?: string;
    postalCode?: string;
    /** ISO 3166-1 alpha-2, e.g. "XK" for Kosovo, "AL" for Albania. */
    country: string;
  } | null,

  /** TODO — decimal coordinates of the clinic, used for LocalBusiness schema. */
  geo: null as { latitude: number; longitude: number } | null,

  /** The clinic's Google Maps share link. */
  mapsUrl: "https://maps.app.goo.gl/izaVgzz7tqvfkv3C6" as string | null,

  /**
   * TODO — Google Maps embed URL ("Share" → "Embed a map" → copy the `src`).
   * The contact page renders a real map when this is set, and a tidy
   * address card when it is not.
   */
  mapsEmbedUrl: null as string | null,

  /** Opening hours. `opens: null` marks a closed day. */
  hours: [
    { days: ["mon", "tue", "wed", "thu", "fri"], opens: "14:00", closes: "20:00" },
    { days: ["sat", "sun"], opens: null, closes: null },
  ] as OpeningHours[],

  /**
   * The clinical team. Add one entry per dentist exactly as the clinic
   * publishes their name and title. Do not add credentials that are not
   * published by the clinic itself.
   */
  team: [
    {
      name: "Dr. Spec. Arbëreshë Korqaj",
      role: { sq: "Mjeke specialiste", en: "Specialist dentist" },
    },
  ] as TeamMember[],

  /**
   * TODO — patient testimonials. Only add reviews the clinic has actually
   * received (Google reviews, Instagram comments) with the patient's consent.
   */
  testimonials: [] as Testimonial[],

  /**
   * TODO — the year the clinic opened, e.g. 2021. Shown in the about section
   * and in structured data. Leave `null` if unconfirmed.
   */
  foundingYear: null as number | null,
} as const;

export type Clinic = typeof clinic;

/** The primary published number, or `null` when none is configured. */
export function primaryPhone(): string | null {
  return clinic.phones[0] ?? null;
}

/** `tel:` href for a number, defaulting to the primary line. */
export function telHref(phone: string | null = primaryPhone()): string | null {
  if (!phone) return null;
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** `viber://` deep link, which opens the Viber app on a phone. */
export function viberHref(): string | null {
  if (!clinic.viber) return null;
  return `viber://chat?number=${encodeURIComponent(clinic.viber.replace(/[^\d+]/g, ""))}`;
}

/** `wa.me` href with an optional pre-filled message. */
export function whatsappHref(message?: string): string | null {
  if (!clinic.whatsapp) return null;
  const digits = clinic.whatsapp.replace(/\D/g, "");
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${query}`;
}

export function mailtoHref(): string | null {
  return clinic.email ? `mailto:${clinic.email}` : null;
}

/** Single-line address, e.g. "Rr. Example 12, Prishtinë". */
export function formatAddress(): string | null {
  const a = clinic.address;
  if (!a) return null;
  return [a.street, a.postalCode, a.locality, a.region]
    .filter(Boolean)
    .join(", ");
}

/**
 * Lists the clinic facts that are still unset. Used by the development-only
 * checklist and by `npm run test` to keep CONTENT.md honest.
 */
export function missingClinicFacts(): string[] {
  const missing: string[] = [];
  if (clinic.phones.length === 0) missing.push("phones");
  if (!clinic.email) missing.push("email");
  if (!clinic.address) missing.push("address");
  if (!clinic.geo) missing.push("geo");
  if (!clinic.mapsEmbedUrl) missing.push("mapsEmbedUrl");
  if (clinic.hours.length === 0) missing.push("hours");
  if (clinic.team.length === 0) missing.push("team");
  if (clinic.testimonials.length === 0) missing.push("testimonials");
  return missing;
}
