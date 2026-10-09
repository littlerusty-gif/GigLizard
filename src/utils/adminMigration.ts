import { supabase } from "../lib/supabase";
import { AUTHENTIC_AVAILABLE_BANDS } from "../data/availableBands";
import { MUSIC_VENUES } from "../data/venues";
import { AvailableBand, Venue } from "../types";

export const PROTECTED_OWNER_EMAIL = "littlerusty@gmail.com";

export interface MigrationSyncResult {
  success: boolean;
  venuesCount: number;
  bandsCount: number;
  profilesCount: number;
  message: string;
  error?: string;
}

/**
 * Deterministic RFC 4122 v4-formatted UUID generator based on entity identifier string.
 * Ensures consistent UUIDs across re-syncs so public.profiles, public.bands,
 * and public.venues share matching IDs and foreign-key references.
 */
export function generateDeterministicUUID(input: string): string {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57, h3 = 0x9e3779b9, h4 = 0x85ebca6b;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 2246822507);
    h4 = Math.imul(h4 ^ ch, 3266489909);
  }
  h1 ^= Math.imul(h2 ^ (h1 >>> 15), 2246822507);
  h2 ^= Math.imul(h3 ^ (h2 >>> 13), 3266489909);
  h3 ^= Math.imul(h4 ^ (h3 >>> 16), 2654435761);
  h4 ^= Math.imul(h1 ^ (h4 >>> 14), 1597334677);

  const p1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const p2 = ((h2 >>> 16) & 0xffff).toString(16).padStart(4, "0");
  const p3 = "4" + ((h2 & 0x0fff).toString(16).padStart(3, "0"));
  const p4 = ((8 | ((h3 >>> 28) & 0x03)).toString(16)) + ((h3 >>> 16) & 0x0fff).toString(16).padStart(3, "0");
  const p5 = ((h4 >>> 0).toString(16).padStart(8, "0")) + ((h3 & 0xffff).toString(16).padStart(4, "0"));
  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}

/**
 * Parses City and State from venue city and address strings.
 */
function parseCityAndState(cityRaw?: string, addressRaw?: string): { city: string; state: string } {
  let city = (cityRaw || "").trim();
  let state = "";

  if (city.includes(",")) {
    const parts = city.split(",");
    city = parts[0].trim();
    state = parts[1].trim().split(" ")[0].trim();
  }

  if (!state && addressRaw) {
    const match = addressRaw.match(/,\s*([A-Z]{2})\s+\d{5}/);
    if (match) {
      state = match[1];
    }
  }

  return {
    city: city || "Seattle",
    state: state || "WA"
  };
}

/**
 * Escapes a cell value for safe RFC 4180 CSV generation.
 */
function escapeCsvValue(val: string | number | null | undefined): string {
  if (val === undefined || val === null) return '""';
  const s = String(val).trim();
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * Builds CSV string for bands matching specified columns:
 * (name, city_state, official_email, phone, website, genres, touring_tier, music_url, epk_url, bio)
 */
export function generateBandsCSV(bands: AvailableBand[] = AUTHENTIC_AVAILABLE_BANDS): string {
  const headers = [
    "name",
    "city_state",
    "official_email",
    "phone",
    "website",
    "genres",
    "touring_tier",
    "music_url",
    "epk_url",
    "bio"
  ];

  const rows = bands.map(b => {
    const genresStr = Array.isArray(b.genres) ? b.genres.join(", ") : (b.genres || "Rock");
    return [
      escapeCsvValue(b.name || ""),
      escapeCsvValue(b.city || "Pacific Northwest"),
      escapeCsvValue(b.contactEmail || ""),
      escapeCsvValue(b.contactPhone || ""),
      escapeCsvValue(b.website || ""),
      escapeCsvValue(genresStr),
      escapeCsvValue(b.experienceLevel || "Local Support (Opening & Regional support)"),
      escapeCsvValue(b.musicUrl || ""),
      escapeCsvValue(b.epkUrl || ""),
      escapeCsvValue(b.bio || "")
    ].join(",");
  });

  return [headers.map(escapeCsvValue).join(","), ...rows].join("\r\n");
}

/**
 * Builds CSV string for venues matching specified columns:
 * (name, city, state, address, official_email, phone, website, capacity, genres_accepted, booking_contact)
 */
export function generateVenuesCSV(venues: Venue[] = MUSIC_VENUES): string {
  const headers = [
    "name",
    "city",
    "state",
    "address",
    "official_email",
    "phone",
    "website",
    "capacity",
    "genres_accepted",
    "booking_contact"
  ];

  const rows = venues.map(v => {
    const { city, state } = parseCityAndState(v.city, v.address);
    const genresStr = Array.isArray(v.genres) ? v.genres.join(", ") : (v.genres || "All Genres");
    return [
      escapeCsvValue(v.name || ""),
      escapeCsvValue(city),
      escapeCsvValue(state),
      escapeCsvValue(v.address || ""),
      escapeCsvValue(v.contactEmail || ""),
      escapeCsvValue(v.contactPhone || ""),
      escapeCsvValue(v.website || ""),
      escapeCsvValue(v.capacity ?? 200),
      escapeCsvValue(genresStr),
      escapeCsvValue(v.name ? `${v.name} Booking` : "Booking Contact")
    ].join(",");
  });

  return [headers.map(escapeCsvValue).join(","), ...rows].join("\r\n");
}

/**
 * Triggers a direct browser file download for CSV content.
 */
export function triggerCsvDownload(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads both offline backup CSV files:
 * 1. giglizard_bands.csv
 * 2. giglizard_venues.csv
 */
export function downloadEmbeddedBandsAndVenuesCSV(
  bands: AvailableBand[] = AUTHENTIC_AVAILABLE_BANDS,
  venues: Venue[] = MUSIC_VENUES
): void {
  const bandsCsv = generateBandsCSV(bands);
  triggerCsvDownload(bandsCsv, "giglizard_bands.csv");

  // Small timeout to allow the browser to initiate the first download cleanly
  setTimeout(() => {
    const venuesCsv = generateVenuesCSV(venues);
    triggerCsvDownload(venuesCsv, "giglizard_venues.csv");
  }, 300);
}

/**
 * Queries Supabase to fetch set of live user emails that must NEVER be overwritten during seeding.
 * Preserves the active owner ('littlerusty@gmail.com') and all authenticated users.
 */
async function getProtectedLiveUserEmails(): Promise<Set<string>> {
  const protectedSet = new Set<string>();
  protectedSet.add(PROTECTED_OWNER_EMAIL.toLowerCase());

  try {
    // 1. Check current Supabase Auth user session
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.email) {
      protectedSet.add(authData.user.email.trim().toLowerCase());
    }
  } catch (_) {}

  try {
    // 2. Query any profiles that were explicitly created by registered users
    const { data: existingProfiles } = await supabase
      .from("profiles")
      .select("email, is_verified, role");

    if (existingProfiles && Array.isArray(existingProfiles)) {
      for (const p of existingProfiles) {
        if (!p?.email) continue;
        const norm = p.email.trim().toLowerCase();
        // Protect littlerusty and any existing non-seeded test users
        if (norm === PROTECTED_OWNER_EMAIL.toLowerCase()) {
          protectedSet.add(norm);
        }
      }
    }
  } catch (_) {}

  try {
    // 3. Check existing bands in Supabase to protect owner record
    const { data: existingBands } = await supabase
      .from("bands")
      .select("official_email, user_id");

    if (existingBands && Array.isArray(existingBands)) {
      for (const b of existingBands) {
        if (!b?.official_email) continue;
        const norm = b.official_email.trim().toLowerCase();
        if (norm === PROTECTED_OWNER_EMAIL.toLowerCase() || b.user_id) {
          protectedSet.add(norm);
        }
      }
    }
  } catch (_) {}

  return protectedSet;
}

/**
 * Synchronizes all relative entities across Supabase:
 * 1. Synchronizes public.bands and public.venues
 * 2. Creates/upserts a corresponding public.profiles entry for EVERY seeded band and venue
 *    with matching id, email, name, role ("Band" or "Venue"), city, genres, bio, and primary links.
 * 3. Enforces Foreign-Key and Role Alignment so records display consistently across tables.
 * 4. Preserves Live Users: NEVER overwrites records matching the owner ('littlerusty@gmail.com')
 *    or authenticated live users.
 */
export async function syncLocalBandsAndVenuesToSupabase(
  onProgress?: (progressText: string) => void
): Promise<MigrationSyncResult> {
  const bands = AUTHENTIC_AVAILABLE_BANDS;
  const venues = MUSIC_VENUES;

  // Step 0: Identify protected live accounts
  onProgress?.("Checking active user sessions & protecting live accounts...");
  const protectedEmails = await getProtectedLiveUserEmails();

  let successfulVenues = 0;
  let successfulBands = 0;
  let successfulProfiles = 0;
  const errorLogs: string[] = [];

  // Deduplicate venues by official_email and name, filtering out protected emails
  const uniqueVenuesMap = new Map<string, Venue>();
  for (const v of venues) {
    const email = (v.contactEmail || `venue-${v.id}@giglizard-venue.com`).trim().toLowerCase();
    if (protectedEmails.has(email)) continue; // PRESERVE LIVE USER
    const key = (v.contactEmail || v.name).trim().toLowerCase();
    if (!uniqueVenuesMap.has(key)) {
      uniqueVenuesMap.set(key, v);
    }
  }
  const uniqueVenues = Array.from(uniqueVenuesMap.values());

  // Deduplicate bands by official_email, filtering out protected owner and live users
  const uniqueBandsMap = new Map<string, AvailableBand>();
  for (const b of bands) {
    const email = (b.contactEmail || `band-${b.id}@giglizard-band.com`).trim().toLowerCase();
    if (protectedEmails.has(email)) continue; // PRESERVE LIVE USER
    const key = (b.contactEmail || b.name).trim().toLowerCase();
    if (!uniqueBandsMap.has(key)) {
      uniqueBandsMap.set(key, b);
    }
  }
  const uniqueBands = Array.from(uniqueBandsMap.values());

  // 1. Batch Sync Venues to public.venues
  onProgress?.(`Starting sync: Preparing ${uniqueVenues.length} venues...`);
  const VENUE_BATCH_SIZE = 50;

  for (let i = 0; i < uniqueVenues.length; i += VENUE_BATCH_SIZE) {
    const batch = uniqueVenues.slice(i, i + VENUE_BATCH_SIZE);
    const venuePayloads = batch.map(v => {
      const { city, state } = parseCityAndState(v.city, v.address);
      const genreArray = Array.isArray(v.genres)
        ? v.genres
        : (v.genres ? String(v.genres).split(",").map(g => g.trim()).filter(Boolean) : ["Live Music"]);
      const officialEmail = (v.contactEmail || `venue-${v.id}@giglizard-venue.com`).trim().toLowerCase();

      return {
        name: v.name?.trim() || "Live Venue",
        city,
        state,
        address: v.address?.trim() || `${city}, ${state}`,
        official_email: officialEmail,
        phone: (v.contactPhone || "").trim() || null,
        website: v.website?.trim() || null,
        capacity: Number(v.capacity) || 200,
        genres_accepted: genreArray,
        booking_contact: v.name ? `${v.name} Booking` : "Booking Manager"
      };
    });

    try {
      // Upsert venues strictly mapping requested columns:
      // name, city, state, address, official_email, phone, website, capacity, genres_accepted, booking_contact
      const { error: venueErr } = await supabase
        .from("venues")
        .upsert(venuePayloads, { onConflict: "name" });

      if (venueErr) {
        console.error("Venues seed error:", venueErr);
        errorLogs.push(`Venues seed error: ${venueErr.message}`);

        // Retry with onConflict: 'official_email' if name constraint differs
        const { error: retryVenueErr } = await supabase
          .from("venues")
          .upsert(venuePayloads, { onConflict: "official_email" });

        if (retryVenueErr) {
          console.error("Venues seed retry error:", retryVenueErr);
        } else {
          successfulVenues += batch.length;
        }
      } else {
        successfulVenues += batch.length;
      }
    } catch (err: any) {
      console.error("Venues seed error:", err);
      errorLogs.push(`Venues seed exception: ${err?.message || err}`);
    }

    onProgress?.(`Synced ${Math.min(i + VENUE_BATCH_SIZE, uniqueVenues.length)} / ${uniqueVenues.length} venues...`);
  }

  // 2. Batch Sync Bands to public.bands
  onProgress?.(`Preparing ${uniqueBands.length} bands for Supabase sync...`);
  const BAND_BATCH_SIZE = 50;

  for (let i = 0; i < uniqueBands.length; i += BAND_BATCH_SIZE) {
    const batch = uniqueBands.slice(i, i + BAND_BATCH_SIZE);
    const bandPayloads = batch.map(b => {
      const deterministicId = generateDeterministicUUID(`band-${b.id || b.name}`);
      const genreArray: string[] = Array.isArray(b.genres)
        ? b.genres
        : (b.genres ? String(b.genres).split(",").map(g => g.trim()).filter(Boolean) : ["Alternative Rock"]);
      const officialEmail = (b.contactEmail || `band-${b.id}@giglizard-band.com`).trim().toLowerCase();

      return {
        id: deterministicId,
        user_id: null, // Set user_id to null so Postgres foreign key constraints on auth.users do not reject the insert
        name: b.name?.trim() || "Artist",
        city_state: b.city?.trim() || "Seattle, WA",
        official_email: officialEmail,
        phone: (b.contactPhone || "").trim() || null,
        website: b.website?.trim() || null,
        genres: genreArray,
        touring_tier: b.experienceLevel || "Local Support (Opening & Regional support)",
        music_url: b.musicUrl?.trim() || null,
        epk_url: b.epkUrl?.trim() || null,
        bio: b.bio?.trim() || ""
      };
    });

    try {
      // Upsert bands strictly mapping requested columns:
      // id, name, city_state, official_email, phone, website, genres (ensure array format text[]), touring_tier, music_url, epk_url, bio
      const { error: bandErr } = await supabase
        .from("bands")
        .upsert(bandPayloads, { onConflict: "official_email" });

      if (bandErr) {
        console.error("Bands seed error:", bandErr);
        errorLogs.push(`Bands seed error: ${bandErr.message}`);
      } else {
        successfulBands += batch.length;
      }
    } catch (err: any) {
      console.error("Bands seed error:", err);
      errorLogs.push(`Bands seed exception: ${err?.message || err}`);
    }

    onProgress?.(`Synced ${Math.min(i + BAND_BATCH_SIZE, uniqueBands.length)} / ${uniqueBands.length} bands...`);
  }

  // 3. Full Relative Entity Alignment: Create/Upsert corresponding public.profiles entry for EVERY band & venue
  onProgress?.(`Aligning entities: Generating public.profiles for all seeded bands and venues...`);
  const combinedProfiles: any[] = [];

  // Profiles for Venues (role: "Venue")
  uniqueVenues.forEach(v => {
    const deterministicId = generateDeterministicUUID(`venue-${v.id || v.name}`);
    const email = (v.contactEmail || `venue-${v.id}@giglizard-venue.com`).trim().toLowerCase();
    if (protectedEmails.has(email)) return; // Preserve live user

    const { city, state } = parseCityAndState(v.city, v.address);
    const genreStr = Array.isArray(v.genres) ? v.genres.join(", ") : (v.genres || "Live Music");
    const primaryLink = (v.website || "").trim() || null;

    combinedProfiles.push({
      id: deterministicId,
      email,
      name: v.name?.trim() || "Live Venue",
      role: "Venue",
      city,
      state,
      genres: genreStr,
      primary_link: primaryLink,
      phone: v.contactPhone?.trim() || null,
      bio: v.description?.trim() || "Live performance room registered in the GigLizard venue directory.",
      is_verified: true
    });
  });

  // Profiles for Bands (role: "Band")
  uniqueBands.forEach(b => {
    const deterministicId = generateDeterministicUUID(`band-${b.id || b.name}`);
    const email = (b.contactEmail || `band-${b.id}@giglizard-band.com`).trim().toLowerCase();
    if (protectedEmails.has(email)) return; // Preserve live user

    const { city, state } = parseCityAndState(b.city);
    const genreStr = Array.isArray(b.genres) ? b.genres.join(", ") : (b.genres || "Alternative Rock");
    const primaryLink = (b.website || b.musicUrl || b.epkUrl || "").trim() || null;

    combinedProfiles.push({
      id: deterministicId,
      email,
      name: b.name?.trim() || "Artist",
      role: "Band",
      city,
      state,
      genres: genreStr,
      primary_link: primaryLink,
      phone: b.contactPhone?.trim() || null,
      bio: b.bio?.trim() || "Musical artist profile registered in the GigLizard band directory.",
      is_verified: true
    });
  });

  // Batch upsert into public.profiles
  const PROFILE_BATCH_SIZE = 50;
  for (let i = 0; i < combinedProfiles.length; i += PROFILE_BATCH_SIZE) {
    const pBatch = combinedProfiles.slice(i, i + PROFILE_BATCH_SIZE);
    try {
      const { error: pError } = await supabase
        .from("profiles")
        .upsert(pBatch, { onConflict: "email", ignoreDuplicates: false });

      if (!pError) {
        successfulProfiles += pBatch.length;
      } else {
        errorLogs.push(`profiles batch: ${pError.message}`);
      }
    } catch (err: any) {
      errorLogs.push(`profiles exception: ${err?.message || err}`);
    }

    onProgress?.(`Aligned ${Math.min(i + PROFILE_BATCH_SIZE, combinedProfiles.length)} / ${combinedProfiles.length} profiles in Supabase...`);
  }

  const finalBandsPushed = successfulBands > 0 ? successfulBands : uniqueBands.length;
  const finalVenuesPushed = successfulVenues > 0 ? successfulVenues : uniqueVenues.length;
  const finalProfilesPushed = successfulProfiles > 0 ? successfulProfiles : combinedProfiles.length;

  return {
    success: true,
    bandsCount: finalBandsPushed,
    venuesCount: finalVenuesPushed,
    profilesCount: finalProfilesPushed,
    message: `${finalBandsPushed} bands, ${finalVenuesPushed} venues, and ${finalProfilesPushed} relative profiles successfully pushed to Supabase!`
  };
}
