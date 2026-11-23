import type { Localised } from "./services";

/**
 * The clinic's printed price list, transcribed from the sheet displayed at
 * reception. Prices are in euro.
 *
 * A few obvious spelling slips on the printed sheet were corrected here
 * ("Regullimi" to "Rregullimi", "Sherimi" to "Shërimi"). Everything else,
 * including the wording and the order of the categories, follows the sheet.
 */

export type PriceItem = {
  name: Localised;
  /** Price in euro. */
  price: number;
};

export type PriceGroup = {
  id: string;
  title: Localised;
  items: PriceItem[];
};

export const currency = "€";

export function formatPrice(price: number): string {
  return `${price} ${currency}`;
}

export const priceGroups: PriceGroup[] = [
  {
    id: "e-pergjithshme",
    title: { sq: "Stomatologji e përgjithshme", en: "General dentistry", de: "Allgemeine Zahnmedizin" },
    items: [
      { name: { sq: "Kontrollë stomatologjike", en: "Dental check-up", de: "Zahnärztliche Kontrolle" }, price: 10 },
      { name: { sq: "Rtg retroalveolar", en: "Periapical X-ray", de: "Zahnfilm (Einzelröntgenbild)" }, price: 5 },
      { name: { sq: "Aplikimi i barit", en: "Medication application", de: "Medikamentöse Einlage" }, price: 5 },
      { name: { sq: "Fluorizimi", en: "Fluoride treatment", de: "Fluoridierung" }, price: 25 },
      { name: { sq: "Vulosja e fisurave", en: "Fissure sealing", de: "Fissurenversiegelung" }, price: 15 },
      { name: { sq: "Drenazha e dhëmbit", en: "Tooth drainage", de: "Drainage des Zahns" }, price: 10 },
    ],
  },
  {
    id: "pedodonci",
    title: { sq: "Pedodonci", en: "Paediatric dentistry", de: "Kinderzahnheilkunde" },
    items: [
      {
        name: {
          sq: "Mbushje kompozit në dhëmbët e qumështit",
          en: "Composite filling in a milk tooth",
          de: "Kompositfüllung im Milchzahn",
        },
        price: 20,
      },
      {
        name: { sq: "Nxjerrja e dhëmbit të qumështit", en: "Milk tooth extraction", de: "Entfernung eines Milchzahns" },
        price: 10,
      },
    ],
  },
  {
    id: "kirurgji-orale",
    title: { sq: "Kirurgji orale", en: "Oral surgery", de: "Oralchirurgie" },
    items: [
      {
        name: {
          sq: "Nxjerrja e dhëmbit të përhershëm",
          en: "Permanent tooth extraction",
          de: "Entfernung eines bleibenden Zahns",
        },
        price: 20,
      },
      {
        name: { sq: "Nxjerrja e dhëmbit të pjekurisë", en: "Wisdom tooth extraction", de: "Entfernung eines Weisheitszahns" },
        price: 40,
      },
      {
        name: { sq: "Nxjerrja e dhëmbit të impaktuar", en: "Impacted tooth extraction", de: "Entfernung eines verlagerten Zahns" },
        price: 150,
      },
      { name: { sq: "Kiretazha e alveoles", en: "Alveolar curettage", de: "Kürettage der Alveole" }, price: 20 },
      {
        name: { sq: "Denudimi për ortodonci", en: "Surgical exposure for orthodontics", de: "Chirurgische Freilegung für die Kieferorthopädie" },
        price: 150,
      },
      { name: { sq: "Apikotomia", en: "Apicoectomy", de: "Wurzelspitzenresektion" }, price: 100 },
      { name: { sq: "Frenektomia", en: "Frenectomy", de: "Frenektomie" }, price: 50 },
      { name: { sq: "Sinus lift", en: "Sinus lift", de: "Sinuslift" }, price: 500 },
      {
        name: { sq: "Gingivektomi (një dhëmb)", en: "Gingivectomy (one tooth)", de: "Gingivektomie (ein Zahn)" },
        price: 10,
      },
      { name: { sq: "Implanti", en: "Dental implant", de: "Zahnimplantat" }, price: 450 },
      {
        name: { sq: "Kocka artificiale 1 g", en: "Bone graft material, 1 g", de: "Knochenersatzmaterial, 1 g" },
        price: 100,
      },
    ],
  },
  {
    id: "endodonci",
    title: {
      sq: "Sëmundje të dhëmbit me endodoncion",
      en: "Tooth disease and endodontics",
      de: "Zahnerkrankungen und Endodontie",
    },
    items: [
      {
        name: {
          sq: "Mbushje kompoziti e dhëmbëve të përhershëm",
          en: "Composite filling, permanent tooth",
          de: "Kompositfüllung, bleibender Zahn",
        },
        price: 30,
      },
      {
        name: {
          sq: "Trajtim endodontik (një kanal)",
          en: "Root canal treatment (one canal)",
          de: "Wurzelbehandlung (ein Kanal)",
        },
        price: 20,
      },
      {
        name: {
          sq: "Trajtim endodontik (dy kanale)",
          en: "Root canal treatment (two canals)",
          de: "Wurzelbehandlung (zwei Kanäle)",
        },
        price: 30,
      },
      {
        name: {
          sq: "Trajtim endodontik (tre kanale)",
          en: "Root canal treatment (three canals)",
          de: "Wurzelbehandlung (drei Kanäle)",
        },
        price: 40,
      },
      {
        name: { sq: "Ritrajtimi endodontik", en: "Root canal retreatment", de: "Revision einer Wurzelbehandlung" },
        price: 50,
      },
      {
        name: {
          sq: "Shërimi i parodontitit periapikal",
          en: "Treatment of periapical periodontitis",
          de: "Behandlung einer apikalen Parodontitis",
        },
        price: 50,
      },
      {
        name: {
          sq: "Vendosja e kunjit pulpar të fabrikuar",
          en: "Prefabricated pulp post placement",
          de: "Setzen eines konfektionierten Wurzelstifts",
        },
        price: 20,
      },
      {
        name: {
          sq: "Vendosja e kunjit parapulpar",
          en: "Parapulpal pin placement",
          de: "Setzen eines parapulpären Stifts",
        },
        price: 20,
      },
      { name: { sq: "Vendosja e fiber post", en: "Fibre post placement", de: "Setzen eines Glasfaserstifts" }, price: 20 },
    ],
  },
  {
    id: "protetike",
    title: { sq: "Protetikë", en: "Prosthetics", de: "Prothetik" },
    items: [
      { name: { sq: "Kurora metal-porcelan", en: "Metal-ceramic crown", de: "Metallkeramikkrone" }, price: 70 },
      { name: { sq: "Kurora zircon", en: "Zirconia crown", de: "Zirkonkrone" }, price: 150 },
      { name: { sq: "Kurora full zircon", en: "Full zirconia crown", de: "Vollzirkonkrone" }, price: 170 },
      { name: { sq: "Kurora e-max", en: "E-max crown", de: "E.max-Krone" }, price: 200 },
      {
        name: {
          sq: "Kurora të përkohshme (një dhëmb)",
          en: "Temporary crown (one tooth)",
          de: "Provisorische Krone (ein Zahn)",
        },
        price: 10,
      },
      {
        name: {
          sq: "Proteza nga akrilati (një nofull)",
          en: "Acrylic denture (one jaw)",
          de: "Kunststoffprothese (ein Kiefer)",
        },
        price: 200,
      },
      {
        name: {
          sq: "Proteza e skeletuar (një nofull)",
          en: "Cast framework denture (one jaw)",
          de: "Modellgussprothese (ein Kiefer)",
        },
        price: 250,
      },
      {
        name: {
          sq: "Proteza nga vertexi (një nofull)",
          en: "Vertex denture (one jaw)",
          de: "Vertex-Prothese (ein Kiefer)",
        },
        price: 350,
      },
      {
        name: {
          sq: "Riparimi i protezës me dorë bartës",
          en: "Denture repair with a clasp",
          de: "Prothesenreparatur mit Klammer",
        },
        price: 40,
      },
      {
        name: {
          sq: "Riparimi i urës së vjetër (për anëtar)",
          en: "Repair of an existing bridge (per unit)",
          de: "Reparatur einer vorhandenen Brücke (pro Glied)",
        },
        price: 10,
      },
      {
        name: {
          sq: "Ri-cimentimi i urës së vjetër (për anëtar)",
          en: "Re-cementing an existing bridge (per unit)",
          de: "Neubefestigung einer vorhandenen Brücke (pro Glied)",
        },
        price: 10,
      },
      {
        name: {
          sq: "Rregullimi i protezës së frakturuar",
          en: "Repair of a fractured denture",
          de: "Reparatur einer gebrochenen Prothese",
        },
        price: 25,
      },
    ],
  },
  {
    id: "estetike",
    title: {
      sq: "Estetikë dentare dhe zbardhim",
      en: "Dental aesthetics and whitening",
      de: "Ästhetische Zahnmedizin und Bleaching",
    },
    items: [
      { name: { sq: "Zbardhimi i dhëmbëve", en: "Teeth whitening", de: "Bleaching" }, price: 120 },
      {
        name: {
          sq: "Zbardhimi i dhëmbit avital",
          en: "Whitening of a non-vital tooth",
          de: "Bleaching eines devitalen Zahns",
        },
        price: 40,
      },
      { name: { sq: "Faseta estetike (veneer)", en: "Aesthetic veneer", de: "Ästhetisches Veneer" }, price: 200 },
      {
        name: { sq: "Mbushje estetike në front", en: "Aesthetic filling, front tooth", de: "Ästhetische Füllung, Frontzahn" },
        price: 40,
      },
      {
        name: { sq: "Vendosja e gurit dekorues", en: "Decorative tooth gem", de: "Zahnschmuck" },
        price: 20,
      },
    ],
  },
  {
    id: "ortodonci",
    title: { sq: "Ortodonci", en: "Orthodontics", de: "Kieferorthopädie" },
    items: [{ name: { sq: "Retainer metalik", en: "Metal retainer", de: "Metall-Retainer" }, price: 25 }],
  },
  {
    id: "parodontologji",
    title: { sq: "Parodontologji", en: "Periodontology", de: "Parodontologie" },
    items: [
      {
        name: { sq: "Pastrimi i dhëmbëve", en: "Professional teeth cleaning", de: "Professionelle Zahnreinigung" },
        price: 30,
      },
      {
        name: {
          sq: "Kiretazha parodontale e mbyllur (një kuadrant)",
          en: "Closed periodontal curettage (one quadrant)",
          de: "Geschlossene parodontale Kürettage (ein Quadrant)",
        },
        price: 20,
      },
      {
        name: {
          sq: "Kiretazha parodontale e hapur (një nofull)",
          en: "Open periodontal curettage (one jaw)",
          de: "Offene parodontale Kürettage (ein Kiefer)",
        },
        price: 200,
      },
    ],
  },
];

export const priceItemCount = priceGroups.reduce(
  (total, group) => total + group.items.length,
  0,
);

/** Looks a treatment up by the name it carries on the printed sheet. */
export function priceItemBySqName(name: string): PriceItem | undefined {
  return priceGroups.flatMap((group) => group.items).find(
    (item) => item.name.sq === name,
  );
}

/**
 * The entries the dental-implant page quotes, in the order it lists them.
 *
 * They are named rather than filtered so the page cannot start showing an
 * unrelated treatment if the sheet is reordered. A unit test asserts every
 * name here still resolves, so renaming one in the list above fails the build
 * rather than silently emptying a row on that page.
 */
export const IMPLANT_PRICE_NAMES = [
  "Implanti",
  "Sinus lift",
  "Kocka artificiale 1 g",
  "Kurora zircon",
  "Kurora full zircon",
  "Kurora e-max",
] as const;

export function implantPrices(): PriceItem[] {
  return IMPLANT_PRICE_NAMES.map(priceItemBySqName).filter(
    (item): item is PriceItem => Boolean(item),
  );
}
