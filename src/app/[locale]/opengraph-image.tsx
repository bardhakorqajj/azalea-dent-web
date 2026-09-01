import { ImageResponse } from "next/og";

import { clinic } from "@/content/clinic";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Azalea Dent — Dental Clinic";

const PETAL =
  "M50 40 C46 40.5 42.5 38 40.5 33 C37.5 26 38.5 16.8 43.5 16 C47 15.5 48 20 47.5 25 " +
  "C47.3 27.2 48.7 28.4 50 26.2 C51.3 28.4 52.7 27.2 52.5 25 C52 20 53 15.5 56.5 16 " +
  "C61.5 16.8 62.5 26 59.5 33 C57.5 38 54 40.5 50 40 Z";

/** The azalea mark as a data URI — Satori renders SVG reliably through <img>. */
function markDataUri(): string {
  const petals = [0, 72, 144, 216, 288]
    .map((angle) => `<path d="${PETAL}" transform="rotate(${angle} 50 50)"/>`)
    .join("");
  const stamens = [36, 108, 180, 252, 324]
    .map(
      (angle) =>
        `<g transform="rotate(${angle} 50 50)" stroke-width="2.7">` +
        `<path d="M50 27 V10" transform="rotate(-7 50 50)"/>` +
        `<path d="M50 27 V10" transform="rotate(7 50 50)"/></g>`,
    )
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200"><g fill="none" stroke="#e3b657" stroke-width="3.1" stroke-linecap="round" stroke-linejoin="round">${petals}${stamens}</g></svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const dict = getDictionary(locale);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0c0e0f",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <img src={markDataUri()} width={104} height={104} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 46,
                letterSpacing: 8,
                color: "#fbf9f6",
                fontWeight: 600,
              }}
            >
              {clinic.name.toUpperCase()}
            </div>
            <div
              style={{
                fontSize: 18,
                letterSpacing: 11,
                color: "#c69a3d",
                marginTop: 10,
              }}
            >
              {clinic.descriptor.toUpperCase()}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              width: 96,
              height: 2,
              backgroundColor: "#c69a3d",
              marginBottom: 34,
            }}
          />
          <div
            style={{
              fontSize: 60,
              lineHeight: 1.14,
              color: "#f5f1ea",
              maxWidth: 900,
            }}
          >
            {dict.hero.title}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
