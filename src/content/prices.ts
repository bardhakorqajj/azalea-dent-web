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
    title: { sq: "Stomatologji e përgjithshme", en: "General dentistry" },
    items: [
      { name: { sq: "Kontrollë stomatologjike", en: "Dental check-up" }, price: 10 },
      { name: { sq: "Rtg retroalveolar", en: "Periapical X-ray" }, price: 5 },
      { name: { sq: "Aplikimi i barit", en: "Medication application" }, price: 5 },
      { name: { sq: "Fluorizimi", en: "Fluoride treatment" }, price: 25 },
      { name: { sq: "Vulosja e fisurave", en: "Fissure sealing" }, price: 15 },
      { name: { sq: "Drenazha e dhëmbit", en: "Tooth drainage" }, price: 10 },
    ],
  },
  {
    id: "pedodonci",
    title: { sq: "Pedodonci", en: "Paediatric dentistry" },
    items: [
      {
        name: {
          sq: "Mbushje kompozit në dhëmbët e qumështit",
          en: "Composite filling in a milk tooth",
        },
        price: 20,
      },
      {
        name: { sq: "Nxjerrja e dhëmbit të qumështit", en: "Milk tooth extraction" },
        price: 10,
      },
    ],
  },
  {
    id: "kirurgji-orale",
    title: { sq: "Kirurgji orale", en: "Oral surgery" },
    items: [
      {
        name: {
          sq: "Nxjerrja e dhëmbit të përhershëm",
          en: "Permanent tooth extraction",
        },
        price: 20,
      },
      {
        name: { sq: "Nxjerrja e dhëmbit të pjekurisë", en: "Wisdom tooth extraction" },
        price: 40,
      },
      {
        name: { sq: "Nxjerrja e dhëmbit të impaktuar", en: "Impacted tooth extraction" },
        price: 150,
      },
      { name: { sq: "Kiretazha e alveoles", en: "Alveolar curettage" }, price: 20 },
      {
        name: { sq: "Denudimi për ortodonci", en: "Surgical exposure for orthodontics" },
        price: 150,
      },
      { name: { sq: "Apikotomia", en: "Apicoectomy" }, price: 100 },
      { name: { sq: "Frenektomia", en: "Frenectomy" }, price: 50 },
      { name: { sq: "Sinus lift", en: "Sinus lift" }, price: 500 },
      {
        name: { sq: "Gingivektomi (një dhëmb)", en: "Gingivectomy (one tooth)" },
        price: 10,
      },
      { name: { sq: "Implanti", en: "Dental implant" }, price: 450 },
      {
        name: { sq: "Kocka artificiale 1 g", en: "Bone graft material, 1 g" },
        price: 100,
      },
    ],
  },
  {
    id: "endodonci",
    title: {
      sq: "Sëmundje të dhëmbit me endodoncion",
      en: "Tooth disease and endodontics",
    },
    items: [
      {
        name: {
          sq: "Mbushje kompoziti e dhëmbëve të përhershëm",
          en: "Composite filling, permanent tooth",
        },
        price: 30,
      },
      {
        name: {
          sq: "Trajtim endodontik (një kanal)",
          en: "Root canal treatment (one canal)",
        },
        price: 20,
      },
      {
        name: {
          sq: "Trajtim endodontik (dy kanale)",
          en: "Root canal treatment (two canals)",
        },
        price: 30,
      },
      {
        name: {
          sq: "Trajtim endodontik (tre kanale)",
          en: "Root canal treatment (three canals)",
        },
        price: 40,
      },
      {
        name: { sq: "Ritrajtimi endodontik", en: "Root canal retreatment" },
        price: 50,
      },
      {
        name: {
          sq: "Shërimi i parodontitit periapikal",
          en: "Treatment of periapical periodontitis",
        },
        price: 50,
      },
      {
        name: {
          sq: "Vendosja e kunjit pulpar të fabrikuar",
          en: "Prefabricated pulp post placement",
        },
        price: 20,
      },
      {
        name: {
          sq: "Vendosja e kunjit parapulpar",
          en: "Parapulpal pin placement",
        },
        price: 20,
      },
      { name: { sq: "Vendosja e fiber post", en: "Fibre post placement" }, price: 20 },
    ],
  },
  {
    id: "protetike",
    title: { sq: "Protetikë", en: "Prosthetics" },
    items: [
      { name: { sq: "Kurora metal-porcelan", en: "Metal-ceramic crown" }, price: 70 },
      { name: { sq: "Kurora zircon", en: "Zirconia crown" }, price: 120 },
      { name: { sq: "Kurora full zircon", en: "Full zirconia crown" }, price: 170 },
      { name: { sq: "Kurora e-max", en: "E-max crown" }, price: 200 },
      {
        name: {
          sq: "Kurora të përkohshme (një dhëmb)",
          en: "Temporary crown (one tooth)",
        },
        price: 10,
      },
      {
        name: {
          sq: "Proteza nga akrilati (një nofull)",
          en: "Acrylic denture (one jaw)",
        },
        price: 200,
      },
      {
        name: {
          sq: "Proteza e skeletuar (një nofull)",
          en: "Cast framework denture (one jaw)",
        },
        price: 250,
      },
      {
        name: {
          sq: "Proteza nga vertexi (një nofull)",
          en: "Vertex denture (one jaw)",
        },
        price: 350,
      },
      {
        name: {
          sq: "Riparimi i protezës me dorë bartës",
          en: "Denture repair with a clasp",
        },
        price: 40,
      },
      {
        name: {
          sq: "Riparimi i urës së vjetër (për anëtar)",
          en: "Repair of an existing bridge (per unit)",
        },
        price: 10,
      },
      {
        name: {
          sq: "Ri-cimentimi i urës së vjetër (për anëtar)",
          en: "Re-cementing an existing bridge (per unit)",
        },
        price: 10,
      },
      {
        name: {
          sq: "Rregullimi i protezës së frakturuar",
          en: "Repair of a fractured denture",
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
    },
    items: [
      { name: { sq: "Zbardhimi i dhëmbëve", en: "Teeth whitening" }, price: 120 },
      {
        name: {
          sq: "Zbardhimi i dhëmbit avital",
          en: "Whitening of a non-vital tooth",
        },
        price: 40,
      },
      { name: { sq: "Faseta estetike (veneer)", en: "Aesthetic veneer" }, price: 200 },
      {
        name: { sq: "Mbushje estetike në front", en: "Aesthetic filling, front tooth" },
        price: 40,
      },
      {
        name: { sq: "Vendosja e gurit dekorues", en: "Decorative tooth gem" },
        price: 20,
      },
    ],
  },
  {
    id: "ortodonci",
    title: { sq: "Ortodonci", en: "Orthodontics" },
    items: [{ name: { sq: "Retainer metalik", en: "Metal retainer" }, price: 25 }],
  },
  {
    id: "parodontologji",
    title: { sq: "Parodontologji", en: "Periodontology" },
    items: [
      {
        name: { sq: "Pastrimi i dhëmbëve", en: "Professional teeth cleaning" },
        price: 30,
      },
      {
        name: {
          sq: "Kiretazha parodontale e mbyllur (një kuadrant)",
          en: "Closed periodontal curettage (one quadrant)",
        },
        price: 20,
      },
      {
        name: {
          sq: "Kiretazha parodontale e hapur (një nofull)",
          en: "Open periodontal curettage (one jaw)",
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
