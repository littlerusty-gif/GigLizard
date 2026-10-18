import { AvailableBand } from "../types";

export interface BookingAgencyInfo {
  agencyName: string;
  agentName?: string;
  email: string;
  phone?: string;
  website?: string;
  isOfficialAgency: boolean;
  notes?: string;
}

export interface PopularAgencyPreset {
  name: string;
  agentName?: string;
  email: string;
  phone: string;
  website: string;
  description: string;
}

/**
 * Standard premier booking agencies in the live touring industry
 */
export const POPULAR_BOOKING_AGENCIES: PopularAgencyPreset[] = [
  {
    name: "Intrepid Artists International",
    agentName: "Rick Booth (President / Agent)",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com",
    description: "Premier agency for touring blues, rock, roots, funk, and live club & festival acts worldwide."
  },
  {
    name: "Ground Control Touring",
    agentName: "Agency Booking Desk",
    email: "info@groundcontroltouring.com",
    phone: "(718) 218-8144",
    website: "https://groundcontroltouring.com",
    description: "Boutique agency specializing in independent rock, post-punk, and alternative touring acts."
  },
  {
    name: "High Road Touring",
    agentName: "Agency Talent Department",
    email: "info@highroadtouring.com",
    phone: "(415) 332-9292",
    website: "https://highroadtouring.com",
    description: "Renowned independent agency representing premier Americana, rock, and singer-songwriters."
  },
  {
    name: "Mint Talent Group",
    agentName: "Booking Department",
    email: "info@minttalentgroup.com",
    phone: "(312) 800-8040",
    website: "https://minttalentgroup.com",
    description: "Full-service talent agency representing touring artists across rock, soul, and festival circuits."
  },
  {
    name: "Wasserman Music",
    agentName: "Live Music Agent",
    email: "contact@teamwass.com",
    phone: "(212) 581-0181",
    website: "https://www.teamwass.com/music",
    description: "Global music talent representation agency."
  }
];

/**
 * Known artists on Intrepid Artists International roster
 */
export const INTREPID_ARTISTS_ROSTER: Record<string, Partial<BookingAgencyInfo>> = {
  "albert-castiglia": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "albert castiglia": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "selwyn-birchwood": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "selwyn birchwood": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "gary-hoey": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "gary hoey": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "the-steepwater-band": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "the steepwater band": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "steepwater band": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "davy-knowles": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "davy knowles": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "anthony-gomes": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "anthony gomes": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "toronzo-cannon": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "toronzo cannon": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "carolyn-wonderland": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "carolyn wonderland": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "popa-chubby": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "popa chubby": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "bywater-call": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "bywater call": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "lil-ed-and-the-blues-imperials": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "lil ed": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "ronnie-baker-brooks": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "ronnie baker brooks": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "nick-moss-band": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "nick moss band": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "walter-trout": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "walter trout": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "mike-zito": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "mike zito": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "blood-brothers": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "blood brothers": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "eric-gales": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "eric gales": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "ana-popovic": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "ana popovic": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "tommy-castro": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "tommy castro": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "tommy castro & the painkillers": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "sugaray-rayford": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "sugaray rayford": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "ga-20": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "ga 20": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "vanessa-collier": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  },
  "vanessa collier": {
    agencyName: "Intrepid Artists International",
    agentName: "Rick Booth",
    email: "staff@intrepidartists.com",
    phone: "(704) 358-4501",
    website: "https://intrepidartists.com"
  }
};

/**
 * Known artists on Ground Control Touring roster
 */
export const GROUND_CONTROL_ROSTER: Record<string, Partial<BookingAgencyInfo>> = {
  "built-to-spill": {
    agencyName: "Ground Control Touring",
    agentName: "Eric Dimenstein",
    email: "eric@groundcontroltouring.com",
    phone: "(718) 218-8144",
    website: "https://groundcontroltouring.com"
  },
  "built to spill": {
    agencyName: "Ground Control Touring",
    agentName: "Eric Dimenstein",
    email: "eric@groundcontroltouring.com",
    phone: "(718) 218-8144",
    website: "https://groundcontroltouring.com"
  },
  "mudhoney": {
    agencyName: "Ground Control Touring",
    agentName: "John Bongiorno",
    email: "john@groundcontroltouring.com",
    phone: "(718) 218-8144",
    website: "https://groundcontroltouring.com"
  },
  "mudhoney-legacy": {
    agencyName: "Ground Control Touring",
    agentName: "John Bongiorno",
    email: "john@groundcontroltouring.com",
    phone: "(718) 218-8144",
    website: "https://groundcontroltouring.com"
  },
  "chastity-belt": {
    agencyName: "Ground Control Touring",
    agentName: "Agency Booking Desk",
    email: "info@groundcontroltouring.com",
    phone: "(718) 218-8144",
    website: "https://groundcontroltouring.com"
  },
  "chastity belt": {
    agencyName: "Ground Control Touring",
    agentName: "Agency Booking Desk",
    email: "info@groundcontroltouring.com",
    phone: "(718) 218-8144",
    website: "https://groundcontroltouring.com"
  },
  "chastity-belt-band": {
    agencyName: "Ground Control Touring",
    agentName: "Agency Booking Desk",
    email: "info@groundcontroltouring.com",
    phone: "(718) 218-8144",
    website: "https://groundcontroltouring.com"
  }
};

/**
 * Resolves whether a band is represented by a booking agency (like Intrepid Artists),
 * returning the agency routing details so booking inquiries are properly directed to the agency.
 */
export function resolveBandAgency(band: Partial<AvailableBand>): BookingAgencyInfo | null {
  if (!band) return null;

  // 1. Explicit agency fields on the band record
  if (band.hasBookingAgency || band.bookingAgency || band.bookingAgencyEmail) {
    const rawAgencyName = (band.bookingAgency || "").trim();
    const cleanLower = rawAgencyName.toLowerCase();

    // Check if matched to Intrepid (including spelling variants like 'intreped')
    const isIntrepid = cleanLower.includes("intrepid") || cleanLower.includes("intreped");
    const isGroundControl = cleanLower.includes("ground control");
    const isHighRoad = cleanLower.includes("high road");

    const email = band.bookingAgencyEmail?.trim() || 
      (isIntrepid ? "staff@intrepidartists.com" : isGroundControl ? "info@groundcontroltouring.com" : isHighRoad ? "info@highroadtouring.com" : band.contactEmail || "booking@agency.com");

    const website = band.bookingAgencyWebsite?.trim() ||
      (isIntrepid ? "https://intrepidartists.com" : isGroundControl ? "https://groundcontroltouring.com" : isHighRoad ? "https://highroadtouring.com" : undefined);

    const phone = band.bookingAgencyPhone?.trim() ||
      (isIntrepid ? "(704) 358-4501" : isGroundControl ? "(718) 218-8144" : isHighRoad ? "(415) 332-9292" : undefined);

    const agent = band.bookingAgentName?.trim() ||
      (isIntrepid ? "Rick Booth" : "Booking Agent");

    return {
      agencyName: isIntrepid ? "Intrepid Artists International" : (rawAgencyName || "Booking Agency Representation"),
      agentName: agent,
      email,
      phone,
      website,
      isOfficialAgency: true,
      notes: "Official Talent Agency. All booking inquiries, co-bill requests, and tour date offers must be routed to this booking agency."
    };
  }

  // 2. Check if contactEmail or bio contains agency markers
  const emailLower = (band.contactEmail || "").toLowerCase();
  const bioLower = (band.bio || "").toLowerCase();

  if (emailLower.includes("intrepidartists.com") || bioLower.includes("intrepid artists") || bioLower.includes("intreped artists")) {
    return {
      agencyName: "Intrepid Artists International",
      agentName: "Rick Booth (President / Agent)",
      email: "staff@intrepidartists.com",
      phone: "(704) 358-4501",
      website: "https://intrepidartists.com",
      isOfficialAgency: true,
      notes: "Official Booking Agency: Intrepid Artists International. All show booking inquiries route to the agency representative, not the artist directly."
    };
  }

  if (emailLower.includes("groundcontroltouring.com") || bioLower.includes("ground control touring")) {
    return {
      agencyName: "Ground Control Touring",
      agentName: "Agency Booking Desk",
      email: "info@groundcontroltouring.com",
      phone: "(718) 218-8144",
      website: "https://groundcontroltouring.com",
      isOfficialAgency: true,
      notes: "Official Booking Agency: Ground Control Touring. All live performance inquiries route to agency booking."
    };
  }

  if (emailLower.includes("highroadtouring.com") || bioLower.includes("high road touring")) {
    return {
      agencyName: "High Road Touring",
      agentName: "Agency Talent Department",
      email: "info@highroadtouring.com",
      phone: "(415) 332-9292",
      website: "https://highroadtouring.com",
      isOfficialAgency: true,
      notes: "Official Booking Agency: High Road Touring."
    };
  }

  // 3. Known roster lookups by normalized name / ID
  const normId = (band.id || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const normName = (band.name || "").toLowerCase().trim();

  const intrepidMatch = INTREPID_ARTISTS_ROSTER[normId] || INTREPID_ARTISTS_ROSTER[normName];
  if (intrepidMatch) {
    return {
      agencyName: intrepidMatch.agencyName || "Intrepid Artists International",
      agentName: intrepidMatch.agentName || "Rick Booth",
      email: intrepidMatch.email || "staff@intrepidartists.com",
      phone: intrepidMatch.phone || "(704) 358-4501",
      website: intrepidMatch.website || "https://intrepidartists.com",
      isOfficialAgency: true,
      notes: "Official Booking Agency: Intrepid Artists International. All live performance inquiries, club bookings, and co-bills route directly to Intrepid Artists."
    };
  }

  const groundControlMatch = GROUND_CONTROL_ROSTER[normId] || GROUND_CONTROL_ROSTER[normName];
  if (groundControlMatch) {
    return {
      agencyName: groundControlMatch.agencyName || "Ground Control Touring",
      agentName: groundControlMatch.agentName || "Agency Booking Desk",
      email: groundControlMatch.email || "info@groundcontroltouring.com",
      phone: groundControlMatch.phone || "(718) 218-8144",
      website: groundControlMatch.website || "https://groundcontroltouring.com",
      isOfficialAgency: true,
      notes: "Official Booking Agency: Ground Control Touring."
    };
  }

  return null;
}

export interface EffectiveBandBookingContact {
  isAgencyManaged: boolean;
  agencyInfo: BookingAgencyInfo | null;
  agencyName: string | null;
  agentName: string | null;
  contactEmail: string;
  contactPhone: string | null;
  website: string | null;
  bookingInquirySubject: string;
  inquiryInstructions: string;
}

/**
 * Returns the effective booking contact for any band.
 * If the band is managed by a booking agency (like Intrepid Artists),
 * all contact details point directly to the agency, never exposing or using a direct band email.
 */
export function getEffectiveBandBookingContact(band: Partial<AvailableBand>): EffectiveBandBookingContact {
  const agency = resolveBandAgency(band);

  if (agency) {
    return {
      isAgencyManaged: true,
      agencyInfo: agency,
      agencyName: agency.agencyName,
      agentName: agency.agentName || null,
      contactEmail: agency.email,
      contactPhone: agency.phone || null,
      website: agency.website || null,
      bookingInquirySubject: `[GigLizard Booking Inquiry] - ${band.name || "Artist"}`,
      inquiryInstructions: `All live performance dates, co-bills, festival bookings, and contract inquiries are managed exclusively through ${agency.agencyName}. Direct show offers to ${agency.agentName || agency.agencyName} at ${agency.email}.`
    };
  }

  return {
    isAgencyManaged: false,
    agencyInfo: null,
    agencyName: null,
    agentName: null,
    contactEmail: band.contactEmail || "",
    contactPhone: band.contactPhone || null,
    website: band.website || null,
    bookingInquirySubject: `[GigLizard Booking Inquiry] - ${band.name || "Artist"}`,
    inquiryInstructions: "Direct artist/band booking inbox."
  };
}

