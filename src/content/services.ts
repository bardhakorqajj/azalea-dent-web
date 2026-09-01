import type { Locale } from "@/i18n/config";

/** A string that exists in both site languages. */
export type Localised = Record<Locale, string>;

export function t(value: Localised, locale: Locale): string {
  return value[locale];
}

export type Service = {
  slug: string;
  title: Localised;
  /** One-line summary used in grids and meta descriptions. */
  summary: Localised;
  /** Body copy, one entry per paragraph. */
  body: Localised[];
  /** Practical points a patient wants to know before booking. */
  highlights: Localised[];
  /** What a visit actually involves, in order. */
  steps: { title: Localised; detail: Localised }[];
};

/**
 * The eight treatments listed on the clinic's own shopfront, in the order they
 * appear there. Descriptions are general, factual explanations of each
 * procedure — they contain no outcome promises and no clinic-specific claims
 * that have not been verified.
 */
export const services: Service[] = [
  {
    slug: "kirurgji-orale",
    title: { sq: "Kirurgji orale", en: "Oral surgery" },
    summary: {
      sq: "Ndërhyrje kirurgjikale në gojë, të planifikuara me kujdes dhe të kryera me anestezi lokale.",
      en: "Surgical procedures in the mouth, carefully planned and carried out under local anaesthetic.",
    },
    body: [
      {
        sq: "Kirurgjia orale përfshin çdo ndërhyrje që kërkon punë në indet e gojës dhe të nofullës: heqjen e dhëmbëve që nuk mund të ruhen, nxjerrjen e dhëmbëve të pjekurisë, si dhe përgatitjen e kockës përpara vendosjes së implanteve.",
        en: "Oral surgery covers any procedure that involves working on the tissues of the mouth and jaw: removing teeth that cannot be saved, extracting wisdom teeth, and preparing bone before implants are placed.",
      },
      {
        sq: "Çdo rast fillon me një ekzaminim dhe me imazhe diagnostikuese, që ndërhyrja të planifikohet paraprakisht. Ju shpjegojmë hap pas hapi çfarë do të ndodhë, sa do të zgjasë dhe si do të jetë shërimi, para se të vendosni.",
        en: "Every case begins with an examination and diagnostic imaging so the procedure can be planned in advance. We explain step by step what will happen, how long it takes and what recovery looks like, before you decide.",
      },
    ],
    highlights: [
      { sq: "Kryhet me anestezi lokale", en: "Performed under local anaesthetic" },
      { sq: "Planifikim me imazhe diagnostikuese", en: "Planned with diagnostic imaging" },
      { sq: "Udhëzime të shkruara për kujdesin pas ndërhyrjes", en: "Written aftercare instructions" },
    ],
    steps: [
      {
        title: { sq: "Konsultë dhe diagnozë", en: "Consultation and diagnosis" },
        detail: {
          sq: "Ekzaminim i gojës dhe imazhe për të parë gjendjen e dhëmbit dhe të kockës përreth.",
          en: "An examination and imaging to assess the tooth and the surrounding bone.",
        },
      },
      {
        title: { sq: "Plani i trajtimit", en: "Treatment plan" },
        detail: {
          sq: "Diskutojmë opsionet, kohëzgjatjen dhe koston përpara se të fillojë ndërhyrja.",
          en: "We discuss the options, the timeline and the cost before anything begins.",
        },
      },
      {
        title: { sq: "Ndërhyrja", en: "The procedure" },
        detail: {
          sq: "Zona anestetizohet plotësisht dhe ndërhyrja kryhet në një ambient steril.",
          en: "The area is fully numbed and the procedure is carried out in a sterile setting.",
        },
      },
      {
        title: { sq: "Kontrolli pas ndërhyrjes", en: "Follow-up" },
        detail: {
          sq: "Një takim kontrolli për të verifikuar shërimin dhe për të hequr suturat nëse është e nevojshme.",
          en: "A check-up appointment to confirm healing and remove sutures if needed.",
        },
      },
    ],
  },
  {
    slug: "implantologji",
    title: { sq: "Implantologji", en: "Dental implants" },
    summary: {
      sq: "Zëvendësimi i një dhëmbi të humbur me një rrënjë titani dhe një kurorë të punuar posaçërisht për ju.",
      en: "Replacing a missing tooth with a titanium root and a crown made specifically for you.",
    },
    body: [
      {
        sq: "Implanti është një rrënjë artificiale prej titani që vendoset në kockën e nofullës dhe merr rolin e rrënjës natyrale. Mbi të fiksohet një kurorë, një urë ose një protezë, në varësi të numrit të dhëmbëve që mungojnë.",
        en: "An implant is an artificial titanium root placed in the jawbone that takes over the role of the natural root. A crown, a bridge or a denture is then fixed on top, depending on how many teeth are missing.",
      },
      {
        sq: "Trajtimi zhvillohet në faza dhe kërkon kohë: pas vendosjes, implantit i duhet një periudhë shërimi për t'u integruar me kockën përpara se të ngarkohet. Për këtë arsye planifikimi paraprak dhe kontrollet e rregullta janë pjesë thelbësore e procesit.",
        en: "Treatment happens in stages and takes time: after placement, the implant needs a healing period to integrate with the bone before it is loaded. Careful planning and regular check-ups are therefore an essential part of the process.",
      },
    ],
    highlights: [
      { sq: "Zgjidhje e fiksuar, nuk hiqet nga pacienti", en: "A fixed solution that is not removed by the patient" },
      { sq: "Nuk kërkon gdhendjen e dhëmbëve fqinjë", en: "Does not require reshaping the neighbouring teeth" },
      { sq: "Trajtim në faza, me kontrolle të planifikuara", en: "Staged treatment with planned check-ups" },
    ],
    steps: [
      {
        title: { sq: "Vlerësimi i kockës", en: "Assessing the bone" },
        detail: {
          sq: "Imazhet tregojnë nëse ka vëllim të mjaftueshëm kocke dhe ku duhet pozicionuar implanti.",
          en: "Imaging shows whether there is enough bone volume and where the implant should sit.",
        },
      },
      {
        title: { sq: "Vendosja e implantit", en: "Placing the implant" },
        detail: {
          sq: "Ndërhyrje me anestezi lokale, gjatë së cilës rrënja e titanit vendoset në kockë.",
          en: "A procedure under local anaesthetic in which the titanium root is placed in the bone.",
        },
      },
      {
        title: { sq: "Periudha e integrimit", en: "Integration period" },
        detail: {
          sq: "Implanti lihet të shërohet dhe të lidhet me kockën përpara fazës protetike.",
          en: "The implant is left to heal and bond with the bone before the prosthetic stage.",
        },
      },
      {
        title: { sq: "Kurora përfundimtare", en: "The final crown" },
        detail: {
          sq: "Merret masa dhe punohet kurora, e cila fiksohet mbi implant.",
          en: "An impression is taken and the crown is made, then fixed onto the implant.",
        },
      },
    ],
  },
  {
    slug: "kurora-dentare",
    title: { sq: "Kurora dentare", en: "Dental crowns" },
    summary: {
      sq: "Mbulesa të punuara me porosi që rikthejnë formën dhe funksionin e një dhëmbi të dëmtuar.",
      en: "Custom-made caps that restore the shape and function of a damaged tooth.",
    },
    body: [
      {
        sq: "Kurora është një mbulesë që vendoset mbi një dhëmb të dëmtuar, të thyer ose të trajtuar me kanal, kur mbushja nuk mjafton më. Ajo mbron atë çka ka mbetur nga dhëmbi dhe i rikthen formën dhe funksionin.",
        en: "A crown is a cap placed over a tooth that is damaged, broken or root-treated, when a filling is no longer enough. It protects what remains of the tooth and restores its shape and function.",
      },
      {
        sq: "Kurorat punohen me porosi sipas masës së gojës suaj. Ngjyra zgjidhet për t'iu përshtatur dhëmbëve fqinjë, në mënyrë që rezultati të duket natyral.",
        en: "Crowns are made to order from an impression of your mouth. The shade is chosen to match the neighbouring teeth so that the result looks natural.",
      },
    ],
    highlights: [
      { sq: "Punohen me porosi për çdo pacient", en: "Made to order for each patient" },
      { sq: "Ngjyra përshtatet me dhëmbët fqinjë", en: "Shade matched to the neighbouring teeth" },
      { sq: "Mbrojnë dhëmbin e trajtuar nga thyerja", en: "Protect a treated tooth from fracture" },
    ],
    steps: [
      {
        title: { sq: "Përgatitja e dhëmbit", en: "Preparing the tooth" },
        detail: {
          sq: "Dhëmbi formësohet me kujdes që kurora të ulet saktë mbi të.",
          en: "The tooth is carefully shaped so the crown seats precisely over it.",
        },
      },
      {
        title: { sq: "Marrja e masës", en: "Taking the impression" },
        detail: {
          sq: "Merret masa e gojës dhe përcaktohet ngjyra e kurorës.",
          en: "An impression is taken and the shade of the crown is agreed.",
        },
      },
      {
        title: { sq: "Kurora e përkohshme", en: "Temporary crown" },
        detail: {
          sq: "Deri sa punohet kurora përfundimtare, dhëmbi mbrohet me një kurorë të përkohshme.",
          en: "While the final crown is made, the tooth is protected with a temporary one.",
        },
      },
      {
        title: { sq: "Fiksimi", en: "Fitting" },
        detail: {
          sq: "Kurora provohet, rregullohet nëse duhet dhe fiksohet përfundimisht.",
          en: "The crown is tried in, adjusted if needed and then permanently fitted.",
        },
      },
    ],
  },
  {
    slug: "proteza-dentare",
    title: { sq: "Proteza dentare", en: "Dentures and prosthetics" },
    summary: {
      sq: "Zgjidhje të lëvizshme ose të fiksuara kur mungojnë disa dhëmbë ose i gjithë harku dentar.",
      en: "Removable or fixed solutions when several teeth or a whole arch are missing.",
    },
    body: [
      {
        sq: "Kur mungojnë disa dhëmbë ose i gjithë harku, proteza rikthen aftësinë për të përtypur dhe për të folur qartë, si dhe mbështetjen e strukturës së fytyrës.",
        en: "When several teeth or an entire arch are missing, a denture restores the ability to chew and speak clearly, as well as support for the structure of the face.",
      },
      {
        sq: "Ekzistojnë disa lloje: proteza të plota, të pjesshme dhe proteza të mbështetura mbi implante. Zgjedhja varet nga sa dhëmbë kanë mbetur, nga gjendja e kockës dhe nga çfarë ju përshtatet më mirë në përditshmëri.",
        en: "There are several types: full dentures, partial dentures and implant-supported dentures. The choice depends on how many teeth remain, the condition of the bone and what suits your daily life best.",
      },
    ],
    highlights: [
      { sq: "Opsione të lëvizshme dhe të fiksuara", en: "Removable and fixed options" },
      { sq: "Të punuara sipas masës së gojës suaj", en: "Made from an impression of your own mouth" },
      { sq: "Rregullime pas dorëzimit sipas nevojës", en: "Adjustments after fitting when needed" },
    ],
    steps: [
      {
        title: { sq: "Vlerësimi", en: "Assessment" },
        detail: {
          sq: "Shqyrtojmë dhëmbët që kanë mbetur dhe gjendjen e mishrave e të kockës.",
          en: "We review the remaining teeth and the condition of the gums and bone.",
        },
      },
      {
        title: { sq: "Masa dhe provat", en: "Impressions and try-ins" },
        detail: {
          sq: "Merren masat dhe bëhen prova të njëpasnjëshme për formën dhe kafshimin.",
          en: "Impressions are taken and successive try-ins check the shape and the bite.",
        },
      },
      {
        title: { sq: "Dorëzimi", en: "Fitting" },
        detail: {
          sq: "Proteza dorëzohet dhe rregullohet derisa të ulet rehat.",
          en: "The denture is fitted and adjusted until it sits comfortably.",
        },
      },
      {
        title: { sq: "Kontrollet", en: "Follow-up" },
        detail: {
          sq: "Takime kontrolli për rregullime të vogla gjatë periudhës së përshtatjes.",
          en: "Check-up appointments for small adjustments during the settling-in period.",
        },
      },
    ],
  },
  {
    slug: "endodonti",
    title: { sq: "Endodonti", en: "Root canal treatment" },
    summary: {
      sq: "Trajtimi i kanalit të rrënjës për të shpëtuar një dhëmb me infeksion në nerv.",
      en: "Root canal treatment to save a tooth with an infected nerve.",
    },
    body: [
      {
        sq: "Kur infeksioni arrin nervin e dhëmbit, trajtimi i kanalit të rrënjës është mënyra për ta ruajtur dhëmbin në vend të heqjes së tij. Nervi i infektuar hiqet, kanalet pastrohen, dezinfektohen dhe mbyllen.",
        en: "When infection reaches the nerve of a tooth, root canal treatment is the way to keep the tooth rather than remove it. The infected nerve is removed and the canals are cleaned, disinfected and sealed.",
      },
      {
        sq: "Trajtimi kryhet me anestezi lokale dhe, sipas rastit, mund të kërkojë më shumë se një seancë. Pas tij, dhëmbi shpesh ka nevojë për një kurorë për ta mbrojtur nga thyerja.",
        en: "The treatment is carried out under local anaesthetic and, depending on the case, may take more than one appointment. Afterwards the tooth often needs a crown to protect it from fracture.",
      },
    ],
    highlights: [
      { sq: "Ruan dhëmbin natyral në vend të heqjes", en: "Keeps the natural tooth instead of extracting it" },
      { sq: "Kryhet me anestezi lokale", en: "Carried out under local anaesthetic" },
      { sq: "Mund të kërkojë më shumë se një seancë", en: "May require more than one appointment" },
    ],
    steps: [
      {
        title: { sq: "Diagnoza", en: "Diagnosis" },
        detail: {
          sq: "Ekzaminim dhe radiografi për të përcaktuar shtrirjen e infeksionit.",
          en: "An examination and radiograph to determine the extent of the infection.",
        },
      },
      {
        title: { sq: "Pastrimi i kanaleve", en: "Cleaning the canals" },
        detail: {
          sq: "Nervi i infektuar hiqet dhe kanalet pastrohen e dezinfektohen.",
          en: "The infected nerve is removed and the canals are cleaned and disinfected.",
        },
      },
      {
        title: { sq: "Mbyllja", en: "Sealing" },
        detail: {
          sq: "Kanalet mbushen dhe mbyllen hermetikisht.",
          en: "The canals are filled and sealed.",
        },
      },
      {
        title: { sq: "Restaurimi", en: "Restoration" },
        detail: {
          sq: "Dhëmbi restaurohet me mbushje ose me kurorë, sipas gjendjes së tij.",
          en: "The tooth is restored with a filling or a crown, depending on its condition.",
        },
      },
    ],
  },
  {
    slug: "mbushje-dentare",
    title: { sq: "Mbushje të dhëmbëve", en: "Dental fillings" },
    summary: {
      sq: "Riparimi i kariesit me materiale kompozite në ngjyrën e dhëmbit.",
      en: "Repairing decay with tooth-coloured composite materials.",
    },
    body: [
      {
        sq: "Mbushja riparon një dhëmb të prekur nga kariesi. Pjesa e dëmtuar hiqet dhe zbrazëtira mbushet me material kompozit, i cili zgjidhet në ngjyrën e dhëmbit tuaj.",
        en: "A filling repairs a tooth affected by decay. The damaged part is removed and the cavity is filled with a composite material chosen to match the colour of your tooth.",
      },
      {
        sq: "Sa më herët të trajtohet kariesi, aq më pak strukturë dhëmbi humbet. Kariesi i vogël shpesh nuk shkakton dhimbje, prandaj kontrollet e rregullta janë mënyra më e sigurt për ta kapur në kohë.",
        en: "The earlier decay is treated, the less tooth structure is lost. Small cavities often cause no pain, which is why regular check-ups are the most reliable way to catch them early.",
      },
    ],
    highlights: [
      { sq: "Material kompozit në ngjyrën e dhëmbit", en: "Tooth-coloured composite material" },
      { sq: "Zakonisht përfundon në një seancë", en: "Usually completed in a single appointment" },
      { sq: "Ruan sa më shumë strukturë natyrale", en: "Preserves as much natural structure as possible" },
    ],
    steps: [
      {
        title: { sq: "Kontrolli", en: "Examination" },
        detail: {
          sq: "Identifikohet kariesi dhe vlerësohet thellësia e tij.",
          en: "The decay is identified and its depth assessed.",
        },
      },
      {
        title: { sq: "Pastrimi i kariesit", en: "Removing the decay" },
        detail: {
          sq: "Pjesa e prekur hiqet me kujdes, duke ruajtur indin e shëndoshë.",
          en: "The affected part is carefully removed while healthy tissue is preserved.",
        },
      },
      {
        title: { sq: "Mbushja", en: "Filling" },
        detail: {
          sq: "Zbrazëtira mbushet me kompozit dhe formësohet sipas dhëmbit.",
          en: "The cavity is filled with composite and shaped to the tooth.",
        },
      },
      {
        title: { sq: "Rregullimi i kafshimit", en: "Adjusting the bite" },
        detail: {
          sq: "Mbushja lëmohet dhe kontrollohet që kafshimi të jetë i rehatshëm.",
          en: "The filling is polished and the bite is checked for comfort.",
        },
      },
    ],
  },
  {
    slug: "pastrim-dentar",
    title: { sq: "Pastrim i dhëmbëve", en: "Professional cleaning" },
    summary: {
      sq: "Heqja e pllakës dhe e gurëzave që furça nuk i arrin, si bazë e shëndetit të mishrave.",
      en: "Removing the plaque and tartar a toothbrush cannot reach — the basis of healthy gums.",
    },
    body: [
      {
        sq: "Edhe me larje të rregullt, në disa zona grumbullohet pllakë që me kohë ngurtësohet në gurëza. Pastrimi profesional i heq ato dhe lëmon sipërfaqen e dhëmbëve, duke ulur irritimin e mishrave.",
        en: "Even with regular brushing, plaque builds up in some areas and hardens over time into tartar. A professional cleaning removes it and polishes the tooth surfaces, reducing gum irritation.",
      },
      {
        sq: "Pastrimi është edhe mundësia më e mirë për një kontroll të plotë: gjatë seancës shikohen dhëmbët dhe mishrat, kështu që problemet e vogla kapen para se të rriten.",
        en: "A cleaning is also the best opportunity for a full check-up: the teeth and gums are examined during the appointment, so small problems are caught before they grow.",
      },
    ],
    highlights: [
      { sq: "Përfshin kontroll të plotë të dhëmbëve dhe mishrave", en: "Includes a full check of teeth and gums" },
      { sq: "Zakonisht një seancë e vetme", en: "Usually a single appointment" },
      { sq: "Këshilla praktike për kujdesin në shtëpi", en: "Practical advice for care at home" },
    ],
    steps: [
      {
        title: { sq: "Kontrolli fillestar", en: "Initial check" },
        detail: {
          sq: "Vlerësohet gjendja e mishrave dhe sasia e gurëzave.",
          en: "The condition of the gums and the amount of tartar are assessed.",
        },
      },
      {
        title: { sq: "Heqja e gurëzave", en: "Removing tartar" },
        detail: {
          sq: "Gurëzat hiqen nga sipërfaqja e dhëmbëve dhe nga vija e mishrave.",
          en: "Tartar is removed from the tooth surfaces and along the gum line.",
        },
      },
      {
        title: { sq: "Lëmimi", en: "Polishing" },
        detail: {
          sq: "Sipërfaqet lëmohen, gjë që ngadalëson grumbullimin e pllakës.",
          en: "The surfaces are polished, which slows down how quickly plaque returns.",
        },
      },
      {
        title: { sq: "Udhëzimet", en: "Advice" },
        detail: {
          sq: "Kalojmë bashkë teknikën e larjes dhe zonat që kërkojnë më shumë vëmendje.",
          en: "We go through brushing technique together and the areas that need more attention.",
        },
      },
    ],
  },
  {
    slug: "zbardhim-dentar",
    title: { sq: "Zbardhim i dhëmbëve", en: "Teeth whitening" },
    summary: {
      sq: "Trajtim estetik për të lehtësuar ngjyrosjet, pas një kontrolli që konfirmon se dhëmbët janë të shëndetshëm.",
      en: "A cosmetic treatment to lighten staining, after a check confirms the teeth are healthy.",
    },
    body: [
      {
        sq: "Zbardhimi lehtëson ngjyrosjet e grumbulluara me kohë nga kafeja, çaji, duhani ose thjesht nga mosha. Trajtimi kryhet vetëm pasi konfirmohet se dhëmbët dhe mishrat janë të shëndetshëm.",
        en: "Whitening lightens staining built up over time from coffee, tea, smoking or simply age. The treatment is only carried out once the teeth and gums have been confirmed healthy.",
      },
      {
        sq: "Rezultati ndryshon nga personi në person dhe varet nga ngjyra fillestare e dhëmbëve dhe nga shkaku i ngjyrosjes. Materialet artificiale si mbushjet dhe kurorat nuk e ndryshojnë ngjyrën, prandaj planifikimi bëhet paraprakisht.",
        en: "Results vary from person to person and depend on the starting shade and the cause of the staining. Artificial materials such as fillings and crowns do not change colour, so this is planned for in advance.",
      },
    ],
    highlights: [
      { sq: "Kryhet pas një kontrolli paraprak", en: "Carried out after a preliminary check" },
      { sq: "Rezultati ndryshon sipas rastit", en: "Results vary from case to case" },
      { sq: "Këshilla për ta ruajtur rezultatin", en: "Advice on maintaining the result" },
    ],
    steps: [
      {
        title: { sq: "Kontrolli paraprak", en: "Preliminary check" },
        detail: {
          sq: "Konfirmohet se dhëmbët dhe mishrat janë të shëndetshëm për trajtim.",
          en: "The teeth and gums are confirmed healthy enough for treatment.",
        },
      },
      {
        title: { sq: "Pastrimi", en: "Cleaning" },
        detail: {
          sq: "Zakonisht paraprihet nga një pastrim, që trajtimi të veprojë në sipërfaqe të pastër.",
          en: "It is usually preceded by a cleaning so the treatment works on a clean surface.",
        },
      },
      {
        title: { sq: "Trajtimi", en: "The treatment" },
        detail: {
          sq: "Materiali zbardhues aplikohet me mishrat e mbrojtur.",
          en: "The whitening material is applied with the gums protected.",
        },
      },
      {
        title: { sq: "Ruajtja e rezultatit", en: "Maintaining the result" },
        detail: {
          sq: "Udhëzime për ushqimet dhe pijet në ditët e para pas trajtimit.",
          en: "Guidance on food and drink in the first days after treatment.",
        },
      },
    ],
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}

export const serviceSlugs = services.map((service) => service.slug);
