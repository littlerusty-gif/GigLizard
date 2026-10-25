/**
 * Directory Counts Utility
 * Automatically synchronizes venue and band counts with actual database numbers,
 * rounding them to the nearest 50 and refreshing every 30 days.
 */

import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';

// Actual database baseline numbers rounded to the nearest 50
export const BASELINE_VENUE_COUNT = 650;
export const BASELINE_BAND_COUNT = 4850;

// 30 days in milliseconds (30 days * 24 hrs * 60 mins * 60 secs * 1000 ms)
export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const STORAGE_KEY = 'giglizard_directory_counts_30d_v1';

export function roundToNearest50(count: number): number {
  if (!count || count <= 0) return 50;
  return Math.max(50, Math.round(count / 50) * 50);
}

export interface DirectoryCounts {
  venueCount: number;
  bandCount: number;
  venueCountStr: string;
  bandCountStr: string;
  combinedCountStr: string;
  lastUpdated: number;
}

function getStoredCounts(): DirectoryCounts | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.venueCount === 'number' && typeof parsed.bandCount === 'number') {
      const v = roundToNearest50(parsed.venueCount);
      const b = roundToNearest50(parsed.bandCount);
      return {
        venueCount: v,
        bandCount: b,
        venueCountStr: `${v.toLocaleString()}+`,
        bandCountStr: `${b.toLocaleString()}+`,
        combinedCountStr: `${v.toLocaleString()}+ venues & ${b.toLocaleString()}+ bands`,
        lastUpdated: parsed.lastUpdated || 0
      };
    }
  } catch (_) {}
  return null;
}

/**
 * Synchronous getter for current counts with fallback to verified baseline rounded to 50
 */
export function getDirectoryCounts(): DirectoryCounts {
  const stored = getStoredCounts();
  if (stored) return stored;

  return {
    venueCount: BASELINE_VENUE_COUNT,
    bandCount: BASELINE_BAND_COUNT,
    venueCountStr: `${BASELINE_VENUE_COUNT.toLocaleString()}+`,
    bandCountStr: `${BASELINE_BAND_COUNT.toLocaleString()}+`,
    combinedCountStr: `${BASELINE_VENUE_COUNT.toLocaleString()}+ venues & ${BASELINE_BAND_COUNT.toLocaleString()}+ bands`,
    lastUpdated: Date.now()
  };
}

/**
 * Checks if 30 days have elapsed since last count update and fetches fresh counts from Supabase
 */
export async function refreshDirectoryCountsIfExpired(): Promise<DirectoryCounts> {
  const current = getDirectoryCounts();
  const now = Date.now();

  // If updated within the last 30 days, keep current cached counts
  if (now - current.lastUpdated < THIRTY_DAYS_MS && current.lastUpdated > 0) {
    return current;
  }

  try {
    // Fetch live counts from Supabase
    const [venuesRes, bandsRes] = await Promise.all([
      supabase.from('venues').select('*', { count: 'exact', head: true }),
      supabase.from('bands').select('*', { count: 'exact', head: true })
    ]);

    const rawVenues = venuesRes.count ?? BASELINE_VENUE_COUNT;
    const rawBands = bandsRes.count ?? BASELINE_BAND_COUNT;

    const roundedVenues = roundToNearest50(rawVenues);
    const roundedBands = roundToNearest50(rawBands);

    const freshCounts: DirectoryCounts = {
      venueCount: roundedVenues,
      bandCount: roundedBands,
      venueCountStr: `${roundedVenues.toLocaleString()}+`,
      bandCountStr: `${roundedBands.toLocaleString()}+`,
      combinedCountStr: `${roundedVenues.toLocaleString()}+ venues & ${roundedBands.toLocaleString()}+ bands`,
      lastUpdated: now
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          venueCount: roundedVenues,
          bandCount: roundedBands,
          lastUpdated: now
        }));
      } catch (_) {}
    }

    return freshCounts;
  } catch (err) {
    console.warn('[DirectoryCounts] Notice refreshing 30-day counts from Supabase:', err);
    return current;
  }
}

/**
 * React hook that returns live counts rounded to nearest 50 and handles 30-day refresh
 */
export function useDirectoryCounts(): DirectoryCounts {
  const [counts, setCounts] = useState<DirectoryCounts>(getDirectoryCounts);

  useEffect(() => {
    let isMounted = true;
    refreshDirectoryCountsIfExpired().then(fresh => {
      if (isMounted) {
        setCounts(fresh);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return counts;
}
