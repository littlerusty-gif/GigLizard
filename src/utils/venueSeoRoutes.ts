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
  type: "city-state" | "genre-city" | "genre-only" | "city-only" | "venue-profile" | "standard";
  city?: string;
  stateCode?: string;
  stateName?: string;
  genre?: string;
  venueSlug?: string;
  venueName?: string;
  venueId?: string;
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
  // West Coast & Pacific Northwest
  { city: "Austin", state: "TX", slug: "austin-tx", corridor: "Texas Triangle (San Antonio · Houston · Dallas)", tagline: "Live Music Capital of the World" },
  { city: "Seattle", state: "WA", slug: "seattle-wa", corridor: "I-5 Pacific Northwest (Portland · Tacoma · Vancouver)", tagline: "Grunge, Indie & Underground Stages" },
  { city: "Portland", state: "OR", slug: "portland-or", corridor: "Cascadia Corridor (Seattle · Eugene · Bend)", tagline: "DIY Independent Music Mecca" },
  { city: "Spokane", state: "WA", slug: "spokane-wa", corridor: "Inland Northwest (Missoula · Boise · Seattle)", tagline: "Inland Northwest Tour Stop" },
  { city: "Tacoma", state: "WA", slug: "tacoma-wa", corridor: "Puget Sound South (Seattle · Olympia)", tagline: "South Sound Live Stages" },
  { city: "Eugene", state: "OR", slug: "eugene-or", corridor: "Willamette Valley (Portland · Ashland)", tagline: "College Town Tour Stop" },
  { city: "Bend", state: "OR", slug: "bend-or", corridor: "Central Oregon (Portland · Boise)", tagline: "High Desert Music Venues" },
  { city: "Los Angeles", state: "CA", slug: "los-angeles-ca", corridor: "Southern California (San Diego · Santa Ana)", tagline: "Sunset Strip & West Coast Venues" },
  { city: "San Diego", state: "CA", slug: "san-diego-ca", corridor: "SoCal Coastal Run (LA · Orange County)", tagline: "Coastal Clubs & Open-Air Amphitheaters" },
  { city: "San Francisco", state: "CA", slug: "san-francisco-ca", corridor: "Bay Area Corridor (Oakland · San Jose)", tagline: "Historic Bay Area Music Halls" },

  // Midwest & Rocky Mountains
  { city: "Chicago", state: "IL", slug: "chicago-il", corridor: "Midwest Loop (Milwaukee · Indianapolis · Detroit)", tagline: "Legendary Blues, Rock & Indie Rooms" },
  { city: "Minneapolis", state: "MN", slug: "minneapolis-mn", corridor: "Upper Midwest (Madison · Chicago · Duluth)", tagline: "Twin Cities Indie & Post-Rock Scene" },
  { city: "Denver", state: "CO", slug: "denver-co", corridor: "Rocky Mountain Hub (Boulder · Fort Collins · Salt Lake)", tagline: "Mile High Rock & Electronic Halls" },
  { city: "Detroit", state: "MI", slug: "detroit-mi", corridor: "Rust Belt Circuit (Cleveland · Columbus · Chicago)", tagline: "Motor City Garage Rock & Techno" },
  { city: "Cleveland", state: "OH", slug: "cleveland-oh", corridor: "Lake Erie Tour Run (Pittsburgh · Detroit · Buffalo)", tagline: "Rock & Roll Hall of Fame City Stages" },
  { city: "Columbus", state: "OH", slug: "columbus-oh", corridor: "Ohio Valley Corridor (Cincinnati · Cleveland)", tagline: "High-Energy College Rock Circuit" },
  { city: "Indianapolis", state: "IN", slug: "indianapolis-in", corridor: "Crossroads Corridor (Chicago · Louisville)", tagline: "Fountain Square Indie Hub" },

  // South & Tennessee Valley
  { city: "Nashville", state: "TN", slug: "nashville-tn", corridor: "Southeast Circuit (Atlanta · Louisville · Memphis)", tagline: "Music City Listening Rooms & Clubs" },
  { city: "Memphis", state: "TN", slug: "memphis-tn", corridor: "Mississippi Delta Run (Nashville · New Orleans)", tagline: "Beale Street & Stax Soul Heritage" },
  { city: "Atlanta", state: "GA", slug: "atlanta-ga", corridor: "Southeast Corridor (Athens · Charlotte · Nashville)", tagline: "Hip-Hop, Indie Rock & Punk Bastion" },
  { city: "New Orleans", state: "LA", slug: "new-orleans-la", corridor: "Gulf Coast Run (Houston · Mobile · Pensacola)", tagline: "Frenchmen Street Jazz, Funk & Brass" },

  // East Coast & Mid-Atlantic
  { city: "New York", state: "NY", slug: "new-york-ny", corridor: "I-95 Northeast Megalopolis (Philly · Boston)", tagline: "Manhattan & Bowery Historic Stages" },
  { city: "Brooklyn", state: "NY", slug: "brooklyn-ny", corridor: "NYC Metro Hub (Bushwick · Williamsburg · Greenpoint)", tagline: "Indie Rock, DIY Warehouses & Lo-Fi" },
  { city: "Philadelphia", state: "PA", slug: "philadelphia-pa", corridor: "Mid-Atlantic Corridor (NYC · Baltimore · DC)", tagline: "Fishtown, South Street & Indie Dives" },
  { city: "Boston", state: "MA", slug: "boston-ma", corridor: "Northeast Corridor (Providence · NYC · New Haven)", tagline: "College Rock & Hardcore Dives" },
  { city: "Washington", state: "DC", slug: "washington-dc", corridor: "Capital Corridor (Baltimore · Richmond · Philly)", tagline: "Dischord Punk Roots & 9:30 Club Legacy" },
  { city: "Baltimore", state: "MD", slug: "baltimore-md", corridor: "Chesapeake Circuit (DC · Philadelphia)", tagline: "DIY Art-Pop & Underground Dives" },
  { city: "Pittsburgh", state: "PA", slug: "pittsburgh-pa", corridor: "Allegheny Hub (Cleveland · Columbus · Philly)", tagline: "Steel City Underground & Rust Belt Rock" },
  { city: "Richmond", state: "VA", slug: "richmond-va", corridor: "Virginia Feeder (DC · Raleigh · Norfolk)", tagline: "DIY Metal, Punk & Indie Community" },
  { city: "Asbury Park", state: "NJ", slug: "asbury-park-nj", corridor: "Jersey Shore Circuit (NYC · Philly)", tagline: "Stone Pony & Boardwalk Rock Heritage" }
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
  { genre: "Blues", genreSlug: "blues", city: "Chicago", state: "IL", slug: "blues/chicago", metaSummary: "historic Chicago blues basements, soul clubs, and intimate stages" },
  { genre: "Rock", genreSlug: "rock", city: "New York", state: "NY", slug: "rock/new-york", metaSummary: "historic East Village, Bowery, and Lower East Side live rock venues" },
  { genre: "Indie", genreSlug: "indie", city: "Brooklyn", state: "NY", slug: "indie/brooklyn", metaSummary: "Williamsburg, Bushwick, and Greenpoint indie rooms, lofts, and warehouses" },
  { genre: "Punk", genreSlug: "punk", city: "Philadelphia", state: "PA", slug: "punk/philadelphia", metaSummary: "Fishtown basements, underground punk clubs, and DIY dive stages" },
  { genre: "Hip-Hop", genreSlug: "hip-hop", city: "Atlanta", state: "GA", slug: "hip-hop/atlanta", metaSummary: "East Atlanta Village, Little Five Points, and Midtown performance venues" },
  { genre: "Jazz", genreSlug: "jazz", city: "New Orleans", state: "LA", slug: "jazz/new-orleans", metaSummary: "Frenchmen Street jazz clubs, preservation halls, and brass venues" },
  { genre: "Rock", genreSlug: "rock", city: "Los Angeles", state: "CA", slug: "rock/los-angeles", metaSummary: "Sunset Strip clubs, Silver Lake stages, and Hollywood live music rooms" }
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

  // Format 1: /venues/:cityState/:venueSlug OR /venues/venue/:venueId OR /venues/:genre/:city
  if (parts.length === 3) {
    // Sub-format 1A: /venues/venue/:venueId
    if (parts[1] === "venue") {
      const venueId = parts[2];
      return {
        isProgrammatic: true,
        type: "venue-profile",
        venueId,
        canonicalPath: `/venues/venue/${venueId}`,
        title: "Live Music Venue & Production Specs | GigLizard",
        description: "View verified booking contact email, stage specs, capacity, and production guidelines for touring acts on GigLizard.",
        heading: "Live Music Venue & Production Specs",
        subhead: "Comprehensive stage dimensions, soundboard specs, PA system, and talent buyer inboxes for independent touring bands.",
        breadcrumb: [
          { name: "Home", url: "https://www.giglizard.us/" },
          { name: "Venues", url: "https://www.giglizard.us/venues" },
          { name: "Venue Profile", url: `https://www.giglizard.us/venues/venue/${venueId}` }
        ]
      };
    }

    // Sub-format 1B: /venues/:city-state/:venueSlug (e.g. /venues/portland-or/doug-fir-lounge)
    const cityStateMatch = parts[1].match(/^(.+)-([a-z]{2})$/i);
    if (cityStateMatch) {
      const citySlug = cityStateMatch[1];
      const stateSlug = cityStateMatch[2].toUpperCase();
      const city = capitalizeWords(citySlug);
      const stateCode = stateSlug;
      const stateName = STATE_MAP[stateCode] || stateCode;
      const venueSlug = parts[2];
      const venueName = capitalizeWords(venueSlug);

      return {
        isProgrammatic: true,
        type: "venue-profile",
        city,
        stateCode,
        stateName,
        venueSlug,
        venueName,
        canonicalPath: `/venues/${parts[1]}/${venueSlug}`,
        title: `${venueName} | Live Music Stage & Specs in ${city}, ${stateCode} - GigLizard`,
        description: `View verified booking contact email, stage specs, capacity, and production guidelines for ${venueName} in ${city}, ${stateCode}.`,
        heading: `${venueName} - Live Music Venue & Booking Specs in ${city}, ${stateCode}`,
        subhead: `Direct talent buyer inboxes, soundboard channels, PA rig, and stage layout at ${venueName} in ${city}, ${stateName}.`,
        breadcrumb: [
          { name: "Home", url: "https://www.giglizard.us/" },
          { name: "Venues", url: "https://www.giglizard.us/venues" },
          { name: `${city}, ${stateCode}`, url: `https://www.giglizard.us/venues/${parts[1]}` },
          { name: venueName, url: `https://www.giglizard.us/venues/${parts[1]}/${venueSlug}` }
        ]
      };
    }

    // Sub-format 1C: /venues/:genre/:city (e.g. /venues/rock/chicago)
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

      const title = `Music Venues in ${city}, ${stateCode} | Booking & Production Specs - GigLizard`;
      const description = `Find and contact verified music venues in ${city}, ${stateCode}. View stage specs, capacities, and DIY booking guidelines for touring bands.`;
      const heading = `Live Music Venues & Booking Specs in ${city}, ${stateCode}`;
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
        title: `Music Venues in ${city}, ${stateCode} | Booking & Production Specs - GigLizard`,
        description: `Find and contact verified music venues in ${city}, ${stateCode}. View stage specs, capacities, and DIY booking guidelines for touring bands.`,
        heading: `Live Music Venues & Booking Specs in ${city}, ${stateCode}`,
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
