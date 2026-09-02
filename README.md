# Azalea Dent — website

Website for **Azalea Dent**, a dental clinic. Bilingual (Albanian and English),
built around the clinic's own photography and its azalea flower branding.

| | |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript, strict |
| Styling | Tailwind CSS v4 (CSS-first tokens, no config file) |
| Fonts | Fraunces + Inter, self-hosted at build time via `next/font` |
| Tests | Vitest (unit) + Playwright/axe (used for QA) |
| Runtime deps | `next`, `react`, `react-dom` — nothing else |

---

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000 (redirects to /sq)
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm start` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Vitest unit tests |
| `npm run check` | typecheck + lint + tests, in one go |
| `npm run images` | Re-optimise photography from `source-photos/` |

Run `npm run check` before every push. CI runs the same commands.

## Editing the site

**See [CONTENT.md](./CONTENT.md).** Every fact, every treatment and every word
lives in `src/content/` and `src/i18n/dictionaries/` — no component needs
editing to change the website.

Some clinic details (phone, address, opening hours, the team) are deliberately
left empty because they could not be verified. Sections without data hide
themselves, so nothing false is ever published. In development a small panel
lists what is still missing.

## Project structure

```
src/
  app/
    [locale]/                 Every page, per language
      page.tsx                Home
      services/               Treatments index + one page per treatment
      about/  gallery/  contact/  appointment/
      layout.tsx              Root layout: fonts, header, footer, metadata
      not-found.tsx  error.tsx  opengraph-image.tsx
    api/appointment/route.ts  Appointment request handler
    robots.ts  sitemap.ts  manifest.ts  icon.svg  apple-icon.png
  components/
    layout/                   Header, footer, mobile action bar, page header
    sections/                 Hero, services index, gallery, visit band, FAQ…
    forms/                    Appointment form
    ui/                       Container, Section, Button, Reveal, icons, logo
  content/                    Clinic facts, treatments, image manifest
  i18n/                       Locale config + Albanian/English dictionaries
  lib/                        Validation, structured data, hours, reveal, utils
  styles/globals.css          Design tokens and base styles
  assets/images/              Optimised photography (imported, not public/)
source-photos/                The clinic's original photographs
scripts/                      Image and icon generation
tests/                        Vitest unit tests
```

### Design system

Tokens are defined once in `src/styles/globals.css` under `@theme`, taken
directly from the clinic itself:

| Token | Where it comes from |
| --- | --- |
| `ink` | the charcoal shopfront, cabinetry, blinds and chairs |
| `bone` | the warm off-white walls and ceramic floor |
| `oak` | the natural oak reception desk and backsplash |
| `gold` | the illuminated azalea sign above the door |

`gold-500` is for the logo mark and hairlines; `gold-700` is the text-safe
bronze that clears WCAG AA on both bone surfaces. Every colour pair used for
text was measured — the site has **no WCAG 2.1 A/AA violations** on any page,
at desktop or mobile width.

### Languages

Albanian (`/sq`) is the default and `/` redirects to it; English lives at
`/en`. `src/i18n/dictionaries/sq.ts` defines the `Dictionary` type, so a key
missing from English fails the build. Both languages are fully pre-rendered,
cross-linked with `hreflang`, and listed in the sitemap.

### Animation

Content fades in on scroll via a single shared, rAF-throttled scheduler
(`src/lib/reveal.ts`). It measures rectangles rather than relying on
`IntersectionObserver` alone, because a fast flick or an anchor jump can move an
element past the viewport without ever firing an observer callback — which
would leave content invisible for good. `prefers-reduced-motion` and a
`<noscript>` rule both force everything visible.

## Appointment requests

The form validates on the client for speed and **again on the server**, then
`POST`s to `/api/appointment`. Delivery is configured entirely by environment
variables:

| Variables | Behaviour |
| --- | --- |
| `RESEND_API_KEY` | Emails the request to the clinic address in `content/clinic.ts` |
| `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_FROM_NUMBER` | Texts the request to the clinic's first published number |
| `APPOINTMENT_WEBHOOK_URL` | POSTs the request as JSON to any endpoint |
| *none set* | Returns `501`; the form says plainly that nothing was sent and offers WhatsApp, Viber and Instagram instead |

Recipients default to the clinic's own email and phone number, so only the
provider credentials need setting. `APPOINTMENT_TO_EMAIL` and
`APPOINTMENT_SMS_TO` override them.

Every configured channel is used, and the request counts as delivered if any
one of them succeeds, so a failing SMS provider cannot stop the email arriving.

The form never reports success for a request that went nowhere. Until a
delivery method is configured, patients are routed to a real channel rather
than a dead end.

## Environment variables

See [`.env.example`](./.env.example). Copy it to `.env.local` for development.
None of them are required to run the site.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | recommended | Canonical origin for metadata, sitemap, hreflang |
| `RESEND_API_KEY` | for email | Email delivery for appointment requests |
| `APPOINTMENT_TO_EMAIL` | optional | Overrides the recipient address |
| `APPOINTMENT_FROM_EMAIL` | optional | Verified sender address |
| `TWILIO_ACCOUNT_SID` | for SMS | Twilio account identifier |
| `TWILIO_AUTH_TOKEN` | for SMS | Twilio auth token |
| `TWILIO_FROM_NUMBER` | for SMS | The Twilio number messages are sent from |
| `APPOINTMENT_SMS_TO` | optional | Overrides the number that receives texts |
| `APPOINTMENT_WEBHOOK_URL` | optional | POSTs each request as JSON |

`.env*` files are git-ignored. Never commit real keys.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step hosting, custom domain
and DNS instructions.
