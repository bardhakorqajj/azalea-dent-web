/**
 * Generates the favicon and the Apple touch icon from the clinic mark, so the
 * icons always match `src/components/ui/AzaleaMark.tsx`.
 *
 * Run with: node scripts/generate-icons.mjs
 */
import { writeFile } from "node:fs/promises";
import sharp from "sharp";

const TOOTH =
  "M51.2 11.2 C52.2 11.1 55.8 10.4 57.2 10.3 C58.7 10.1 59.1 10.1 59.8 10.2 C60.5 10.4 61 10.6 61.4 11 C61.8 11.4 62.2 12 62.4 12.8 C62.6 13.6 63.3 12.4 62.6 15.8 C61.9 19.1 59.1 29.9 58.2 33.1 C57.2 36.2 57.4 34.3 56.9 34.5 C56.3 34.7 55.6 34.5 55.1 34.3 C54.6 34 54.4 33.9 53.9 33 C53.4 32.2 52.5 30 52 29.3 C51.5 28.6 51.6 28.8 51.2 28.6 C50.8 28.5 50.2 28.3 49.8 28.3 C49.4 28.3 49.1 28.4 48.7 28.6 C48.4 28.8 48.4 28.5 47.7 29.4 C47.1 30.3 45.5 33.3 44.7 34.1 C44 35 43.6 34.7 43.2 34.7 C42.8 34.7 42.7 35.4 42.3 34.1 C41.9 32.8 41.6 29.4 40.8 26.7 C40 24 38.1 19.8 37.5 17.8 C36.9 15.8 37.2 15.8 37.3 14.8 C37.3 13.9 37.5 12.8 38 12 C38.5 11.3 39.3 10.5 40.2 10.1 C41.2 9.8 42.9 10 43.7 10.1 C44.6 10.2 44.2 10.1 45.3 10.7 C46.4 11.3 48.9 13.2 50.3 14 C51.7 14.7 53.1 14.8 53.7 15";

const INK = "#14171a";
const GOLD = "#e3b657";

function markSvg({ size = 100, stroke = 3.4, background = INK, colour = GOLD } = {}) {
  const teeth = [0, 72, 144, 216, 288]
    .map((angle) => `<path d="${TOOTH}" transform="rotate(${angle} 50 50)"/>`)
    .join("");
  const rays = [36, 108, 180, 252, 324]
    .map(
      (angle) =>
        `<g transform="rotate(${angle} 50 50)" stroke-width="${(stroke * 0.8).toFixed(2)}">` +
        `<path d="M50 26.3 V17.1"/><path d="M50 13 V10.4"/></g>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  <rect width="100" height="100" fill="${background}"/>
  <g transform="translate(50 50) scale(0.82) translate(-50 -50)" fill="none" stroke="${colour}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
    ${teeth}${rays}
  </g>
</svg>`;
}

const favicon = markSvg({ stroke: 3.6 });
await writeFile("src/app/icon.svg", `${favicon}\n`, "utf8");

await sharp(Buffer.from(markSvg({ size: 180, stroke: 3.2 })))
  .resize(180, 180)
  .png()
  .toFile("src/app/apple-icon.png");

console.log("wrote src/app/icon.svg and src/app/apple-icon.png");
