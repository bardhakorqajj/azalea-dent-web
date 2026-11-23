import type { Dictionary } from "./sq";

/**
 * German copy. Written above all for patients from the diaspora in Germany,
 * Austria and Switzerland, who often book their treatment for a visit home,
 * and who read about medical matters more comfortably in German than in
 * English.
 *
 * The formal "Sie" is used throughout, as a German-speaking patient would
 * expect from a clinic. The `Dictionary` type is derived from the Albanian
 * file, so TypeScript fails the build if a key is ever missing here.
 */
export const de: Dictionary = {
  nav: {
    home: "Startseite",
    services: "Behandlungen",
    prices: "Preise",
    about: "Die Praxis",
    gallery: "Galerie",
    contact: "Kontakt",
    appointment: "Termin vereinbaren",
    menu: "Menü",
    openMenu: "Menü öffnen",
    closeMenu: "Menü schließen",
    skipToContent: "Zum Inhalt springen",
    language: "Sprache",
    theme: {
      label: "Darstellung",
      toggleToDark: "Zur dunklen Darstellung wechseln",
      toggleToLight: "Zur hellen Darstellung wechseln",
    },
  },

  actions: {
    bookAppointment: "Termin vereinbaren",
    seeTreatments: "Behandlungen ansehen",
    allTreatments: "Alle Behandlungen",
    learnMore: "Mehr erfahren",
    call: "Anrufen",
    whatsapp: "WhatsApp",
    viber: "Viber",
    instagram: "Instagram",
    facebook: "Facebook",
    email: "E-Mail",
    directions: "Auf der Karte ansehen",
    back: "Zurück",
    backToHome: "Zurück zur Startseite",
    viewGallery: "Galerie ansehen",
    viewPrices: "Preise ansehen",
  },

  hero: {
    eyebrow: "Zahnarztpraxis in Prishtina",
    title: "Zahnmedizin, die sich ganz Ihrem Lächeln widmet.",
    lead: "Azalea Dent ist eine Zahnarztpraxis in Prishtina, in der Holger-Petersen-Straße, mit einem ruhigen Wartebereich und einem voll ausgestatteten Behandlungsraum. Von Kontrolle, Reinigung und Füllungen bis zu Wurzelbehandlungen, Kronen und Zahnimplantaten: Jeden Behandlungsplan besprechen wir mit Ihnen, bevor wir beginnen.",
    imageCaption: "Der Behandlungsraum",
    scroll: "Scrollen",
  },

  intro: {
    eyebrow: "Die Praxis",
    title: "Ein Raum, der den Besuch leicht macht.",
    body: [
      "Die Praxis folgt einer einfachen Idee: Der Patient soll wissen, was gerade geschieht. Ein Besuch beginnt in einem ruhigen Wartebereich und geht im voll ausgestatteten Behandlungsraum weiter, wo jeder Schritt erklärt wird, bevor er erfolgt.",
      "Materialien, Farben und Licht wurden so gewählt, dass der Raum nicht kalt wirkt. Er ist sauber und professionell, aber auch warm, denn die Hälfte des Wohlbefindens während einer Behandlung kommt vom Raum selbst.",
    ],
    stats: [
      { value: "8", label: "Behandlungen" },
      { value: "14:00 – 20:00", label: "Montag – Freitag" },
    ],
  },

  services: {
    eyebrow: "Behandlungen",
    title: "Unser Angebot",
    lead: "Alle Behandlungen werden in der Praxis durchgeführt, von der Routinekontrolle bis zu chirurgischen Eingriffen und Zahnimplantaten.",
    pageTitle: "Zahnärztliche Behandlungen",
    pageLead:
      "Die acht Behandlungsbereiche bei Azalea Dent, Schritt für Schritt erklärt: was sie umfassen, wie sie ablaufen und was Sie erwartet.",
    priceTitle: "Preis",
    highlightsTitle: "Gut zu wissen",
    stepsTitle: "So läuft es ab",
    otherTitle: "Weitere Behandlungen",
    ctaTitle: "Fragen zu dieser Behandlung?",
    ctaBody:
      "Senden Sie uns das Formular oder schreiben Sie uns auf Instagram. Wir antworten Ihnen mit allen Details, die Sie vor der Terminbuchung brauchen.",
  },

  prices: {
    eyebrow: "Preise",
    title: "Preise für Zahnbehandlungen",
    lead: "Was eine Behandlung bei Azalea Dent in Prishtina kostet, nach derselben Preisliste, die in der Praxis aushängt.",
    note: "Alle Preise in Euro. Der endgültige Behandlungsplan und seine Kosten werden nach einer Untersuchung in der Praxis festgelegt.",
    ctaTitle: "Sie finden die gesuchte Behandlung nicht?",
    ctaBody:
      "Rufen Sie uns an oder schreiben Sie uns, und wir sagen Ihnen genau, was die Behandlung umfasst und was sie kostet.",
  },

  why: {
    eyebrow: "Warum Azalea Dent",
    title: "So arbeiten wir",
    items: [
      {
        title: "Erst der Plan, dann die Behandlung",
        body: "Zuerst kommen Untersuchung und Bildgebung, und sie bestimmen den Plan. Sie kennen Zeitrahmen und Kosten, bevor ein Eingriff beginnt.",
      },
      {
        title: "Ohne Fachchinesisch erklärt",
        body: "Jeder Schritt wird in einfachen Worten beschrieben. Fragen gehören zum Termin und sind keine Unterbrechung.",
      },
      {
        title: "Ausstattung und Sterilisation für jeden Patienten",
        body: "Der Behandlungsraum ist voll ausgestattet, und die Instrumente werden vor jedem Patienten nach Protokoll sterilisiert.",
      },
      {
        title: "Von der Kontrolle bis zur Chirurgie",
        body: "Reinigung, Füllungen, Wurzelbehandlungen, Zahnersatz und Implantate werden alle in derselben Praxis durchgeführt.",
      },
    ],
  },

  work: {
    eyebrow: "Galerie",
    title: "Unsere Arbeit",
    lead: "Fälle aus unserem Praxisalltag.",
  },

  gallery: {
    eyebrow: "Galerie",
    title: "Einblick in die Praxis",
    lead: "Echte Fotos des Raumes, in dem Ihre Behandlung stattfindet.",
    pageLead:
      "Der Eingang, der Wartebereich und der Behandlungsraum der Zahnarztpraxis Azalea Dent in Prishtina.",
    open: "Foto vergrößern",
    close: "Schließen",
    previous: "Vorheriges Foto",
    next: "Nächstes Foto",
    counter: "{current} von {total}",
  },

  team: {
    eyebrow: "Das Team",
    title: "Wer Sie behandelt",
    lead: "Das zahnärztliche Team von Azalea Dent.",
    empty: "Angaben zum Team werden in Kürze veröffentlicht.",
  },

  testimonials: {
    eyebrow: "Patientenerfahrungen",
    title: "Was Patienten sagen",
  },

  visit: {
    eyebrow: "Ihr Besuch",
    title: "Hier finden Sie uns",
    lead: "Die Praxis liegt in der Holger-Petersen-Straße in Prishtina, im Erdgeschoss, mit direktem Zugang von der Straße und einem beleuchteten Schild über der Tür.",
    hoursTitle: "Öffnungszeiten",
    addressTitle: "Adresse",
    contactTitle: "Kontakt",
    followTitle: "Folgen Sie uns",
    messagingTitle: "Schreiben Sie uns",
    followBody:
      "Fotos unserer Arbeit, Neuigkeiten und aktuelle Öffnungszeiten veröffentlichen wir auf Instagram.",
    hoursPending: "Die Öffnungszeiten werden in Kürze veröffentlicht.",
    addressPending: "Die vollständige Adresse wird in Kürze veröffentlicht.",
    contactPending:
      "Die Telefonnummer wird in Kürze veröffentlicht. Bis dahin schreiben Sie uns auf Instagram oder nutzen Sie das Formular.",
    closed: "Geschlossen",
    mapUnavailable: "Die Karte wird in Kürze hinzugefügt.",
  },

  faq: {
    eyebrow: "Fragen",
    title: "Die häufigsten Fragen",
    items: [
      {
        question: "Wie oft sollte ich zur Kontrolle kommen?",
        answer:
          "Für die meisten Erwachsenen wird alle sechs Monate eine Kontrolle empfohlen. Bei Zahnfleischproblemen oder einer laufenden Behandlung können häufigere Kontrollen sinnvoll sein.",
      },
      {
        question: "Tut die Behandlung weh?",
        answer:
          "Behandlungen, die schmerzhaft sein könnten, erfolgen unter örtlicher Betäubung, die den Bereich vollständig betäubt. Wenn Sie sich während eines Termins unwohl fühlen, sagen Sie es uns, und wir halten an.",
      },
      {
        question: "Wie lange dauert eine Implantatbehandlung?",
        answer:
          "Eine Implantatbehandlung erfolgt in Etappen. Nach dem Setzen braucht das Implantat eine Einheilzeit, um mit dem Knochen zu verwachsen, bevor die Krone aufgesetzt wird. Der genaue Zeitplan hängt vom Fall ab und steht in Ihrem Behandlungsplan.",
      },
      {
        question: "Was sollte ich zum ersten Besuch mitbringen?",
        answer:
          "Wenn Sie Röntgenbilder oder Unterlagen von früheren Behandlungen haben, bringen Sie diese bitte mit. Informieren Sie uns außerdem über chronische Erkrankungen und Medikamente, die Sie regelmäßig einnehmen.",
      },
      {
        question: "Wie vereinbare ich einen Termin?",
        answer:
          "Füllen Sie das Terminanfrageformular auf dieser Website aus oder schreiben Sie uns direkt auf Instagram. Wir melden uns, um Datum und Uhrzeit zu bestätigen.",
      },
      {
        question: "Wo ist die Praxis und wie finde ich Sie?",
        answer:
          "Azalea Dent liegt in der Holger-Petersen-Straße in Prishtina, im Erdgeschoss, mit eigenem Eingang von der Straße und einem beleuchteten Schild über der Tür. Auf der Kontaktseite finden Sie die Karte und einen Link zur Wegbeschreibung.",
      },
      {
        question: "Wann ist die Praxis geöffnet?",
        answer:
          "Die Praxis ist von Montag bis Freitag von 14:00 bis 20:00 Uhr geöffnet. Samstag und Sonntag ist geschlossen.",
      },
      {
        question: "Was kostet eine zahnärztliche Kontrolle?",
        answer:
          "Die Preise aller Behandlungen stehen auf der Preisseite, nach derselben Liste, die in der Praxis aushängt. Der endgültige Plan und seine Kosten werden nach einer Untersuchung festgelegt.",
      },
    ],
  },

  calendar: {
    months: [
      "Januar",
      "Februar",
      "März",
      "April",
      "Mai",
      "Juni",
      "Juli",
      "August",
      "September",
      "Oktober",
      "November",
      "Dezember",
    ],
    weekdaysShort: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
    openDate: "Kalender öffnen",
    openTime: "Liste der Uhrzeiten öffnen",
    previousMonth: "Vorheriger Monat",
    nextMonth: "Nächster Monat",
    datePlaceholder: "Datum wählen",
    timePlaceholder: "Uhrzeit wählen",
  },

  appointment: {
    eyebrow: "Termine",
    title: "Terminanfrage",
    lead: "Füllen Sie das Formular aus, und wir melden uns, um Datum und Uhrzeit zu bestätigen. Eine Anfrage ist erst dann ein fester Termin, wenn wir geantwortet haben.",
    directTitle: "Oder kontaktieren Sie uns direkt",
    form: {
      name: "Vollständiger Name",
      namePlaceholder: "Ihr Name",
      phone: "Telefonnummer",
      phonePlaceholder: "+49 170 0000000",
      email: "E-Mail (optional)",
      emailPlaceholder: "name@beispiel.de",
      service: "Behandlung",
      servicePlaceholder: "Behandlung wählen",
      serviceOther: "Unsicher / Sonstiges",
      date: "Wunschdatum",
      time: "Wunschuhrzeit",
      message: "Nachricht (optional)",
      messagePlaceholder: "Beschreiben Sie kurz den Grund Ihres Besuchs.",
      consent:
        "Ich bin einverstanden, dass meine Angaben nur verwendet werden, um mich zu dieser Anfrage zu kontaktieren.",
      submit: "Anfrage senden",
      submitting: "Wird gesendet…",
      required: "Pflichtfeld",
      optional: "optional",
    },
    errors: {
      name: "Bitte geben Sie Ihren Namen ein.",
      phone: "Bitte geben Sie eine gültige Telefonnummer ein.",
      email: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
      service: "Bitte wählen Sie eine Behandlung.",
      date: "Bitte wählen Sie ein Datum.",
      datePast: "Bitte wählen Sie ein Datum in der Zukunft.",
      time: "Bitte wählen Sie eine gültige Uhrzeit innerhalb der Öffnungszeiten.",
      consent: "Bitte stimmen Sie den Bedingungen zu, um fortzufahren.",
      generic:
        "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt.",
    },
    success: {
      title: "Anfrage gesendet",
      body: "Wir melden uns in Kürze, um Datum und Uhrzeit zu bestätigen. Ein Termin ist erst gebucht, wenn die Praxis ihn bestätigt hat.",
      again: "Weitere Anfrage senden",
    },
    failed: {
      title: "Die Anfrage wurde nicht gesendet",
      body: "Ein technisches Problem hat verhindert, dass Ihre Anfrage die Praxis erreicht. Bitte kontaktieren Sie uns direkt über eine der folgenden Möglichkeiten.",
    },
    unconfigured: {
      title: "Der Online-Versand ist noch nicht aktiv",
      body: "Das Formular ist noch nicht mit einem E-Mail-Dienst verbunden, daher wurde Ihre Anfrage nicht gesendet. Bitte kontaktieren Sie uns direkt über eine der folgenden Möglichkeiten, und wir melden uns so bald wie möglich.",
    },
    fallback: {
      heading: "Kontaktieren Sie uns direkt",
      note: "WhatsApp und E-Mail übernehmen die Angaben, die Sie bereits eingetragen haben, Sie müssen also nichts erneut eintippen.",
      emailSubject: "Terminanfrage",
    },
  },

  about: {
    eyebrow: "Die Praxis",
    title: "Über Azalea Dent",
    lead: "Eine Zahnarztpraxis in Prishtina, eingerichtet, damit sich ein Besuch ruhig und verständlich anfühlt.",
    storyTitle: "Der Raum",
    story: [
      "Azalea Dent liegt im Erdgeschoss, mit direktem Zugang von der Straße. Das beleuchtete Schild und die Azaleenblüte, dieselbe, die innen ins Glas graviert ist, sind das erste Erkennungszeichen der Praxis.",
      "Innen ist der Wartebereich so gestaltet, dass Warten keine Last ist: große Fenster, bequeme Sitzplätze und Tageslicht. Der Behandlungsraum ist durch Glas abgetrennt und voll ausgestattet.",
      "Die Farbpalette der Praxis aus Anthrazit, Eiche und warmem Weiß war eine bewusste Entscheidung. Viele Zahnarztpraxen wirken kalt. Diese sollte es nicht.",
    ],
    approachTitle: "Unser Ansatz",
    approach: [
      "Jede Behandlung beginnt mit einer Untersuchung und einem Plan. Sie wissen, was gemacht wird, wie viele Termine es braucht und was es kostet, bevor die Arbeit beginnt.",
      "Wenn es mehr als eine Lösung gibt, erklären wir alle, auch diejenige, bei der gar nicht behandelt wird. Die Entscheidung liegt immer bei Ihnen.",
    ],
    servicesTitle: "Behandlungen in der Praxis",
  },

  implants: {
    eyebrow: "Zahnimplantate",
    title: "Zahnimplantate in Prishtina",
    lead: "Ein Implantat ersetzt die Wurzel eines fehlenden Zahns, und darauf wird die Krone gesetzt. Die Behandlung erfolgt in Etappen und wird vorab mit Untersuchung und Bildgebung geplant.",

    whatTitle: "Was ein Zahnimplantat ist",
    what: [
      "Ein Zahnimplantat ist eine künstliche Wurzel aus Titan, die in den Kieferknochen eingesetzt wird und die Aufgabe der natürlichen Zahnwurzel übernimmt. Sobald der Knochen um das Implantat herum verheilt ist, wird die Krone darauf befestigt: der sichtbare Teil, mit dem gekaut wird.",
      "Anders als bei einer Brücke müssen für ein Implantat keine Nachbarzähne beschliffen werden, um es zu halten. Anders als eine herausnehmbare Prothese sitzt es fest im Knochen. Deshalb werden Implantate eingesetzt, wenn ein einzelner Zahn fehlt, wenn mehrere fehlen oder wenn eine vorhandene Prothese Halt braucht.",
    ],

    whenTitle: "Wann ein Implantat in Frage kommt",
    when: [
      "Wenn ein einzelner Zahn fehlt und die Nachbarzähne gesund sind.",
      "Wenn mehrere Zähne fehlen und eine Brücke das Beschleifen anderer Zähne bedeuten würde.",
      "Wenn eine herausnehmbare Prothese schlecht hält und Halt braucht.",
      "Wenn ein Zahn gezogen werden muss und Sie ihn ersetzen möchten.",
    ],

    stagesTitle: "Die Etappen der Behandlung",
    stages: [
      {
        title: "Beratung und Planung",
        detail:
          "Eine Untersuchung des Mundes und diagnostische Bildgebung, um Menge und Qualität des Knochens an der Implantatstelle zu beurteilen. Hier wird entschieden, ob ein Implantat möglich ist und was zuerst vorbereitet werden muss.",
      },
      {
        title: "Vorbereitung des Knochens, falls nötig",
        detail:
          "Ist nicht genügend Knochen in Höhe oder Breite vorhanden, kann vor oder während des Setzens Knochenersatzmaterial eingebracht werden, oder im Oberkiefer kann ein Sinuslift nötig sein. Das ist nicht in jedem Fall erforderlich.",
      },
      {
        title: "Setzen des Implantats",
        detail:
          "Der Eingriff erfolgt unter örtlicher Betäubung in steriler Umgebung. Das Implantat wird in den Knochen gesetzt und die Stelle verschlossen. Sie gehen mit schriftlichen Anweisungen für die folgenden Tage nach Hause.",
      },
      {
        title: "Osseointegration",
        detail:
          "Die Zeit, in der der Knochen heilt und sich mit der Oberfläche des Implantats verbindet. Wie lange das dauert, hängt vom Fall und vom Kiefer ab und steht in Ihrem Behandlungsplan. In dieser Zeit finden Kontrollen statt.",
      },
      {
        title: "Die Krone auf dem Implantat",
        detail:
          "Ist das Implantat eingeheilt, wird ein Abdruck genommen und die Krone angefertigt. Die Farbe wird an die Nachbarzähne angepasst. Die Krone wird anprobiert, auf den Biss abgestimmt und eingesetzt.",
      },
      {
        title: "Nachsorge",
        detail:
          "Ein Implantat wird regelmäßig kontrolliert, genau wie die anderen Zähne. Professionelle Reinigung und Pflege zu Hause halten das Zahnfleisch um das Implantat gesund.",
      },
    ],

    goodToKnowTitle: "Gut zu wissen",
    goodToKnow: [
      "Die Behandlung erfolgt in Etappen, nicht in einem einzigen Termin.",
      "Das Setzen erfolgt unter örtlicher Betäubung.",
      "Sie wird mit Untersuchung und diagnostischer Bildgebung geplant.",
      "Nicht jeder Fall braucht Knochenaufbau oder einen Sinuslift.",
      "Die Anweisungen für die Nachsorge erhalten Sie schriftlich.",
    ],

    pricesTitle: "Preise rund um Implantate",
    pricesLead:
      "Das Implantat und die vorbereitenden Eingriffe stehen auf der Liste der Oralchirurgie. Die Krone auf dem Implantat wird separat nach Material berechnet, auf der Liste der Prothetik.",

    relatedTitle: "Weiterlesen",
    relatedLead:
      "Implantate werden im Rahmen der Oralchirurgie gesetzt, die Krone auf dem Implantat im Rahmen der Prothetik.",

    ctaTitle: "Fragen zu Implantaten?",
    ctaBody:
      "Kommen Sie zu einer Beratung: Wir sehen uns Ihren Fall an, sagen Ihnen, ob ein Implantat möglich ist, und Sie gehen mit einem klaren Plan zu Etappen und Kosten.",
  },

  contact: {
    eyebrow: "Kontakt",
    title: "Kontakt zur Zahnarztpraxis",
    lead: "Für einen Zahnarzttermin, eine Frage oder eine Zweitmeinung schreiben Sie uns, und wir antworten. Die Praxis liegt in Prishtina, in der Holger-Petersen-Straße.",
    formTitle: "Terminanfrage",
    infoTitle: "Angaben zur Praxis",
  },

  message: {
    title: "Eine kurze Frage",
    lead: "Wenn Sie noch keinen Termin buchen möchten, schreiben Sie uns Ihre Frage, und wir antworten.",
    name: "Name",
    email: "E-Mail",
    phone: "Telefon",
    subject: "Betreff",
    body: "Nachricht",
    consent:
      "Ich bin einverstanden, dass die Praxis meine Angaben nur verwendet, um mir zu antworten.",
    submit: "Nachricht senden",
    submitting: "Wird gesendet…",
    optional: "optional",
    successTitle: "Nachricht gesendet",
    successBody: "Vielen Dank. Die Praxis liest jede Nachricht und antwortet so bald wie möglich.",
    errorTitle: "Die Nachricht wurde nicht gesendet",
    errorBody:
      "Versuchen Sie es erneut oder kontaktieren Sie die Praxis direkt unter den Nummern unten.",
    errors: {
      name: "Bitte geben Sie Ihren Namen an",
      body: "Bitte schreiben Sie Ihre Nachricht",
      contact:
        "Bitte geben Sie eine E-Mail-Adresse oder Telefonnummer an, damit wir antworten können",
      email: "Diese E-Mail-Adresse ist ungültig",
      phone: "Diese Telefonnummer ist ungültig",
      consent: "Wir brauchen Ihr Einverständnis, um antworten zu können",
    },
  },

  footer: {
    tagline: "Zahnarztpraxis",
    treatments: "Behandlungen",
    clinic: "Die Praxis",
    contact: "Kontakt",
    followUs: "Folgen Sie uns",
    rights: "Alle Rechte vorbehalten.",
    credit: "Terminanfragen werden von der Praxis bestätigt.",
  },

  notFound: {
    title: "Seite nicht gefunden",
    body: "Die gesuchte Seite existiert nicht oder wurde verschoben.",
  },

  error: {
    title: "Etwas ist schiefgelaufen",
    body: "Beim Laden dieser Seite ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
    retry: "Erneut versuchen",
  },

  meta: {
    homeTitle: "Zahnarzt in Prishtina | Azalea Dent",
    homeDescription:
      "Azalea Dent ist eine Zahnarztpraxis in Prishtina, Kosovo: Zahnimplantate, Zahnersatz, Wurzelbehandlung, Oralchirurgie, Kieferorthopädie, Zahnreinigung und Bleaching. Geöffnet Montag bis Freitag, 14:00 – 20:00 Uhr.",

    servicesTitle: "Zahnbehandlungen in Prishtina",
    servicesDescription:
      "Die acht Behandlungsbereiche bei Azalea Dent, einer Zahnarztpraxis in Prishtina: allgemeine Zahnmedizin, Oralchirurgie, Zahnimplantate, Endodontie, Prothetik und Kieferorthopädie.",

    aboutTitle: "Über die Zahnarztpraxis Azalea Dent in Prishtina",
    aboutDescription:
      "Lernen Sie Azalea Dent kennen, eine Zahnarztpraxis in Prishtina: die Räume, den Umgang mit Patienten und die Behandlungen, die in der Praxis durchgeführt werden.",

    galleryTitle: "Galerie der Zahnarztpraxis",
    galleryDescription:
      "Fotos der Zahnarztpraxis Azalea Dent in Prishtina: der Eingang, der Wartebereich, der Behandlungsraum und Fälle aus dem Praxisalltag.",

    pricesTitle: "Preise für Zahnbehandlungen in Prishtina",
    pricesDescription:
      "Die vollständige Preisliste für Zahnbehandlungen bei Azalea Dent, Prishtina: Kontrolle, professionelle Zahnreinigung, Füllungen, Wurzelbehandlung, Kronen, Prothesen, Implantate und Bleaching, alles in Euro.",

    contactTitle: "Kontakt und Adresse in Prishtina",
    contactDescription:
      "Kontaktieren Sie die Zahnarztpraxis Azalea Dent in Prishtina, Holger-Petersen-Straße. Telefon +383 48 306 376, geöffnet Montag bis Freitag, 14:00 – 20:00 Uhr.",

    appointmentTitle: "Zahnarzttermin in Prishtina vereinbaren",
    appointmentDescription:
      "Senden Sie eine Terminanfrage an die Zahnarztpraxis Azalea Dent in Prishtina. Wir melden uns, um Datum und Uhrzeit zu bestätigen.",

    implantsTitle: "Zahnimplantate in Prishtina",
    implantsDescription:
      "Zahnimplantate in Prishtina bei Azalea Dent: wie die Behandlung abläuft, welche Etappen dazugehören, wie lange die Einheilung dauert und was Sie vorab wissen sollten. Preise laut Preisliste der Praxis.",

    serviceTitleSuffix: "in Prishtina",
  },
};
