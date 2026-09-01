/**
 * Generates the favicon and the Apple touch icon from the azalea mark, so the
 * icons always match `src/components/ui/AzaleaMark.tsx`.
 *
 * Run with: node scripts/generate-icons.mjs
 */
import { writeFile } from "node:fs/promises";
import sharp from "sharp";

const PETAL =
  "M50 40 C46 40.5 42.5 38 40.5 33 C37.5 26 38.5 16.8 43.5 16 C47 15.5 48 20 47.5 25 " +
  "C47.3 27.2 48.7 28.4 50 26.2 C51.3 28.4 52.7 27.2 52.5 25 C52 20 53 15.5 56.5 16 " +
  "C61.5 16.8 62.5 26 59.5 33 C57.5 38 54 40.5 50 40 Z";

const INK = "#14171a";
const GOLD = "#e3b657";

function markSvg({ size = 100, stroke = 3.4, background = INK, colour = GOLD } = {}) {
  const petals = [0, 72, 144, 216, 288]
    .map((angle) => `<path d="${PETAL}" transform="rotate(${angle} 50 50)"/>`)
    .join("");
  const stamens = [36, 108, 180, 252, 324]
    .map(
      (angle) =>
        `<g transform="rotate(${angle} 50 50)" stroke-width="${(stroke * 0.86).toFixed(2)}">` +
        `<path d="M50 27 V10" transform="rotate(-7 50 50)"/>` +
        `<path d="M50 27 V10" transform="rotate(7 50 50)"/></g>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  <rect width="100" height="100" fill="${background}"/>
  <g transform="translate(50 50) scale(0.86) translate(-50 -50)" fill="none" stroke="${colour}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
    ${petals}${stamens}
  </g>
</svg>`;
}

const favicon = markSvg({ stroke: 4.2 });
await writeFile("src/app/icon.svg", `${favicon}\n`, "utf8");

await sharp(Buffer.from(markSvg({ size: 180, stroke: 3.8 })))
  .resize(180, 180)
  .png()
  .toFile("src/app/apple-icon.png");

console.log("wrote src/app/icon.svg and src/app/apple-icon.png");
