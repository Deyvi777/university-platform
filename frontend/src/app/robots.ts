import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard", "/kardex-pdf", "/notas-pdf", "/libreta-pdf"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
