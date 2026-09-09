# Azalea Dent — website

Website for **Azalea Dent**, a dental clinic. Bilingual (Albanian and English),
built around the clinic's own photography and its azalea flower branding.

| | |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript, strict |
| Styling | Tailwind CSS v4 (CSS-first tokens, no config file) |
| Fonts | Fraunces + Inter, self-hosted at build time via `next/font` |
| Database | PostgreSQL 16, via `pg` — only for the admin dashboard |
| Tests | Vitest (unit + database integration) + Playwright/axe (used for QA) |
| Runtime deps | `next`, `react`, `react-dom`, `pg` — nothing else |

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
| `npm run db:migrate` | Apply the database migrations (dashboard only) |
| `npm run db:status` | Show which migrations have been applied |
| `npm run admin:setup` | Create or change the single admin account |
| `npm run qa:dashboard` | End-to-end checks against a running server |

Run `npm run check` before every push. CI runs the same commands.

The website runs with no database and no environment variables at all. The
dashboard needs `DATABASE_URL`; see [Admin dashboard](#admin-dashboard).

## Editing the site

**See [CONTENT.md](./CONTENT.md).** Every fact, every treatment and every word
lives in `src/content/` and `src/i18n/dictionaries/` — no component needs
editing to change the website.

That is still the source of truth, and the copy the site is published with.
The admin dashboard edits *over* it: a headline, a treatment, a team member or
a photograph saved there overrides the shipped value, and clearing the field
brings the shipped one back. Nothing the clinic can do in the dashboard can
empty the website, and neither can an unreachable database.

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
      implante-dentare/       Dental implants landing page
      about/  gallery/  contact/  appointment/
      layout.tsx              Root layout: fonts, header, footer, metadata
      not-found.tsx  error.tsx  opengraph-image.tsx
    admin/                    The dashboard — its own root layout, own host
      login/                  Sign-in page and its server action
      (dashboard)/            The 14 sections, all behind requireAdmin()
    api/appointment/route.ts  Appointment request handler
    api/contact/route.ts      Contact messages → the dashboard inbox
    api/media/[id]/route.ts   Serves uploaded files, publish-aware
    api/admin/                Upload endpoint and notification reads
    robots.ts  sitemap.ts  manifest.ts  icon.svg  apple-icon.png
  admin/                    Dashboard dictionaries, navigation, formatting
  components/
    layout/                   Header, footer, mobile action bar, page header
    sections/                 Hero, services index, gallery, visit band, FAQ…
    forms/                    Appointment form, contact message form
    admin/                    The dashboard's own component kit
    ui/                       Container, Section, Button, Reveal, icons, logo
  content/                    Clinic facts, treatments, image manifest
  i18n/                       Locale config + Albanian/English dictionaries
  lib/
    admin/                    Sessions, passwords, CSRF, rate limits, uploads
    db/                       Pool, migrations, row types, one repo per table
    public/                   What the website reads, with its fallbacks
    cms/registry.ts           Which pieces of copy the dashboard can edit
    …                         Validation, structured data, metadata, hours
  proxy.ts                    Host routing: which hostname gets what
  styles/globals.css          Design tokens and base styles
  styles/admin.css            The dashboard's chrome, over the same tokens
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

### Search

Every page builds its metadata through `src/lib/seo.ts`, which sets the title,
description, canonical URL, `hreflang` alternates, Open Graph, the Twitter card
and the robots directives from one call. Doing it in one place is what keeps
the social cards describing the page they are on rather than inheriting the
home page's, and it means a preview deployment emits `noindex` on the page as
well as `Disallow: /` in `robots.txt` — a URL that is merely uncrawlable can
still be indexed from an external link.

Structured data is in `src/lib/schema.ts` and is published as a linked
`@graph`: one `Dentist` node for the clinic (address, coordinates, opening
hours, phone numbers, social profiles and a priced offer catalogue), a
`WebSite`, and a `WebPage` plus `BreadcrumbList` per page. Treatment pages add
a `MedicalProcedure` and a `Service`. Every value is derived from
`content/clinic.ts`, `content/services.ts` and `content/prices.ts`, so the
structured data cannot claim anything the page does not.

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

## Admin dashboard

The clinic's own dashboard, at **`admin.azaleadent.org`** in production and
`admin.localhost:3000` in development. It is the same application, the same
deployment and the same database as the website — not a second project, and
not a `/admin` URL on the public site. There is no `/admin` path: on the
public hostname it answers `404`, and on the admin hostname nothing but the
dashboard is served.

Routing happens in `src/proxy.ts` (Next 16's replacement for
`middleware.ts`), which rewrites the admin hostname onto the `/admin` route
tree and adds `X-Robots-Tag: noindex` to everything it serves there.

### The single admin account

There is exactly one, for the clinic. No registration, no invitations, no
second role, no user management — those were left out deliberately rather
than left unfinished.

```bash
npm run db:migrate                  # once, to create the schema
npm run admin:setup                 # asks for the email and password
```

`admin_account` is a one-row table (`check (id = 1)`), so a second account
cannot be created even by hand. Changing the password signs out every open
session. Where the database is not reachable from your machine,
`npm run admin:setup -- --hash` prints `ADMIN_EMAIL` and
`ADMIN_PASSWORD_HASH` for the host's environment instead, and the account is
created from them at the first sign-in.

### How the sign-in holds up

| | |
| --- | --- |
| Passwords | scrypt (`node:crypto`), per-password salt, parameters stored with the hash; at least 12 characters, and the passwords attackers try first are refused |
| Sessions | 256 bits of randomness in an `HttpOnly` `Secure` `SameSite=Lax` cookie; only its SHA-256 is stored, so the table is useless if it leaks |
| Authorisation | decided in the database on every request, next to the data — never by the presence of a cookie, and never in the proxy |
| CSRF | double-submit token on every mutation, compared in constant time, with the request's `Origin` checked against the configured hosts |
| Brute force | counted in the database: 10 attempts per address and 20 per account in 15 minutes, so it holds across a serverless host's many instances |
| Failure mode | closed. An unreachable database reads as *not signed in*, never as signed in |
| Uploads | the format is decided by the file's own bytes, not by its name or the browser's `Content-Type`; 8 MB ceiling; served from a route that re-checks whether the thing pointing at the file is published |

Every server action and API route runs the check itself, because a `POST`
reaches them without the page ever rendering.

### What the dashboard does not pretend to do

The clinic's trust in it depends on it never showing something that is not
true, so:

- **Analytics** count the rows in the database and say so. No traffic
  numbers, no invented trends, no charts of data nobody collected.
- **Social media** composes and schedules posts for a person to publish.
  Nothing is auto-published, no platform password is stored, and the status
  of a post says exactly which of those it is.
- **Reviews** are entered by hand and stamped with where they came from. The
  site shows nothing that a person did not type in.
- **Patient records** hold what a receptionist needs to run appointments —
  no medical history beyond a free-text note the clinic chooses to write —
  and nothing on them is reachable from the public site.
- **Treatment photographs** cannot be published without consent recorded
  against the image. That is enforced in the form, in the action, and by a
  `check` constraint in the schema, so no code path can get around it.
- **Empty sections** say they are empty. There is no seeded demo data.

### End-to-end checks

`npm run qa:dashboard` drives the real forms over HTTP the way a browser with
no JavaScript would — reading the hidden `$ACTION…` fields Next renders and
posting them back — so it exercises the proxy, host routing, sessions, CSRF,
validation, the repositories and Postgres together. It writes to the database
it is pointed at, so point it at a scratch one:

```bash
npm run dev
QA_DATABASE_URL=postgres://localhost/azalea_dev \
QA_PASSWORD='the admin password' npm run qa:dashboard
```

The database integration tests are skipped unless `TEST_DATABASE_URL` is set:

```bash
TEST_DATABASE_URL=postgres://localhost/azalea_test npx vitest run tests/db-integration.test.ts
```

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
| `DATABASE_URL` | for the dashboard | PostgreSQL connection string |
| `DATABASE_POOL_MAX` | optional | Pool size per instance, default 5 |
| `PGSSL_STRICT` | optional | `1` requires a verifiable TLS chain |
| `ADMIN_HOST` | optional | The dashboard's hostname; defaults to `admin.<site host>` |
| `ADMIN_EMAIL` | optional | Bootstraps the admin account with `ADMIN_PASSWORD_HASH` |
| `ADMIN_PASSWORD_HASH` | optional | A scrypt hash from `npm run admin:setup -- --hash` |

`.env*` files are git-ignored. Never commit real keys. No password, key or
hostname is hardcoded anywhere in `src/`.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step hosting, custom domain
and DNS instructions.
