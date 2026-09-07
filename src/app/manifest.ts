import type { MetadataRoute } from "next";

import { clinic } from "@/content/clinic";
import { defaultLocale, htmlLang } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default function manifest(): MetadataRoute.Manifest {
  const dict = getDictionary(defaultLocale);

  return {
    id: "/",
    name: `${clinic.name} ${clinic.descriptor}`,
    short_name: clinic.name,
    description: dict.meta.homeDescription,
    lang: htmlLang[defaultLocale],
    dir: "ltr",
    categories: ["health", "medical"],
    start_url: "/",
    display: "standalone",
    background_color: "#fbf9f6",
    theme_color: "#14171a",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
