import type { MetadataRoute } from "next";

import { clinic } from "@/content/clinic";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${clinic.name} ${clinic.descriptor}`,
    short_name: clinic.name,
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
