import type { MetadataRoute } from "next";

import { isUnlistedDeployment, siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  /* Preview deployments are the same site on a different address. Letting them
     be crawled would put duplicates of every page in the index, competing with
     the real domain. */
  if (isUnlistedDeployment()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
