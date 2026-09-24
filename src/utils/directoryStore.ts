import { AvailableBand, Venue } from "../types";
import { INITIAL_AVAILABLE_BANDS } from "../data/availableBands";
import { MUSIC_VENUES } from "../data/venues";
import { isBandBanned } from "./accessControl";
import { isValidWebUrl } from "./musicLinks";

export const AUTHORIZED_OWNER_EMAIL = "littlerusty@gmail.com";

/**
 * Normalizes an email address by trimming whitespace and converting to lowercase.
 */
export function normalizeEmail(email?: string): string {
  if (!email) return "";
  return email.trim().toLowerCase();
}

export function isOwnerAuthorized(email?: string): boolean {
  if (!email) return false;
  return normalizeEmail(email) === normalizeEmail(AUTHORIZED_OWNER_EMAIL);
}

const STORAGE_KEY_BAND_EDITS = "giglizard_owner_band_edits_v1";
const STORAGE_KEY_VENUE_EDITS = "giglizard_owner_venue_edits_v1";
const STORAGE_KEY_DELETED_BANDS = "giglizard_owner_deleted_bands_v1";
const STORAGE_KEY_DELETED_VENUES = "giglizard_owner_deleted_venues_v1";
const STORAGE_KEY_CUSTOM_BANDS = "custom_available_bands_v1";
const STORAGE_KEY_CUSTOM_VENUES = "custom_venues_v1";

/**
 * Get all owner overrides for bands (map of ID or normalized name -> AvailableBand)
 */
export function getOwnerBandEdits(): Record<string, AvailableBand> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BAND_EDITS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Get all owner overrides for venues (map of ID or normalized name -> Venue)
 */
export function getOwnerVenueEdits(): Record<string, Venue> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VENUE_EDITS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Get list of deleted band IDs/names
 */
export function getOwnerDeletedBandIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_BANDS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Get list of deleted venue IDs/names
 */
export function getOwnerDeletedVenueIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_VENUES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Get all custom/user registered bands
 */
export function getCustomBands(): AvailableBand[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_BANDS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Get all custom/user registered venues
 */
export function getCustomVenues(): Venue[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_VENUES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Combines all available bands (initial + custom), applies owner overrides, and excludes deleted entries.
 */
export function getMergedBandsList(additionalBands?: AvailableBand[]): AvailableBand[] {
  const custom = getCustomBands();
  const overrides = getOwnerBandEdits();
  const deleted = new Set(getOwnerDeletedBandIds().map(id => id.toLowerCase()));

  const allRaw = [...(additionalBands || []), ...custom, ...INITIAL_AVAILABLE_BANDS];
  const seen = new Set<string>();
  const result: AvailableBand[] = [];

  for (const b of allRaw) {
    if (!b || !b.name) continue;
    if (isBandBanned(b.contactEmail, b.name)) continue;

    const idKey = b.id?.toLowerCase();
    const nameKey = b.name.trim().toLowerCase();

    if (deleted.has(idKey) || deleted.has(nameKey)) {
      continue;
    }

    if (seen.has(nameKey)) continue;
    seen.add(nameKey);

    // Apply owner override if one exists for this ID or Name
    const override = overrides[b.id] || overrides[nameKey];
    if (override) {
      const sanitizedOverride = { ...override };
      if (sanitizedOverride.epkUrl && !isValidWebUrl(sanitizedOverride.epkUrl)) {
        sanitizedOverride.epkUrl = undefined;
      }
      if (sanitizedOverride.musicUrl && !isValidWebUrl(sanitizedOverride.musicUrl)) {
        sanitizedOverride.musicUrl = undefined;
      }
      result.push({
        ...b,
        ...sanitizedOverride,
        genres: Array.isArray(sanitizedOverride.genres) ? sanitizedOverride.genres : b.genres
      });
    } else {
      result.push(b);
    }
  }

  return result;
}

/**
 * Combines all music venues (initial + custom), applies owner overrides, and excludes deleted entries.
 */
export function getMergedVenuesList(additionalVenues?: Venue[]): Venue[] {
  const custom = getCustomVenues();
  const overrides = getOwnerVenueEdits();
  const deleted = new Set(getOwnerDeletedVenueIds().map(id => id.toLowerCase()));

  const allRaw = [...(additionalVenues || []), ...custom, ...MUSIC_VENUES];
  const seen = new Set<string>();
  const result: Venue[] = [];

  for (const v of allRaw) {
    if (!v || !v.name) continue;

    const idKey = v.id?.toLowerCase();
    const nameKey = v.name.trim().toLowerCase();

    if (deleted.has(idKey) || deleted.has(nameKey)) {
      continue;
    }

    if (seen.has(nameKey)) continue;
    seen.add(nameKey);

    // Apply owner override if one exists for this ID or Name
    const override = overrides[v.id] || overrides[nameKey];
    if (override) {
      result.push({
        ...v,
        ...override,
        genres: Array.isArray(override.genres) ? override.genres : v.genres
      });
    } else {
      result.push(v);
    }
  }

  return result;
}

/**
 * Checks whether a given email is already registered in the system:
 * - Master/owner accounts
 * - Currently logged in account in localStorage
 * - Registered passwords map in user_custom_passwords_v1
 * - Custom registered bands in custom_available_bands_v1
 * - Custom registered venues in custom_venues_v1
 * - Initial & merged band directory entries
 * - Initial & merged venue directory entries
 *
 * Normalizes email (lowercase and trim) before checking.
 */
export function isEmailAlreadyRegistered(rawEmail?: string): boolean {
  const normalized = normalizeEmail(rawEmail);
  if (!normalized) return false;

  // 1. Check master platform owner email
  if (normalized === normalizeEmail(AUTHORIZED_OWNER_EMAIL)) {
    return true;
  }

  // 2. Check current logged-in account in localStorage
  try {
    const rawAccount = localStorage.getItem("current_user_account_v1");
    if (rawAccount) {
      const acc = JSON.parse(rawAccount);
      if (normalizeEmail(acc?.contactEmail) === normalized) {
        return true;
      }
    }
  } catch (e) {
    console.error("Error checking current_user_account_v1:", e);
  }

  // 3. Check custom registered user passwords registry (keys are registered emails)
  try {
    const rawPasswords = localStorage.getItem("user_custom_passwords_v1");
    if (rawPasswords) {
      const passwordsMap = JSON.parse(rawPasswords);
      if (typeof passwordsMap === "object" && passwordsMap !== null) {
        for (const key of Object.keys(passwordsMap)) {
          if (normalizeEmail(key) === normalized) {
            return true;
          }
        }
      }
    }
  } catch (e) {
    console.error("Error checking user_custom_passwords_v1:", e);
  }

  // 4. Check custom registered bands in localStorage
  const customBands = getCustomBands();
  if (customBands.some(b => normalizeEmail(b.contactEmail) === normalized)) {
    return true;
  }

  // 5. Check custom registered venues in localStorage
  const customVenues = getCustomVenues();
  if (customVenues.some(v => normalizeEmail(v.contactEmail) === normalized)) {
    return true;
  }

  // 6. Check merged bands (includes initial bands, custom bands, and owner edits)
  const allBands = getMergedBandsList();
  if (allBands.some(b => normalizeEmail(b.contactEmail) === normalized)) {
    return true;
  }

  // 7. Check merged venues (includes initial venues, custom venues, and owner edits)
  const allVenues = getMergedVenuesList();
  if (allVenues.some(v => normalizeEmail(v.contactEmail) === normalized)) {
    return true;
  }

  return false;
}

/**
 * Save an edited band or add a new band as owner.
 * Strictly restricted to littlerusty@gmail.com.
 */
export function saveOwnerBandEdit(
  band: AvailableBand, 
  userEmail?: string
): { success: boolean; error?: string } {
  if (!isOwnerAuthorized(userEmail)) {
    return { 
      success: false, 
      error: `Access Denied: Only the platform owner (${AUTHORIZED_OWNER_EMAIL}) has authorization to edit bands in the directory.` 
    };
  }

  if (!band || !band.name?.trim()) {
    return { success: false, error: "Band name is required." };
  }

  try {
    const edits = getOwnerBandEdits();
    const bandId = band.id || `band-${Date.now()}`;
    const cleanBand: AvailableBand = {
      ...band,
      id: bandId,
      name: band.name.trim(),
      city: band.city?.trim() || "Seattle, WA",
      bio: band.bio?.trim() || "Live touring act.",
      contactEmail: band.contactEmail?.trim() || "",
      contactPhone: band.contactPhone?.trim() || "(206) 555-0199",
      website: band.website?.trim() || undefined,
      epkUrl: band.epkUrl?.trim() && isValidWebUrl(band.epkUrl.trim()) ? band.epkUrl.trim() : undefined,
      musicUrl: band.musicUrl?.trim() && isValidWebUrl(band.musicUrl.trim()) ? band.musicUrl.trim() : undefined,
      genres: Array.isArray(band.genres) && band.genres.length > 0 ? band.genres : ["Alternative Rock"],
      experienceLevel: band.experienceLevel || "Local"
    };

    // Save override keyed by ID and Name
    edits[cleanBand.id] = cleanBand;
    edits[cleanBand.name.toLowerCase()] = cleanBand;
    localStorage.setItem(STORAGE_KEY_BAND_EDITS, JSON.stringify(edits));

    // Also update custom bands list if it was a custom band
    const custom = getCustomBands();
    const updatedCustom = [cleanBand, ...custom.filter(b => b.id !== cleanBand.id && b.name.toLowerCase() !== cleanBand.name.toLowerCase())];
    localStorage.setItem(STORAGE_KEY_CUSTOM_BANDS, JSON.stringify(updatedCustom));

    // If it was previously marked deleted, un-delete
    const deleted = getOwnerDeletedBandIds().filter(id => id !== cleanBand.id && id !== cleanBand.name.toLowerCase());
    localStorage.setItem(STORAGE_KEY_DELETED_BANDS, JSON.stringify(deleted));

    // Broadcast update event
    window.dispatchEvent(new CustomEvent("giglizard_bands_updated", { detail: { band: cleanBand } }));

    // Sync with backend API
    try {
      fetch("/api/owner/bands/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerEmail: userEmail, band: cleanBand })
      }).catch(err => console.warn("Backend band sync notice:", err));
    } catch (_) {}

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to persist band changes." };
  }
}

/**
 * Delete a band as owner.
 * Strictly restricted to littlerusty@gmail.com.
 */
export function deleteOwnerBandEntry(
  bandId: string, 
  bandName?: string, 
  userEmail?: string
): { success: boolean; error?: string } {
  if (!isOwnerAuthorized(userEmail)) {
    return { 
      success: false, 
      error: `Access Denied: Only the platform owner (${AUTHORIZED_OWNER_EMAIL}) has authorization to delete bands.` 
    };
  }

  try {
    const deleted = getOwnerDeletedBandIds();
    if (bandId && !deleted.includes(bandId.toLowerCase())) {
      deleted.push(bandId.toLowerCase());
    }
    if (bandName && !deleted.includes(bandName.trim().toLowerCase())) {
      deleted.push(bandName.trim().toLowerCase());
    }
    localStorage.setItem(STORAGE_KEY_DELETED_BANDS, JSON.stringify(deleted));

    // Remove from custom if exists
    const custom = getCustomBands().filter(b => b.id !== bandId && (!bandName || b.name.toLowerCase() !== bandName.toLowerCase()));
    localStorage.setItem(STORAGE_KEY_CUSTOM_BANDS, JSON.stringify(custom));

    // Broadcast update event
    window.dispatchEvent(new CustomEvent("giglizard_bands_updated", { detail: { deletedId: bandId } }));

    // Sync with backend
    try {
      fetch("/api/owner/bands/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerEmail: userEmail, bandId, bandName })
      }).catch(() => {});
    } catch (_) {}

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to remove band." };
  }
}

/**
 * Save an edited venue or add a new venue as owner.
 * Strictly restricted to littlerusty@gmail.com.
 */
export function saveOwnerVenueEdit(
  venue: Venue, 
  userEmail?: string
): { success: boolean; error?: string } {
  if (!isOwnerAuthorized(userEmail)) {
    return { 
      success: false, 
      error: `Access Denied: Only the platform owner (${AUTHORIZED_OWNER_EMAIL}) has authorization to edit venues in the directory.` 
    };
  }

  if (!venue || !venue.name?.trim()) {
    return { success: false, error: "Venue name is required." };
  }

  try {
    const edits = getOwnerVenueEdits();
    const venueId = venue.id || `venue-${Date.now()}`;
    const cleanVenue: Venue = {
      ...venue,
      id: venueId,
      name: venue.name.trim(),
      capacity: Number(venue.capacity) || 150,
      address: venue.address?.trim() || "123 Music Ave",
      city: venue.city?.trim() || "Seattle",
      genres: Array.isArray(venue.genres) && venue.genres.length > 0 ? venue.genres : ["Live Music"],
      contactEmail: venue.contactEmail?.trim() || "",
      contactPhone: venue.contactPhone?.trim() || "(206) 555-0142",
      description: venue.description?.trim() || `[Capacity: ${venue.capacity || 150} guests] Live performance music venue.`,
      website: venue.website?.trim() || "www.inquire-booking.com",
      hasPA: venue.hasPA ?? true,
      hasLighting: venue.hasLighting ?? true
    };

    // Save override keyed by ID and Name
    edits[cleanVenue.id] = cleanVenue;
    edits[cleanVenue.name.toLowerCase()] = cleanVenue;
    localStorage.setItem(STORAGE_KEY_VENUE_EDITS, JSON.stringify(edits));

    // Also update custom venues list if applicable
    const custom = getCustomVenues();
    const updatedCustom = [cleanVenue, ...custom.filter(v => v.id !== cleanVenue.id && v.name.toLowerCase() !== cleanVenue.name.toLowerCase())];
    localStorage.setItem(STORAGE_KEY_CUSTOM_VENUES, JSON.stringify(updatedCustom));

    // If it was marked deleted, remove from deleted list
    const deleted = getOwnerDeletedVenueIds().filter(id => id !== cleanVenue.id && id !== cleanVenue.name.toLowerCase());
    localStorage.setItem(STORAGE_KEY_DELETED_VENUES, JSON.stringify(deleted));

    // Broadcast update event
    window.dispatchEvent(new CustomEvent("giglizard_venues_updated", { detail: { venue: cleanVenue } }));

    // Sync with backend API
    try {
      fetch("/api/owner/venues/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerEmail: userEmail, venue: cleanVenue })
      }).catch(err => console.warn("Backend venue sync notice:", err));
    } catch (_) {}

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to persist venue changes." };
  }
}

/**
 * Delete a venue as owner.
 * Strictly restricted to littlerusty@gmail.com.
 */
export function deleteOwnerVenueEntry(
  venueId: string, 
  venueName?: string, 
  userEmail?: string
): { success: boolean; error?: string } {
  if (!isOwnerAuthorized(userEmail)) {
    return { 
      success: false, 
      error: `Access Denied: Only the platform owner (${AUTHORIZED_OWNER_EMAIL}) has authorization to delete venues.` 
    };
  }

  try {
    const deleted = getOwnerDeletedVenueIds();
    if (venueId && !deleted.includes(venueId.toLowerCase())) {
      deleted.push(venueId.toLowerCase());
    }
    if (venueName && !deleted.includes(venueName.trim().toLowerCase())) {
      deleted.push(venueName.trim().toLowerCase());
    }
    localStorage.setItem(STORAGE_KEY_DELETED_VENUES, JSON.stringify(deleted));

    // Remove from custom if exists
    const custom = getCustomVenues().filter(v => v.id !== venueId && (!venueName || v.name.toLowerCase() !== venueName.toLowerCase()));
    localStorage.setItem(STORAGE_KEY_CUSTOM_VENUES, JSON.stringify(custom));

    // Broadcast update event
    window.dispatchEvent(new CustomEvent("giglizard_venues_updated", { detail: { deletedId: venueId } }));

    // Sync with backend
    try {
      fetch("/api/owner/venues/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerEmail: userEmail, venueId, venueName })
      }).catch(() => {});
    } catch (_) {}

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to remove venue." };
  }
}
