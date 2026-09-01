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

Most clinic details are now set. What remains could not be derived from a
Google Maps short link (this project's build environment cannot reach Google
Maps), so it needs pasting in by hand.

While you run `npm run dev`, a small panel in the corner lists whatever is
still missing. It never appears on the live site.

Open `src/content/clinic.ts` and fill in:

```ts
address: {
  street: "Rr. Shembull 12",
  locality: "Prishtinë",
  postalCode: "10000",
  country: "XK",                   // ISO country code: XK Kosovo, AL Albania
},

geo: { latitude: 42.6629, longitude: 21.1655 },
```

To get the coordinates: open the clinic in Google Maps, right-click the pin,
and the first item in the menu is the latitude and longitude — click to copy.

For the embedded map, an address alone is enough — no API key needed:

```ts
mapsEmbedUrl: "https://www.google.com/maps?q=Rr.+Shembull+12,+Prishtin%C3%AB&output=embed",
```

Take your address, replace spaces with `+`, and drop it after `q=`. Or use
Google Maps' own embed code (Share → *Embed a map* → copy just the `src="…"`
value), which gives you control over the zoom level.

Until `mapsEmbedUrl` is set, the contact page shows the clinic's shopfront
photograph in place of the map, alongside a working "View on map" link.

### Already set

Phone numbers, WhatsApp, Viber, email, Facebook, Instagram, the Google Maps
link, opening hours and the clinical team are all configured. Edit them in the
same file — everything that displays them updates at once.

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
