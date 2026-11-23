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
  /** Matching group in `content/prices.ts`, so each page can list its prices. */
  priceGroupId: string;
};

/**
 * The eight areas of treatment the clinic offers, in the order and grouping of
 * its own price list. Descriptions are general, factual explanations of each
 * area: no outcome promises, and nothing claimed that the price list does not
 * actually cover.
 */
export const services: Service[] = [
  {
    slug: "stomatologji-e-pergjithshme",
    priceGroupId: "e-pergjithshme",
    title: { sq: "Stomatologji e përgjithshme", en: "General dentistry", de: "Allgemeine Zahnmedizin" },
    summary: {
      sq: "Kontrolli i rregullt, radiografitë dhe masat parandaluese që i kapin problemet herët.",
      en: "Routine check-ups, radiographs and the preventive care that catches problems early.",
      de: "Regelmäßige Kontrollen, Röntgenbilder und Vorsorge, die Probleme früh erkennt.",
    },
    body: [
      {
        sq: "Stomatologjia e përgjithshme është pika ku fillon çdo trajtim tjetër. Në kontroll shikohen dhëmbët, mishrat dhe kafshimi, dhe kur nevojitet bëhet një radiografi retroalveolare për të parë atë që nuk duket me sy.",
        en: "General dentistry is where every other treatment starts. A check-up looks at the teeth, the gums and the bite, and when needed a periapical radiograph shows what the eye cannot.",
        de: "Mit der allgemeinen Zahnmedizin beginnt jede andere Behandlung. Bei der Kontrolle werden Zähne, Zahnfleisch und Biss untersucht, und bei Bedarf zeigt ein Zahnfilm, was das Auge nicht sieht.",
      },
      {
        sq: "Këtu hyjnë edhe masat parandaluese: fluorizimi dhe vulosja e fisurave, që mbrojnë sipërfaqet e dhëmbëve përpara se të shfaqet kariesi. Sa më herët kapet një problem, aq më i thjeshtë dhe më i lirë është trajtimi.",
        en: "It also covers prevention: fluoride treatment and fissure sealing, which protect the tooth surfaces before decay appears. The earlier a problem is caught, the simpler and the cheaper it is to treat.",
        de: "Dazu gehört auch die Vorsorge: Fluoridierung und Fissurenversiegelung, die die Zahnoberflächen schützen, bevor Karies entsteht. Je früher ein Problem erkannt wird, desto einfacher und günstiger ist die Behandlung.",
      },
    ],
    highlights: [
      { sq: "Kontroll i plotë i dhëmbëve dhe mishrave", en: "A full check of teeth and gums", de: "Vollständige Kontrolle von Zähnen und Zahnfleisch" },
      { sq: "Radiografi retroalveolare sipas nevojës", en: "Periapical radiographs when needed", de: "Zahnfilm-Röntgenbilder bei Bedarf" },
      { sq: "Fluorizim dhe vulosje e fisurave", en: "Fluoride treatment and fissure sealing", de: "Fluoridierung und Fissurenversiegelung" },
    ],
    steps: [
      {
        title: { sq: "Biseda", en: "The conversation", de: "Das Gespräch" },
        detail: {
          sq: "Na tregoni për ankesat, sëmundjet kronike dhe medikamentet që merrni rregullisht.",
          en: "Tell us about any complaints, chronic conditions and medication you take regularly.",
          de: "Erzählen Sie uns von Beschwerden, chronischen Erkrankungen und Medikamenten, die Sie regelmäßig einnehmen.",
        },
      },
      {
        title: { sq: "Ekzaminimi", en: "Examination", de: "Untersuchung" },
        detail: {
          sq: "Shikohen të gjithë dhëmbët, mishrat dhe mënyra si mbyllet kafshimi.",
          en: "All the teeth, the gums and the way the bite closes are examined.",
          de: "Alle Zähne, das Zahnfleisch und der Zusammenbiss werden untersucht.",
        },
      },
      {
        title: { sq: "Imazhet", en: "Imaging", de: "Bildgebung" },
        detail: {
          sq: "Nëse nevojitet, një radiografi tregon zonat mes dhëmbëve dhe rreth rrënjëve.",
          en: "If needed, a radiograph shows the areas between the teeth and around the roots.",
          de: "Bei Bedarf zeigt ein Röntgenbild die Bereiche zwischen den Zähnen und um die Wurzeln.",
        },
      },
      {
        title: { sq: "Plani", en: "The plan", de: "Der Plan" },
        detail: {
          sq: "Dilni me një plan të qartë: çfarë duhet bërë, në sa seanca dhe sa kushton.",
          en: "You leave with a clear plan: what needs doing, in how many appointments, and what it costs.",
          de: "Sie gehen mit einem klaren Plan: was zu tun ist, in wie vielen Terminen und was es kostet.",
        },
      },
    ],
  },
  {
    slug: "pedodonci",
    priceGroupId: "pedodonci",
    title: { sq: "Pedodonci", en: "Paediatric dentistry", de: "Kinderzahnheilkunde" },
    summary: {
      sq: "Trajtimi i dhëmbëve të qumështit, pa nxitim, që fëmija të mos ketë frikë nga vizita e radhës.",
      en: "Care for milk teeth, unhurried, so a child does not dread the next visit.",
      de: "Behandlung der Milchzähne in Ruhe, damit ein Kind den nächsten Besuch nicht fürchtet.",
    },
    body: [
      {
        sq: "Dhëmbët e qumështit kanë rëndësi: ata mbajnë vendin për dhëmbët e përhershëm dhe ndikojnë në përtypje e në të folur. Kariesi tek ata trajtohet me mbushje kompozite, njësoj si tek të rriturit.",
        en: "Milk teeth matter: they hold the space for the permanent teeth and affect chewing and speech. Decay in them is treated with composite fillings, just as in adults.",
        de: "Milchzähne sind wichtig: Sie halten den Platz für die bleibenden Zähne frei und beeinflussen Kauen und Sprechen. Karies wird bei ihnen mit Kompositfüllungen behandelt, genau wie bei Erwachsenen.",
      },
      {
        sq: "Kur një dhëmb qumështi nuk mund të ruhet, ai hiqet. Vizita e parë bëhet pa nxitim: fëmija njihet me dhomën dhe me pajisjet, dhe puna fillon vetëm kur ndihet i qetë.",
        en: "When a milk tooth cannot be saved, it is removed. The first visit is never rushed: the child gets to know the room and the equipment, and work only starts once they feel settled.",
        de: "Lässt sich ein Milchzahn nicht erhalten, wird er entfernt. Der erste Besuch erfolgt nie in Eile: Das Kind lernt den Raum und die Geräte kennen, und die Behandlung beginnt erst, wenn es sich wohlfühlt.",
      },
    ],
    highlights: [
      { sq: "Mbushje kompozite në dhëmbët e qumështit", en: "Composite fillings in milk teeth", de: "Kompositfüllungen in Milchzähnen" },
      { sq: "Vizita e parë pa nxitim", en: "An unhurried first visit", de: "Ein erster Besuch ohne Eile" },
      { sq: "Këshilla për larjen e dhëmbëve në shtëpi", en: "Advice on brushing at home", de: "Tipps zum Zähneputzen zu Hause" },
    ],
    steps: [
      {
        title: { sq: "Njohja", en: "Getting comfortable", de: "Vertraut werden" },
        detail: {
          sq: "Fëmija shikon dhomën dhe pajisjet përpara se të preket ndonjë dhëmb.",
          en: "The child sees the room and the equipment before any tooth is touched.",
          de: "Das Kind sieht den Raum und die Geräte, bevor ein Zahn berührt wird.",
        },
      },
      {
        title: { sq: "Ekzaminimi", en: "Examination", de: "Untersuchung" },
        detail: {
          sq: "Kontrollohen dhëmbët e qumështit dhe ata të përhershëm që kanë dalë.",
          en: "The milk teeth and any permanent teeth that have come through are checked.",
          de: "Die Milchzähne und die bereits durchgebrochenen bleibenden Zähne werden kontrolliert.",
        },
      },
      {
        title: { sq: "Trajtimi", en: "Treatment", de: "Behandlung" },
        detail: {
          sq: "Mbushje ose nxjerrje, sipas gjendjes së dhëmbit, me hapa të shpjeguar edhe fëmijës.",
          en: "A filling or an extraction, depending on the tooth, with each step explained to the child too.",
          de: "Je nach Zahn eine Füllung oder eine Extraktion, wobei jeder Schritt auch dem Kind erklärt wird.",
        },
      },
      {
        title: { sq: "Kontrolli", en: "Follow-up", de: "Nachsorge" },
        detail: {
          sq: "Një takim kontrolli dhe udhëzime praktike për prindin.",
          en: "A check-up appointment and practical guidance for the parent.",
          de: "Ein Kontrolltermin und praktische Hinweise für die Eltern.",
        },
      },
    ],
  },
  {
    slug: "kirurgji-orale",
    priceGroupId: "kirurgji-orale",
    title: { sq: "Kirurgji orale", en: "Oral surgery", de: "Oralchirurgie" },
    summary: {
      sq: "Nxjerrje dhëmbësh, ndërhyrje në mishra e kockë dhe vendosja e implanteve.",
      en: "Extractions, procedures on the gums and bone, and the placement of dental implants.",
      de: "Zahnentfernungen, Eingriffe an Zahnfleisch und Knochen und das Setzen von Zahnimplantaten.",
    },
    body: [
      {
        sq: "Kirurgjia orale përfshin çdo ndërhyrje që kërkon punë në indet e gojës dhe të nofullës: heqjen e dhëmbëve që nuk mund të ruhen, nxjerrjen e dhëmbëve të pjekurisë dhe të atyre të impaktuar, si dhe përgatitjen e kockës përpara vendosjes së implanteve.",
        en: "Oral surgery covers any procedure that involves working on the tissues of the mouth and jaw: removing teeth that cannot be saved, extracting wisdom and impacted teeth, and preparing the bone before an implant is placed.",
        de: "Die Oralchirurgie umfasst alle Eingriffe am Gewebe von Mund und Kiefer: das Entfernen nicht erhaltungswürdiger Zähne, das Ziehen von Weisheitszähnen und verlagerten Zähnen und die Vorbereitung des Knochens, bevor ein Implantat gesetzt wird.",
      },
      {
        sq: "Implanti është një rrënjë artificiale prej titani që vendoset në kockë dhe merr rolin e rrënjës natyrale. Trajtimi zhvillohet në faza: pas vendosjes, implantit i duhet një periudhë shërimi për t'u integruar me kockën përpara se mbi të të fiksohet kurora.",
        en: "An implant is an artificial titanium root placed in the bone that takes over the role of the natural root. Treatment happens in stages: after placement, the implant needs a healing period to integrate with the bone before the crown is fixed on top.",
        de: "Ein Implantat ist eine künstliche Wurzel aus Titan, die in den Knochen gesetzt wird und die Aufgabe der natürlichen Wurzel übernimmt. Die Behandlung erfolgt in Etappen: Nach dem Setzen braucht das Implantat eine Einheilzeit, um mit dem Knochen zu verwachsen, bevor die Krone darauf befestigt wird.",
      },
    ],
    highlights: [
      { sq: "Kryhet me anestezi lokale", en: "Performed under local anaesthetic", de: "Unter örtlicher Betäubung" },
      { sq: "Planifikim me imazhe diagnostikuese", en: "Planned with diagnostic imaging", de: "Geplant mit diagnostischer Bildgebung" },
      { sq: "Udhëzime të shkruara për kujdesin pas ndërhyrjes", en: "Written aftercare instructions", de: "Schriftliche Hinweise für die Nachsorge" },
    ],
    steps: [
      {
        title: { sq: "Konsulta dhe diagnoza", en: "Consultation and diagnosis", de: "Beratung und Diagnose" },
        detail: {
          sq: "Ekzaminim dhe imazhe për të parë gjendjen e dhëmbit dhe të kockës përreth.",
          en: "An examination and imaging to assess the tooth and the surrounding bone.",
          de: "Untersuchung und Bildgebung, um den Zahn und den umgebenden Knochen zu beurteilen.",
        },
      },
      {
        title: { sq: "Plani i trajtimit", en: "Treatment plan", de: "Behandlungsplan" },
        detail: {
          sq: "Diskutojmë opsionet, kohëzgjatjen dhe koston përpara se të fillojë ndërhyrja.",
          en: "We discuss the options, the timeline and the cost before anything begins.",
          de: "Wir besprechen die Möglichkeiten, den Zeitplan und die Kosten, bevor etwas beginnt.",
        },
      },
      {
        title: { sq: "Ndërhyrja", en: "The procedure", de: "Der Eingriff" },
        detail: {
          sq: "Zona anestetizohet plotësisht dhe ndërhyrja kryhet në ambient steril.",
          en: "The area is fully numbed and the procedure is carried out in a sterile setting.",
          de: "Der Bereich wird vollständig betäubt, und der Eingriff erfolgt in steriler Umgebung.",
        },
      },
      {
        title: { sq: "Kontrolli pas ndërhyrjes", en: "Follow-up", de: "Nachsorge" },
        detail: {
          sq: "Një takim kontrolli për të verifikuar shërimin dhe për të hequr suturat nëse duhet.",
          en: "A check-up appointment to confirm healing and remove sutures if needed.",
          de: "Ein Kontrolltermin, um die Heilung zu prüfen und bei Bedarf die Fäden zu ziehen.",
        },
      },
    ],
  },
  {
    slug: "endodonci",
    priceGroupId: "endodonci",
    title: {
      sq: "Sëmundje të dhëmbit dhe endodonci",
      en: "Tooth disease and endodontics",
      de: "Zahnerkrankungen und Endodontie",
    },
    summary: {
      sq: "Mbushjet e kariesit dhe trajtimi i kanalit të rrënjës, që dhëmbi të mbetet në vendin e vet.",
      en: "Fillings for decay and root canal treatment, so the tooth stays where it is.",
      de: "Füllungen bei Karies und Wurzelbehandlungen, damit der Zahn erhalten bleibt.",
    },
    body: [
      {
        sq: "Kariesi trajtohet me mbushje kompozite në ngjyrën e dhëmbit. Sa më herët kapet, aq më pak strukturë humbet dhëmbi. Kariesi i vogël shpesh nuk shkakton dhimbje, prandaj kontrollet e rregullta janë mënyra më e sigurt për ta kapur në kohë.",
        en: "Decay is treated with tooth-coloured composite fillings. The earlier it is caught, the less tooth structure is lost. Small cavities often cause no pain, which is why regular check-ups are the most reliable way to catch them in time.",
        de: "Karies wird mit zahnfarbenen Kompositfüllungen behandelt. Je früher sie erkannt wird, desto weniger Zahnsubstanz geht verloren. Kleine Löcher verursachen oft keine Schmerzen, deshalb sind regelmäßige Kontrollen der zuverlässigste Weg, sie rechtzeitig zu finden.",
      },
      {
        sq: "Kur infeksioni arrin nervin, trajtimi i kanalit të rrënjës është mënyra për ta ruajtur dhëmbin në vend të heqjes. Nervi i infektuar hiqet, kanalet pastrohen, dezinfektohen dhe mbyllen. Sipas dhëmbit mund të jenë një deri në tre kanale, dhe mund të nevojitet më shumë se një seancë.",
        en: "When infection reaches the nerve, root canal treatment is the way to keep the tooth rather than remove it. The infected nerve is removed and the canals are cleaned, disinfected and sealed. Depending on the tooth there may be one to three canals, and more than one appointment may be needed.",
        de: "Erreicht eine Entzündung den Nerv, ist die Wurzelbehandlung der Weg, den Zahn zu erhalten, statt ihn zu entfernen. Der entzündete Nerv wird entfernt, die Kanäle werden gereinigt, desinfiziert und versiegelt. Je nach Zahn gibt es einen bis drei Kanäle, und es kann mehr als ein Termin nötig sein.",
      },
    ],
    highlights: [
      { sq: "Mbushje kompozite në ngjyrën e dhëmbit", en: "Tooth-coloured composite fillings", de: "Zahnfarbene Kompositfüllungen" },
      { sq: "Ruan dhëmbin natyral në vend të heqjes", en: "Keeps the natural tooth instead of extracting it", de: "Erhält den natürlichen Zahn, statt ihn zu ziehen" },
      { sq: "Kryhet me anestezi lokale", en: "Carried out under local anaesthetic", de: "Unter örtlicher Betäubung durchgeführt" },
    ],
    steps: [
      {
        title: { sq: "Diagnoza", en: "Diagnosis", de: "Diagnose" },
        detail: {
          sq: "Ekzaminim dhe radiografi për të përcaktuar shtrirjen e kariesit ose të infeksionit.",
          en: "An examination and radiograph to determine the extent of the decay or infection.",
          de: "Untersuchung und Röntgenbild, um das Ausmaß der Karies oder Entzündung festzustellen.",
        },
      },
      {
        title: { sq: "Pastrimi", en: "Cleaning", de: "Reinigung" },
        detail: {
          sq: "Pjesa e prekur hiqet me kujdes, ose kanalet pastrohen dhe dezinfektohen.",
          en: "The affected part is carefully removed, or the canals are cleaned and disinfected.",
          de: "Der betroffene Teil wird sorgfältig entfernt, oder die Kanäle werden gereinigt und desinfiziert.",
        },
      },
      {
        title: { sq: "Mbyllja", en: "Sealing", de: "Verschluss" },
        detail: {
          sq: "Zbrazëtira mbushet me kompozit, ose kanalet mbushen dhe mbyllen hermetikisht.",
          en: "The cavity is filled with composite, or the canals are filled and sealed.",
          de: "Das Loch wird mit Komposit gefüllt, oder die Kanäle werden gefüllt und versiegelt.",
        },
      },
      {
        title: { sq: "Restaurimi", en: "Restoration", de: "Wiederherstellung" },
        detail: {
          sq: "Kafshimi rregullohet, dhe kur duhet dhëmbi mbrohet me kurorë.",
          en: "The bite is adjusted and, where needed, the tooth is protected with a crown.",
          de: "Der Biss wird angepasst, und bei Bedarf wird der Zahn mit einer Krone geschützt.",
        },
      },
    ],
  },
  {
    slug: "protetike",
    priceGroupId: "protetike",
    title: { sq: "Protetikë", en: "Prosthetics", de: "Prothetik" },
    summary: {
      sq: "Kurora, ura dhe proteza që rikthejnë përtypjen dhe pamjen e dhëmbëve.",
      en: "Crowns, bridges and dentures that restore both chewing and appearance.",
      de: "Kronen, Brücken und Prothesen, die Kaufunktion und Aussehen wiederherstellen.",
    },
    body: [
      {
        sq: "Kurora është një mbulesë që vendoset mbi një dhëmb të dëmtuar, të thyer ose të trajtuar me kanal, kur mbushja nuk mjafton më. Punohet me porosi sipas masës së gojës suaj, dhe ngjyra zgjidhet për t'iu përshtatur dhëmbëve fqinjë.",
        en: "A crown is a cap placed over a tooth that is damaged, broken or root-treated, when a filling is no longer enough. It is made to order from an impression of your own mouth, and the shade is matched to the neighbouring teeth.",
        de: "Eine Krone ist eine Kappe über einem beschädigten, abgebrochenen oder wurzelbehandelten Zahn, wenn eine Füllung nicht mehr ausreicht. Sie wird nach einem Abdruck Ihres eigenen Mundes angefertigt, und die Farbe wird an die Nachbarzähne angepasst.",
      },
      {
        sq: "Kur mungojnë disa dhëmbë ose i gjithë harku, proteza rikthen përtypjen, të folurit dhe mbështetjen e strukturës së fytyrës. Zgjedhja mes akrilatit, protezës së skeletuar dhe asaj mbi implante varet nga sa dhëmbë kanë mbetur dhe nga gjendja e kockës.",
        en: "When several teeth or a whole arch are missing, a denture restores chewing, speech and support for the structure of the face. The choice between acrylic, a cast framework and an implant-supported denture depends on how many teeth remain and on the condition of the bone.",
        de: "Fehlen mehrere Zähne oder ein ganzer Zahnbogen, stellt eine Prothese Kauen, Sprechen und den Halt der Gesichtsstrukturen wieder her. Die Wahl zwischen Kunststoffprothese, Modellguss und implantatgetragener Prothese hängt davon ab, wie viele Zähne noch vorhanden sind und in welchem Zustand der Knochen ist.",
      },
    ],
    highlights: [
      { sq: "Punohen me porosi për çdo pacient", en: "Made to order for each patient", de: "Für jeden Patienten individuell angefertigt" },
      { sq: "Ngjyra përshtatet me dhëmbët fqinjë", en: "Shade matched to the neighbouring teeth", de: "Farbe an die Nachbarzähne angepasst" },
      {
        sq: "Riparim dhe ri-cimentim i punimeve ekzistuese",
        en: "Repair and re-cementing of existing work",
        de: "Reparatur und Neubefestigung vorhandener Arbeiten",
      },
    ],
    steps: [
      {
        title: { sq: "Përgatitja", en: "Preparation", de: "Vorbereitung" },
        detail: {
          sq: "Dhëmbi formësohet me kujdes, ose vlerësohen dhëmbët që kanë mbetur.",
          en: "The tooth is carefully shaped, or the remaining teeth are assessed.",
          de: "Der Zahn wird sorgfältig beschliffen, oder die verbliebenen Zähne werden beurteilt.",
        },
      },
      {
        title: { sq: "Marrja e masës", en: "Taking the impression", de: "Der Abdruck" },
        detail: {
          sq: "Merret masa e gojës dhe përcaktohet ngjyra e punimit.",
          en: "An impression is taken and the shade of the work is agreed.",
          de: "Ein Abdruck wird genommen und die Farbe der Arbeit abgestimmt.",
        },
      },
      {
        title: { sq: "Provat", en: "Try-ins", de: "Anproben" },
        detail: {
          sq: "Deri sa punohet punimi përfundimtar, dhëmbi mbrohet me kurorë të përkohshme.",
          en: "While the final work is made, the tooth is protected with a temporary crown.",
          de: "Während die endgültige Arbeit angefertigt wird, schützt ein Provisorium den Zahn.",
        },
      },
      {
        title: { sq: "Fiksimi", en: "Fitting", de: "Einsetzen" },
        detail: {
          sq: "Punimi provohet, rregullohet nëse duhet dhe fiksohet përfundimisht.",
          en: "The work is tried in, adjusted if needed and then permanently fitted.",
          de: "Die Arbeit wird anprobiert, bei Bedarf angepasst und dann endgültig eingesetzt.",
        },
      },
    ],
  },
  {
    slug: "estetike-dentare",
    priceGroupId: "estetike",
    title: {
      sq: "Estetikë dentare dhe zbardhim",
      en: "Dental aesthetics and whitening",
      de: "Ästhetische Zahnmedizin und Bleaching",
    },
    summary: {
      sq: "Zbardhim, faseta dhe mbushje estetike, pas një kontrolli që konfirmon se dhëmbët janë të shëndetshëm.",
      en: "Whitening, veneers and aesthetic fillings, after a check confirms the teeth are healthy.",
      de: "Bleaching, Veneers und ästhetische Füllungen, nachdem eine Kontrolle bestätigt hat, dass die Zähne gesund sind.",
    },
    body: [
      {
        sq: "Zbardhimi lehtëson ngjyrosjet e grumbulluara me kohë nga kafeja, çaji, duhani ose thjesht nga mosha. Një dhëmb i vetëm që është errësuar pas trajtimit të kanalit mund të zbardhet veçmas nga të tjerët.",
        en: "Whitening lightens staining built up over time from coffee, tea, smoking or simply age. A single tooth that has darkened after root canal treatment can be whitened on its own.",
        de: "Bleaching hellt Verfärbungen auf, die sich mit der Zeit durch Kaffee, Tee, Rauchen oder einfach das Alter bilden. Ein einzelner Zahn, der nach einer Wurzelbehandlung nachgedunkelt ist, kann auch für sich aufgehellt werden.",
      },
      {
        sq: "Fasetat estetike janë shtresa të holla që vendosen mbi sipërfaqen e përparme të dhëmbit dhe ndryshojnë formën ose ngjyrën e tij. Trajtimet estetike kryhen vetëm pasi konfirmohet se dhëmbët dhe mishrat janë të shëndetshëm. Materialet artificiale si mbushjet dhe kurorat nuk e ndryshojnë ngjyrën, prandaj planifikimi bëhet paraprakisht.",
        en: "Veneers are thin layers placed over the front surface of a tooth to change its shape or its colour. Cosmetic treatment is only carried out once the teeth and gums have been confirmed healthy. Artificial materials such as fillings and crowns do not change colour, so this is planned for in advance.",
        de: "Veneers sind dünne Schalen, die auf die Vorderseite eines Zahns gesetzt werden, um seine Form oder Farbe zu verändern. Eine ästhetische Behandlung erfolgt erst, wenn feststeht, dass Zähne und Zahnfleisch gesund sind. Künstliche Materialien wie Füllungen und Kronen verändern ihre Farbe nicht, deshalb wird das im Voraus eingeplant.",
      },
    ],
    highlights: [
      { sq: "Kryhet pas një kontrolli paraprak", en: "Carried out after a preliminary check", de: "Nach einer Voruntersuchung durchgeführt" },
      { sq: "Rezultati ndryshon sipas rastit", en: "Results vary from case to case", de: "Die Ergebnisse sind von Fall zu Fall verschieden" },
      { sq: "Këshilla për ta ruajtur rezultatin", en: "Advice on keeping the result", de: "Tipps, um das Ergebnis zu erhalten" },
    ],
    steps: [
      {
        title: { sq: "Kontrolli paraprak", en: "Preliminary check", de: "Voruntersuchung" },
        detail: {
          sq: "Konfirmohet se dhëmbët dhe mishrat janë të shëndetshëm për trajtim estetik.",
          en: "The teeth and gums are confirmed healthy enough for cosmetic treatment.",
          de: "Es wird bestätigt, dass Zähne und Zahnfleisch gesund genug für eine ästhetische Behandlung sind.",
        },
      },
      {
        title: { sq: "Pastrimi", en: "Cleaning", de: "Reinigung" },
        detail: {
          sq: "Zakonisht paraprihet nga një pastrim, që trajtimi të veprojë në sipërfaqe të pastër.",
          en: "It is usually preceded by a cleaning, so the treatment works on a clean surface.",
          de: "Meist geht eine Reinigung voraus, damit die Behandlung auf einer sauberen Oberfläche wirkt.",
        },
      },
      {
        title: { sq: "Trajtimi", en: "The treatment", de: "Die Behandlung" },
        detail: {
          sq: "Zbardhimi kryhet me mishrat e mbrojtur, ose faseta punohet dhe fiksohet.",
          en: "Whitening is carried out with the gums protected, or the veneer is made and fitted.",
          de: "Das Bleaching erfolgt mit geschütztem Zahnfleisch, oder das Veneer wird angefertigt und eingesetzt.",
        },
      },
      {
        title: { sq: "Ruajtja e rezultatit", en: "Keeping the result", de: "Das Ergebnis erhalten" },
        detail: {
          sq: "Udhëzime për ushqimet dhe pijet në ditët e para pas trajtimit.",
          en: "Guidance on food and drink in the first days after treatment.",
          de: "Hinweise zu Essen und Trinken in den ersten Tagen nach der Behandlung.",
        },
      },
    ],
  },
  {
    slug: "ortodonci",
    priceGroupId: "ortodonci",
    title: { sq: "Ortodonci", en: "Orthodontics", de: "Kieferorthopädie" },
    summary: {
      sq: "Mbajtësit që ruajnë pozicionin e dhëmbëve pas një trajtimi ortodontik.",
      en: "Retainers that hold the teeth in position after orthodontic treatment.",
      de: "Retainer, die die Zähne nach einer kieferorthopädischen Behandlung in Position halten.",
    },
    body: [
      {
        sq: "Pas një trajtimi ortodontik, dhëmbët kanë prirjen të kthehen drejt pozicionit të mëparshëm. Retaineri është elementi që i mban në vend gjatë periudhës kur kocka dhe indet përreth stabilizohen.",
        en: "After orthodontic treatment, teeth tend to drift back towards their previous position. A retainer is what holds them in place while the bone and the surrounding tissue settle.",
        de: "Nach einer kieferorthopädischen Behandlung neigen die Zähne dazu, in ihre frühere Position zurückzuwandern. Ein Retainer hält sie an ihrem Platz, während sich Knochen und umgebendes Gewebe festigen.",
      },
      {
        sq: "Në klinikë vendoset retainer metalik. Nëse keni nevojë për një trajtim tjetër ortodontik, ejani në konsultë: shqyrtojmë rastin dhe ju themi qartë çfarë mund të bëhet këtu dhe çfarë kërkon një specialist tjetër.",
        en: "The clinic fits metal retainers. If you need other orthodontic treatment, come in for a consultation: we will look at the case and tell you plainly what can be done here and what needs a different specialist.",
        de: "Die Praxis setzt Metall-Retainer ein. Wenn Sie eine andere kieferorthopädische Behandlung brauchen, kommen Sie zu einer Beratung: Wir sehen uns den Fall an und sagen Ihnen offen, was hier gemacht werden kann und wofür ein anderer Spezialist nötig ist.",
      },
    ],
    highlights: [
      { sq: "Retainer metalik", en: "Metal retainer", de: "Metall-Retainer" },
      {
        sq: "Ruan rezultatin e trajtimit ortodontik",
        en: "Protects the result of orthodontic treatment",
        de: "Schützt das Ergebnis der kieferorthopädischen Behandlung",
      },
      { sq: "Konsultë përpara çdo vendimi", en: "A consultation before any decision", de: "Eine Beratung vor jeder Entscheidung" },
    ],
    steps: [
      {
        title: { sq: "Konsulta", en: "Consultation", de: "Beratung" },
        detail: {
          sq: "Shqyrtojmë pozicionin e dhëmbëve dhe trajtimin ortodontik që keni bërë.",
          en: "We look at the position of the teeth and the orthodontic treatment you have had.",
          de: "Wir sehen uns die Stellung der Zähne und Ihre bisherige kieferorthopädische Behandlung an.",
        },
      },
      {
        title: { sq: "Vendosja", en: "Fitting", de: "Einsetzen" },
        detail: {
          sq: "Retaineri vendoset dhe kontrollohet që të mos pengojë kafshimin.",
          en: "The retainer is fitted and checked so that it does not interfere with the bite.",
          de: "Der Retainer wird eingesetzt und geprüft, damit er den Biss nicht stört.",
        },
      },
      {
        title: { sq: "Kontrolli", en: "Check-up", de: "Kontrolle" },
        detail: {
          sq: "Një takim kontrolli për të parë se si po qëndron dhe si po ndihet.",
          en: "A check-up appointment to see how it is holding and how it feels.",
          de: "Ein Kontrolltermin, um zu sehen, wie er hält und wie er sich anfühlt.",
        },
      },
      {
        title: { sq: "Mirëmbajtja", en: "Care", de: "Pflege" },
        detail: {
          sq: "Udhëzime praktike për pastrimin rreth retainerit.",
          en: "Practical guidance on cleaning around the retainer.",
          de: "Praktische Hinweise zur Reinigung rund um den Retainer.",
        },
      },
    ],
  },
  {
    slug: "parodontologji",
    priceGroupId: "parodontologji",
    title: { sq: "Parodontologji", en: "Periodontology", de: "Parodontologie" },
    summary: {
      sq: "Pastrimi profesional dhe trajtimi i mishrave, ku fillon shëndeti i dhëmbëve.",
      en: "Professional cleaning and gum treatment, where healthy teeth begin.",
      de: "Professionelle Zahnreinigung und Zahnfleischbehandlung: Hier beginnen gesunde Zähne.",
    },
    body: [
      {
        sq: "Edhe me larje të rregullt, në disa zona grumbullohet pllakë që me kohë ngurtësohet në gurëza. Pastrimi profesional i heq ato dhe lëmon sipërfaqen e dhëmbëve, duke ulur irritimin e mishrave.",
        en: "Even with regular brushing, plaque builds up in some areas and hardens over time into tartar. A professional cleaning removes it and polishes the tooth surfaces, reducing gum irritation.",
        de: "Auch bei regelmäßigem Putzen sammelt sich an manchen Stellen Plaque an und verhärtet mit der Zeit zu Zahnstein. Eine professionelle Zahnreinigung entfernt ihn und poliert die Zahnoberflächen, was Reizungen des Zahnfleischs verringert.",
      },
      {
        sq: "Kur mishrat janë tashmë të prekur, nevojitet kiretazha parodontale, që pastron nën vijën e mishrave. Sipas thellësisë së problemit, ajo bëhet e mbyllur, kuadrant pas kuadranti, ose e hapur për një nofull të tërë.",
        en: "When the gums are already affected, periodontal curettage is needed to clean below the gum line. Depending on how deep the problem goes, it is done closed, quadrant by quadrant, or open across a whole jaw.",
        de: "Ist das Zahnfleisch bereits betroffen, ist eine parodontale Kürettage nötig, um unterhalb des Zahnfleischrands zu reinigen. Je nachdem, wie tief das Problem reicht, erfolgt sie geschlossen, Quadrant für Quadrant, oder offen für einen ganzen Kiefer.",
      },
    ],
    highlights: [
      {
        sq: "Përfshin kontroll të plotë të dhëmbëve dhe mishrave",
        en: "Includes a full check of teeth and gums",
        de: "Mit vollständiger Kontrolle von Zähnen und Zahnfleisch",
      },
      {
        sq: "Kiretazhë e mbyllur ose e hapur sipas rastit",
        en: "Closed or open curettage depending on the case",
        de: "Geschlossene oder offene Kürettage je nach Fall",
      },
      { sq: "Këshilla praktike për kujdesin në shtëpi", en: "Practical advice for care at home", de: "Praktische Tipps für die Pflege zu Hause" },
    ],
    steps: [
      {
        title: { sq: "Kontrolli fillestar", en: "Initial check", de: "Erstuntersuchung" },
        detail: {
          sq: "Vlerësohet gjendja e mishrave dhe sasia e gurëzave.",
          en: "The condition of the gums and the amount of tartar are assessed.",
          de: "Der Zustand des Zahnfleischs und die Menge an Zahnstein werden beurteilt.",
        },
      },
      {
        title: { sq: "Heqja e gurëzave", en: "Removing tartar", de: "Zahnsteinentfernung" },
        detail: {
          sq: "Gurëzat hiqen nga sipërfaqja e dhëmbëve dhe nga vija e mishrave.",
          en: "Tartar is removed from the tooth surfaces and along the gum line.",
          de: "Zahnstein wird von den Zahnoberflächen und entlang des Zahnfleischrands entfernt.",
        },
      },
      {
        title: { sq: "Kiretazha", en: "Curettage", de: "Kürettage" },
        detail: {
          sq: "Kur mishrat janë të prekur, pastrimi vazhdon nën vijën e tyre.",
          en: "Where the gums are affected, cleaning continues below the gum line.",
          de: "Wo das Zahnfleisch betroffen ist, wird unterhalb des Zahnfleischrands weitergereinigt.",
        },
      },
      {
        title: { sq: "Udhëzimet", en: "Advice", de: "Beratung" },
        detail: {
          sq: "Kalojmë bashkë teknikën e larjes dhe zonat që kërkojnë më shumë vëmendje.",
          en: "We go through brushing technique together and the areas that need more attention.",
          de: "Wir gehen gemeinsam die Putztechnik durch und die Stellen, die mehr Aufmerksamkeit brauchen.",
        },
      },
    ],
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}

export const serviceSlugs = services.map((service) => service.slug);
