/**
 * Dynamic XML Sitemap Generator for GigLizard.
 * Generates standards-compliant XML (sitemaps.org schema 0.9)
 * containing:
 * 1. Core pages (Home, Venues, Bands, Tour, Plot, Rider, Poster, Pricing, Compare, etc.)
 * 2. Programmatic City & State routes (/venues/[location], e.g. /venues/portland-or, /venues/austin-tx)
 * 3. Individual Venue profile routes (/venues/:location/:venueSlug and /venues/venue/:venueId)
 * All city routes and venue profile URLs are given priority 0.8 and weekly changefreq for Google crawlers.
 */

import { POPULAR_TOURING_CITIES, POPULAR_GENRE_CITY_ROUTES } from "./venueSeoRoutes";
import { MUSIC_VENUES } from "../data/venues";

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

function makeSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// In-memory cache for dynamic sitemap with 30-minute TTL
let cachedSitemapXml: string | null = null;
let lastSitemapGeneratedAt = 0;
const SITEMAP_CACHE_TTL_MS = 30 * 60 * 1000;

export function getCoreSitemapEntries(): SitemapEntry[] {
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
    url: "https://www.giglizard.us/tools/stage-plot",
    lastmod: today,
    changefreq: "weekly",
    priority: "0.9"
  });

  entries.push({
    url: "https://www.giglizard.us/plot",
    lastmod: today,
    changefreq: "weekly",
    priority: "0.9"
  });

  entries.push({
    url: "https://www.giglizard.us/tools/poster-designer",
    lastmod: today,
    changefreq: "weekly",
    priority: "0.9"
  });

  entries.push({
    url: "https://www.giglizard.us/poster",
    lastmod: today,
    changefreq: "weekly",
    priority: "0.9"
  });

  entries.push({
    url: "https://www.giglizard.us/rider",
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

  // 5. Popular Genre Hubs (e.g. /venues/rock, /venues/punk)
  for (const genre of PRIMARY_GENRES) {
    entries.push({
      url: `https://www.giglizard.us/venues/${genre}`,
      lastmod: today,
      changefreq: "weekly",
      priority: "0.80"
    });
  }

  // 6. Popular Genre + City Circuits (e.g. /venues/rock/chicago)
  for (const circuit of POPULAR_GENRE_CITY_ROUTES) {
    entries.push({
      url: `https://www.giglizard.us/venues/${circuit.slug}`,
      lastmod: today,
      changefreq: "weekly",
      priority: "0.80"
    });
  }

  return entries;
}

export function getSitemapEntries(): SitemapEntry[] {
  const entries = getCoreSitemapEntries();
  const today = new Date().toISOString().split("T")[0];

  // Static fallback popular cities
  for (const city of POPULAR_TOURING_CITIES) {
    entries.push({
      url: `https://www.giglizard.us/venues/${city.slug}`,
      lastmod: today,
      changefreq: "weekly",
      priority: "0.8"
    });
  }

  // Static fallback local venues
  for (const v of MUSIC_VENUES) {
    const citySlug = makeSlug(v.city || "seattle");
    const stateSlug = (v.state || "wa").toLowerCase();
    const venueSlug = makeSlug(v.name);
    entries.push({
      url: `https://www.giglizard.us/venues/${citySlug}-${stateSlug}/${venueSlug}`,
      lastmod: today,
      changefreq: "weekly",
      priority: "0.8"
    });
    entries.push({
      url: `https://www.giglizard.us/venues/venue/${v.id}`,
      lastmod: today,
      changefreq: "weekly",
      priority: "0.8"
    });
  }

  return entries;
}

/**
 * Builds standard XML sitemap from entries array
 */
export function buildSitemapXmlFromEntries(entries: SitemapEntry[]): string {
  // Deduplicate entries by URL
  const seenUrls = new Set<string>();
  const uniqueEntries = entries.filter((e) => {
    if (seenUrls.has(e.url)) return false;
    seenUrls.add(e.url);
    return true;
  });

  const xmlNodes = uniqueEntries
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

export function generateSitemapXml(): string {
  return buildSitemapXmlFromEntries(getSitemapEntries());
}

/**
 * Dynamic XML Sitemap Generator that queries all unique city + state pairs
 * and individual venue IDs from Supabase public.venues table.
 *
 * All city routes and venue profile URLs are generated with:
 * - priority: 0.8
 * - changefreq: weekly
 */
export async function generateDynamicSupabaseSitemap(supabaseClient?: any): Promise<string> {
  const now = Date.now();
  if (cachedSitemapXml && now - lastSitemapGeneratedAt < SITEMAP_CACHE_TTL_MS) {
    return cachedSitemapXml;
  }

  const today = new Date().toISOString().split("T")[0];
  const entries: SitemapEntry[] = [...getCoreSitemapEntries()];

  // Track unique city-state paths and venue URLs to ensure no duplicates
  const cityRoutes = new Set<string>();
  const venueRoutes = new Set<string>();

  try {
    let venuesData: Array<{ id: string; name: string; city: string; state: string }> = [];

    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from("venues")
        .select("id, name, city, state");

      if (!error && Array.isArray(data)) {
        venuesData = data;
      }
    }

    // Also blend local curated venues to ensure total coverage
    MUSIC_VENUES.forEach((mv) => {
      venuesData.push({
        id: mv.id,
        name: mv.name,
        city: mv.city,
        state: mv.state || "WA"
      });
    });

    // Popular touring cities guarantee
    POPULAR_TOURING_CITIES.forEach((pc) => {
      const route = `https://www.giglizard.us/venues/${pc.slug}`;
      cityRoutes.add(route);
      entries.push({
        url: route,
        lastmod: today,
        changefreq: "weekly",
        priority: "0.8"
      });
    });

    for (const v of venuesData) {
      if (v.city && v.state) {
        const citySlug = makeSlug(v.city);
        const stateSlug = v.state.toLowerCase().trim();
        const cityUrl = `https://www.giglizard.us/venues/${citySlug}-${stateSlug}`;

        if (!cityRoutes.has(cityUrl)) {
          cityRoutes.add(cityUrl);
          entries.push({
            url: cityUrl,
            lastmod: today,
            changefreq: "weekly",
            priority: "0.8"
          });
        }

        if (v.name) {
          const venueSlug = makeSlug(v.name);
          const venueUrl = `https://www.giglizard.us/venues/${citySlug}-${stateSlug}/${venueSlug}`;
          if (!venueRoutes.has(venueUrl)) {
            venueRoutes.add(venueUrl);
            entries.push({
              url: venueUrl,
              lastmod: today,
              changefreq: "weekly",
              priority: "0.8"
            });
          }
        }
      }

      // Individual venue ID URL
      if (v.id) {
        const venueIdUrl = `https://www.giglizard.us/venues/venue/${v.id}`;
        if (!venueRoutes.has(venueIdUrl)) {
          venueRoutes.add(venueIdUrl);
          entries.push({
            url: venueIdUrl,
            lastmod: today,
            changefreq: "weekly",
            priority: "0.8"
          });
        }
      }
    }
  } catch (err) {
    console.error("Error generating dynamic Supabase sitemap:", err);
  }

  const generatedXml = buildSitemapXmlFromEntries(entries);
  cachedSitemapXml = generatedXml;
  lastSitemapGeneratedAt = now;

  return generatedXml;
}
