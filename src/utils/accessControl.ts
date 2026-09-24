import { UserAccount } from "../types";

// Removed / Banned accounts list (e.g. sherie.szubski band)
export const BANNED_BAND_EMAILS = ["sherie.szubski@gmail.com"];

export function isBandBanned(email?: string, name?: string): boolean {
  if (email && BANNED_BAND_EMAILS.includes(email.trim().toLowerCase())) {
    return true;
  }
  if (email && email.toLowerCase().includes("sherie.szubski")) {
    return true;
  }
  if (name && (name.toLowerCase().includes("sherie") && name.toLowerCase().includes("szubski"))) {
    return true;
  }
  return false;
}

export function isEmailRevoked(email?: string): boolean {
  if (!email) return false;
  return isBandBanned(email);
}

// Special perpetual lifetime pass accounts with full unmasked access for life
export const PERPETUAL_30_DAY_PASS_EMAILS = ["littlerusty@gmail.com"];

export function isPerpetualPassEmail(email?: string): boolean {
  if (!email) return false;
  return PERPETUAL_30_DAY_PASS_EMAILS.includes(email.trim().toLowerCase());
}

/**
 * Checks if a user is currently logged into an account
 */
export function isUserLoggedIn(account?: Partial<UserAccount> | null): boolean {
  return Boolean(
    account && 
    account.contactEmail && 
    account.contactEmail.trim().length > 0 && 
    account.contactEmail.includes("@")
  );
}

/**
 * Core Policy: Only paid subscribers that are not expired can see band contact info,
 * and ONLY when they are logged into their account.
 */
export function canViewBandContacts(account?: Partial<UserAccount> | null): boolean {
  if (!isUserLoggedIn(account)) {
    return false;
  }
  return isAccessActive(account);
}

/**
 * Access check helper:
 * - littlerusty@gmail.com: Full unmasked access to the entire site for life.
 * - Paid pass users: Unmasked access while accessExpiresAt is in the future.
 * - All other users: Free tier account with masked contacts until 30-day pass ($9.99) is purchased.
 */
export function isAccessActive(venue?: Partial<UserAccount> | null): boolean {
  if (!venue) return false;
  if (!venue.contactEmail || !venue.contactEmail.trim()) return false;
  if (isEmailRevoked(venue.contactEmail)) {
    return false;
  }
  // Perpetual Lifetime Pass for littlerusty@gmail.com (Full unmasked access for life)
  if (isPerpetualPassEmail(venue.contactEmail)) {
    return true;
  }
  return Boolean(venue.accessExpiresAt && new Date(venue.accessExpiresAt) > new Date());
}

/**
 * Returns remaining days of active access (0 if expired or inactive)
 */
export function getAccessRemainingDays(venue?: Partial<UserAccount> | null): number {
  if (!venue) return 0;
  if (!venue.contactEmail || !venue.contactEmail.trim()) return 0;
  if (isEmailRevoked(venue.contactEmail)) return 0;
  
  if (isPerpetualPassEmail(venue.contactEmail)) {
    return 99999; // Perpetual lifetime pass
  }

  if (!venue.accessExpiresAt) return 0;
  
  const expiryTime = new Date(venue.accessExpiresAt).getTime();
  if (isNaN(expiryTime) || expiryTime <= 0) return 0;
  
  const diffMs = expiryTime - Date.now();
  if (diffMs <= 0) return 0;

  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Formats full expiration status overview
 */
export function getAccessStatusDetails(venue?: Partial<UserAccount> | null) {
  const isLoggedIn = isUserLoggedIn(venue);
  const isPerpetual = isLoggedIn && isPerpetualPassEmail(venue?.contactEmail);
  const active = isLoggedIn && (isPerpetual || isAccessActive(venue));
  const hadPass = Boolean(isPerpetual || venue?.accessExpiresAt || venue?.lastPaymentDate || venue?.hasPaidAccess || venue?.isPremium);
  const isExpired = isLoggedIn && hadPass && !active;
  const remainingDays = isLoggedIn ? getAccessRemainingDays(venue) : 0;
  const autoRenew = Boolean(isLoggedIn && (isPerpetual || venue?.autoRenew));

  let formattedExpiry = "None";
  let statusType: "not_logged_in" | "active_owner" | "active_paid" | "expired" | "unpaid" = "not_logged_in";

  if (!isLoggedIn) {
    statusType = "not_logged_in";
    formattedExpiry = "Login Required";
  } else if (isPerpetual) {
    statusType = "active_owner";
    formattedExpiry = "Never Expires (Perpetual Lifetime Access)";
  } else if (venue?.accessExpiresAt) {
    try {
      formattedExpiry = new Date(venue.accessExpiresAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      formattedExpiry = venue.accessExpiresAt;
    }
    statusType = active ? "active_paid" : "expired";
  } else {
    statusType = "unpaid";
  }

  let bannerText = "";
  if (!isLoggedIn) {
    bannerText = "🔒 Login Required — Only paid subscribers with up-to-date subscriptions can view band contacts";
  } else if (isPerpetual) {
    bannerText = "🟢 Lifetime VIP Owner Pass Active (Full Unmasked Access for Life • Never Expires)";
  } else if (active) {
    const renewWord = autoRenew ? "Renews" : "Expires";
    bannerText = `🟢 30-Day All Access Pass Active (${renewWord} in ${remainingDays} ${remainingDays === 1 ? "day" : "days"})`;
  } else if (isExpired) {
    bannerText = "🔒 30-Day Access Expired — Renew for $9.99 to Unlock Contact Info";
  } else {
    bannerText = "🔒 Free Tier (Contacts Masked) — Get 30-Day All Access Pass ($9.99) to Unlock Contacts";
  }

  return {
    isLoggedIn,
    isActive: active,
    isExpired: isPerpetual ? false : isExpired,
    remainingDays,
    formattedExpiry,
    renewsMonthly: autoRenew,
    isPerpetual,
    bannerText,
    statusType
  };
}

/**
 * Masks email address for locked/expired accounts ('--****')
 */
export function maskContactEmail(email?: string): string {
  return "--****";
}

/**
 * Masks phone number for locked/expired accounts ('--****')
 */
export function maskContactPhone(phone?: string): string {
  return "--****";
}


