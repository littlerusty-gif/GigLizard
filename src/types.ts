export interface Venue {
  id: string;
  name: string;
  capacity: number;
  address: string;
  city: string;
  genres: string[];
  contactEmail: string;
  contactPhone: string;
  hasPA: boolean;
  hasLighting: boolean;
  description: string;
  website: string;
  password?: string;
}

export type EquipmentType = 
  | "drum_kit"
  | "guitar_amp"
  | "bass_amp"
  | "keyboard_rig"
  | "vocal_mic"
  | "instrument_mic"
  | "monitor_wedge"
  | "di_box"
  | "dj_turntables";

export interface StageElement {
  id: string;
  type: EquipmentType;
  label: string;
  x: number; // percentage width on canvas (0 to 100)
  y: number; // percentage height on canvas (0 to 100)
  rotation: number; // degrees: 0, 90, 180, 270
}

export interface InputChannel {
  channel: number;
  instrument: string;
  micOrDi: string;
  stand: "None" | "Short Boom" | "Tall Boom" | "Straight";
  phantomPower: boolean;
  notes: string;
}

export interface TechRider {
  bandName: string;
  genre: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  inputs: InputChannel[];
  hospitalityNotes: string;
  audioNotes: string;
  bandState?: string;
  governingState?: string;
}

export interface PosterConfig {
  bandName: string;
  secondaryText: string; // e.g. "ON TOUR NOW" or "PLUS SPECIAL GUESTS"
  venueName: string;
  venueAddress: string;
  dateStr: string; // e.g. "Friday, Oct 24th"
  timeStr: string; // e.g. "Doors at 8 PM, Music at 9 PM"
  priceStr: string; // e.g. "$12 Adv / $15 Door"
  allAges: string; // "All Ages" | "18+ w/ ID" | "21+ w/ ID"
  amenities: {
    servesFood: boolean;
    servesAlcohol: boolean;
    merchArea: boolean;
  };
  extraDetails: string; // e.g. "Limited tickets at the door. No dynamic parking."
  themeId: string; // "heavy-grunge" | "retro-neon" | "indie-minimal" | "folk-acoustic"
  colorId?: string; // custom color swatch override e.g. "default", "red", "blue", "green", "purple", "amber", "pink", "black"
}

export interface SloganProposal {
  slogan: string;
  context: string;
}

export interface AvailableBand {
  id: string;
  name: string;
  genres: string[];
  city: string;
  bio: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string | null;
  experienceLevel: "Local" | "Regional Tour" | "National Act";
  password?: string;
  epkUrl?: string | null;
  musicUrl?: string | null;
}

export interface BandProfile {
  name?: string;
  genre?: string;
  city?: string;
  bio?: string;
  epkUrl?: string | null;
  musicUrl?: string | null;
}

export type AccountType = "Band" | "Venue";

export interface TourVenueStop {
  id?: string;
  name: string;
  city: string;
  address?: string;
  capacity?: number;
  genres?: string[];
  contactEmail?: string;
  contactPhone?: string;
  hasPA?: boolean;
  hasLighting?: boolean;
  description?: string;
  website?: string;
}

export interface TourLodgingOption {
  id?: string;
  name: string;
  type: "Band-Friendly Hotel" | "Budget Motel / Inn" | "Van / RV Secure Parking" | "Musician Crash Pad / Hostel" | "Airbnb / Group Suite";
  city: string;
  estPricePerNight?: string;
  distanceToVenues?: string;
  amenities?: string[];
  gearSecurityNote?: string;
  bookingSearchUrl?: string;
  address?: string;
}

export interface TourSelectedVenue {
  id?: string;
  name: string;
  address?: string;
  city?: string;
  contactEmail?: string;
  contactPhone?: string;
  capacity?: number;
  loadInTime?: string;
  soundcheckTime?: string;
  doorsTime?: string;
  setTime?: string;
  ticketPrice?: string;
  notes?: string;
  website?: string;
}

export interface TourSelectedLodging {
  id?: string;
  name: string;
  type?: string;
  address?: string;
  cost?: number | string; // e.g. 95 or "$95/night"
  confirmationNumber?: string;
  checkInTime?: string;
  checkOutTime?: string;
  gearSecurityNote?: string;
  bookingUrl?: string;
  notes?: string;
}

export interface TourStop {
  id: string;
  stopName: string;
  city: string;
  state: string;
  driveTimeFromPrev: string;
  distanceMilesFromPrev: number;
  routeHighlight: string;
  suggestedVenues: TourVenueStop[];
  localSceneNotes: string;
  dayNumber: number;
  date?: string; // e.g. "2026-09-12"
  estimatedGasCost?: number;
  lodgingOptions?: TourLodgingOption[];
  lodgingNotes?: string;
  // Personalized user selections
  selectedVenue?: TourSelectedVenue;
  selectedLodging?: TourSelectedLodging;
  customNotes?: string;
}

export interface TourPlan {
  tourTitle?: string;
  bandName?: string;
  startingCity: string;
  destinationCity: string;
  intermediateDestinations?: string[];
  totalDistanceMiles: number;
  totalDriveTime: string;
  routeDescription: string;
  stops: TourStop[];
  tourTips: string[];
  googleMapsDirectionsUrl: string;
}

export interface UserAccount {
  type: AccountType;
  name: string;
  city: string;
  isPremium: boolean;
  hasPaidAccess?: boolean;
  lastPaymentDate?: string;
  accessExpiresAt?: string;
  autoRenew?: boolean;
  paypalOrderId?: string;
  paypalSubscriptionId?: string;
  genre?: string; // used for Comma separated values or primary style
  bio?: string;
  capacity?: number;
  address?: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string | null;
  experienceLevel?: "Local" | "Regional Tour" | "National Act";
  hasPA?: boolean;
  hasLighting?: boolean;
  password?: string;
  epkUrl?: string | null;
  musicUrl?: string | null;
}

export type ReviewAuthorRole = 
  | "Touring Musician" 
  | "Local Artist" 
  | "Venue Owner / Bookkeeper" 
  | "Sound Engineer" 
  | "Concertgoer / Fan" 
  | "Tour Manager";

export interface Review {
  id: string;
  targetId: string; // ID or normalized name of the band/venue
  targetType: "band" | "venue";
  targetName: string;
  rating: number; // 1 to 5
  authorName: string;
  authorRole: ReviewAuthorRole;
  comment: string;
  createdAt: string; // ISO date string e.g. "2026-08-20T14:30:00.000Z"
  tags?: string[];
  recommended?: boolean;
}

export interface RatingStats {
  average: number;
  count: number;
  distribution: { [stars: number]: number }; // 1: count, 2: count, etc.
}



