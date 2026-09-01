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
    about: "The clinic",
    gallery: "Gallery",
    contact: "Contact",
    appointment: "Book an appointment",
    menu: "Menu",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    skipToContent: "Skip to content",
    language: "Language",
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
  },

  hero: {
    eyebrow: "Dental clinic in Prishtina",
    title: "Dental care, clearly explained.",
    lead:
      "Azalea Dent is a dental clinic with a calm waiting area and a fully equipped treatment room. From cleanings and fillings to root canals and implants — every treatment plan is discussed with you before it begins.",
    imageCaption: "The treatment room",
    scroll: "Scroll",
  },

  intro: {
    eyebrow: "The clinic",
    title: "A space designed to make the visit easy.",
    body: [
      "The clinic is built around a simple idea: the patient should know what is happening. A visit starts in a calm waiting area and continues in the fully equipped treatment room, where every step is explained before it is carried out.",
      "The materials, colours and light were chosen so the space would not feel clinical. It is clean and professional, but warm — because half the comfort during a treatment comes from the room itself.",
    ],
    stats: [
      { value: "8", label: "Treatments" },
      { value: "14–20", label: "Monday – Friday" },
    ],
  },

  services: {
    eyebrow: "Treatments",
    title: "What we offer",
    lead:
      "Every treatment is carried out at the clinic, from a routine check-up to surgical procedures.",
    pageTitle: "Treatments",
    pageLead:
      "The eight treatments offered at Azalea Dent, explained step by step: what they are, how they work and what to expect.",
    highlightsTitle: "Good to know",
    stepsTitle: "How it works",
    otherTitle: "Other treatments",
    ctaTitle: "Questions about this treatment?",
    ctaBody:
      "Send us the form or message us on Instagram — we will answer with the details you need before you book.",
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

  gallery: {
    eyebrow: "Gallery",
    title: "Inside the clinic",
    lead: "Real photographs of the space where your treatment takes place.",
    pageLead:
      "The entrance, the waiting area and both treatment rooms — the space exactly as it is.",
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
    lead:
      "The clinic is on the ground floor, with direct street access and an illuminated sign.",
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
    ],
  },

  appointment: {
    eyebrow: "Appointments",
    title: "Appointment request",
    lead:
      "Fill in the form and we will contact you to confirm the date and time. A request is not a confirmed appointment until we reply.",
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
    unconfigured: {
      title: "Online sending is not active yet",
      body: "The form is not yet connected to an email service, so your request was not sent. Please contact us directly using one of the options below — we reply the same working day.",
      viaWhatsapp: "Send the details on WhatsApp",
      viaInstagram: "Message us on Instagram",
    },
  },

  about: {
    eyebrow: "The clinic",
    title: "About Azalea Dent",
    lead: "A dental clinic built so that a visit feels calm and understandable.",
    storyTitle: "The space",
    story: [
      "Azalea Dent is on the ground floor, with direct access from the street. The illuminated sign and the azalea flower — the same one etched into the glass inside — are the first sign of the clinic.",
      "Inside, the waiting area is designed so that waiting is not a burden: large windows, comfortable seating and natural light. The treatment room is separated by glass and fully equipped.",
      "The clinic's palette — charcoal, oak and warm white — was a deliberate choice. Dental spaces often feel cold; this one was not built that way.",
    ],
    approachTitle: "The approach",
    approach: [
      "Every treatment starts with an examination and a plan. You know what will be done, how many appointments it takes and what it costs, before any work begins.",
      "When there is more than one solution, we explain all of them — including the one that involves no intervention at all. The decision stays yours.",
    ],
    servicesTitle: "Treatments at the clinic",
  },

  contact: {
    eyebrow: "Contact",
    title: "Contact the clinic",
    lead:
      "For an appointment, a question or a second opinion — write to us and we will reply.",
    formTitle: "Appointment request",
    infoTitle: "Clinic details",
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
    homeTitle: "Azalea Dent — Dental Clinic in Prishtina",
    homeDescription:
      "Dental clinic in Prishtina: cleanings, fillings, root canals, prosthetics, crowns, oral surgery and implants. Every treatment plan is explained before it begins.",
    servicesDescription:
      "The eight treatments at Azalea Dent in Prishtina: cleaning, whitening, fillings, root canal treatment, crowns, dentures, oral surgery and implants.",
    aboutDescription:
      "Get to know Azalea Dent: the space, the approach to patients and the treatments offered.",
    galleryDescription:
      "Photographs of the Azalea Dent clinic: the entrance, the waiting area and the treatment rooms.",
    contactDescription:
      "Contact Azalea Dent in Prishtina to book an appointment or ask a question about treatments. Open Monday to Friday, 14:00 – 20:00.",
    appointmentDescription:
      "Send an appointment request to the Azalea Dent dental clinic.",
  },
};
