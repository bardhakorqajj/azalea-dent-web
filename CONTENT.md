# Editing the website content

Everything the site says about the clinic lives in a handful of files. No
component needs to be touched to update the website.

| What | File |
| --- | --- |
| Phone, WhatsApp, email, address, opening hours, team, testimonials | `src/content/clinic.ts` |
| The eight treatments and their copy | `src/content/services.ts` |
| The price list | `src/content/prices.ts` |
| Photographs, alt text and captions | `src/content/images.ts` |
| Every other word on the site, in both languages | `src/i18n/dictionaries/sq.ts` and `en.ts` |

After editing, run `npm run dev` and the change appears immediately.

---

## 1. Clinic details

Every clinic fact is set in `src/content/clinic.ts` — phone numbers, WhatsApp,
Viber, email, address, opening hours, the Google Maps link and embed, the
Instagram and Facebook profiles, and the clinical team. Edit them there and
every place that displays them updates at once: the footer, the contact page,
the sticky mobile call button, and the `Dentist` structured data Google reads.

Two fields are deliberately left empty and are **not** reported as missing:

- `geo` — decimal coordinates. The address and the Maps link already place the
  clinic. To switch it on for local SEO, set
  `{ latitude: 42.6390286, longitude: 21.1638098 }`.
- `testimonials` — the section stays hidden until real, attributable reviews
  are added. See section 3.

While you run `npm run dev`, a small panel in the corner lists anything still
missing. It never appears on the live site, and it should currently be empty.

### The map

`mapsEmbedUrl` uses a coordinate-based embed, which needs no Google API key:

```ts
mapsEmbedUrl: "https://www.google.com/maps?q=42.6390286,21.1638098&z=17&output=embed",
```

The pin is exactly on the clinic but is labelled with coordinates rather than
the business name. For a labelled pin, open the clinic in Google Maps →
**Share → Embed a map** → copy just the `src="…"` value and paste it here.

If `mapsEmbedUrl` is ever cleared, the contact page falls back to the
shopfront photograph with a short note, alongside a working "view on map" link.

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

## 5. Prices

`src/content/prices.ts` holds the price list, grouped exactly as it is on the
sheet at reception. To change a price, edit the number:

```ts
{ name: { sq: "Implanti", en: "Dental implant" }, price: 450 },
```

Prices are plain numbers in euro; the euro sign is added when rendering. Adding
a treatment means adding one entry to the right group, and adding a whole
category means one more group with an `id`, a `title` in both languages and its
`items`.

A few obvious spelling slips on the printed sheet were corrected in the file
("Regullimi" to "Rregullimi", "Sherimi" to "Shërimi"). Everything else follows
the sheet exactly, including the order of the categories.

`npm test` checks the transcription: it asserts the eight categories, the total
of 49 treatments, that every entry has a positive whole-number price and both
languages, and it spot-checks the prices patients ask about most. If you change
a price, update `tests/content.test.ts` when the test names that treatment.

## 6. Adding a treatment

Append an entry to `services` in `src/content/services.ts`. Its page, its place
in the navigation index, the footer list, the appointment dropdown, the sitemap
and the structured data are all generated from that one entry.

## 7. Wording

`src/i18n/dictionaries/sq.ts` is the Albanian copy and also defines the shape
that every language must provide. If you add a key there, TypeScript will
refuse to build until `en.ts` has it too, so the two languages cannot drift
apart.
