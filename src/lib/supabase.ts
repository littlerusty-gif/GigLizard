import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AvailableBand, Venue } from "../types";
import { SubscriberMember } from "../utils/analyticsStore";

// Production fallback credentials provided by user
export const FALLBACK_SUPABASE_URL = "https://papzanzgzoghrrgdzvfo.supabase.co";
export const FALLBACK_SUPABASE_ANON_KEY = "sb_publishable_VVfSEHC_sej3qB_Qtxl5yA_fS1ZleG2";

// Configure client from environment variables with hardcoded production fallbacks
const envUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

function normalizeSupabaseUrl(rawUrl: string): string {
  const trimmed = (rawUrl || "").trim();
  if (!trimmed || !trimmed.startsWith("http") || trimmed === "YOUR_SUPABASE_URL") {
    return FALLBACK_SUPABASE_URL;
  }
  try {
    const urlObj = new URL(trimmed);
    return urlObj.origin;
  } catch {
    return trimmed.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
  }
}

const supabaseUrl = normalizeSupabaseUrl(envUrl);

const supabaseAnonKey = envKey && envKey.length > 10 && envKey !== "YOUR_SUPABASE_ANON_KEY"
  ? envKey
  : FALLBACK_SUPABASE_ANON_KEY;

export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl && supabaseAnonKey && typeof supabaseUrl === "string" && supabaseUrl.startsWith("http")
);

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export interface SupabaseProfile {
  id?: string;
  created_at?: string;
  name: string;
  email: string;
  role: "Band" | "Venue" | "Sound Engineer" | string;
  city?: string | null;
  state?: string | null;
  genres?: string | string[] | null;
  genre?: string | null;
  primary_link?: string | null;
  phone?: string | null;
  contact_phone?: string | null;
  bio?: string | null;
  is_verified?: boolean;
  // Compatibility getters/aliases
  contact_email?: string;
  type?: string;
  website?: string | null;
  epk_url?: string | null;
  music_url?: string | null;
  capacity?: number | null;
  address?: string | null;
  has_pa?: boolean | null;
  has_lighting?: boolean | null;
  is_premium?: boolean;
  is_paid?: boolean;
  password?: string;
  plan?: string;
  status?: string;
  experience_level?: string | null;
}

const STORAGE_PROFILES_CACHE = "giglizard_supabase_profiles_cache_v1";

/**
 * Get cached Supabase profiles from localStorage for instant synchronous hydration
 */
export function getCachedProfiles(): SupabaseProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_PROFILES_CACHE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save profiles to local cache
 */
export function setCachedProfiles(profiles: SupabaseProfile[]) {
  try {
    localStorage.setItem(STORAGE_PROFILES_CACHE, JSON.stringify(profiles));
  } catch (err) {
    console.warn("[Supabase] Failed to cache profiles:", err);
  }
}

/**
 * Query all rows from the `profiles` table in Supabase.
 * Falls back to local cached profiles if Supabase is offline or fails.
 */
export async function fetchProfiles(): Promise<SupabaseProfile[]> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[Supabase] Error querying profiles table:", error.message);
      return getCachedProfiles();
    }

    if (data && Array.isArray(data)) {
      const normalized: SupabaseProfile[] = data.map((d: any) => ({
        ...d,
        type: d.role,
        contact_email: d.email,
        website: d.primary_link,
        city: d.state && d.city && !d.city.includes(",") ? `${d.city}, ${d.state}` : (d.city || "Seattle, WA")
      }));
      setCachedProfiles(normalized);
      return normalized;
    }
    return getCachedProfiles();
  } catch (err) {
    console.warn("[Supabase] Failed to fetch profiles:", err);
    return getCachedProfiles();
  }
}

/**
 * Inserts or updates a user/band/venue/engineer record directly into the `profiles` table in Supabase.
 */
export async function insertProfile(profile: Partial<SupabaseProfile>): Promise<SupabaseProfile> {
  const name = (profile.name || "Unnamed").trim();
  const email = (profile.email || profile.contact_email || "").trim().toLowerCase();
  const role = (profile.role || profile.type || "Band").trim();

  // Parse location into city and state
  let city = (profile.city || "").trim();
  let state = (profile.state || "").trim();
  if (city && city.includes(",") && !state) {
    const parts = city.split(",").map(p => p.trim());
    city = parts[0] || city;
    state = parts[1] || "";
  } else if (!state && profile.address) {
    const match = profile.address.match(/,\s*([A-Z]{2})\b/);
    if (match) state = match[1];
  }

  // Format genres as comma-separated string
  let genresStr = "";
  if (typeof profile.genres === "string") {
    genresStr = profile.genres.trim();
  } else if (Array.isArray(profile.genres)) {
    genresStr = (profile.genres as string[]).join(", ");
  } else if ((profile as any).genre) {
    genresStr = String((profile as any).genre).trim();
  }

  // Determine primary link (website, epk, or music url)
  const primaryLink = (
    profile.primary_link ||
    profile.website ||
    (profile as any).epk_url ||
    (profile as any).epkUrl ||
    (profile as any).music_url ||
    (profile as any).musicUrl ||
    ""
  ).trim() || null;

  const phone = (profile.phone || profile.contact_phone || (profile as any).contactPhone || "").trim() || null;
  const bio = (profile.bio || "").trim() || null;

  // The database row matching the Supabase `profiles` table schema
  const dbRow = {
    name,
    email,
    role,
    city: city || "Seattle",
    state: state || "WA",
    genres: genresStr || null,
    primary_link: primaryLink,
    phone,
    bio,
    is_verified: Boolean(profile.is_verified)
  };

  // Immediate optimistic local cache update
  const cached = getCachedProfiles();
  const localRecord: SupabaseProfile = {
    ...dbRow,
    id: profile.id || `prof-${Date.now()}`,
    type: role,
    contact_email: email,
    website: primaryLink,
    created_at: new Date().toISOString()
  };

  const updatedCache = [
    localRecord,
    ...cached.filter(p => (p.email || p.contact_email || "").toLowerCase() !== email.toLowerCase() && p.name.toLowerCase() !== name.toLowerCase())
  ];
  setCachedProfiles(updatedCache);

  // Dispatch events to notify all listening components in real-time
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("giglizard_subscribers_updated"));
    if (role === "Band") {
      window.dispatchEvent(new CustomEvent("giglizard_bands_updated"));
    } else if (role === "Venue") {
      window.dispatchEvent(new CustomEvent("giglizard_venues_updated"));
    }
  }

  // Write record directly to the Supabase `profiles` table
  try {
    const { data, error } = await supabase
      .from("profiles")
      .insert([dbRow])
      .select();

    if (error) {
      console.warn("[Supabase] Insert into profiles warning:", error.message);
      // If error might be due to custom column absence, attempt with core fields
      if (error.message && (error.message.toLowerCase().includes("column") || error.code === "PGRST204")) {
        try {
          const minimalRow = { name, email, role };
          const fallbackRes = await supabase.from("profiles").insert([minimalRow]).select();
          if (fallbackRes.data && fallbackRes.data[0]) {
            const ins = fallbackRes.data[0];
            const merged: SupabaseProfile = { ...localRecord, ...ins };
            return merged;
          }
        } catch (_) {}
      }
    } else if (data && data[0]) {
      const inserted = data[0];
      const merged: SupabaseProfile = {
        ...inserted,
        type: inserted.role,
        contact_email: inserted.email,
        website: inserted.primary_link,
        city: inserted.state && inserted.city && !inserted.city.includes(",") ? `${inserted.city}, ${inserted.state}` : (inserted.city || "Seattle, WA")
      };
      setCachedProfiles([
        merged,
        ...cached.filter(p => (p.email || p.contact_email || "").toLowerCase() !== email.toLowerCase() && p.name.toLowerCase() !== name.toLowerCase())
      ]);
      return merged;
    }
  } catch (err) {
    console.warn("[Supabase] Unexpected error inserting into profiles table:", err);
  }

  return localRecord;
}

/**
 * Convert a Supabase profile row into an AvailableBand entity
 */
export function profileToAvailableBand(p: SupabaseProfile): AvailableBand {
  const genres = p.genres
    ? (Array.isArray(p.genres) ? p.genres : String(p.genres).split(",").map(g => g.trim()).filter(Boolean))
    : ["Alternative Rock"];

  const loc = p.state && p.city && !p.city.includes(",")
    ? `${p.city}, ${p.state}`
    : (p.city || "Seattle, WA");

  return {
    id: p.id || `band-supa-${Date.now()}`,
    name: p.name,
    genres: genres.length > 0 ? genres : ["Alternative Rock"],
    city: loc,
    bio: p.bio || "Live music artist registered on GigLizard.",
    contactEmail: (p.email || p.contact_email || "").trim(),
    contactPhone: p.phone || "Inquire",
    website: p.primary_link || p.website || undefined,
    epkUrl: p.primary_link || undefined,
    musicUrl: p.primary_link || undefined,
    experienceLevel: (p.experience_level as any) || "Local"
  };
}

/**
 * Convert a Supabase profile row into a Venue entity
 */
export function profileToVenue(p: SupabaseProfile): Venue {
  const genres = p.genres
    ? (Array.isArray(p.genres) ? p.genres : String(p.genres).split(",").map(g => g.trim()).filter(Boolean))
    : ["Live Music"];

  const loc = p.state && p.city && !p.city.includes(",")
    ? `${p.city}, ${p.state}`
    : (p.city || "Seattle, WA");

  return {
    id: p.id || `venue-supa-${Date.now()}`,
    name: p.name,
    capacity: Number(p.capacity) || 150,
    address: loc,
    city: loc,
    genres: genres.length > 0 ? genres : ["Live Music"],
    contactEmail: (p.email || p.contact_email || "").trim(),
    contactPhone: p.phone || "Inquire",
    description: p.bio || "A vibrant live performance room ready to play host to high quality events.",
    website: p.primary_link || p.website || "www.inquire-booking.com",
    hasPA: p.has_pa ?? true,
    hasLighting: p.has_lighting ?? true
  };
}

/**
 * Convert a Supabase profile row into a SubscriberMember entity
 */
export function profileToSubscriber(p: SupabaseProfile): SubscriberMember {
  const email = (p.email || p.contact_email || "").trim();
  const isOwner = email.toLowerCase() === "littlerusty@gmail.com";
  const roleType = (
    p.role === "Venue" || p.type === "Venue" ? "Venue" :
    (p.role === "Sound Engineer" || p.type === "Sound Engineer" ? "Sound Engineer" : "Band")
  ) as "Band" | "Venue" | "Sound Engineer";

  const loc = p.state && p.city && !p.city.includes(",")
    ? `${p.city}, ${p.state}`
    : (p.city || "Seattle, WA");

  return {
    id: p.id || `sub-supa-${Date.now()}`,
    name: p.name || "Community Member",
    contactEmail: email,
    type: roleType,
    city: loc,
    isPaid: isOwner,
    plan: isOwner ? "30-Day All-Access Pass ($9.99/mo)" : "Free Community Member",
    signupDate: p.created_at ? p.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
    renewalDate: isOwner ? "Never Expires (Auto-Renews Every 30 Days Forever)" : undefined,
    experienceLevel: (p.experience_level as any) || "Local",
    status: isOwner ? "Active" : "Free Tier",
    notes: isOwner
      ? "Platform Owner & Artist (Dr Hadit) • Auto-Renews Every 30 Days Forever (Never Expires)"
      : (p.bio || undefined)
  };
}

export interface ResolvedAccountInfo {
  name: string;
  role: "Band" | "Venue" | "Sound Engineer";
  city: string;
  bandRecord: any | null;
  profileRecord: any | null;
  email: string;
  isOwner: boolean;
}

/**
 * Resolves current user display name and profile data strictly prioritizing
 * database records (public.bands, then public.profiles) over email prefixes.
 * If official_email === 'littlerusty@gmail.com', name is guaranteed to be 'Dr Hadit'.
 */
export async function resolveAccountFromDatabase(
  userId?: string | null,
  rawEmail?: string | null
): Promise<ResolvedAccountInfo> {
  const cleanEmail = (rawEmail || "").trim().toLowerCase();
  const isOwner = cleanEmail === "littlerusty@gmail.com";

  // 1. Check public.bands table (matching official_email or user_id)
  let bandRecord: any = null;
  if (cleanEmail) {
    try {
      const { data, error } = await supabase
        .from("bands")
        .select("*")
        .eq("official_email", cleanEmail)
        .maybeSingle();
      if (!error && data) bandRecord = data;
    } catch (_) {}
  }
  if (!bandRecord && userId) {
    try {
      const { data, error } = await supabase
        .from("bands")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (!error && data) bandRecord = data;
    } catch (_) {}
  }

  // Automatically link auth.uid() to user_id in public.bands matching email
  if (userId && cleanEmail) {
    if (bandRecord && bandRecord.user_id !== userId) {
      try {
        await supabase
          .from("bands")
          .update({ user_id: userId })
          .eq("official_email", cleanEmail);
        bandRecord.user_id = userId;
      } catch (_) {}
    } else if (!bandRecord) {
      try {
        await supabase
          .from("bands")
          .update({ user_id: userId })
          .eq("official_email", cleanEmail);
      } catch (_) {}
    }
  }

  // 2. Check public.profiles table (matching email or id)
  let profileRecord: any = null;
  if (cleanEmail) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", cleanEmail)
        .maybeSingle();
      if (!error && data) profileRecord = data;
    } catch (_) {}
  }
  if (!profileRecord && userId) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (!error && data) profileRecord = data;
    } catch (_) {}
  }

  // 3. Prioritize Database Name over Email Prefix
  let resolvedName = "";
  if (isOwner) {
    resolvedName = "Dr Hadit";
  } else if (bandRecord?.name && bandRecord.name.trim()) {
    resolvedName = bandRecord.name.trim();
  } else if (profileRecord?.name && profileRecord.name.trim()) {
    resolvedName = profileRecord.name.trim();
  } else if (cleanEmail) {
    resolvedName = cleanEmail.split("@")[0];
  } else {
    resolvedName = "User";
  }

  // Ensure owner account name is always Dr Hadit, never 'littlerusty'
  if (isOwner || cleanEmail === "littlerusty@gmail.com") {
    resolvedName = "Dr Hadit";
  }

  const role: "Band" | "Venue" | "Sound Engineer" = (
    profileRecord?.role === "Venue" || profileRecord?.type === "Venue" ? "Venue" :
    profileRecord?.role === "Sound Engineer" || profileRecord?.type === "Sound Engineer" ? "Sound Engineer" :
    "Band"
  );

  const city = bandRecord?.city_state || (
    profileRecord?.state && profileRecord?.city && !profileRecord.city.includes(",")
      ? `${profileRecord.city}, ${profileRecord.state}`
      : (profileRecord?.city || "Seattle, WA")
  );

  return {
    name: resolvedName,
    role,
    city,
    bandRecord,
    profileRecord,
    email: cleanEmail,
    isOwner
  };
}

/**
 * Explicitly links an authenticated user's auth.uid() to the `user_id` column
 * in public.bands matching their official_email.
 * 
 * Auto-Link on Sign In / Sign Up:
 * - Checks public.bands for a matching official_email.
 * - If found and bands.user_id is null, links their auth user ID to that record:
 *   UPDATE public.bands SET user_id = auth.uid() WHERE official_email = user.email AND user_id IS NULL.
 */
export async function linkAuthUidToBand(userId: string, email: string): Promise<boolean> {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!userId || !cleanEmail) return false;

  try {
    // 1. Check public.bands for a matching official_email
    const { data: existingBands, error: checkErr } = await supabase
      .from("bands")
      .select("id, user_id, official_email")
      .eq("official_email", cleanEmail);

    if (checkErr) {
      console.warn(`[Supabase] Error checking bands for email (${cleanEmail}):`, checkErr.message);
    }

    if (existingBands && existingBands.length > 0) {
      // 2. If found and bands.user_id is null, link their auth user ID to that record:
      // UPDATE public.bands SET user_id = auth.uid() WHERE official_email = user.email AND user_id IS NULL
      const { data: linkedNullRows, error: linkNullErr } = await supabase
        .from("bands")
        .update({ user_id: userId })
        .eq("official_email", cleanEmail)
        .is("user_id", null)
        .select("id, name, user_id");

      if (linkNullErr) {
        console.warn(`[Supabase] Error linking user_id where null for band (${cleanEmail}):`, linkNullErr.message);
      }

      // Also ensure if band has unlinked user_id or requires claiming/updating
      const needsClaim = existingBands.some(b => !b.user_id || b.user_id !== userId);
      if (needsClaim && (!linkedNullRows || linkedNullRows.length === 0)) {
        await supabase
          .from("bands")
          .update({ user_id: userId })
          .eq("official_email", cleanEmail);
      }

      return true;
    }

    return false;
  } catch (err) {
    console.warn(`[Supabase] Exception linking auth.uid to band:`, err);
    return false;
  }
}

/**
 * Saves or updates a band record directly in public.bands table.
 * Strictly maps to columns: (name, city_state, official_email, website, music_url, epk_url, genres, touring_tier, bio, user_id).
 */
export async function saveBandToDatabase(payload: {
  name: string;
  city_state: string;
  official_email: string;
  website?: string | null;
  music_url?: string | null;
  epk_url?: string | null;
  genres: string[];
  touring_tier?: string;
  bio?: string;
  user_id?: string | null;
}): Promise<{ data: any; error: any }> {
  const cleanEmail = payload.official_email.trim().toLowerCase();
  const bandRow: Record<string, any> = {
    name: payload.name.trim(),
    city_state: payload.city_state.trim(),
    official_email: cleanEmail,
    website: payload.website?.trim() || null,
    music_url: payload.music_url?.trim() || null,
    epk_url: payload.epk_url?.trim() || null,
    genres: Array.isArray(payload.genres) ? payload.genres : [payload.genres].filter(Boolean),
    touring_tier: payload.touring_tier || "Local Support (Opening & Regional support)",
    bio: payload.bio?.trim() || ""
  };

  if (payload.user_id) {
    bandRow.user_id = payload.user_id;
  }

  // 1. Attempt update first matching user_id or official_email
  let updateSuccess = false;
  if (payload.user_id) {
    const { data, error } = await supabase
      .from("bands")
      .update(bandRow)
      .or(`user_id.eq.${payload.user_id},official_email.eq.${cleanEmail}`)
      .select();
    if (!error && data && data.length > 0) {
      updateSuccess = true;
      return { data, error: null };
    }
  }

  // Also try update matching official_email directly
  const { data: updateByEmail, error: updateErr } = await supabase
    .from("bands")
    .update(bandRow)
    .eq("official_email", cleanEmail)
    .select();
  if (!updateErr && updateByEmail && updateByEmail.length > 0) {
    updateSuccess = true;
    return { data: updateByEmail, error: null };
  }

  // 2. If no record was updated, upsert by official_email
  if (!updateSuccess) {
    const { data, error } = await supabase
      .from("bands")
      .upsert(bandRow, { onConflict: "official_email" })
      .select();

    if (error) {
      console.warn("[Supabase] Upsert into bands error:", error.message);
      // Fallback if Postgres foreign key on auth.users rejects insert
      if (error.message?.toLowerCase().includes("foreign key") || error.code === "23503") {
        const fallback = await supabase
          .from("bands")
          .upsert({ ...bandRow, user_id: null }, { onConflict: "official_email" })
          .select();
        return fallback;
      }
      return { data: null, error };
    }
    return { data, error: null };
  }

  return { data: [bandRow], error: null };
}

/**
 * Fetches all bands directly from public.bands table.
 * Transforms database rows to AvailableBand domain models.
 */
export async function fetchBandsFromDatabase(): Promise<AvailableBand[]> {
  try {
    const { data, error } = await supabase
      .from("bands")
      .select("*");

    if (error) {
      console.warn("[Supabase] Error querying bands table:", error.message);
      return [];
    }

    if (data && Array.isArray(data)) {
      return data.map((b: any) => ({
        id: b.id || `band-db-${b.name?.toLowerCase().replace(/\s+/g, "-")}`,
        name: b.name || "Live Artist",
        city: b.city_state || "Seattle, WA",
        genres: Array.isArray(b.genres) 
          ? b.genres 
          : (b.genres ? String(b.genres).split(",").map(g => g.trim()).filter(Boolean) : ["Alternative Rock"]),
        bio: b.bio || "Live music artist registered on GigLizard.",
        contactEmail: b.official_email || "",
        website: b.website || undefined,
        experienceLevel: b.touring_tier?.includes("National") 
          ? "National Act" 
          : b.touring_tier?.includes("Regional") 
          ? "Regional Tour" 
          : "Local",
        epkUrl: b.epk_url || undefined,
        musicUrl: b.music_url || undefined
      }));
    }
    return [];
  } catch (err) {
    console.warn("[Supabase] Failed to fetch bands from database:", err);
    return [];
  }
}

/**
 * Tour Record definition for public.tours table
 */
export interface SavedTourRecord {
  id: string;
  user_id?: string | null;
  name: string;
  status: "draft" | "confirmed";
  route_data: {
    origin: string;
    destination: string;
    startDate: string;
    endDate: string;
    currentStep?: number;
    intermediateDestinations?: string[];
    stops: any[];
    totalDistanceMiles: number;
    totalDriveTime: string;
    financials?: {
      totalGas: number;
      totalLodgingCost: number;
      totalExpenses: number;
      confirmedVenuesCount: number;
      confirmedLodgingCount: number;
    };
    bandProfile?: any;
    customNotes?: string;
    createdAtHuman?: string;
  };
  created_at: string;
  updated_at: string;
}

const STORAGE_SAVED_TOURS = "giglizard_saved_tours_cache_v1";
const STORAGE_PENDING_DRAFT = "giglizard_pending_tour_draft";

/**
 * Saves or updates a tour record in public.tours and local cache.
 * Columns: (id, user_id, name, status, route_data, created_at, updated_at).
 */
export async function saveTourToDatabase(payload: {
  id?: string;
  user_id?: string | null;
  name: string;
  status: "draft" | "confirmed";
  route_data: any;
  created_at?: string;
}): Promise<{ data: SavedTourRecord; error: any }> {
  const now = new Date().toISOString();
  const tourId = payload.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `tour-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`);

  const tourRecord: SavedTourRecord = {
    id: tourId,
    user_id: payload.user_id || null,
    name: payload.name.trim() || "Untitled Tour",
    status: payload.status,
    route_data: payload.route_data,
    created_at: payload.created_at || now,
    updated_at: now
  };

  // 1. Always update local storage cache immediately for zero-loss reliability
  try {
    const raw = localStorage.getItem(STORAGE_SAVED_TOURS);
    let list: SavedTourRecord[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];
    const existingIdx = list.findIndex(t => t.id === tourRecord.id);
    if (existingIdx >= 0) {
      list[existingIdx] = tourRecord;
    } else {
      list.unshift(tourRecord);
    }
    localStorage.setItem(STORAGE_SAVED_TOURS, JSON.stringify(list));
    // Clear pending draft key once saved
    localStorage.removeItem(STORAGE_PENDING_DRAFT);
  } catch (err) {
    console.warn("[Tours Cache] Could not persist to localStorage:", err);
  }

  // 2. Attempt upsert into Supabase public.tours table
  try {
    const { data, error } = await supabase
      .from("tours")
      .upsert({
        id: tourRecord.id,
        user_id: tourRecord.user_id,
        name: tourRecord.name,
        status: tourRecord.status,
        route_data: tourRecord.route_data,
        created_at: tourRecord.created_at,
        updated_at: tourRecord.updated_at
      }, { onConflict: "id" })
      .select();

    if (error) {
      console.warn("[Supabase] Notice when saving to public.tours:", error.message);
      // If foreign key constraint failed on user_id, retry with user_id: null
      if (error.code === "23503" || error.message?.toLowerCase().includes("foreign key")) {
        const retryRes = await supabase
          .from("tours")
          .upsert({
            id: tourRecord.id,
            user_id: null,
            name: tourRecord.name,
            status: tourRecord.status,
            route_data: tourRecord.route_data,
            created_at: tourRecord.created_at,
            updated_at: tourRecord.updated_at
          }, { onConflict: "id" })
          .select();
        if (!retryRes.error) {
          return { data: tourRecord, error: null };
        }
      }
      return { data: tourRecord, error };
    }

    return { data: tourRecord, error: null };
  } catch (err: any) {
    console.warn("[Supabase] Exception writing to public.tours:", err);
    return { data: tourRecord, error: err };
  }
}

/**
 * Fetches user's saved tours from public.tours, merging with local cache.
 */
export async function fetchUserTours(userId?: string | null): Promise<SavedTourRecord[]> {
  // Read local cache first for instant synchronous feedback
  let cachedTours: SavedTourRecord[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_SAVED_TOURS);
    if (raw) cachedTours = JSON.parse(raw);
    if (!Array.isArray(cachedTours)) cachedTours = [];
  } catch (_) {}

  try {
    let query = supabase
      .from("tours")
      .select("*")
      .order("updated_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (!error && data && Array.isArray(data)) {
      // Merge remote and local tours, deduplicating by ID
      const remoteIds = new Set(data.map((d: any) => d.id));
      const localOnly = cachedTours.filter(t => !remoteIds.has(t.id));
      const combined = [...data, ...localOnly];
      try {
        localStorage.setItem(STORAGE_SAVED_TOURS, JSON.stringify(combined));
      } catch (_) {}
      return combined;
    }
  } catch (err) {
    console.warn("[Supabase] Could not fetch remote tours, using local cache:", err);
  }

  return cachedTours;
}

/**
 * Deletes a tour from public.tours and local cache.
 */
export async function deleteTourFromDatabase(tourId: string): Promise<boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_SAVED_TOURS);
    if (raw) {
      const list: SavedTourRecord[] = JSON.parse(raw);
      if (Array.isArray(list)) {
        const filtered = list.filter(t => t.id !== tourId);
        localStorage.setItem(STORAGE_SAVED_TOURS, JSON.stringify(filtered));
      }
    }
  } catch (_) {}

  try {
    await supabase.from("tours").delete().eq("id", tourId);
    return true;
  } catch (err) {
    console.warn("[Supabase] Error deleting tour:", err);
    return false;
  }
}

/**
 * Queries venues for a specific city from public.venues in Supabase.
 */
export async function fetchVenuesFromDatabaseForCity(cityName: string): Promise<Venue[]> {
  const cleanCity = cityName.trim();
  if (!cleanCity) return [];

  try {
    const { data, error } = await supabase
      .from("venues")
      .select("*")
      .ilike("city", `%${cleanCity}%`);

    if (!error && data && Array.isArray(data)) {
      return data.map((v: any) => ({
        id: v.id || `venue-db-${v.name?.toLowerCase().replace(/\s+/g, "-")}`,
        name: v.name || "Live Venue",
        city: v.city || cleanCity,
        address: v.address || `${cleanCity}, ${v.state || ""}`.trim(),
        capacity: Number(v.capacity) || 150,
        genres: Array.isArray(v.genres_accepted) 
          ? v.genres_accepted 
          : (v.genres_accepted ? String(v.genres_accepted).split(",").map(g => g.trim()) : ["Live Music"]),
        contactEmail: v.booking_email || v.email || "",
        contactPhone: v.phone || "Inquire",
        website: v.website || undefined,
        hasPA: true,
        hasLighting: true,
        description: v.description || `Live music venue located in ${cleanCity}.`
      }));
    }
  } catch (err) {
    console.warn("[Supabase] Failed to query venues for city:", err);
  }
  return [];
}


