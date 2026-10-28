import { Venue } from "../types";
import { WASHINGTON_VENUES } from "./waVenues";
import { OREGON_VENUES } from "./orVenues";
import { BC_VENUES } from "./bcVenues";
import { NATIONAL_SUPABASE_VENUES } from "./nationalVenues";

const NATIONAL_BASE_VENUES: Venue[] = [
  {
    id: "showbox-seattle",
    name: "The Showbox",
    capacity: 1150,
    address: "1426 1st Ave, Seattle, WA 98101",
    city: "Seattle",
    state: "WA",
    country: "US",
    genres: ["Alternative Rock", "Indie Rock", "Punk", "Hip Hop", "Electronic"],
    contactEmail: "info@showboxpresents.com",
    contactPhone: "(206) 628-3151",
    hasPA: true,
    hasLighting: true,
    description: "[Capacity: 1150 guests] Historic 1939 ballroom directly across from Pike Place Market. Concert-grade line array, full green rooms, and legendary Pacific Northwest acoustics.",
    website: "https://www.showboxpresents.com"
  },
  {
    id: "antones-austin",
    name: "Antone's Nightclub",
    capacity: 450,
    address: "305 E 5th St, Austin, TX 78701",
    city: "Austin",
    state: "TX",
    country: "US",
    genres: ["Blues", "Rock", "Soul", "Americana", "Funk"],
    contactEmail: "booking@antonesnightclub.com",
    contactPhone: "(512) 814-0361",
    hasPA: true,
    hasLighting: true,
    description: "[Capacity: 450 guests] Austin's Home of the Blues since 1975 in Downtown Austin. Impeccable house audio, backline provided upon advance request, and pro stage lighting.",
    website: "https://antonesnightclub.com"
  },
  {
    id: "mohawk-austin",
    name: "Mohawk Austin",
    capacity: 900,
    address: "912 Red River St, Austin, TX 78701",
    city: "Austin",
    state: "TX",
    country: "US",
    genres: ["Rock", "Indie Rock", "Punk", "Metal", "Alternative Rock"],
    contactEmail: "booking@mohawk-austin.com",
    contactPhone: "(512) 646-1328",
    hasPA: true,
    hasLighting: true,
    description: "[Capacity: 900 guests (Outdoor/Indoor)] Dual-stage live music venue in Austin's Red River Cultural District. Multi-level amphitheater with pro concert audio, full stage lighting, and green rooms for touring rock bands.",
    website: "https://www.mohawkaustin.com"
  },
  {
    id: "hotel-vegas-austin",
    name: "Hotel Vegas",
    capacity: 350,
    address: "1502 E 6th St, Austin, TX 78702",
    city: "Austin",
    state: "TX",
    country: "US",
    genres: ["Rock", "Garage Rock", "Psych Rock", "Punk", "Indie Rock"],
    contactEmail: "booking@hotelvegasaustin.com",
    contactPhone: "(512) 524-1584",
    hasPA: true,
    hasLighting: true,
    description: "[Capacity: 350 guests] Iconic East Austin rock club and patio stage. Center of Austin's garage, psych, and punk circuits with tight drum risers and high-energy crowds.",
    website: "https://www.hotelvegasaustin.com"
  },
  {
    id: "exit-in-nashville",
    name: "Exit/In",
    capacity: 500,
    address: "2208 Elliston Pl, Nashville, TN 37203",
    city: "Nashville",
    state: "TN",
    country: "US",
    genres: ["Rock", "Punk", "Indie Rock", "Alternative Rock", "Metal"],
    contactEmail: "booking@exitin.com",
    contactPhone: "(615) 321-3340",
    hasPA: true,
    hasLighting: true,
    description: "[Capacity: 500 guests] Legendary Rock Block music venue operating since 1971. High-power concert sound, dedicated artist dressing rooms, and historic touring pedigree.",
    website: "https://exitin.com"
  },
  {
    id: "cervantes-denver",
    name: "Cervantes' Masterpiece Ballroom",
    capacity: 1000,
    address: "2637 Welton St, Denver, CO 80205",
    city: "Denver",
    state: "CO",
    country: "US",
    genres: ["Electronic", "Funk", "Jam Band", "Hip Hop", "Rock"],
    contactEmail: "booking@cervantesmasterpiece.com",
    contactPhone: "(303) 297-1772",
    hasPA: true,
    hasLighting: true,
    description: "[Capacity: 1000 guests] Dual-room live music complex in Denver's historic Five Points neighborhood. Outfitted with high-fidelity sound, moving lights, and easy gear loading.",
    website: "https://cervantesmasterpiece.com"
  },
  {
    id: "the-sinclair-boston",
    name: "The Sinclair",
    capacity: 525,
    address: "52 Church St, Cambridge, MA 02138",
    city: "Boston",
    state: "MA",
    country: "US",
    genres: ["Indie Rock", "Punk", "Alternative Rock", "Electronic", "Folk"],
    contactEmail: "info@sinclaircambridge.com",
    contactPhone: "(617) 547-5200",
    hasPA: true,
    hasLighting: true,
    description: "[Capacity: 525 guests] Premier Harvard Square live music venue with custom acoustic treatment, state-of-the-art d&b audiotechnik PA, and wrap-around balcony.",
    website: "https://www.sinclaircambridge.com"
  },
  {
    id: "troubadour-la",
    name: "Troubadour",
    capacity: 500,
    address: "9081 Santa Monica Blvd, West Hollywood, CA 90069",
    city: "Los Angeles",
    state: "CA",
    country: "US",
    genres: ["Rock", "Indie Rock", "Folk", "Alternative Rock", "Pop"],
    contactEmail: "booking@troubadour.com",
    contactPhone: "(310) 276-1158",
    hasPA: true,
    hasLighting: true,
    description: "[Capacity: 500 guests] Legendary live music venue on Santa Monica Blvd since 1957. Renowned acoustics, intimate sightlines, wooden balcony, and professional production crew.",
    website: "https://troubadour.com"
  },
  {
    id: "empty-bottle-chicago",
    name: "The Empty Bottle",
    capacity: 300,
    address: "1035 N Western Ave, Chicago, IL 60622",
    city: "Chicago",
    state: "IL",
    country: "US",
    genres: ["Rock", "Indie Rock", "Punk", "Garage Rock", "Experimental"],
    contactEmail: "booking@emptybottle.com",
    contactPhone: "(773) 276-3600",
    hasPA: true,
    hasLighting: true,
    description: "[Capacity: 300 guests] Legendary Ukrainian Village indie rock and punk institution. Pristine monitor mixes, low stage ceiling, and deeply loyal local crowds for touring independent rock bands.",
    website: "https://www.emptybottle.com"
  },
  {
    id: "subterranean-chicago",
    name: "Subterranean",
    capacity: 400,
    address: "2011 W North Ave, Chicago, IL 60647",
    city: "Chicago",
    state: "IL",
    country: "US",
    genres: ["Rock", "Punk", "Alternative Rock", "Indie Rock", "Hip Hop"],
    contactEmail: "talent@subt.net",
    contactPhone: "(773) 278-6600",
    hasPA: true,
    hasLighting: true,
    description: "[Capacity: 400 guests] Iconic multi-floor Wicker Park music hall with wraparound balcony, punchy stage sound, and heavy touring calendar for alternative and rock bands.",
    website: "https://www.subt.net"
  },
  {
    id: "thalia-hall-chicago",
    name: "Thalia Hall",
    capacity: 800,
    address: "1807 S Allport St, Chicago, IL 60608",
    city: "Chicago",
    state: "IL",
    country: "US",
    genres: ["Indie Rock", "Folk", "Alternative Rock", "Rock", "Soul"],
    contactEmail: "booking@thaliahallchicago.com",
    contactPhone: "(312) 526-3100",
    hasPA: true,
    hasLighting: true,
    description: "[Capacity: 800 guests] Historic 1892 opera house modeled after Prague's Estates Theatre in Pilsen. Features pro concert sound, balcony seating, and proscenium stage.",
    website: "https://www.thaliahallchicago.com"
  },
  {
    id: "doubledown-lasvegas",
    name: "Double Down Saloon",
    capacity: 150,
    address: "4640 Paradise Rd, Las Vegas, NV 89169",
    city: "Las Vegas",
    state: "NV",
    country: "US",
    genres: ["Punk", "Garage Rock", "Hardcore", "Surf Rock", "Rock"],
    contactEmail: "doubledownsaloon@aol.com",
    contactPhone: "(702) 791-5775",
    hasPA: true,
    hasLighting: true,
    description: "[Capacity: 150 guests] The legendary Clubhouse of the Damned. World-famous punk rock dive bar near the Vegas Strip featuring loud touring punk and garage rock acts 7 nights a week.",
    website: "https://doubledownsaloon.com"
  },
  {
    id: "first-avenue-minneapolis",
    name: "First Avenue & 7th St Entry",
    capacity: 1550,
    address: "701 N 1st Ave, Minneapolis, MN 55403",
    city: "Minneapolis",
    state: "MN",
    country: "US",
    genres: ["Rock", "Indie Rock", "Punk", "Alternative Rock", "Hip Hop"],
    contactEmail: "info@first-avenue.com",
    contactPhone: "(612) 332-1775",
    hasPA: true,
    hasLighting: true,
    description: "[Capacity: 1550 Mainroom / 250 Entry] Landmark downtown Minneapolis music venue with unmatched live music pedigree, festival-grade audio systems, and multi-level viewing.",
    website: "https://first-avenue.com"
  },
  {
    id: "casbah-sandiego",
    name: "The Casbah",
    capacity: 285,
    address: "2501 Kettner Blvd, San Diego, CA 92101",
    city: "San Diego",
    state: "CA",
    country: "US",
    genres: ["Rock", "Punk", "Indie Rock", "Garage Rock", "Alternative Rock"],
    contactEmail: "casbahbooking@gmail.com",
    contactPhone: "(619) 232-4355",
    hasPA: true,
    hasLighting: true,
    description: "[Capacity: 285 guests] Legendary San Diego independent music club operating since 1989 near Little Italy. Essential touring stop with impeccable stage sound and loyal crowds.",
    website: "https://www.casbahmusic.com"
  }
];

const ALL_RAW_VENUES: Venue[] = [
  ...WASHINGTON_VENUES.map(v => ({ ...v, state: v.state || "WA", country: v.country || "US" })),
  ...OREGON_VENUES.map(v => ({ ...v, state: v.state || "OR", country: v.country || "US" })),
  ...BC_VENUES.map(v => ({ ...v, state: v.state || "BC", country: v.country || "CA" })),
  ...NATIONAL_BASE_VENUES,
  ...NATIONAL_SUPABASE_VENUES
];

const seenVenueKeys = new Set<string>();
export const MUSIC_VENUES: Venue[] = [];

for (const venue of ALL_RAW_VENUES) {
  const normName = (venue.name || "").trim().toLowerCase().replace(/\s+/g, " ");
  const normCity = (venue.city || "").trim().toLowerCase();
  const normState = (venue.state || "").trim().toUpperCase();
  const key = `${normName}__${normCity}__${normState}`;

  if (!seenVenueKeys.has(key)) {
    seenVenueKeys.add(key);
    MUSIC_VENUES.push(venue);
  }
}

