/**
 * Programmatic SEO routing utilities for the GigLizard Venue Directory.
 * Handles parsing, metadata generation, and sitemap generation for routes like:
 * - /venues/austin-tx
 * - /venues/seattle-wa
 * - /venues/rock/chicago
 * - /venues/punk/seattle
 * - /venues/portland-or
 */

import { CONTINENTAL_US_STATES } from "../constants/states";

export interface ProgrammaticVenueRoute {
  isProgrammatic: boolean;
  type: "city-state" | "genre-city" | "genre-only" | "city-only" | "standard";
  city?: string;
  stateCode?: string;
  stateName?: string;
  genre?: string;
  canonicalPath: string;
  title: string;
  description: string;
  heading: string;
  subhead: string;
  breadcrumb: Array<{ name: string; url: string }>;
}

export const POPULAR_TOURING_CITIES: Array<{
  city: string;
  state: string;
  slug: string;
  corridor: string;
  tagline: string;
}> = [
  { city: "Austin", state: "TX", slug: "austin-tx", corridor: "Texas Triangle (San Antonio · Houston · Dallas)", tagline: "Live Music Capital of the World" },
  { city: "Seattle", state: "WA", slug: "seattle-wa", corridor: "I-5 Pacific Northwest (Portland · Tacoma · Vancouver)", tagline: "Grunge, Indie & Underground Stages" },
  { city: "Portland", state: "OR", slug: "portland-or", corridor: "Cascadia Corridor (Seattle · Eugene · Bend)", tagline: "DIY Independent Music Mecca" },
  { city: "Chicago", state: "IL", slug: "chicago-il", corridor: "Midwest Loop (Milwaukee · Indianapolis · Detroit)", tagline: "Legendary Blues, Rock & Indie Rooms" },
  { city: "Nashville", state: "TN", slug: "nashville-tn", corridor: "Southeast Circuit (Atlanta · Louisville · Memphis)", tagline: "Music City Listening Rooms & Clubs" },
  { city: "Denver", state: "CO", slug: "denver-co", corridor: "Rocky Mountain Hub (Boulder · Fort Collins · Salt Lake)", tagline: "Mile High Rock & Electronic Halls" },
  { city: "Los Angeles", state: "CA", slug: "los-angeles-ca", corridor: "Southern California (San Diego · Santa Ana)", tagline: "Sunset Strip & West Coast Venues" },
  { city: "Boston", state: "MA", slug: "boston-ma", corridor: "Northeast Corridor (Providence · NYC · New Haven)", tagline: "College Rock & Hardcore Dives" },
  { city: "Minneapolis", state: "MN", slug: "minneapolis-mn", corridor: "Upper Midwest (Madison · Chicago · Duluth)", tagline: "Twin Cities Indie & Post-Rock Scene" },
  { city: "San Diego", state: "CA", slug: "san-diego-ca", corridor: "SoCal Coastal Run (LA · Orange County)", tagline: "Coastal Clubs & Open-Air Amphitheaters" },
  { city: "Spokane", state: "WA", slug: "spokane-wa", corridor: "Inland Northwest (Missoula · Boise · Seattle)", tagline: "Inland Northwest Tour Stop" },
  { city: "Tacoma", state: "WA", slug: "tacoma-wa", corridor: "Puget Sound South (Seattle · Olympia)", tagline: "South Sound Live Stages" },
  { city: "Eugene", state: "OR", slug: "eugene-or", corridor: "Willamette Valley (Portland · Ashland)", tagline: "College Town Tour Stop" },
  { city: "Bend", state: "OR", slug: "bend-or", corridor: "Central Oregon (Portland · Boise)", tagline: "High Desert Music Venues" }
];

export const POPULAR_GENRE_CITY_ROUTES: Array<{
  genre: string;
  genreSlug: string;
  city: string;
  state: string;
  slug: string;
  metaSummary: string;
}> = [
  { genre: "Rock", genreSlug: "rock", city: "Chicago", state: "IL", slug: "rock/chicago", metaSummary: "legendary rock clubs, dive bars, and mid-sized music halls" },
  { genre: "Punk", genreSlug: "punk", city: "Seattle", state: "WA", slug: "punk/seattle", metaSummary: "gritty underground punk basements, historic dive bars, and DIY rooms" },
  { genre: "Indie", genreSlug: "indie", city: "Austin", state: "TX", slug: "indie/austin", metaSummary: "Red River Cultural District rooms, patio stages, and indie listening lounges" },
  { genre: "Folk", genreSlug: "folk", city: "Nashville", state: "TN", slug: "folk/nashville", metaSummary: "acoustic listening rooms, intimate singer-songwriter halls, and Americana stages" },
  { genre: "Metal", genreSlug: "metal", city: "Portland", state: "OR", slug: "metal/portland", metaSummary: "heavy metal dives, loud monitor rooms, and independent rock clubs" },
  { genre: "Electronic", genreSlug: "electronic", city: "Denver", state: "CO", slug: "electronic/denver", metaSummary: "warehouse venues, synth lounges, and bass-heavy performance spaces" },
  { genre: "Alternative Rock", genreSlug: "alternative-rock", city: "Seattle", state: "WA", slug: "alternative-rock/seattle", metaSummary: "iconic Belltown and Capitol Hill stages for touring alternative acts" },
  { genre: "Blues", genreSlug: "blues", city: "Chicago", state: "IL", slug: "blues/chicago", metaSummary: "historic Chicago blues basements, soul clubs, and intimate stages" }
];

// Map state abbreviation to full name
const STATE_MAP: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "District of Columbia", BC: "British Columbia"
};

function capitalizeWords(str: string): string {
  return str
    .split(/[- ]+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Parses any venue URL path into programmatic SEO details.
 * Examples:
 *   /venues/austin-tx
 *   /venues/rock/chicago
 *   /venues/seattle-wa
 *   /venues/portland-or
 */
export function parseProgrammaticVenuePath(rawPath: string): ProgrammaticVenueRoute | null {
  const clean = rawPath.replace(/^\/+|\/+$/g, "").toLowerCase();
  const parts = clean.split("/");

  if (parts[0] !== "venues" || parts.length < 2) {
    return null;
  }

  // Format 1: /venues/:genre/:city (e.g. /venues/rock/chicago)
  if (parts.length === 3) {
    const genreSlug = parts[1];
    const citySlug = parts[2];
    const genre = capitalizeWords(genreSlug);
    const city = capitalizeWords(citySlug);

    // Look for matching popular city to get state code if known
    const matchedCity = POPULAR_TOURING_CITIES.find(c => c.city.toLowerCase() === city.toLowerCase());
    const stateCode = matchedCity ? matchedCity.state : undefined;
    const stateName = stateCode ? STATE_MAP[stateCode] : undefined;

    const locationSuffix = stateCode ? `${city}, ${stateCode}` : city;
    const title = `${genre} Venues in ${locationSuffix} | GigLizard`;
    const description = `Find verified ${genre.toLowerCase()} music venues in ${locationSuffix}. Direct talent buyer booking emails, club sound specs, and room capacities for DIY touring bands.`;
    const heading = `${genre} Music Venues in ${locationSuffix}`;
    const subhead = `Explore bookable ${genre.toLowerCase()} stages, live audio specs, and verified booking emails across ${locationSuffix} for independent touring acts.`;

    return {
      isProgrammatic: true,
      type: "genre-city",
      city,
      stateCode,
      stateName,
      genre,
      canonicalPath: `/venues/${genreSlug}/${citySlug}`,
      title,
      description,
      heading,
      subhead,
      breadcrumb: [
        { name: "Home", url: "https://www.giglizard.us/" },
        { name: "Venues", url: "https://www.giglizard.us/venues" },
        { name: `${genre} in ${locationSuffix}`, url: `https://www.giglizard.us/venues/${genreSlug}/${citySlug}` }
      ]
    };
  }

  // Format 2: /venues/:param (either city-state like austin-tx, or city, or genre)
  if (parts.length === 2) {
    const param = parts[1];

    // Check for city-state format: e.g. "austin-tx", "seattle-wa", "salt-lake-city-ut"
    const dashMatch = param.match(/^(.+)-([a-z]{2})$/i);
    if (dashMatch) {
      const citySlug = dashMatch[1];
      const stateSlug = dashMatch[2].toUpperCase();
      const city = capitalizeWords(citySlug);
      const stateCode = stateSlug;
      const stateName = STATE_MAP[stateCode] || stateCode;

      const title = `Live Music Venues in ${city}, ${stateCode} (Free Directory) | GigLizard`;
      const description = `Discover 100% free live music venues in ${city}, ${stateCode}. View room capacities, sound specs, and direct booking email contacts for independent touring acts.`;
      const heading = `Live Music Venues in ${city}, ${stateCode}`;
      const subhead = `Explore verified live stages, club capacities, soundboard specs, and direct talent buyer inboxes across ${city}, ${stateName}.`;

      return {
        isProgrammatic: true,
        type: "city-state",
        city,
        stateCode,
        stateName,
        canonicalPath: `/venues/${param}`,
        title,
        description,
        heading,
        subhead,
        breadcrumb: [
          { name: "Home", url: "https://www.giglizard.us/" },
          { name: "Venues", url: "https://www.giglizard.us/venues" },
          { name: stateName, url: `https://www.giglizard.us/venues?state=${stateCode}` },
          { name: `${city}, ${stateCode}`, url: `https://www.giglizard.us/venues/${param}` }
        ]
      };
    }

    // Check if param matches a known city directly (e.g. "austin", "seattle")
    const matchedCity = POPULAR_TOURING_CITIES.find(
      c => c.city.toLowerCase() === param.toLowerCase() || c.slug === param.toLowerCase()
    );
    if (matchedCity) {
      const city = matchedCity.city;
      const stateCode = matchedCity.state;
      const stateName = STATE_MAP[stateCode] || stateCode;

      return {
        isProgrammatic: true,
        type: "city-state",
        city,
        stateCode,
        stateName,
        canonicalPath: `/venues/${matchedCity.slug}`,
        title: `Live Music Venues in ${city}, ${stateCode} (Free Directory) | GigLizard`,
        description: `Discover 100% free live music venues in ${city}, ${stateCode}. View room capacities, sound specs, and direct booking email contacts for independent touring acts.`,
        heading: `Live Music Venues in ${city}, ${stateCode}`,
        subhead: `Explore verified live stages, club capacities, soundboard specs, and direct talent buyer inboxes across ${city}, ${stateName}.`,
        breadcrumb: [
          { name: "Home", url: "https://www.giglizard.us/" },
          { name: "Venues", url: "https://www.giglizard.us/venues" },
          { name: `${city}, ${stateCode}`, url: `https://www.giglizard.us/venues/${matchedCity.slug}` }
        ]
      };
    }

    // Check if param matches a genre directly (e.g. "rock", "punk", "indie", "metal", "electronic")
    const commonGenres = ["rock", "punk", "indie", "metal", "folk", "electronic", "hip-hop", "blues", "jazz"];
    if (commonGenres.includes(param)) {
      const genre = capitalizeWords(param);
      return {
        isProgrammatic: true,
        type: "genre-only",
        genre,
        canonicalPath: `/venues/${param}`,
        title: `${genre} Music Venues & Clubs Directory | GigLizard`,
        description: `Search verified ${genre.toLowerCase()} music clubs, listening rooms, and live stages across the USA with direct booking emails and sound specs.`,
        heading: `${genre} Music Venues Across the USA`,
        subhead: `Browse live stages catering to ${genre.toLowerCase()} acts across all 48 continental states with free booking contacts.`,
        breadcrumb: [
          { name: "Home", url: "https://www.giglizard.us/" },
          { name: "Venues", url: "https://www.giglizard.us/venues" },
          { name: `${genre} Venues`, url: `https://www.giglizard.us/venues/${param}` }
        ]
      };
    }
  }

  return null;
}
