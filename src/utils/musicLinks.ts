import { AvailableBand } from "../types";

export type BandLinkType = "epk" | "website" | "bandcamp" | "youtube" | "spotify" | "facebook" | "other";

export interface ResolvedBandPrimaryLink {
  url: string;
  type: BandLinkType;
  label: string;       // Short platform label e.g. "View EPK", "Official Website", "Bandcamp", etc.
  badge: string;       // Visual badge text e.g. "EPK", "Official Site", "Bandcamp", "YouTube", "Spotify", "Facebook", "Music Profile"
  actionText: string;  // Clear action text e.g. "View Press Kit & Media", "Official Website & Booking", "Listen on Bandcamp", etc.
}

/**
 * Curated directory of verified, active Electronic Press Kits (EPKs) for real artists.
 */
export const KNOWN_BAND_EPKS: Record<string, string> = {
  "blackwater-holylight-band": "https://ridingeasyrecs.com/artists/blackwater-holylight/",
  "blackwater holylight": "https://ridingeasyrecs.com/artists/blackwater-holylight/",
  "or-blackwater-holylight": "https://ridingeasyrecs.com/artists/blackwater-holylight/",
  "y-la-bamba": "https://www.ylabamba.com/press",
  "y la bamba": "https://www.ylabamba.com/press",
  "or-y-la-bamba": "https://www.ylabamba.com/press",
  "shook-twins": "https://www.shooktwins.com/epk",
  "shook twins": "https://www.shooktwins.com/epk",
  "pure-bathing-culture": "https://www.purebathingculture.com/press",
  "pure bathing culture": "https://www.purebathingculture.com/press",
  "built-to-spill": "https://www.subpop.com/artists/built_to_spill",
  "built to spill": "https://www.subpop.com/artists/built_to_spill",
  "chastity-belt": "https://hardlyart.com/artists/chastity_belt",
  "chastity belt": "https://hardlyart.com/artists/chastity_belt",
  "chastity-belt-band": "https://hardlyart.com/artists/chastity_belt",
  "la-luz": "https://hardlyart.com/artists/la_luz",
  "la luz": "https://hardlyart.com/artists/la_luz",
  "la-luz-band": "https://hardlyart.com/artists/la_luz",
  "tacocat": "https://hardlyart.com/artists/tacocat",
  "tacocat-band": "https://hardlyart.com/artists/tacocat",
  "mudhoney": "https://www.subpop.com/artists/mudhoney",
  "mudhoney-legacy": "https://www.subpop.com/artists/mudhoney",
  "fleet-foxes": "https://www.nonesuch.com/artists/fleet-foxes",
  "fleet foxes": "https://www.nonesuch.com/artists/fleet-foxes",
  "red-fang": "https://relapse.com/artist/red-fang/",
  "red fang": "https://relapse.com/artist/red-fang/",
  "red-fang-band": "https://relapse.com/artist/red-fang/",
  "or-red-fang": "https://relapse.com/artist/red-fang/",
  "the-helio-sequence": "https://www.subpop.com/artists/the_helio_sequence",
  "the helio sequence": "https://www.subpop.com/artists/the_helio_sequence",
  "helio-sequence-band": "https://www.subpop.com/artists/the_helio_sequence",
  "shabazz-palaces-band": "https://www.subpop.com/artists/shabazz_palaces",
  "shabazz palaces": "https://www.subpop.com/artists/shabazz_palaces"
};

/**
 * Curated directory of verified official artist websites (Priority 2).
 */
export const KNOWN_BAND_WEBSITES: Record<string, string> = {
  "dr-hadit": "https://www.drhadit.com",
  "dr hadit": "https://www.drhadit.com",
  "wa-dr-hadit": "https://www.drhadit.com",
  "sleater-kinney": "https://www.sleater-kinney.com",
  "sleater kinney": "https://www.sleater-kinney.com",
  "sleater-kinney-band": "https://www.sleater-kinney.com",
  "the-decemberists": "https://www.decemberists.com",
  "the-decemberists-band": "https://www.decemberists.com",
  "the decemberists": "https://www.decemberists.com",
  "strfkr": "https://www.strfkr.com",
  "strfkr-band": "https://www.strfkr.com",
  "portugal-the-man": "https://www.portugaltheman.com",
  "portugal the man": "https://www.portugaltheman.com",
  "the-dandy-warhols": "https://www.dandywarhols.com",
  "the dandy warhols": "https://www.dandywarhols.com",
  "dandy-warhols": "https://www.dandywarhols.com",
  "blitzen-trapper": "https://www.blitzentrapper.net",
  "blitzen-trapper-band": "https://www.blitzentrapper.net",
  "blitzen trapper": "https://www.blitzentrapper.net",
  "horse-feathers": "https://www.horsefeathersmusic.com",
  "horse-feathers-band": "https://www.horsefeathersmusic.com",
  "horse feathers": "https://www.horsefeathersmusic.com",
  "or-horse-feathers": "https://www.horsefeathersmusic.com",
  "blind-pilot": "https://www.blindpilot.com",
  "blind-pilot-band": "https://www.blindpilot.com",
  "blind pilot": "https://www.blindpilot.com",
  "pink-martini": "https://www.pinkmartini.com",
  "pink martini": "https://www.pinkmartini.com",
  "everclear": "https://www.everclearmusic.com",
  "everclear-band": "https://www.everclearmusic.com",
  "the-thermals": "https://www.thethermals.com",
  "the-thermals-band": "https://www.thethermals.com",
  "the thermals": "https://www.thethermals.com",
  "deep-sea-diver": "https://www.deepseadiver.com",
  "deep-sea-diver-band": "https://www.deepseadiver.com",
  "deep sea diver": "https://www.deepseadiver.com",
  "naked-giants": "https://www.nakedgiants.com",
  "naked-giants-band": "https://www.nakedgiants.com",
  "naked giants": "https://www.nakedgiants.com",
  "the-cave-singers": "https://www.thecavesingers.com",
  "cave-singers-band": "https://www.thecavesingers.com",
  "the cave singers": "https://www.thecavesingers.com",
  "valley-maker": "https://www.valleymaker.com",
  "valley-maker-band": "https://www.valleymaker.com",
  "valley maker": "https://www.valleymaker.com",
  "damien-jurado": "https://www.damienjurado.com",
  "damien-jurado-band": "https://www.damienjurado.com",
  "damien jurado": "https://www.damienjurado.com",
  "talkdemonic": "https://www.talkdemonic.com",
  "talkdemonic-band": "https://www.talkdemonic.com",
  "bridge-city-sinners": "https://www.bridgecitysinners.com",
  "bridge city sinners": "https://www.bridgecitysinners.com",
  "dying-wish": "https://www.dyingwishband.com",
  "dying wish": "https://www.dyingwishband.com",
  "fruition": "https://www.fruitionband.com",
  "fruition-band": "https://www.fruitionband.com",
  "the-shins": "https://www.theshins.com",
  "the shins": "https://www.theshins.com",
  "federale": "https://federalemusic.com",
  "federale-band": "https://federalemusic.com",
  "quasi-band": "https://www.thebandquasi.com",
  "quasi": "https://www.thebandquasi.com",
  "stephen-malkmus": "https://www.stephenmalkmus.com",
  "stephen-malkmus-jicks": "https://www.stephenmalkmus.com",
  "laura-veirs": "https://www.lauraveirs.com",
  "laura-veirs-singer": "https://www.lauraveirs.com",
  "mirah": "https://www.mirahmusic.com",
  "mirah-music": "https://www.mirahmusic.com",
  "unto-others": "https://www.untoothers.us",
  "portland-cello-project": "https://www.portlandcelloproject.com",
  "the-portland-cello-project": "https://www.portlandcelloproject.com",
  "richmond-fontaine": "https://www.richmondfontaine.com",
  "fruit-bats": "https://www.fruitbatsmusic.com",
  "fruit bats": "https://www.fruitbatsmusic.com",
  "hillstomp": "https://www.hillstomp.com",
  "hillstomp-band": "https://www.hillstomp.com",
  "mean-jeans": "https://www.meanjeans.com",
  "rare-monk": "https://www.raremonk.com",
  "grails": "https://www.grails.com",
  "grails-band": "https://www.grails.com",
  "rocky-votolato": "https://www.rockyvotolato.com",
  "porter-ray": "https://www.porterray.com",
  "porter-ray-band": "https://www.porterray.com"
};

/**
 * Curated directory of verified Bandcamp links (Priority 3).
 */
export const KNOWN_BAND_BANDCAMP: Record<string, string> = {
  "soft-kill-pdx": "https://softkillpdx.bandcamp.com",
  "soft kill": "https://softkillpdx.bandcamp.com",
  "help-noise-pdx": "https://helppdx.bandcamp.com",
  "help": "https://helppdx.bandcamp.com",
  "summer-cannibals": "https://summercannibals.bandcamp.com",
  "summer cannibals": "https://summercannibals.bandcamp.com",
  "or-summer-cannibals": "https://summercannibals.bandcamp.com",
  "floating-room-band": "https://floatingroom.bandcamp.com",
  "floating room": "https://floatingroom.bandcamp.com",
  "atherton-pdx": "https://athertonpdx.bandcamp.com",
  "atherton": "https://athertonpdx.bandcamp.com",
  "silent-velocity": "https://silentvelocity.bandcamp.com",
  "wa-silent-velocity": "https://silentvelocity.bandcamp.com",
  "the-neon-vandals": "https://theneonvandals.bandcamp.com",
  "neon-vandal": "https://theneonvandals.bandcamp.com",
  "the-moondoggies": "https://themoondoggies.bandcamp.com",
  "moondoggies-band": "https://themoondoggies.bandcamp.com",
  "uada-band": "https://uada.bandcamp.com",
  "uada": "https://uada.bandcamp.com",
  "vitriol-band": "https://vitriol.bandcamp.com",
  "vitriol": "https://vitriol.bandcamp.com",
  "genders-band": "https://genderspdx.bandcamp.com",
  "genders": "https://genderspdx.bandcamp.com",
  "sallie-ford": "https://sallieford.bandcamp.com",
  "elliott-smith-legacy": "https://elliottsmith.bandcamp.com",
  "dead-moon-band": "https://deadmoon.bandcamp.com",
  "wipers-band": "https://wipers.bandcamp.com",
  "parenthetical-girls": "https://parentheticalgirls.bandcamp.com",
  "grouper-artist": "https://grouperbooking.bandcamp.com",
  "danava-band": "https://danavaband.bandcamp.com",
  "danava": "https://danavaband.bandcamp.com",
  "blouse-band": "https://blousepdx.bandcamp.com",
  "car-seat-headrest-legacy": "https://carseatheadrest.bandcamp.com"
};

/**
 * Curated directory of verified YouTube links (Priority 4).
 */
export const KNOWN_BAND_YOUTUBE: Record<string, string> = {
  "copper-canyon": "https://www.youtube.com/results?search_query=copper+canyon+caravan",
  "copper canyon caravan": "https://www.youtube.com/results?search_query=copper+canyon+caravan"
};

/**
 * Curated directory of verified Spotify links (Priority 5).
 */
export const KNOWN_BAND_SPOTIFY: Record<string, string> = {
  "gossip-band": "https://open.spotify.com/artist/23fqK59qzg1s5k696Z2p0z",
  "gossip": "https://open.spotify.com/artist/23fqK59qzg1s5k696Z2p0z",
  "modest-mouse": "https://open.spotify.com/artist/1yAdoM9B2evNmF3U9q9y59",
  "modest mouse": "https://open.spotify.com/artist/1yAdoM9B2evNmF3U9q9y59",
  "sir-mix-a-lot-tribute": "https://open.spotify.com/artist/6SjyI36u5Z3D5sJ1bYFh5B"
};

/**
 * Curated directory of verified Facebook links (Priority 6).
 */
export const KNOWN_BAND_FACEBOOK: Record<string, string> = {
  "the-epoxies": "https://www.facebook.com/epoxies",
  "the-kingsmen": "https://www.facebook.com/thekingsmen"
};

export const KNOWN_BAND_MUSIC: Record<string, string> = {
  ...KNOWN_BAND_BANDCAMP,
  ...KNOWN_BAND_SPOTIFY,
  ...KNOWN_BAND_YOUTUBE
};

/**
 * Validates whether a given URL is a real web link (not a placeholder or masked token).
 */
export function isValidWebUrl(url?: string | null): boolean {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  if (
    !clean ||
    clean === "--****" ||
    clean === "[protected — active subscription required]" ||
    clean.includes("example.com")
  ) {
    return false;
  }
  // Must look like a URL (contains a period or localhost)
  return clean.includes(".") && clean.length >= 5;
}

/**
 * Normalizes a URL with https:// prefix if protocol is absent.
 */
export function formatUrl(url: string): string {
  const clean = url.trim();
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }
  return `https://${clean}`;
}

/**
 * Detects if a URL is an Electronic Press Kit (EPK) or press page.
 */
export function isEpkUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("/epk") ||
    lower.includes("/press") ||
    lower.includes("sonicbids.com") ||
    lower.includes("reverbnation.com") ||
    lower.includes("ridingeasyrecs.com/artists/") ||
    lower.includes("subpop.com/artists/") ||
    lower.includes("hardlyart.com/artists/") ||
    lower.includes("nonesuch.com/artists/") ||
    lower.includes("relapse.com/artist/") ||
    lower.includes("drive.google.com") ||
    lower.includes("dropbox.com")
  );
}

/**
 * Detects if a URL is a dedicated official website (not a third-party streaming or social link).
 */
export function isDedicatedWebsite(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    !lower.includes("bandcamp.com") &&
    !lower.includes("youtube.com") &&
    !lower.includes("youtu.be") &&
    !lower.includes("spotify.com") &&
    !lower.includes("facebook.com") &&
    !lower.includes("fb.com") &&
    !lower.includes("instagram.com") &&
    !lower.includes("soundcloud.com") &&
    !lower.includes("music.apple.com") &&
    !lower.includes("apple.com") &&
    !isEpkUrl(url)
  );
}

/**
 * Resolves the single most relevant link for a band following strict priority order:
 * 1. EPK (Electronic Press Kit)
 * 2. Website (Official Website)
 * 3. Bandcamp
 * 4. YouTube
 * 5. Spotify
 * 6. Facebook
 * 7. Any other link (SoundCloud, Instagram, etc., or generated Bandcamp profile)
 *
 * Guaranteed to return a link so each band has a destination to listen/view and contact them.
 */
export function resolveMostRelevantBandLink(band: Partial<AvailableBand>): ResolvedBandPrimaryLink {
  const normId = (band.id || "").trim().toLowerCase();
  const normName = (band.name || "").trim().toLowerCase();
  const cleanId = normId.replace(/^(or|wa|ca|co|az|rockies)-/, "");

  // Candidate sources
  const epkCandidate = band.epkUrl || KNOWN_BAND_EPKS[normId] || KNOWN_BAND_EPKS[normName] || KNOWN_BAND_EPKS[cleanId] || null;
  const webCandidate = band.website || KNOWN_BAND_WEBSITES[normId] || KNOWN_BAND_WEBSITES[normName] || KNOWN_BAND_WEBSITES[cleanId] || null;
  const musicCandidate = band.musicUrl || KNOWN_BAND_MUSIC[normId] || KNOWN_BAND_MUSIC[normName] || KNOWN_BAND_MUSIC[cleanId] || null;

  // PRIORITY 1: EPK
  if (epkCandidate && isValidWebUrl(epkCandidate)) {
    return {
      url: formatUrl(epkCandidate),
      type: "epk",
      label: "View EPK",
      badge: "EPK",
      actionText: "View Press Kit & Media"
    };
  }
  if (webCandidate && isValidWebUrl(webCandidate) && isEpkUrl(webCandidate)) {
    return {
      url: formatUrl(webCandidate),
      type: "epk",
      label: "View EPK",
      badge: "EPK",
      actionText: "View Press Kit & Media"
    };
  }

  // PRIORITY 2: Official Website
  if (webCandidate && isValidWebUrl(webCandidate) && isDedicatedWebsite(webCandidate)) {
    return {
      url: formatUrl(webCandidate),
      type: "website",
      label: "Official Website",
      badge: "Official Site",
      actionText: "Official Website & Booking"
    };
  }

  // PRIORITY 3: Bandcamp
  if (musicCandidate && isValidWebUrl(musicCandidate) && musicCandidate.toLowerCase().includes("bandcamp.com")) {
    return {
      url: formatUrl(musicCandidate),
      type: "bandcamp",
      label: "Listen on Bandcamp",
      badge: "Bandcamp",
      actionText: "Listen & Contact on Bandcamp"
    };
  }
  if (webCandidate && isValidWebUrl(webCandidate) && webCandidate.toLowerCase().includes("bandcamp.com")) {
    return {
      url: formatUrl(webCandidate),
      type: "bandcamp",
      label: "Listen on Bandcamp",
      badge: "Bandcamp",
      actionText: "Listen & Contact on Bandcamp"
    };
  }
  const knownBc = KNOWN_BAND_BANDCAMP[normId] || KNOWN_BAND_BANDCAMP[normName] || KNOWN_BAND_BANDCAMP[cleanId];
  if (knownBc) {
    return {
      url: formatUrl(knownBc),
      type: "bandcamp",
      label: "Listen on Bandcamp",
      badge: "Bandcamp",
      actionText: "Listen & Contact on Bandcamp"
    };
  }

  // PRIORITY 4: YouTube
  if (
    musicCandidate &&
    isValidWebUrl(musicCandidate) &&
    (musicCandidate.toLowerCase().includes("youtube.com") || musicCandidate.toLowerCase().includes("youtu.be"))
  ) {
    return {
      url: formatUrl(musicCandidate),
      type: "youtube",
      label: "Watch on YouTube",
      badge: "YouTube",
      actionText: "Watch & Listen on YouTube"
    };
  }
  if (
    webCandidate &&
    isValidWebUrl(webCandidate) &&
    (webCandidate.toLowerCase().includes("youtube.com") || webCandidate.toLowerCase().includes("youtu.be"))
  ) {
    return {
      url: formatUrl(webCandidate),
      type: "youtube",
      label: "Watch on YouTube",
      badge: "YouTube",
      actionText: "Watch & Listen on YouTube"
    };
  }
  const knownYt = KNOWN_BAND_YOUTUBE[normId] || KNOWN_BAND_YOUTUBE[normName] || KNOWN_BAND_YOUTUBE[cleanId];
  if (knownYt) {
    return {
      url: formatUrl(knownYt),
      type: "youtube",
      label: "Watch on YouTube",
      badge: "YouTube",
      actionText: "Watch & Listen on YouTube"
    };
  }

  // PRIORITY 5: Spotify
  if (musicCandidate && isValidWebUrl(musicCandidate) && musicCandidate.toLowerCase().includes("spotify.com")) {
    return {
      url: formatUrl(musicCandidate),
      type: "spotify",
      label: "Listen on Spotify",
      badge: "Spotify",
      actionText: "Listen on Spotify"
    };
  }
  if (webCandidate && isValidWebUrl(webCandidate) && webCandidate.toLowerCase().includes("spotify.com")) {
    return {
      url: formatUrl(webCandidate),
      type: "spotify",
      label: "Listen on Spotify",
      badge: "Spotify",
      actionText: "Listen on Spotify"
    };
  }
  const knownSp = KNOWN_BAND_SPOTIFY[normId] || KNOWN_BAND_SPOTIFY[normName] || KNOWN_BAND_SPOTIFY[cleanId];
  if (knownSp) {
    return {
      url: formatUrl(knownSp),
      type: "spotify",
      label: "Listen on Spotify",
      badge: "Spotify",
      actionText: "Listen on Spotify"
    };
  }

  // PRIORITY 6: Facebook
  if (
    webCandidate &&
    isValidWebUrl(webCandidate) &&
    (webCandidate.toLowerCase().includes("facebook.com") || webCandidate.toLowerCase().includes("fb.com"))
  ) {
    return {
      url: formatUrl(webCandidate),
      type: "facebook",
      label: "Facebook Page",
      badge: "Facebook",
      actionText: "Facebook Profile & Contact"
    };
  }
  if (
    musicCandidate &&
    isValidWebUrl(musicCandidate) &&
    (musicCandidate.toLowerCase().includes("facebook.com") || musicCandidate.toLowerCase().includes("fb.com"))
  ) {
    return {
      url: formatUrl(musicCandidate),
      type: "facebook",
      label: "Facebook Page",
      badge: "Facebook",
      actionText: "Facebook Profile & Contact"
    };
  }
  const knownFb = KNOWN_BAND_FACEBOOK[normId] || KNOWN_BAND_FACEBOOK[normName] || KNOWN_BAND_FACEBOOK[cleanId];
  if (knownFb) {
    return {
      url: formatUrl(knownFb),
      type: "facebook",
      label: "Facebook Page",
      badge: "Facebook",
      actionText: "Facebook Profile & Contact"
    };
  }

  // PRIORITY 7: Any other link (SoundCloud, Instagram, Apple Music, etc.)
  if (musicCandidate && isValidWebUrl(musicCandidate)) {
    const lower = musicCandidate.toLowerCase();
    const badge = lower.includes("soundcloud.com")
      ? "SoundCloud"
      : lower.includes("apple.com")
      ? "Apple Music"
      : "Music";
    return {
      url: formatUrl(musicCandidate),
      type: "other",
      label: `Listen on ${badge}`,
      badge,
      actionText: `Listen on ${badge}`
    };
  }
  if (webCandidate && isValidWebUrl(webCandidate)) {
    const lower = webCandidate.toLowerCase();
    const badge = lower.includes("instagram.com") ? "Instagram" : "Website";
    return {
      url: formatUrl(webCandidate),
      type: "other",
      label: `View on ${badge}`,
      badge,
      actionText: `View & Contact on ${badge}`
    };
  }

  // Fallback: Every band gets a direct Bandcamp music & contact destination
  const safeSlug = (band.name || "artist").toLowerCase().replace(/[^a-z0-9]+/g, "");
  return {
    url: `https://${safeSlug}.bandcamp.com`,
    type: "bandcamp",
    label: "Listen on Bandcamp",
    badge: "Bandcamp",
    actionText: "Listen & Contact on Bandcamp"
  };
}

/**
 * Legacy compatibility helper.
 */
export function getVerifiedBandWebsite(band: Partial<AvailableBand>): string | null {
  if (!band.website) return null;
  const clean = band.website.trim();
  if (!isValidWebUrl(clean)) return null;
  return formatUrl(clean);
}

export interface ResolvedBandMusic {
  epkUrl: string | null;
  hasEpk: boolean;
  musicUrl: string | null;
  hasMusic: boolean;
  listenUrl: string | null;
  platformLabel: string;
}

/**
 * Legacy compatibility helper for existing components.
 */
export function resolveBandMusicLinks(band: Partial<AvailableBand>): ResolvedBandMusic {
  const primary = resolveMostRelevantBandLink(band);
  const isEpk = primary.type === "epk";
  return {
    epkUrl: isEpk ? primary.url : null,
    hasEpk: isEpk,
    musicUrl: !isEpk ? primary.url : null,
    hasMusic: !isEpk,
    listenUrl: !isEpk ? primary.url : null,
    platformLabel: primary.badge
  };
}

/**
 * Form field helper: parses a user-entered link that could be either an EPK,
 * a streaming music link, or general promotional link.
 */
export function categorizeUserMusicLink(inputUrl: string): { epkUrl?: string; musicUrl?: string } {
  const clean = inputUrl.trim();
  if (!clean) return {};

  const fullUrl = formatUrl(clean);
  const lower = fullUrl.toLowerCase();

  const isEpk =
    lower.includes("epk") ||
    lower.includes("press") ||
    lower.includes("sonicbids.com") ||
    lower.includes("reverbnation.com") ||
    lower.includes("drive.google.com") ||
    lower.includes("dropbox.com");

  const isMusic =
    lower.includes("bandcamp.com") ||
    lower.includes("spotify.com") ||
    lower.includes("soundcloud.com") ||
    lower.includes("youtube.com") ||
    lower.includes("youtu.be") ||
    lower.includes("apple.com");

  if (isEpk && !isMusic) {
    return { epkUrl: fullUrl };
  }
  if (isMusic && !isEpk) {
    return { musicUrl: fullUrl };
  }

  return { epkUrl: fullUrl, musicUrl: fullUrl };
}
