/**
 * Dynamic XML Sitemap Generator for GigLizard.
 * Generates standards-compliant XML (sitemaps.org schema 0.9)
 * containing all primary tools, programmatic city and genre hubs,
 * comparison landing pages, guides, FAQs, and verification logs.
 */

import { POPULAR_TOURING_CITIES, POPULAR_GENRE_CITY_ROUTES } from "./venueSeoRoutes";

export interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: string;
}

const PRIMARY_GENRES = [
  "rock",
  "punk",
  "indie",
  "metal",
  "folk",
  "electronic",
  "hip-hop",
  "blues",
  "jazz"
];

export function getSitemapEntries(): SitemapEntry[] {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const entries: SitemapEntry[] = [];

  // 1. Root & Directory Core Hubs
  entries.push({
    url: "https://www.giglizard.us/",
    lastmod: today,
    changefreq: "daily",
    priority: "1.0"
  });

  entries.push({
    url: "https://www.giglizard.us/venues",
    lastmod: today,
    changefreq: "daily",
    priority: "0.95"
  });

  entries.push({
    url: "https://www.giglizard.us/bands",
    lastmod: today,
    changefreq: "daily",
    priority: "0.95"
  });

  // 2. Production & Touring Tools (100% Free Forever)
  entries.push({
    url: "https://www.giglizard.us/tour",
    lastmod: today,
    changefreq: "weekly",
    priority: "0.90"
  });

  entries.push({
    url: "https://www.giglizard.us/plot",
    lastmod: today,
    changefreq: "weekly",
    priority: "0.85"
  });

  entries.push({
    url: "https://www.giglizard.us/rider",
    lastmod: today,
    changefreq: "weekly",
    priority: "0.85"
  });

  entries.push({
    url: "https://www.giglizard.us/poster",
    lastmod: today,
    changefreq: "weekly",
    priority: "0.85"
  });

  // 3. Pricing, Platform Comparisons & Features
  entries.push({
    url: "https://www.giglizard.us/pricing",
    lastmod: today,
    changefreq: "weekly",
    priority: "0.90"
  });

  entries.push({
    url: "https://www.giglizard.us/compare",
    lastmod: today,
    changefreq: "weekly",
    priority: "0.90"
  });

  entries.push({
    url: "https://www.giglizard.us/vs/sonicbids",
    lastmod: today,
    changefreq: "weekly",
    priority: "0.85"
  });

  entries.push({
    url: "https://www.giglizard.us/vs/prism-fm",
    lastmod: today,
    changefreq: "weekly",
    priority: "0.85"
  });

  entries.push({
    url: "https://www.giglizard.us/vs/gigwell",
    lastmod: today,
    changefreq: "weekly",
    priority: "0.85"
  });

  entries.push({
    url: "https://www.giglizard.us/features",
    lastmod: today,
    changefreq: "weekly",
    priority: "0.85"
  });

  // 4. Mission, Guides, Changelog, Verification & Trust
  entries.push({
    url: "https://www.giglizard.us/about",
    lastmod: today,
    changefreq: "monthly",
    priority: "0.80"
  });

  entries.push({
    url: "https://www.giglizard.us/changelog",
    lastmod: today,
    changefreq: "weekly",
    priority: "0.80"
  });

  entries.push({
    url: "https://www.giglizard.us/customers",
    lastmod: today,
    changefreq: "weekly",
    priority: "0.80"
  });

  entries.push({
    url: "https://www.giglizard.us/touring-guide",
    lastmod: today,
    changefreq: "weekly",
    priority: "0.80"
  });

  entries.push({
    url: "https://www.giglizard.us/faq",
    lastmod: today,
    changefreq: "weekly",
    priority: "0.80"
  });

  entries.push({
    url: "https://www.giglizard.us/verification",
    lastmod: today,
    changefreq: "daily",
    priority: "0.85"
  });

  // 5. Popular Touring City Hubs (e.g. /venues/austin-tx, /venues/seattle-wa, /venues/new-york-ny, etc.)
  for (const city of POPULAR_TOURING_CITIES) {
    entries.push({
      url: `https://www.giglizard.us/venues/${city.slug}`,
      lastmod: today,
      changefreq: "weekly",
      priority: "0.88"
    });
  }

  // 6. Popular Genre Hubs (e.g. /venues/rock, /venues/punk, /venues/indie, etc.)
  for (const genre of PRIMARY_GENRES) {
    entries.push({
      url: `https://www.giglizard.us/venues/${genre}`,
      lastmod: today,
      changefreq: "weekly",
      priority: "0.88"
    });
  }

  // 7. Popular Genre + City Circuits (e.g. /venues/rock/chicago, /venues/punk/seattle, etc.)
  for (const circuit of POPULAR_GENRE_CITY_ROUTES) {
    entries.push({
      url: `https://www.giglizard.us/venues/${circuit.slug}`,
      lastmod: today,
      changefreq: "weekly",
      priority: "0.85"
    });
  }

  return entries;
}

export function generateSitemapXml(): string {
  const entries = getSitemapEntries();
  const xmlNodes = entries
    .map(
      (e) => `  <url>
    <loc>${e.url}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlNodes}
</urlset>`;
}
