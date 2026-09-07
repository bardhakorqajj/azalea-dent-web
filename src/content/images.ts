import type { StaticImageData } from "next/image";

import facadeNight from "@/assets/images/facade-night.jpg";
import glassDetail from "@/assets/images/glass-detail.jpg";
import operatoryDaylight from "@/assets/images/operatory-daylight.jpg";
import operatoryOak from "@/assets/images/operatory-oak.jpg";
import reception from "@/assets/images/reception.jpg";
import streetSign from "@/assets/images/street-sign.jpg";
import work01 from "@/assets/images/work-01.jpg";
import work02 from "@/assets/images/work-02.jpg";
import work03 from "@/assets/images/work-03.jpg";
import work04 from "@/assets/images/work-04.jpg";
import work05 from "@/assets/images/work-05.jpg";

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
  streetSign: {
    src: streetSign,
    alt: {
      sq: "Tabela e ndriçuar e Azalea Dent mbi rrugë në mbrëmje, me logon e azaleas, emrin e klinikës dhe numrin e telefonit, para qiellit në perëndim.",
      en: "The illuminated Azalea Dent sign above the street in the evening, with the azalea logo, the clinic name and the phone number, against the sunset sky.",
    },
    caption: {
      sq: "Tabela e klinikës",
      en: "The clinic sign",
    },
    /* Portrait frame: holds the whole sign, logo included, in the gallery's
       landscape crop while keeping some of the sunset behind it. */
    focus: "center 10%",
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
 * Gallery order — arranged as a sequence rather than a plain grid: the sign
 * from the street, arrival, waiting, the corridor, then the treatment room.
 */
/**
 * Treatment photographs — the clinic's own cases, shown under "Puna jonë".
 *
 * Empty until real ones are added, and the section stays hidden while it is:
 * an empty gallery is worse than no gallery. Add them the same way as the
 * photographs above — a static import from `@/assets/images`, alt text in
 * both languages, and a caption. Every case needs the patient's permission
 * before it goes online.
 */
export const workPhotos: Photo[] = [
  {
    src: work01,
    alt: {
      sq: "Para dhe pas: dhëmbët e përparmë të sipërm, fillimisht të konsumuar dhe të parregullt, pastaj të njëtrajtshëm dhe të bardhë.",
      en: "Before and after: the upper front teeth, first worn and uneven, then even and white.",
    },
    caption: {
      sq: "Dhëmbët e përparmë, para dhe pas",
      en: "The front teeth, before and after",
    },
  },
  {
    src: work02,
    alt: {
      sq: "Para dhe pas: dhëmbë të thyer dhe të zbrazëta në harkun e sipërm, pastaj një rresht i plotë dhëmbësh të rregullt.",
      en: "Before and after: broken teeth and gaps in the upper arch, then a complete, even row of teeth.",
    },
    caption: {
      sq: "Harku i sipërm, para dhe pas",
      en: "The upper arch, before and after",
    },
  },
  {
    src: work03,
    alt: {
      sq: "Para dhe pas: dhëmbë të dëmtuar rëndë me mbushje të vjetra dhe gurëz, pastaj dhëmbë të rregullt e të bardhë.",
      en: "Before and after: heavily damaged teeth with old fillings and tartar, then even, white teeth.",
    },
    caption: {
      sq: "Dhëmbë të dëmtuar, para dhe pas",
      en: "Damaged teeth, before and after",
    },
  },
  {
    src: work04,
    alt: {
      sq: "Pamje e afërt anësore e punës së përfunduar, me sipërfaqe të lëmuara dhe formë natyrale.",
      en: "A close side view of the finished work, with smooth surfaces and a natural shape.",
    },
    caption: {
      sq: "Detaj i punës së përfunduar",
      en: "A detail of the finished work",
    },
  },
  {
    src: work05,
    alt: {
      sq: "Para dhe pas: buzëqeshja dhe pamja brenda gojës, para dhe pas trajtimit.",
      en: "Before and after: the smile and the intraoral view, before and after treatment.",
    },
    caption: {
      sq: "Buzëqeshja, para dhe pas",
      en: "The smile, before and after",
    },
  },
];

export const galleryOrder: PhotoKey[] = [
  "streetSign",
  "facadeNight",
  "reception",
  "glassDetail",
  "operatoryOak",
  "operatoryDaylight",
];
