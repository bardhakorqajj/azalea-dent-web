# Editing the website content

Everything the site says about the clinic lives in a handful of files. No
component needs to be touched to update the website.

| What | File |
| --- | --- |
| Phone, WhatsApp, email, address, opening hours, team, testimonials | `src/content/clinic.ts` |
| The eight treatments and their copy | `src/content/services.ts` |
| Photographs, alt text and captions | `src/content/images.ts` |
| Every other word on the site, in both languages | `src/i18n/dictionaries/sq.ts` and `en.ts` |

After editing, run `npm run dev` and the change appears immediately.

---

## 1. Details that still need filling in

These were left empty on purpose. They could not be verified from the material
provided, and the site is built to **hide anything it does not know** rather
than publish a placeholder. While you run `npm run dev`, a small panel in the
corner lists whatever is still missing. It never appears on the live site.

Open `src/content/clinic.ts` and fill in:

```ts
phone: "+383 44 123 456",          // full international form, so tel: links work from abroad
whatsapp: "38344123456",           // digits only, no "+" and no spaces
email: "info@azaleadent.com",

address: {
  street: "Rr. Shembull 12",
  locality: "Prishtinë",
  postalCode: "10000",
  country: "XK",                   // ISO country code: XK Kosovo, AL Albania
},

geo: { latitude: 42.6629, longitude: 21.1655 },   // from Google Maps

mapsUrl: "https://maps.app.goo.gl/…",             // Maps → Share → Copy link
mapsEmbedUrl: "https://www.google.com/maps/embed?pb=…",  // Maps → Share → Embed a map → copy the src="…" value

hours: [
  { days: ["mon", "tue", "wed", "thu", "fri"], opens: "09:00", closes: "19:00" },
  { days: ["sat"], opens: "09:00", closes: "14:00" },
  { days: ["sun"], opens: null, closes: null },   // null = closed
],

foundingYear: 2021,
```

As soon as a value is set it appears everywhere at once: the header, the
footer, the contact page, the sticky mobile call button, and the
`Dentist` structured data that Google reads.

## 2. The team

Nothing is invented here — the team section stays hidden until you add real
people.

```ts
team: [
  {
    name: "Dr. Emri Mbiemri",
    role: { sq: "Dentiste", en: "Dentist" },
    bio: { sq: "…", en: "…" },     // optional
    photo: "dr-emri",              // optional, see below
  },
],
```

To add portraits:

1. Put the photo in `src/assets/images/team/` (e.g. `dr-emri.jpg`).
2. Register it in `src/content/team-photos.ts`:

   ```ts
   import drEmri from "@/assets/images/team/dr-emri.jpg";
   export const teamPhotos: Record<string, StaticImageData> = { "dr-emri": drEmri };
   ```

A member without a photo gets a typographic monogram card, so a partly
photographed team still looks deliberate.

Only add credentials the clinic itself publishes.

## 3. Testimonials

Also hidden until real ones are added. Use the patient's own words, with their
consent:

```ts
testimonials: [
  {
    quote: { sq: "…", en: "…" },
    author: "A. B.",
    source: "Google",   // optional
  },
],
```

## 4. Photographs

The originals live in `source-photos/`. `npm run images` optimises them into
`src/assets/images/`, and `scripts/process-images.mjs` holds the crop for each
one.

> The originals committed here came through a channel that resized them to at
> most 1200px on the long edge. If you have the full-resolution files from the
> camera, replace `source-photos/` with them and re-run `npm run images` — the
> photography will get noticeably sharper on large screens, with no other
> changes needed.

To add or replace a photo:

1. Drop the original into `source-photos/`.
2. Add an entry to `PHOTOS` in `scripts/process-images.mjs`.
3. Run `npm run images`.
4. Import it in `src/content/images.ts` with alt text and a caption in both
   languages, then add its key to `galleryOrder`.

Alt text should describe what is actually in the frame — it is read aloud by
screen readers and indexed by Google.

## 5. Adding a treatment

Append an entry to `services` in `src/content/services.ts`. Its page, its place
in the navigation index, the footer list, the appointment dropdown, the sitemap
and the structured data are all generated from that one entry.

## 6. Wording

`src/i18n/dictionaries/sq.ts` is the Albanian copy and also defines the shape
that every language must provide. If you add a key there, TypeScript will
refuse to build until `en.ts` has it too, so the two languages cannot drift
apart.
