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

  /** The street address shown on the contact page and in local SEO. */
  address: {
    street: "Holger Petersen",
    locality: "Prishtinë",
    postalCode: "10000",
    /** ISO 3166-1 alpha-2. */
    country: "XK",
  } as {
    street: string;
    locality: string;
    region?: string;
    postalCode?: string;
    country: string;
  } | null,

  /**
   * Decimal coordinates for LocalBusiness schema. Left unset by choice — the
   * address and the Maps link already place the clinic. To switch it on, use
   * 42.6390286 / 21.1638098 (taken from the clinic's own Google Maps URL).
   */
  geo: null as { latitude: number; longitude: number } | null,

  /** The clinic's Google Maps share link. */
  mapsUrl: "https://maps.app.goo.gl/izaVgzz7tqvfkv3C6" as string | null,

  /**
   * Google Maps embed, centred on the clinic's coordinates. This form needs no
   * API key. To show a labelled pin instead, replace it with the `src` value
   * from Google Maps' own "Share → Embed a map" dialog.
   */
  mapsEmbedUrl:
    "https://www.google.com/maps?q=42.6390286,21.1638098&z=17&output=embed" as
      | string
      | null,

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
      name: "Dr. Spec. Arbëreshë Korçaj",
      role: { sq: "Mjeke specialiste", en: "Specialist dentist" },
    },
  ] as TeamMember[],

  /**
   * Patient testimonials. Intentionally empty — the section stays hidden.
   * To switch it on later, add reviews the clinic has actually received, with
   * the patient's consent.
   */
  testimonials: [] as Testimonial[],

  /**
   * The year the clinic opened. Shown in structured data when set; leave
   * `null` while unconfirmed.
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

/** Single-line address, e.g. "Holger Petersen, 10000 Prishtinë". */
export function formatAddress(): string | null {
  const a = clinic.address;
  if (!a) return null;
  const town = [a.postalCode, a.locality].filter(Boolean).join(" ");
  return [a.street, town, a.region].filter(Boolean).join(", ");
}

/**
 * Lists the clinic facts that are still unset. Used by the development-only
 * checklist. `geo`, `testimonials` and `foundingYear` are deliberate omissions
 * rather than gaps, so they are not reported.
 */
export function missingClinicFacts(): string[] {
  const missing: string[] = [];
  if (clinic.phones.length === 0) missing.push("phones");
  if (!clinic.email) missing.push("email");
  if (!clinic.address) missing.push("address");
  if (!clinic.mapsEmbedUrl) missing.push("mapsEmbedUrl");
  if (clinic.hours.length === 0) missing.push("hours");
  if (clinic.team.length === 0) missing.push("team");
  return missing;
}
