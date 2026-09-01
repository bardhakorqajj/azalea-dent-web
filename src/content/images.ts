import type { StaticImageData } from "next/image";

import facadeNight from "@/assets/images/facade-night.jpg";
import glassDetail from "@/assets/images/glass-detail.jpg";
import operatoryDaylight from "@/assets/images/operatory-daylight.jpg";
import operatoryOak from "@/assets/images/operatory-oak.jpg";
import reception from "@/assets/images/reception.jpg";

import type { Localised } from "./services";

export type Photo = {
  src: StaticImageData;
  /** Alt text describes what is actually in the frame, in both languages. */
  alt: Localised;
  /** Short editorial caption used in the gallery. */
  caption: Localised;
  /**
   * `object-position` for this photo, so crops stay well framed at every
   * aspect ratio instead of cutting through the subject.
   */
  focus?: string;
};

/**
 * The clinic's own photography. These are the real rooms — no stock imagery is
 * used anywhere on the site.
 */
export const photos = {
  facadeNight: {
    src: facadeNight,
    alt: {
      sq: "Hyrja e klinikës Azalea Dent në mbrëmje, me tabelën e ndriçuar dhe logon në formë lulëzimi azalea.",
      en: "The entrance to Azalea Dent in the evening, with the illuminated sign and the azalea flower logo.",
    },
    caption: {
      sq: "Hyrja e klinikës",
      en: "The clinic entrance",
    },
    focus: "center 45%",
  },
  reception: {
    src: reception,
    alt: {
      sq: "Zona e pritjes e klinikës, me karrige, tavolinë prej druri dhe recepsion përballë dritareve nga dyshemeja në tavan.",
      en: "The clinic waiting area, with seating, a wooden table and the reception desk in front of floor-to-ceiling windows.",
    },
    caption: {
      sq: "Zona e pritjes",
      en: "The waiting area",
    },
    focus: "center 55%",
  },
  operatoryOak: {
    src: operatoryOak,
    alt: {
      sq: "Dhoma e trajtimit me karrige dentare, monitor dhe mobilie në ngjyrë antracit me sipërfaqe druri.",
      en: "A treatment room with a dental chair, monitor and charcoal cabinetry with a wooden worktop.",
    },
    caption: {
      sq: "Dhoma e trajtimit",
      en: "The treatment room",
    },
    focus: "center 62%",
  },
  operatoryDaylight: {
    src: operatoryDaylight,
    alt: {
      sq: "Karrige dentare e gatshme pranë dritares së madhe, me dritë natyrale në dhomën e trajtimit.",
      en: "A prepared dental chair beside the large window, with natural light in the treatment room.",
    },
    caption: {
      sq: "Njësia dentare",
      en: "The dental unit",
    },
    focus: "center center",
  },
  glassDetail: {
    src: glassDetail,
    alt: {
      sq: "Ndarja prej xhami me logon e gdhendur të lules azalea, që të çon drejt dhomës së trajtimit.",
      en: "The glass partition with the etched azalea logo, leading through to a treatment room.",
    },
    caption: {
      sq: "Dhoma e punës",
      en: "The work room",
    },
    focus: "center center",
  },
} satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof photos;

/**
 * Gallery order — arranged as a sequence rather than a plain grid: arrival,
 * waiting, the corridor, then the treatment room.
 */
export const galleryOrder: PhotoKey[] = [
  "facadeNight",
  "reception",
  "glassDetail",
  "operatoryOak",
  "operatoryDaylight",
];
