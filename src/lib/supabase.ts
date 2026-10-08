import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AvailableBand, Venue, UserAccount } from "../types";
import { SubscriberMember } from "../utils/analyticsStore";

// Retrieve Supabase credentials from Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Check if valid credentials have been configured
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  typeof supabaseUrl === "string" &&
  supabaseUrl.startsWith("http") &&
  supabaseUrl !== "YOUR_SUPABASE_URL" &&
  supabaseAnonKey !== "YOUR_SUPABASE_ANON_KEY"
);

// Initialize client if configured, otherwise null
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface SupabaseProfile {
  id?: string;
  name: string;
  email?: string;
  contact_email?: string;
  type: "Band" | "Venue" | "Sound Engineer" | string;
  role?: string;
  city: string;
  genre?: string | null;
  genres?: string[] | null;
  bio?: string | null;
  capacity?: number | null;
  address?: string | null;
  contact_phone?: string | null;
  phone?: string | null;
  website?: string | null;
  epk_url?: string | null;
  music_url?: string | null;
  experience_level?: string | null;
  has_pa?: boolean | null;
  has_lighting?: boolean | null;
  is_premium?: boolean;
  is_paid?: boolean;
  plan?: string;
  status?: string;
  created_at?: string;
  password?: string;
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
 * Query all records from the `profiles` table in Supabase.
 * Falls back to local cached profiles if Supabase is offline or not configured.
 */
export async function fetchProfiles(): Promise<SupabaseProfile[]> {
  if (!supabase) {
    return getCachedProfiles();
  }

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
      setCachedProfiles(data);
      return data;
    }
    return getCachedProfiles();
  } catch (err) {
    console.warn("[Supabase] Failed to fetch profiles:", err);
    return getCachedProfiles();
  }
}

/**
 * Inserts or updates a user/band/venue/engineer record into the `profiles` table in Supabase.
 */
export async function insertProfile(profile: Partial<SupabaseProfile>): Promise<SupabaseProfile> {
  const email = (profile.contact_email || profile.email || "").trim();
  const name = (profile.name || "Unnamed").trim();
  const id = profile.id || `prof-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const roleType = profile.type || profile.role || "Band";
  const now = new Date().toISOString();

  const record: SupabaseProfile = {
    id,
    name,
    email,
    contact_email: email,
    type: roleType,
    role: roleType,
    city: (profile.city || "Seattle, WA").trim(),
    genre: profile.genre || (roleType === "Band" ? "Alternative Rock" : (roleType === "Venue" ? "Live Music" : "Live Sound / Audio")),
    bio: profile.bio || "Live music member registered on GigLizard.",
    capacity: profile.capacity !== undefined ? Number(profile.capacity) : null,
    address: profile.address || null,
    contact_phone: profile.contact_phone || profile.phone || null,
    phone: profile.contact_phone || profile.phone || null,
    website: profile.website || null,
    epk_url: profile.epk_url || null,
    music_url: profile.music_url || null,
    experience_level: profile.experience_level || "Local",
    has_pa: profile.has_pa ?? (roleType === "Venue" ? true : null),
    has_lighting: profile.has_lighting ?? (roleType === "Venue" ? true : null),
    is_premium: Boolean(profile.is_premium),
    is_paid: Boolean(profile.is_paid || profile.is_premium),
    plan: profile.plan || (profile.is_premium ? "30-Day All-Access Pass ($9.99/mo)" : "Free Community Member"),
    status: profile.status || (profile.is_premium ? "Active" : "Free Tier"),
    created_at: profile.created_at || now,
    password: profile.password || undefined
  };

  // Always update local cache first for instant UI response
  const existing = getCachedProfiles();
  const updatedCache = [
    record,
    ...existing.filter(p => {
      const pEmail = (p.contact_email || p.email || "").toLowerCase();
      const rEmail = email.toLowerCase();
      return pEmail !== rEmail && p.name.toLowerCase() !== name.toLowerCase();
    })
  ];
  setCachedProfiles(updatedCache);

  // Dispatch events to notify listeners across the app
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("giglizard_subscribers_updated"));
    if (roleType === "Band") {
      window.dispatchEvent(new CustomEvent("giglizard_bands_updated"));
    } else if (roleType === "Venue") {
      window.dispatchEvent(new CustomEvent("giglizard_venues_updated"));
    }
  }

  // Write into Supabase `profiles` table if configured
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .upsert([record], { onConflict: "id" })
        .select();

      if (error) {
        console.warn("[Supabase] Upsert error on profiles:", error.message);
        // Try simple insert if upsert with conflict key fails
        try {
          await supabase.from("profiles").insert([record]);
        } catch (_) {}
      } else if (data && data[0]) {
        return data[0];
      }
    } catch (err) {
      console.warn("[Supabase] Unexpected error inserting into profiles table:", err);
    }
  }

  return record;
}

/**
 * Convert a Supabase profile row into an AvailableBand entity
 */
export function profileToAvailableBand(p: SupabaseProfile): AvailableBand {
  const genres = p.genres && Array.isArray(p.genres)
    ? p.genres
    : (p.genre ? p.genre.split(",").map(g => g.trim()).filter(Boolean) : ["Alternative Rock"]);

  return {
    id: p.id || `band-supa-${Date.now()}`,
    name: p.name,
    genres: genres.length > 0 ? genres : ["Rock"],
    city: p.city || "Seattle, WA",
    bio: p.bio || "Live music artist registered on GigLizard.",
    contactEmail: (p.contact_email || p.email || "").trim(),
    contactPhone: p.contact_phone || p.phone || "Inquire",
    website: p.website || undefined,
    epkUrl: p.epk_url || undefined,
    musicUrl: p.music_url || undefined,
    experienceLevel: (p.experience_level as "Local" | "Regional Tour" | "National Act") || "Local"
  };
}

/**
 * Convert a Supabase profile row into a Venue entity
 */
export function profileToVenue(p: SupabaseProfile): Venue {
  const genres = p.genres && Array.isArray(p.genres)
    ? p.genres
    : (p.genre ? p.genre.split(",").map(g => g.trim()).filter(Boolean) : ["Live Music"]);

  return {
    id: p.id || `venue-supa-${Date.now()}`,
    name: p.name,
    capacity: Number(p.capacity) || 150,
    address: p.address || "123 Music Ave",
    city: p.city || "Seattle, WA",
    genres: genres.length > 0 ? genres : ["Live Music"],
    contactEmail: (p.contact_email || p.email || "").trim(),
    contactPhone: p.contact_phone || p.phone || "Inquire",
    description: p.bio || `[Capacity: ${p.capacity || 150} guests] Live music room.`,
    website: p.website || "www.inquire-booking.com",
    hasPA: p.has_pa ?? true,
    hasLighting: p.has_lighting ?? true
  };
}

/**
 * Convert a Supabase profile row into a SubscriberMember entity
 */
export function profileToSubscriber(p: SupabaseProfile): SubscriberMember {
  const email = (p.contact_email || p.email || "").trim();
  const isOwner = email.toLowerCase() === "littlerusty@gmail.com";
  const isPaid = isOwner || Boolean(p.is_paid || p.is_premium);
  const roleType = (
    p.type === "Venue" ? "Venue" : (p.type === "Sound Engineer" ? "Sound Engineer" : "Band")
  ) as "Band" | "Venue" | "Sound Engineer";

  return {
    id: p.id || `sub-supa-${Date.now()}`,
    name: p.name || "Community Member",
    contactEmail: email,
    type: roleType,
    city: p.city || "Seattle, WA",
    isPaid,
    plan: (p.plan as any) || (isPaid ? "30-Day All-Access Pass ($9.99/mo)" : "Free Community Member"),
    signupDate: p.created_at ? p.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
    renewalDate: isOwner ? "Never Expires (Auto-Renews Every 30 Days Forever)" : (isPaid ? "Active 30-Day Pass" : undefined),
    experienceLevel: p.experience_level || undefined,
    status: isPaid ? "Active" : "Free Tier",
    notes: isOwner
      ? "Platform Owner & Artist (Dr Hadit) • Auto-Renews Every 30 Days Forever (Never Expires)"
      : (p.bio || undefined)
  };
}
