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
