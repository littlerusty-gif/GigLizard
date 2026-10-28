/**
 * GigLizard SEO Manager
 * Dynamically synchronizes document title, meta descriptions, keywords, canonical URLs,
 * and OpenGraph/Twitter cards for maximum organic search indexing on Google & Bing.
 */

export interface SeoMetadata {
  title: string;
  description: string;
  keywords: string;
  canonicalUrl: string;
  ogType?: string;
}

export const SEO_CONFIG: Record<string, SeoMetadata> = {
  home: {
    title: "GigLizard - Free Stage Plot Maker, Tech Rider Builder & Venue Directory",
    description: "Free stage plot maker, live sound tech rider builder, 650+ music venue directory with verified booking contacts, and AI tour planner for independent musicians.",
    keywords: "free stage plot maker, stage plot designer, tech rider builder, music venue directory, band booking contacts, diy tour planner, concert flyer maker, live sound input list",
    canonicalUrl: "https://www.giglizard.us/"
  },
  plot: {
    title: "Free Stage Plot Maker & Band Stage Designer | GigLizard",
    description: "Design free professional stage plots online with drag-and-drop drums, amps, microphones, monitors, and inputs. Export 300 DPI print-ready PDF & PNG tech sheets for sound engineers.",
    keywords: "free stage plot maker, stage plot designer, online stage plot creator, band stage plot template, stage layout builder, music stage plot generator, live concert stage plot",
    canonicalUrl: "https://www.giglizard.us/plot"
  },
  rider: {
    title: "Live Sound Tech Rider Builder & Input Patch List Maker | GigLizard",
    description: "Generate standard live sound tech riders with 24-channel input patch lists, mic choices, +48V phantom power, monitor sends, and backline power specs for sound engineers.",
    keywords: "tech rider builder, band tech rider template, soundboard input list maker, audio tech rider, live sound patch sheet, touring band technical rider",
    canonicalUrl: "https://www.giglizard.us/rider"
  },
  venues: {
    title: "650+ Live Music Venue Directory & Booking Emails (Lower 48) | GigLizard",
    description: "Explore 650+ independent music venues across all 48 continental states. Search by city, genre, capacity, sound specs, and verified talent buyer booking emails for 100% free.",
    keywords: "music venue directory, live music venues near me, indie band booking, concert venue database, talent buyer contacts, booking agent emails, diy tour booking directory",
    canonicalUrl: "https://www.giglizard.us/venues"
  },
  bands: {
    title: "4,850+ Touring Band Directory & Co-Bill Partner Finder | GigLizard",
    description: "Find active local support and co-bill bands in every US touring market. Connect with verified artists to split bills, share backline gear, and pack venues.",
    keywords: "touring band directory, find local support bands, band co-bills, indie bands looking for shows, musician networking, touring co-bill directory",
    canonicalUrl: "https://www.giglizard.us/bands"
  },
  tour: {
    title: "DIY Band Tour Route Planner & Van Gas Cost Calculator | GigLizard",
    description: "Map multi-city tour itineraries with driving times, routing corridors, band van gas budget estimators, and hotel lodging searches powered by Google Maps.",
    keywords: "band tour planner, diy tour routing, tour gas calculator, band route planner, touring route optimizer, live music road trip planner",
    canonicalUrl: "https://www.giglizard.us/tour"
  },
  poster: {
    title: "Concert Poster Designer & Gig Flyer Maker Studio | GigLizard",
    description: "Create high-impact concert gig flyers and tour posters with vintage halftone, psychedelic grunge, and neon cyber aesthetics. Instant social and print export.",
    keywords: "gig flyer maker, concert poster designer, band flyer generator, show poster creator, live event graphic maker, indie music poster template",
    canonicalUrl: "https://www.giglizard.us/poster"
  },
  pricing: {
    title: "Transparent Musician Pricing - Free Venue Tools & $9.99 Pass | GigLizard",
    description: "All core venue directories, stage plot designers, tech rider builders, and tour planners are 100% free forever. Get a flat 30-day band booking pass for $9.99 with no auto-renewal traps.",
    keywords: "giglizard pricing, free stage plot maker, band booking database cost, affordable touring software for musicians",
    canonicalUrl: "https://www.giglizard.us/pricing"
  },
  compare: {
    title: "GigLizard vs Sonicbids, Prism.fm & Gigwell | Platform Comparison",
    description: "Compare GigLizard against expensive agency software. Zero monthly subscriptions, 100% free venue directory, free stage plot maker, and fair $9.99 30-day passes.",
    keywords: "sonicbids alternative, prism fm alternative, gigwell alternative, best free stage plot maker, affordable booking tools",
    canonicalUrl: "https://www.giglizard.us/compare"
  },
  about: {
    title: "About GigLizard - Built by Touring Musicians for Independent Artists",
    description: "Learn about the mission of GigLizard, founded by Pacific Northwest touring artist Little Rusty to give DIY bands free venue intelligence, stage plotting, and booking access.",
    keywords: "about giglizard, little rusty musician, independent touring advocate, diy music booking mission",
    canonicalUrl: "https://www.giglizard.us/about"
  },
  features: {
    title: "All Touring & Production Features | GigLizard Tour Suite",
    description: "Explore the complete suite of DIY band tools: Stage Plot Designer, Tech Rider Builder, 650+ Venue Directory, Tour Route Planner, Poster Maker, and Band Directory.",
    keywords: "band production tools, giglizard features, music booking tools, tour planning software",
    canonicalUrl: "https://www.giglizard.us/features"
  },
  guide: {
    title: "The Independent DIY Touring Playbook & Booking Guide | GigLizard",
    description: "Step-by-step master guide for booking independent tours, emailing talent buyers, designing soundboard tech riders, routing highway corridors, and packing rooms.",
    keywords: "diy touring guide, how to book band tour, emailing talent buyers, band tour booking template, venue outreach guide",
    canonicalUrl: "https://www.giglizard.us/guide"
  },
  changelog: {
    title: "Changelog & Product Updates | GigLizard",
    description: "Track live releases, feature additions, venue database expansions, and stage plotting improvements on the GigLizard platform.",
    keywords: "giglizard changelog, band tour software updates, live sound stage plot updates",
    canonicalUrl: "https://www.giglizard.us/changelog"
  },
  customers: {
    title: "Band Stories & Touring Case Studies | GigLizard",
    description: "Read real stories of independent rock, punk, metal, indie, and folk artists booking successful DIY tours and packing venues using GigLizard.",
    keywords: "diy touring case studies, band booking reviews, independent tour success stories",
    canonicalUrl: "https://www.giglizard.us/customers"
  },
  verification: {
    title: "Live Booking Contact Verification & Freshness Log | GigLizard",
    description: "Real-time audit log tracking human verification of venue emails, sound specs, and band contact information across all 50 states.",
    keywords: "venue email verification, live booking audit log, accurate music venue directory",
    canonicalUrl: "https://www.giglizard.us/verification"
  },
  advisor: {
    title: "Touring FAQ & Booking Support | GigLizard",
    description: "Answers to common questions regarding booking DIY tours, stage plot formats, tech rider standards, and venue contact verification.",
    keywords: "touring faq, band booking questions, stage plot faq, tech rider questions",
    canonicalUrl: "https://www.giglizard.us/faq"
  }
};

/**
 * Updates DOM title, meta description, meta keywords, canonical link,
 * and OpenGraph/Twitter card tags for the current active view.
 */
export function updatePageSeo(tabKey: string, customMeta?: Partial<SeoMetadata>) {
  if (typeof document === "undefined") return;

  const config = { ...(SEO_CONFIG[tabKey] || SEO_CONFIG.home), ...customMeta };

  // 1. Page Title
  document.title = config.title;

  // 2. Helper to set or create meta tag
  const setMetaTag = (attribute: "name" | "property", key: string, content: string) => {
    let elem = document.querySelector(`meta[${attribute}="${key}"]`);
    if (!elem) {
      elem = document.createElement("meta");
      elem.setAttribute(attribute, key);
      document.head.appendChild(elem);
    }
    elem.setAttribute("content", content);
  };

  // 3. Meta Description & Keywords
  setMetaTag("name", "description", config.description);
  setMetaTag("name", "keywords", config.keywords);

  // 4. OpenGraph Tags
  setMetaTag("property", "og:title", config.title);
  setMetaTag("property", "og:description", config.description);
  setMetaTag("property", "og:url", config.canonicalUrl);
  setMetaTag("property", "og:type", config.ogType || "website");

  // 5. Twitter Card Tags
  setMetaTag("name", "twitter:title", config.title);
  setMetaTag("name", "twitter:description", config.description);

  // 6. Canonical Link
  let canonicalElem = document.querySelector('link[rel="canonical"]');
  if (!canonicalElem) {
    canonicalElem = document.createElement("link");
    canonicalElem.setAttribute("rel", "canonical");
    document.head.appendChild(canonicalElem);
  }
  canonicalElem.setAttribute("href", config.canonicalUrl);
}
