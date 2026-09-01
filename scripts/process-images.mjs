/**
 * Optimises the clinic's original photography into the web assets used by the site.
 *
 * Source photos live in `source-photos/` — the clinic's untouched originals.
 * Output lands in `src/assets/images/` so that Next.js can statically import them and
 * derive intrinsic dimensions + blur placeholders automatically.
 *
 * Run with: npm run images
 */
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = "source-photos";
const OUT = "src/assets/images";

/**
 * Each entry maps an original photo to its web asset.
 * `extract` crops away distracting edges — framing only, never distortion.
 */
const PHOTOS = [
  {
    from: "treatment-room-oak.jpg",
    to: "operatory-oak.jpg",
    note: "Treatment room with charcoal cabinetry and oak backsplash",
  },
  {
    from: "treatment-room-daylight.jpg",
    to: "operatory-daylight.jpg",
    note: "Daylight treatment room",
    // Trims empty ceiling so the chair sits properly in portrait frames.
    extract: { left: 0, top: 150, width: 900, height: 900 },
  },
  {
    from: "facade.jpg",
    to: "facade-night.jpg",
    note: "Illuminated clinic facade at dusk",
    extract: { left: 0, top: 110, width: 900, height: 590 },
  },
  {
    from: "reception.jpg",
    to: "reception.jpg",
    note: "Reception and waiting area",
  },
  {
    from: "glass-partition.jpg",
    to: "glass-detail.jpg",
    note: "Etched azalea mark on the treatment room glass",
    // Trims foreground floor so the etched mark carries the frame.
    extract: { left: 0, top: 0, width: 1200, height: 790 },
  },
];

const MAX_EDGE = 1600;

async function run() {
  await mkdir(OUT, { recursive: true });

  for (const photo of PHOTOS) {
    const input = path.join(SRC, photo.from);
    try {
      await stat(input);
    } catch {
      console.warn(`skip ${photo.from} — not found in ${SRC}/`);
      continue;
    }

    let pipeline = sharp(input).rotate();
    if (photo.extract) pipeline = pipeline.extract(photo.extract);

    const outPath = path.join(OUT, photo.to);
    const info = await pipeline
      .resize({
        width: MAX_EDGE,
        height: MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 82, progressive: true, mozjpeg: true })
      .toFile(outPath);

    console.log(
      `${photo.to.padEnd(24)} ${String(info.width).padStart(4)}x${String(info.height).padEnd(4)}  ${(info.size / 1024).toFixed(0)} kB  — ${photo.note}`,
    );
  }

  const written = await readdir(OUT);
  console.log(`\n${written.length} assets in ${OUT}/`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
