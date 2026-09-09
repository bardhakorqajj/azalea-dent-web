import type { NextConfig } from "next";

import { allowedOrigins } from "./src/lib/admin/origins";

/**
 * The dashboard answers on its own hostname, which two of these settings exist
 * for. See `src/lib/admin/host.ts` for how the hostname itself is resolved.
 */

/**
 * Hostnames a Server Action may be invoked from.
 *
 * Next compares a Server Action's `Origin` against the request's host (or
 * `X-Forwarded-Host`) and rejects a mismatch — a CSRF protection that is
 * exactly right by default and needs telling about a second hostname. Without
 * this, every form in the dashboard fails with "Invalid Server Actions
 * request" once it is served from admin.azaleadent.org.
 *
 * The list comes from `src/lib/admin/origins.ts`, which is the same list the
 * application's own `verifySameOrigin()` checks against — so the framework and
 * the application cannot disagree about which addresses are legitimate.
 */

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: {
      allowedOrigins: allowedOrigins(),
      /**
       * The gallery uploads photographs through a Server Action, and the
       * default cap is 1MB — which a photograph off a phone exceeds without
       * trying. Set a little above the 8MB the upload gate allows, because the
       * limit applies to the raw multipart body including its boundaries and
       * part headers.
       */
      bodySizeLimit: "9mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
