import type { Dictionary } from "./sq";

/**
 * English copy. The clinic serves an Albanian-speaking city, so English is the
 * secondary language — useful for visitors and for patients living abroad.
 *
 * The `Dictionary` type is derived from the Albanian file, so TypeScript fails
 * the build if a key is ever missing here.
 */
export const en: Dictionary = {
  nav: {
    home: "Home",
    services: "Treatments",
    prices: "Prices",
    about: "The clinic",
    gallery: "Gallery",
    contact: "Contact",
    appointment: "Book an appointment",
    menu: "Menu",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    skipToContent: "Skip to content",
    language: "Language",
    theme: {
      label: "Theme",
      toggleToDark: "Switch to dark theme",
      toggleToLight: "Switch to light theme",
    },
  },

  actions: {
    bookAppointment: "Book an appointment",
    seeTreatments: "See treatments",
    allTreatments: "All treatments",
    learnMore: "Learn more",
    call: "Call",
    whatsapp: "WhatsApp",
    viber: "Viber",
    instagram: "Instagram",
    facebook: "Facebook",
    email: "Email",
    directions: "View on map",
    back: "Back",
    backToHome: "Back to home",
    viewGallery: "View gallery",
    viewPrices: "View prices",
  },

  hero: {
    eyebrow: "Dental clinic in Prishtina",
    title: "Dental care, devoted to your smile.",
    lead: "Azalea Dent is a dental clinic in Prishtina, on Holger Petersen street, with a calm waiting area and a fully equipped treatment room. From check-ups, cleanings and fillings to root canals, crowns and dental implants, we talk through every treatment plan with you before it begins.",
    imageCaption: "The treatment room",
    scroll: "Scroll",
  },

  intro: {
    eyebrow: "The clinic",
    title: "A space designed to make the visit easy.",
    body: [
      "The clinic is built around a simple idea: the patient should know what is happening. A visit starts in a calm waiting area and continues in the fully equipped treatment room, where every step is explained before it is carried out.",
      "The materials, colours and light were chosen so the space would not feel cold. It is clean and professional, but warm too, because half the comfort during a treatment comes from the room itself.",
    ],
    stats: [
      { value: "8", label: "Treatments" },
      { value: "14:00 – 20:00", label: "Monday – Friday" },
    ],
  },

  services: {
    eyebrow: "Treatments",
    title: "What we offer",
    lead: "Every treatment is carried out at the clinic, from a routine check-up to surgical procedures and dental implants.",
    pageTitle: "Dental treatments",
    pageLead:
      "The eight areas of treatment at Azalea Dent, explained step by step: what they cover, how they work and what to expect.",
    priceTitle: "Price",
    highlightsTitle: "Good to know",
    stepsTitle: "How it works",
    otherTitle: "Other treatments",
    ctaTitle: "Questions about this treatment?",
    ctaBody:
      "Send us the form or message us on Instagram. We will answer with the details you need before you book.",
  },

  prices: {
    eyebrow: "Prices",
    title: "Dental treatment prices",
    lead: "What treatment at Azalea Dent in Prishtina costs, following the same list displayed at the clinic.",
    note: "Prices are in euro. The final treatment plan and its cost are set after an examination at the clinic.",
    ctaTitle: "Cannot find the treatment you are looking for?",
    ctaBody:
      "Call or message us and we will tell you exactly what the treatment involves and what it costs.",
  },

  why: {
    eyebrow: "Why Azalea Dent",
    title: "How we work",
    items: [
      {
        title: "The plan comes before the treatment",
        body: "An examination and imaging come first and set the plan. You know the timeline and the cost before any procedure starts.",
      },
      {
        title: "Explained without the jargon",
        body: "Every step is described in plain words. Questions are part of the appointment, not an interruption to it.",
      },
      {
        title: "Equipment and sterilisation for every patient",
        body: "The treatment room is fully equipped, and instruments are sterilised to protocol before every patient.",
      },
      {
        title: "From check-up to surgery",
        body: "Cleanings, fillings, root canals, prosthetics and implants are all carried out at the same clinic.",
      },
    ],
  },

  work: {
    eyebrow: "Gallery",
    title: "Our work",
    lead: "Cases from our day-to-day practice.",
  },

  gallery: {
    eyebrow: "Gallery",
    title: "Inside the clinic",
    lead: "Real photographs of the space where your treatment takes place.",
    pageLead:
      "The entrance, the waiting area and the treatment room at the Azalea Dent dental clinic in Prishtina.",
    open: "Enlarge photograph",
    close: "Close",
    previous: "Previous photograph",
    next: "Next photograph",
    counter: "{current} of {total}",
  },

  team: {
    eyebrow: "The team",
    title: "Who will see you",
    lead: "The clinical team at Azalea Dent.",
    empty: "Team details will be published soon.",
  },

  testimonials: {
    eyebrow: "Patient experience",
    title: "What patients say",
  },

  visit: {
    eyebrow: "Visiting",
    title: "Find us here",
    lead: "The clinic is on Holger Petersen street in Prishtina, on the ground floor, with direct street access and an illuminated sign above the door.",
    hoursTitle: "Opening hours",
    addressTitle: "Address",
    contactTitle: "Contact",
    followTitle: "Follow us",
    messagingTitle: "Message us",
    followBody:
      "Photographs of our work, announcements and up-to-date opening hours are posted on Instagram.",
    hoursPending: "Opening hours will be published soon.",
    addressPending: "The full address will be published soon.",
    contactPending:
      "The phone number will be published soon. Until then, message us on Instagram or use the form.",
    closed: "Closed",
    mapUnavailable: "The map will be added soon.",
  },

  faq: {
    eyebrow: "Questions",
    title: "The questions we are asked most",
    items: [
      {
        question: "How often should I have a check-up?",
        answer:
          "For most adults a check-up every six months is recommended. If you have gum problems or ongoing treatment, more frequent check-ups may be advised.",
      },
      {
        question: "Will the treatment hurt?",
        answer:
          "Treatments that could be painful are carried out under local anaesthetic, which numbs the area completely. If you feel uncomfortable during an appointment, tell us and we stop.",
      },
      {
        question: "How long does implant treatment take?",
        answer:
          "Implant treatment happens in stages. After the implant is placed it needs a healing period to integrate with the bone before the crown is fitted. The exact timeline depends on the case and is set out in your treatment plan.",
      },
      {
        question: "What should I bring to a first visit?",
        answer:
          "If you have radiographs or documents from previous treatment, bring them with you. Also tell us about any chronic conditions and any medication you take regularly.",
      },
      {
        question: "How do I book an appointment?",
        answer:
          "Fill in the appointment request form on this site, or message us directly on Instagram. We will get in touch to confirm the date and time.",
      },
      {
        question: "Where is the clinic and how do I find you?",
        answer:
          "Azalea Dent is on Holger Petersen street in Prishtina, on the ground floor, with its own entrance from the street and an illuminated sign above the door. The contact page has the map and a link for directions.",
      },
      {
        question: "What are the clinic's opening hours?",
        answer:
          "The clinic is open Monday to Friday, from 14:00 to 20:00. We are closed on Saturday and Sunday.",
      },
      {
        question: "How much does a dental check-up cost?",
        answer:
          "The prices for every treatment are published on the prices page, following the same list displayed at the clinic. The final plan and its cost are set after an examination.",
      },
    ],
  },

  appointment: {
    eyebrow: "Appointments",
    title: "Appointment request",
    lead: "Fill in the form and we will contact you to confirm the date and time. A request is not a confirmed appointment until we reply.",
    directTitle: "Or contact us directly",
    form: {
      name: "Full name",
      namePlaceholder: "Your name",
      phone: "Phone number",
      phonePlaceholder: "+383 44 000 000",
      email: "Email (optional)",
      emailPlaceholder: "name@example.com",
      service: "Treatment",
      servicePlaceholder: "Choose a treatment",
      serviceOther: "Not sure / other",
      date: "Preferred date",
      time: "Preferred time",
      timeMorning: "Morning",
      timeAfternoon: "Afternoon",
      timeEvening: "Evening",
      message: "Message (optional)",
      messagePlaceholder: "Briefly describe the reason for your visit.",
      consent:
        "I agree that my details may be used only to contact me about this request.",
      submit: "Send request",
      submitting: "Sending…",
      required: "required",
      optional: "optional",
    },
    errors: {
      name: "Please enter your name.",
      phone: "Please enter a valid phone number.",
      email: "Please enter a valid email address.",
      service: "Please choose a treatment.",
      date: "Please choose a date.",
      datePast: "Please choose a date in the future.",
      consent: "Please accept the terms to continue.",
      generic: "Something went wrong. Please try again or contact us directly.",
    },
    success: {
      title: "Request sent",
      body: "We will contact you shortly to confirm the date and time. An appointment is only booked once the clinic confirms it.",
      again: "Send another request",
    },
    failed: {
      title: "The request was not sent",
      body: "A technical problem stopped your request from reaching the clinic. Please contact us directly using one of the options below.",
    },
    unconfigured: {
      title: "Online sending is not active yet",
      body: "The form is not yet connected to an email service, so your request was not sent. Please contact us directly using one of the options below and we will get back to you as soon as we can.",
    },
    fallback: {
      heading: "Contact us directly",
      note: "WhatsApp and email already carry the details you filled in, so there is nothing to retype.",
      emailSubject: "Appointment request",
    },
  },

  about: {
    eyebrow: "The clinic",
    title: "About Azalea Dent",
    lead: "A dental clinic in Prishtina, built so that a visit feels calm and understandable.",
    storyTitle: "The space",
    story: [
      "Azalea Dent is on the ground floor, with direct access from the street. The illuminated sign and the azalea flower, the same one etched into the glass inside, are the first sign of the clinic.",
      "Inside, the waiting area is designed so that waiting is not a burden: large windows, comfortable seating and natural light. The treatment room is separated by glass and fully equipped.",
      "The clinic's palette of charcoal, oak and warm white was a deliberate choice. Many dental spaces feel cold. This one was not meant to.",
    ],
    approachTitle: "The approach",
    approach: [
      "Every treatment starts with an examination and a plan. You know what will be done, how many appointments it takes and what it costs, before any work begins.",
      "When there is more than one solution, we explain all of them, including the one that involves no treatment at all. The decision is always yours.",
    ],
    servicesTitle: "Treatments at the clinic",
  },

  implants: {
    eyebrow: "Dental implants",
    title: "Dental Implants in Prishtina",
    lead: "An implant replaces the root of a missing tooth, and the crown is fitted on top of it. Treatment happens in stages and is planned in advance with an examination and imaging.",

    whatTitle: "What a dental implant is",
    what: [
      "A dental implant is an artificial titanium root placed in the jawbone that takes over the role of the natural tooth root. Once the bone has healed around it, the crown is fixed on top — the visible part that does the chewing.",
      "Unlike a bridge, an implant does not require the neighbouring teeth to be ground down to hold it. Unlike a removable denture, it stays fixed in the bone. That is why implants are used when a single tooth is missing, when several are, or when an existing denture needs support.",
    ],

    whenTitle: "When an implant is considered",
    when: [
      "When a single tooth is missing and the neighbouring teeth are healthy.",
      "When several teeth are missing and a bridge would mean grinding down others.",
      "When a removable denture does not hold well and needs support.",
      "When a tooth has to be extracted and you want to replace it.",
    ],

    stagesTitle: "The stages of treatment",
    stages: [
      {
        title: "Consultation and planning",
        detail:
          "An examination of the mouth and diagnostic imaging to assess the amount and quality of bone where the implant would go. This is where it is decided whether an implant is possible and what needs preparing first.",
      },
      {
        title: "Preparing the bone, where needed",
        detail:
          "If there is not enough bone in height or width, bone graft material may be added before or during placement, or a sinus lift may be needed in the upper jaw. This is not required in every case.",
      },
      {
        title: "Placing the implant",
        detail:
          "The procedure is carried out under local anaesthetic in a sterile setting. The implant is placed in the bone and the site is closed. You leave with written instructions for the days that follow.",
      },
      {
        title: "Osseointegration",
        detail:
          "The period during which the bone heals and bonds to the surface of the implant. How long it takes depends on the case and the jaw, and is set out in your treatment plan. Check-ups happen during this time.",
      },
      {
        title: "The crown on the implant",
        detail:
          "Once the implant has integrated, an impression is taken and the crown is made. The shade is matched to the neighbouring teeth. The crown is tried in, adjusted against the bite and fitted.",
      },
      {
        title: "Follow-up",
        detail:
          "An implant is checked regularly, just like the other teeth. Professional cleaning and care at home are what keep the gum around it healthy.",
      },
    ],

    goodToKnowTitle: "Good to know",
    goodToKnow: [
      "Treatment happens in stages, not in a single appointment.",
      "Placement is carried out under local anaesthetic.",
      "It is planned with an examination and diagnostic imaging.",
      "Not every case needs a bone graft or a sinus lift.",
      "Aftercare instructions are given in writing.",
    ],

    pricesTitle: "Prices related to implants",
    pricesLead:
      "The implant and the preparatory procedures are part of the oral surgery list. The crown fitted on top of the implant is priced separately by material, on the prosthetics list.",

    relatedTitle: "Read further",
    relatedLead:
      "Implants are placed as part of oral surgery, and the crown on the implant as part of prosthetics.",

    ctaTitle: "Questions about implants?",
    ctaBody:
      "Come in for a consultation: we will look at your case, tell you whether an implant is possible, and you leave with a clear plan of stages and costs.",
  },

  contact: {
    eyebrow: "Contact",
    title: "Contact the dental clinic",
    lead: "For a dentist appointment, a question or a second opinion, write to us and we will reply. The clinic is in Prishtina, on Holger Petersen street.",
    formTitle: "Appointment request",
    infoTitle: "Clinic details",
  },

  message: {
    title: "A quick question",
    lead: "If you are not ready to book, write your question and we will reply.",
    name: "Name",
    email: "Email",
    phone: "Phone",
    subject: "Subject",
    body: "Message",
    consent: "I agree that the clinic may use my details only to reply to me.",
    submit: "Send the message",
    submitting: "Sending…",
    optional: "optional",
    successTitle: "Message sent",
    successBody: "Thank you. The clinic reads these and will reply as soon as it can.",
    errorTitle: "The message was not sent",
    errorBody: "Try again, or contact the clinic directly on the numbers below.",
    errors: {
      name: "Please give your name",
      body: "Please write your message",
      contact: "Please give an email address or a phone number, so we can reply",
      email: "That email address is not valid",
      phone: "That phone number is not valid",
      consent: "We need your agreement in order to reply",
    },
  },

  footer: {
    tagline: "Dental clinic",
    treatments: "Treatments",
    clinic: "The clinic",
    contact: "Contact",
    followUs: "Follow us",
    rights: "All rights reserved.",
    credit: "Appointment requests are confirmed by the clinic.",
  },

  notFound: {
    title: "Page not found",
    body: "The page you were looking for does not exist or has been moved.",
  },

  error: {
    title: "Something went wrong",
    body: "An error occurred while loading this page. Please try again.",
    retry: "Try again",
  },

  meta: {
    homeTitle: "Dental Clinic in Prishtina | Azalea Dent",
    homeDescription:
      "Azalea Dent is a dental clinic in Prishtina, Kosovo: dental implants, prosthetics, endodontics, oral surgery, orthodontics, cleaning and whitening. Open Monday to Friday, 14:00 – 20:00.",

    servicesTitle: "Dental Treatments in Prishtina",
    servicesDescription:
      "The eight areas of treatment at Azalea Dent, a dental clinic in Prishtina: general dentistry, oral surgery, dental implants, endodontics, prosthetics and orthodontics.",

    aboutTitle: "About the Azalea Dent Dental Clinic in Prishtina",
    aboutDescription:
      "Get to know Azalea Dent, a dental clinic in Prishtina: the space, the approach to patients and the treatments carried out at the clinic.",

    galleryTitle: "Dental Clinic Gallery",
    galleryDescription:
      "Photographs of the Azalea Dent dental clinic in Prishtina: the entrance, the waiting area, the treatment room and cases from everyday practice.",

    pricesTitle: "Dental Treatment Prices in Prishtina",
    pricesDescription:
      "The full price list for dental treatment at Azalea Dent, Prishtina: check-ups, professional cleaning, fillings, endodontics, crowns, dentures, implants and whitening, all in euro.",

    contactTitle: "Contact and Address in Prishtina",
    contactDescription:
      "Contact the Azalea Dent dental clinic in Prishtina, Holger Petersen street. Phone +383 48 306 376, open Monday to Friday, 14:00 – 20:00.",

    appointmentTitle: "Book a Dentist Appointment in Prishtina",
    appointmentDescription:
      "Send an appointment request to the Azalea Dent dental clinic in Prishtina. We will contact you to confirm the date and time.",

    implantsTitle: "Dental Implants in Prishtina",
    implantsDescription:
      "Dental implants in Prishtina at Azalea Dent: how the treatment works, the stages involved, how long healing takes and what to know beforehand. Prices as per the clinic's list.",

    serviceTitleSuffix: "in Prishtina",
  },
};
