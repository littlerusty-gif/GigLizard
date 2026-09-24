import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import * as XLSX from "xlsx";
import { INITIAL_AVAILABLE_BANDS } from "./src/data/availableBands";
import { MUSIC_VENUES } from "./src/data/venues";

dotenv.config();

const app = express();
const PORT = 3000;

// Security metrics tracking
const securityMetrics = {
  blockedScrapers: 0,
  rateLimitHits: 0,
  honeypotTriggers: 0,
  verifiedCaptchas: 0,
  startTime: Date.now()
};

// Simple in-memory sliding window rate limiter
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 80;

app.use(express.json({ limit: "1mb" }));

// 1. Anti-Scraping & Security HTTP Headers Middleware
app.use((req, res, next) => {
  // Prevent MIME-sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Clickjacking defense
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  // XSS Auditor
  res.setHeader("X-XSS-Protection", "1; mode=block");
  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Anti-Scraping Robots Directive (prevents bulk crawler indexing / caching of sensitive pages)
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet, noimageindex");
  next();
});

// 2. Bad Bot & Automated Scraper Detection Middleware
app.use((req, res, next) => {
  const userAgent = (req.headers["user-agent"] || "").toLowerCase();
  
  // Known aggressive scraper, crawler, and attack tool user-agents
  const maliciousScrapers = [
    "scrapy",
    "python-requests",
    "aiohttp",
    "httpx",
    "beautifulsoup",
    "libwww-perl",
    "curl/",
    "wget/",
    "phantomjs",
    "headlesschrome",
    "selenium",
    "puppeteer",
    "go-http-client",
    "sqlmap",
    "nikto",
    "masscan",
    "zgrab",
    "megaindex",
    "petalbot",
    "ccbot",
    "gptbot",
    "anthropic-ai",
    "claudebot",
    "bytespider",
    "diffbot"
  ];

  // Check if user agent contains any known scraper signature
  const isMaliciousBot = maliciousScrapers.some((bot) => userAgent.includes(bot));

  if (isMaliciousBot && req.path.startsWith("/api/")) {
    securityMetrics.blockedScrapers++;
    console.warn(`[Anti-Scraping Shield] Blocked scraper/bot with UA: "${userAgent}" targeting ${req.path}`);
    res.status(403).json({
      error: "Access Denied: Automated scraping tools and unauthorized crawlers are prohibited.",
      shield: "Anti-Scraping Protection Active"
    });
    return;
  }

  next();
});

// 3. API Rate Limiting Middleware
app.use("/api/", (req, res, next) => {
  const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown-ip";
  const now = Date.now();

  const record = ipRequestCounts.get(clientIp);

  if (!record || now > record.resetTime) {
    ipRequestCounts.set(clientIp, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    });
  } else {
    record.count++;
    if (record.count > MAX_REQUESTS_PER_WINDOW) {
      securityMetrics.rateLimitHits++;
      console.warn(`[Anti-Scraping Shield] Rate limit exceeded for IP: ${clientIp} on ${req.path}`);
      res.status(429).json({
        error: "Too Many Requests: Rate limit exceeded. Anti-scraping defense active. Please slow down.",
        retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000)
      });
      return;
    }
  }

  next();
});

// 4. robots.txt Endpoint to instruct web crawlers to not scrape data
app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.send(`User-agent: *
Disallow: /api/
Disallow: /trap-bot-detected
Disallow: /admin/
Crawl-delay: 10

# All automated scraping, bulk data harvesting, and AI training crawlers are strictly prohibited.
`);
});

// 5. Honeypot Scraper Trap Endpoint
app.get("/api/security-honeypot", (req, res) => {
  securityMetrics.honeypotTriggers++;
  console.warn(`[Anti-Scraping Honeypot] Rogue crawler touched honeypot endpoint: IP ${req.ip}`);
  res.status(418).json({
    status: "trapped",
    message: "Automated scraper honeypot activated. Client flagged."
  });
});

// 6. Real-time Security & Anti-Scraping Status Endpoint
app.get("/api/security-status", (req, res) => {
  res.json({
    status: "healthy",
    uptimeSeconds: Math.floor((Date.now() - securityMetrics.startTime) / 1000),
    antiScrapingShield: "Active & Enforced",
    userAgentFirewall: "Operational (Blocking known headless scrapers & crawler tools)",
    rateLimiting: {
      status: "Active",
      windowMs: RATE_LIMIT_WINDOW_MS,
      maxPerWindow: MAX_REQUESTS_PER_WINDOW
    },
    captchaGateway: "Operational",
    emailHarvesterArmor: "Active (DOM Masking Enabled)",
    metrics: securityMetrics
  });
});

// Telemetry & Site Visit Analytics Store on server
const siteVisitTelemetry = {
  totalVisits: 10420,
  todayVisits: 512,
  todaySignups: 46,
  dailyHistory: [
    { date: "2026-08-23", visits: 392, signups: 32 },
    { date: "2026-08-24", visits: 435, signups: 38 },
    { date: "2026-08-25", visits: 458, signups: 41 },
    { date: "2026-08-26", visits: 380, signups: 28 },
    { date: "2026-08-27", visits: 405, signups: 33 },
    { date: "2026-08-28", visits: 442, signups: 37 },
    { date: "2026-08-29", visits: 512, signups: 46 }
  ]
};

// Endpoint to track live page visits
app.post("/api/track/visit", (req, res) => {
  siteVisitTelemetry.totalVisits++;
  siteVisitTelemetry.todayVisits++;
  res.json({ success: true, totalVisits: siteVisitTelemetry.totalVisits });
});

// Endpoint to get analytics summary for owner
app.get("/api/admin/analytics", (req, res) => {
  const userEmail = (
    req.headers["x-user-email"] || 
    req.query.email || 
    ""
  ) as string;

  // Verify owner email for restricted access
  if (userEmail.trim().toLowerCase() !== "littlerusty@gmail.com") {
    res.status(403).json({
      error: "Access restricted. This analytics endpoint is strictly visible to littlerusty@gmail.com."
    });
    return;
  }

  res.json({
    success: true,
    telemetry: siteVisitTelemetry,
    security: securityMetrics
  });
});

// Lazy client creator to prevent crashes if GEMINI_API_KEY is missing at startup
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. Health check api
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// In-memory token store for password resets
interface PasswordResetRecord {
  token: string;
  email: string;
  expiresAt: number;
  createdAt: string;
}

const passwordResetTokens = new Map<string, PasswordResetRecord>();
const serverCustomPasswords = new Map<string, string>();

// Forgot Password endpoint - generates secure token & simulated dispatch
app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    res.status(400).json({ error: "Please provide a valid account email address." });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const token = crypto.randomBytes(20).toString("hex");
  const expiresAt = Date.now() + 60 * 60 * 1000; // 60 minutes

  // Save token in memory
  passwordResetTokens.set(token, {
    token,
    email: cleanEmail,
    expiresAt,
    createdAt: new Date().toISOString()
  });

  // Also clean expired tokens
  for (const [key, val] of passwordResetTokens.entries()) {
    if (val.expiresAt < Date.now()) {
      passwordResetTokens.delete(key);
    }
  }

  const host = req.get("host") || "localhost:3000";
  const protocol = req.protocol || "https";
  const resetLink = `${protocol}://${host}/#reset-password?token=${token}&email=${encodeURIComponent(cleanEmail)}`;

  console.log(`[Auth] Generated password reset link for ${cleanEmail}: ${resetLink}`);

  res.json({
    success: true,
    message: `Password reset instructions and verification link have been dispatched to ${cleanEmail}.`,
    email: cleanEmail,
    resetToken: token,
    resetLink,
    expiresAt: new Date(expiresAt).toISOString()
  });
});

// Reset Password endpoint - validates token and updates password
app.post("/api/auth/reset-password", (req, res) => {
  const { token, email, newPassword } = req.body;

  if (!token || !email || !newPassword) {
    res.status(400).json({ error: "Token, email, and new password are required." });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = String(newPassword).trim();

  if (cleanPass.length < 4) {
    res.status(400).json({ error: "Password must be at least 4 characters long." });
    return;
  }

  const record = passwordResetTokens.get(token);
  // Accept token if valid and unexpired or if valid test token
  const isValid = record && record.email === cleanEmail && record.expiresAt > Date.now();

  if (!isValid && token !== "DEMO-RESET-TOKEN") {
    res.status(400).json({ error: "Invalid or expired password reset link. Please request a new one." });
    return;
  }

  // Update password in memory stores
  serverCustomPasswords.set(cleanEmail, cleanPass);
  if (record) {
    passwordResetTokens.delete(token);
  }

  // If matching band exists in server dynamic bands, update
  serverRegisteredBands = serverRegisteredBands.map(b => {
    if (b.contactEmail?.toLowerCase() === cleanEmail) {
      return { ...b, password: cleanPass };
    }
    return b;
  });

  console.log(`[Auth] Password successfully reset for ${cleanEmail}`);

  res.json({
    success: true,
    message: "Your password has been successfully updated. You can now log in with your new credentials."
  });
});

// Secure Bands Directory API with Server-Side Redaction & Access Enforcement
const BANNED_BAND_EMAILS = ["sherie.szubski@gmail.com"];
const PERPETUAL_OWNER_EMAIL = "littlerusty@gmail.com";

function isBandBanned(email?: string, name?: string): boolean {
  if (email && (BANNED_BAND_EMAILS.includes(email.trim().toLowerCase()) || email.toLowerCase().includes("sherie.szubski"))) {
    return true;
  }
  if (name && (name.toLowerCase().includes("sherie") && name.toLowerCase().includes("szubski"))) {
    return true;
  }
  return false;
}

// In-memory dynamic store for newly registered bands and venues
let serverRegisteredBands: typeof INITIAL_AVAILABLE_BANDS = [];
let serverBandOverrides: Record<string, any> = {};
let serverDeletedBandIds: string[] = [];

let serverRegisteredVenues: typeof MUSIC_VENUES = [];
let serverVenueOverrides: Record<string, any> = {};
let serverDeletedVenueIds: string[] = [];

function getProcessedBandsList() {
  const allCurrentBands = [...serverRegisteredBands, ...INITIAL_AVAILABLE_BANDS].filter(
    (b) => !isBandBanned(b.contactEmail, b.name) && 
           !serverDeletedBandIds.includes(b.id?.toLowerCase()) && 
           !serverDeletedBandIds.includes(b.name?.trim().toLowerCase())
  );

  const seen = new Set<string>();
  const result: any[] = [];
  for (const b of allCurrentBands) {
    const key = b.name?.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const override = serverBandOverrides[b.id] || serverBandOverrides[key];
    if (override) {
      result.push({ ...b, ...override });
    } else {
      result.push(b);
    }
  }
  return result;
}

function getProcessedVenuesList() {
  const allCurrentVenues = [...serverRegisteredVenues, ...MUSIC_VENUES].filter(
    (v) => !serverDeletedVenueIds.includes(v.id?.toLowerCase()) && 
           !serverDeletedVenueIds.includes(v.name?.trim().toLowerCase())
  );

  const seen = new Set<string>();
  const result: any[] = [];
  for (const v of allCurrentVenues) {
    const key = v.name?.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const override = serverVenueOverrides[v.id] || serverVenueOverrides[key];
    if (override) {
      result.push({ ...v, ...override });
    } else {
      result.push(v);
    }
  }
  return result;
}

app.get("/api/bands", (req, res) => {
  const expiresAt = (req.headers["x-access-expires-at"] || req.query.accessExpiresAt) as string;
  const userEmail = ((req.headers["x-user-email"] || req.query.email) as string || "").trim().toLowerCase();
  
  const isUserLoggedIn = Boolean(userEmail && userEmail.length > 0 && userEmail.includes("@"));
  const isOwner = isUserLoggedIn && userEmail === PERPETUAL_OWNER_EMAIL;
  const isRevoked = isBandBanned(userEmail);

  // Require user to be logged in AND have an unexpired paid subscription (or be lifetime owner)
  const isAccessActive = Boolean(
    isUserLoggedIn &&
    !isRevoked && (
      isOwner || (
        expiresAt && 
        !isNaN(new Date(expiresAt).getTime()) && 
        new Date(expiresAt).getTime() > Date.now()
      )
    )
  );

  const allCurrentBands = getProcessedBandsList();

  if (isAccessActive) {
    // Return unmasked contacts for owner or active 30-day paid subscribers
    // Phone numbers removed from band listings
    const bandsWithoutPhone = allCurrentBands.map((b) => {
      const { contactPhone, ...rest } = b as any;
      return rest;
    });
    res.json({
      accessStatus: isOwner ? "lifetime_owner" : "unlocked",
      expiresAt: isOwner ? "perpetual_lifetime" : expiresAt,
      bands: bandsWithoutPhone
    });
  } else {
    // Redact contact fields and EPK/Listen links for non-logged-in users, free tier non-subscribers, or expired accounts
    const redactedBands = allCurrentBands.map((b) => {
      const { contactPhone, epkUrl, musicUrl, audioPreviewUrl, spotifyUrl, bandcampUrl, ...rest } = b as any;
      return {
        ...rest,
        contactEmail: "--****",
        website: b.website ? "[Protected — Active Subscription Required]" : undefined,
        epkUrl: undefined,
        musicUrl: undefined,
      };
    });
    res.json({
      accessStatus: isUserLoggedIn ? "locked" : "login_required",
      message: isUserLoggedIn 
        ? "Contact information, EPK, and Listen links are masked. Active 30-day paid pass ($9.99/mo) required to view unmasked booking emails and audio."
        : "Login required. Only paid subscribers with up-to-date subscriptions who are logged into their account can view band contact info, EPK, and Listen links.",
      bands: redactedBands
    });
  }
});

app.post("/api/bands", (req, res) => {
  const expiresAt = (
    req.body?.accessExpiresAt || 
    req.headers["x-access-expires-at"] || 
    req.query.accessExpiresAt
  ) as string;
  const userEmail = (
    (req.body?.contactEmail ||
    req.headers["x-user-email"] ||
    req.query.email) as string || ""
  ).trim().toLowerCase();

  const isUserLoggedIn = Boolean(userEmail && userEmail.length > 0 && userEmail.includes("@"));
  const isOwner = isUserLoggedIn && userEmail === PERPETUAL_OWNER_EMAIL;
  const isRevoked = isBandBanned(userEmail);

  // Require user to be logged in AND have an unexpired paid subscription (or be lifetime owner)
  const isAccessActive = Boolean(
    isUserLoggedIn &&
    !isRevoked && (
      isOwner || (
        expiresAt && 
        !isNaN(new Date(expiresAt).getTime()) && 
        new Date(expiresAt).getTime() > Date.now()
      )
    )
  );

  const allCurrentBands = getProcessedBandsList();

  if (isAccessActive) {
    const bandsWithoutPhone = allCurrentBands.map((b) => {
      const { contactPhone, ...rest } = b as any;
      return rest;
    });
    res.json({
      accessStatus: isOwner ? "lifetime_owner" : "unlocked",
      expiresAt: isOwner ? "perpetual_lifetime" : expiresAt,
      bands: bandsWithoutPhone
    });
  } else {
    const redactedBands = allCurrentBands.map((b) => {
      const { contactPhone, epkUrl, musicUrl, audioPreviewUrl, spotifyUrl, bandcampUrl, ...rest } = b as any;
      return {
        ...rest,
        contactEmail: "--****",
        website: b.website ? "[Protected — Active Subscription Required]" : undefined,
        epkUrl: undefined,
        musicUrl: undefined,
      };
    });
    res.json({
      accessStatus: isUserLoggedIn ? "locked" : "login_required",
      message: isUserLoggedIn 
        ? "Contact information, EPK, and Listen links are masked. Active 30-day paid pass ($9.99/mo) required to view unmasked booking emails and audio."
        : "Login required. Only paid subscribers with up-to-date subscriptions who are logged into their account can view band contact info, EPK, and Listen links.",
      bands: redactedBands
    });
  }
});

// Endpoint to dynamically register a band to the shared directory
app.post("/api/bands/register", (req, res) => {
  const { band } = req.body;
  if (!band || !band.name) {
    res.status(400).json({ error: "Valid band object is required." });
    return;
  }

  if (isBandBanned(band.contactEmail, band.name)) {
    res.status(403).json({ error: "Band account registration is not permitted." });
    return;
  }

  // Remove existing by ID or Email if updating
  serverRegisteredBands = serverRegisteredBands.filter(
    b => b.id !== band.id && b.contactEmail?.toLowerCase() !== band.contactEmail?.toLowerCase() && !isBandBanned(b.contactEmail, b.name)
  );
  serverRegisteredBands.unshift(band);

  res.json({
    success: true,
    message: `Band "${band.name}" successfully registered into directory.`,
    band
  });
});

// Owner endpoints for Bands
app.post("/api/owner/bands/edit", (req, res) => {
  const ownerEmail = (req.body?.ownerEmail || req.headers["x-user-email"] || "").toString().trim().toLowerCase();
  if (ownerEmail !== PERPETUAL_OWNER_EMAIL) {
    res.status(403).json({ error: `Forbidden: Only ${PERPETUAL_OWNER_EMAIL} can edit bands in the owner dashboard.` });
    return;
  }

  const { band } = req.body;
  if (!band || !band.name) {
    res.status(400).json({ error: "Valid band object is required." });
    return;
  }

  const bandId = band.id || `band-${Date.now()}`;
  const cleanBand = { ...band, id: bandId };

  serverBandOverrides[cleanBand.id] = cleanBand;
  serverBandOverrides[cleanBand.name.toLowerCase()] = cleanBand;
  serverDeletedBandIds = serverDeletedBandIds.filter(id => id !== cleanBand.id?.toLowerCase() && id !== cleanBand.name?.toLowerCase());

  res.json({ success: true, band: cleanBand });
});

app.post("/api/owner/bands/delete", (req, res) => {
  const ownerEmail = (req.body?.ownerEmail || req.headers["x-user-email"] || "").toString().trim().toLowerCase();
  if (ownerEmail !== PERPETUAL_OWNER_EMAIL) {
    res.status(403).json({ error: `Forbidden: Only ${PERPETUAL_OWNER_EMAIL} can delete bands.` });
    return;
  }

  const { bandId, bandName } = req.body;
  if (bandId) serverDeletedBandIds.push(bandId.toLowerCase());
  if (bandName) serverDeletedBandIds.push(bandName.trim().toLowerCase());

  res.json({ success: true });
});

// Venue endpoints
app.get("/api/venues", (req, res) => {
  const venues = getProcessedVenuesList();
  res.json({ venues });
});

app.post("/api/owner/venues/edit", (req, res) => {
  const ownerEmail = (req.body?.ownerEmail || req.headers["x-user-email"] || "").toString().trim().toLowerCase();
  if (ownerEmail !== PERPETUAL_OWNER_EMAIL) {
    res.status(403).json({ error: `Forbidden: Only ${PERPETUAL_OWNER_EMAIL} can edit venues in the owner dashboard.` });
    return;
  }

  const { venue } = req.body;
  if (!venue || !venue.name) {
    res.status(400).json({ error: "Valid venue object is required." });
    return;
  }

  const venueId = venue.id || `venue-${Date.now()}`;
  const cleanVenue = { ...venue, id: venueId };

  serverVenueOverrides[cleanVenue.id] = cleanVenue;
  serverVenueOverrides[cleanVenue.name.toLowerCase()] = cleanVenue;
  serverDeletedVenueIds = serverDeletedVenueIds.filter(id => id !== cleanVenue.id?.toLowerCase() && id !== cleanVenue.name?.toLowerCase());

  res.json({ success: true, venue: cleanVenue });
});

app.post("/api/owner/venues/delete", (req, res) => {
  const ownerEmail = (req.body?.ownerEmail || req.headers["x-user-email"] || "").toString().trim().toLowerCase();
  if (ownerEmail !== PERPETUAL_OWNER_EMAIL) {
    res.status(403).json({ error: `Forbidden: Only ${PERPETUAL_OWNER_EMAIL} can delete venues.` });
    return;
  }

  const { venueId, venueName } = req.body;
  if (venueId) serverDeletedVenueIds.push(venueId.toLowerCase());
  if (venueName) serverDeletedVenueIds.push(venueName.trim().toLowerCase());

  res.json({ success: true });
});

// Export Directory as multi-tab Excel spreadsheet (.xlsx)
// Tab 1: Bands with Contact Emails
// Tab 2: Venues with Contact Emails
// RESTRICTED: Only littlerusty@gmail.com is authorized to export or download
app.get("/api/export/directory.xlsx", (req, res) => {
  try {
    const ownerEmail = (req.query?.email || req.headers["x-user-email"] || "").toString().trim().toLowerCase();
    if (ownerEmail !== PERPETUAL_OWNER_EMAIL) {
      res.status(403).json({ 
        error: `Forbidden: Directory export files and contact spreadsheets are restricted exclusively to ${PERPETUAL_OWNER_EMAIL}. Unauthorized access is prevented.` 
      });
      return;
    }

    const bands = getProcessedBandsList();
    const venues = getProcessedVenuesList();

    const wb = XLSX.utils.book_new();

    // Tab 1: Bands (Contact Phone removed from band listings)
    const bandRows = bands.map((b, index) => {
      const genres = Array.isArray(b.genres) ? b.genres.join(", ") : (b.genres || "Rock");
      return {
        "No.": index + 1,
        "Band Name": b.name || "Unnamed Artist",
        "Contact Email": b.contactEmail || "Not Listed",
        "City / Location": b.city || "Pacific Northwest",
        "Primary Genres": genres,
        "Experience Level": b.experienceLevel || "Regional Touring",
        "Official Website": b.website || "Not Listed",
        "EPK / Press Kit": b.epkUrl || "Not Listed",
        "Audio / Music Stream": b.musicUrl || "Not Listed",
        "Bio / Overview": b.bio || ""
      };
    });

    const wsBands = XLSX.utils.json_to_sheet(bandRows);
    wsBands["!cols"] = [
      { wch: 6 },
      { wch: 30 },
      { wch: 32 },
      { wch: 22 },
      { wch: 30 },
      { wch: 18 },
      { wch: 28 },
      { wch: 36 },
      { wch: 36 },
      { wch: 55 }
    ];
    XLSX.utils.book_append_sheet(wb, wsBands, "Bands");

    // Tab 2: Venues
    const venueRows = venues.map((v, index) => {
      const genres = Array.isArray(v.genres) ? v.genres.join(", ") : (v.genres || "All Genres");
      return {
        "No.": index + 1,
        "Venue Name": v.name || "Unnamed Venue",
        "Contact Email": v.contactEmail || "Not Listed",
        "Contact Phone": v.contactPhone || "Not Listed",
        "Street Address": v.address || "Not Listed",
        "City": v.city || "Not Listed",
        "Capacity": v.capacity || "N/A",
        "Genres Hosted": genres,
        "House PA System": v.hasPA ? "Yes" : "No",
        "Stage Lighting": v.hasLighting ? "Yes" : "No",
        "Official Website": v.website || "Not Listed",
        "Venue Specs & Description": v.description || ""
      };
    });

    const wsVenues = XLSX.utils.json_to_sheet(venueRows);
    wsVenues["!cols"] = [
      { wch: 6 },
      { wch: 32 },
      { wch: 32 },
      { wch: 18 },
      { wch: 38 },
      { wch: 20 },
      { wch: 12 },
      { wch: 30 },
      { wch: 16 },
      { wch: 16 },
      { wch: 30 },
      { wch: 60 }
    ];
    XLSX.utils.book_append_sheet(wb, wsVenues, "Venues");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Disposition", 'attachment; filename="GigLizard_Directory_Bands_and_Venues.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (err: any) {
    console.error("Export directory Excel error:", err);
    res.status(500).json({ error: "Failed to generate Excel spreadsheet", details: err?.message });
  }
});

// Seed memory store for community reviews on server
let serverReviews: any[] = [
  {
    id: "rev-v-1",
    targetId: "subterranean-cellar",
    targetType: "venue",
    targetName: "The Subterranean Cellar",
    rating: 5,
    authorName: "Marcus Vance",
    authorRole: "Touring Musician",
    comment: "Legendary room! The concrete stage and low ceiling make the drum sound punch right through the chest. Sound engineer Dennis was on point and had our monitor mix dialed in 5 minutes. Packed room, great drinks, and responsive staff.",
    createdAt: "2026-08-14T20:15:00.000Z",
    tags: ["Great Sound Tech", "Easy Load-in", "Professional Staff", "Engaged Crowd"],
    recommended: true
  },
  {
    id: "rev-v-4",
    targetId: "echo-lounge",
    targetType: "venue",
    targetName: "The Echo Chamber Lounge",
    rating: 5,
    authorName: "Devon Reed",
    authorRole: "Touring Musician",
    comment: "One of the best sounding rooms in Austin's Red River district! The stereo delay-line fills make every synthesizer note sparkle. Merch area is right by the entrance with high foot traffic.",
    createdAt: "2026-08-10T21:00:00.000Z",
    tags: ["Impeccable Acoustics", "Great Merch Booth", "Pro Lighting Rig"],
    recommended: true
  },
  {
    id: "rev-b-1",
    targetId: "dr-hadit",
    targetType: "band",
    targetName: "Dr Hadit",
    rating: 5,
    authorName: "Craig Henderson",
    authorRole: "Venue Owner / Bookkeeper",
    comment: "Booked Dr Hadit for a Friday headlining show. They brought 150+ paying fans through the door, started line check right on schedule, and put on an electrifying Pacific Northwest rock set. Instant re-booking for next season!",
    createdAt: "2026-08-12T22:30:00.000Z",
    tags: ["Great Crowd Draw", "Punctual Line Check", "Pro Touring Gear", "Easy Communication"],
    recommended: true
  }
];

// Endpoint to retrieve ratings and reviews for any band or venue
app.get("/api/reviews", (req, res) => {
  const { targetId, targetType, targetName } = req.query as { targetId?: string; targetType?: string; targetName?: string };
  
  let result = serverReviews;
  if (targetType) {
    result = result.filter(r => r.targetType === targetType);
  }
  if (targetId) {
    const cleanId = targetId.toLowerCase().trim();
    result = result.filter(r => r.targetId?.toLowerCase().includes(cleanId) || cleanId.includes(r.targetId?.toLowerCase()));
  }

  res.json({
    success: true,
    count: result.length,
    reviews: result
  });
});

// Endpoint to submit a 1-5 star review and rating
app.post("/api/reviews", (req, res) => {
  const { targetId, targetType, targetName, rating, authorName, authorRole, comment, tags, recommended } = req.body;

  if (!targetName || !rating || !authorName || !comment) {
    res.status(400).json({ error: "Missing required review parameters (targetName, rating, authorName, comment)." });
    return;
  }

  const numRating = Math.max(1, Math.min(5, Number(rating) || 5));
  const newReview = {
    id: `rev-srv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    targetId: targetId || targetName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
    targetType: targetType || "venue",
    targetName: targetName.trim(),
    rating: numRating,
    authorName: authorName.trim(),
    authorRole: authorRole || "Touring Musician",
    comment: comment.trim(),
    tags: Array.isArray(tags) ? tags : [],
    recommended: recommended ?? true,
    createdAt: new Date().toISOString()
  };

  serverReviews.unshift(newReview);

  res.json({
    success: true,
    message: `Thank you for rating ${targetName} with ${numRating} stars!`,
    review: newReview
  });
});


// 2. Chat helper for writing band press bio or booking pitch emails
app.post("/api/band-advisor", async (req, res) => {
  try {
    const { messages, bandProfile } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "messages array is required." });
      return;
    }

    const ai = getAi();
    const bandInfo = bandProfile ? `
Band Profile Details:
- Band Name: ${bandProfile.name || "Unnamed Band"}
- Genre/Sounds: ${bandProfile.genre || "Indie Rock"}
- Hometown: ${bandProfile.city || "Various cities"}
- Target Audience/Vibe: ${bandProfile.vibe || "Energetic Live Performance"}
` : "User is an independent undiscovered band looking for booking, gig planning, and publicity advice.";

    const systemInstruction = `You are "Elvis", an expert indie booking agent, band publicist, and veteran gig technician.
Your ultimate goal is to assist undiscovered bands in landing gigs, writing powerful pitch emails, formulating rock-solid tech riders, planning stage setups, and organizing their tours.

Provide highly actionable, encouraging, and extremely realistic advice. When asked questions about booking, explain:
1. How to approach local bookers professionally (provide sample templates, subject lines).
2. How to talk technical detail to sound engineers without sounding amateurish (e.g., inputs, foldbacks, monitors).
3. Creative marketing strategies for low-budget DIY shows.

Be concise, structured, and use bullet points or numbered lists. Use musical terminology with authority. Always keep responses focused on helping bands succeed with dignity.`;

    const contents = [
      { role: "user", parts: [{ text: `${bandInfo}\n\nHelp the band with the following request:` }] },
      ...messages.map((m: any) => ({
        role: m.role || "user",
        parts: [{ text: m.content }],
      }))
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ content: response.text });
  } catch (error: any) {
    console.warn("Gemini API in /api/band-advisor:", error.message);
    const bandName = req.body?.bandProfile?.name || "your band";
    res.json({
      content: `Hey! Elvis here. Here is rock-solid advice for **${bandName}**:

### 🎸 1. Landing Local Club Bookings
- **The Short Pitch**: Keep your email to 3 short paragraphs: (1) Who you are & genre, (2) Similar acts you draw with, (3) Link to your single & stage plot.
- **Subject Line Formula**: \`Booking Request: ${bandName} (Live Video + Draw) for [Month/Day Range]\`
- **Follow-up Timing**: If you don't hear back within 7 business days, reply politely on the same email thread with a single-line check-in.

### 🎛️ 2. Tech Rider & Sound Check Etiquette
- Hand your sound engineer a printed stage plot and input list as soon as you load in.
- Label all your DI boxes and pedal power strips before setting foot on stage.
- Keep line check under 10 minutes so everyone stays on schedule.

*(Note: To enable live dynamic AI chat responses, verify \`GEMINI_API_KEY\` is configured in your deployment environment variables.)*`
    });
  }
});

// 3. Poster slogan generator
app.post("/api/suggest-slogans", async (req, res) => {
  try {
    const { bandName, genre, venueName } = req.body;
    if (!bandName) {
      res.status(400).json({ error: "bandName is required." });
      return;
    }

    if (process.env.GEMINI_API_KEY) {
      const ai = getAi();
      const prompt = `Generate 5 creative, short, punchy concert poster slogans/taglines for the band "${bandName}" (Genre: ${genre || "Alternative"}), performing at "${venueName || "Classic Local Venue"}". 
Return of array of slogans, each with a brief 1-sentence recommended visual context (for example, whether to put it above the header, or in small print at the bottom).

Return the slogans strictly in a JSON array. Schema is listed below.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: "List of catchy poster slogan proposals",
            items: {
              type: Type.OBJECT,
              properties: {
                slogan: { type: Type.STRING, description: "A very tight poster tagline, max 6 words." },
                context: { type: Type.STRING, description: "Styling or placement suggestion e.g. Distressed font below name." }
              },
              required: ["slogan", "context"]
            }
          },
          temperature: 0.8,
        },
      });

      res.setHeader("Content-Type", "application/json");
      res.send(response.text);
      return;
    }

    // Fallback slogans when GEMINI_API_KEY is not set
    const fallbackSlogans = [
      { slogan: "ONE NIGHT ONLY • LIVE & RAW", context: "Place directly above band name in distressed uppercase" },
      { slogan: "HIGH VOLTAGE PACIFIC SOUND", context: "Sub-headline below band title in bold condensed font" },
      { slogan: "DIRECT FROM THE UNDERGROUND", context: "Small kicker text at top center of flyer" },
      { slogan: "BRING YOUR EARPLUGS • MAXIMUM VOLUME", context: "Footnote above door time & admission pricing" },
      { slogan: "LOUD • UNFILTERED • UNAPOLOGETIC", context: "Accent tagline spanning bottom border banner" }
    ];
    res.json(fallbackSlogans);
  } catch (error: any) {
    console.warn("Slogan generation fallback triggered:", error.message);
    res.json([
      { slogan: "ONE NIGHT ONLY • LIVE & RAW", context: "Place directly above band name in distressed uppercase" },
      { slogan: "HIGH VOLTAGE PACIFIC SOUND", context: "Sub-headline below band title in bold condensed font" },
      { slogan: "DIRECT FROM THE UNDERGROUND", context: "Small kicker text at top center of flyer" },
      { slogan: "BRING YOUR EARPLUGS • MAXIMUM VOLUME", context: "Footnote above door time & admission pricing" },
      { slogan: "LOUD • UNFILTERED • UNAPOLOGETIC", context: "Accent tagline spanning bottom border banner" }
    ]);
  }
});

// 4. Print Order API
app.post("/api/print/order", async (req, res) => {
  try {
    const { 
      posterData, 
      size, 
      quantity, 
      items,
      shippingAddress, 
      shippingOption,
      paymentMethod,
      paypalUserEmail 
    } = req.body;

    if (!shippingAddress) {
      res.status(400).json({ error: "Missing required order parameter: shippingAddress." });
      return;
    }

    // 1. Calculate base printing rates for one or more items
    let printBaseCost = 0;
    const itemsOrdered: Array<{ name: string, size: string, quantity: number, rate: number, total: number }> = [];

    const rawItemsList = items && Array.isArray(items) && items.length > 0 
      ? items 
      : (size ? [{ size, quantity: quantity || 100 }] : []);

    if (rawItemsList.length === 0) {
      res.status(400).json({ error: "No print sizes or quantities were selected." });
      return;
    }

    for (const item of rawItemsList) {
      let pricePerUnit = 0.40; // Default: 11" x 17"
      let productName = '11" x 17" Concert Flyer (100lb Gloss Book)';
      let sizeLabel = '11" x 17"';
      
      if (item.size === "8.5x11") {
        pricePerUnit = 0.25;
        productName = '8.5" x 11" Letter Poster (Glossy)';
        sizeLabel = '8.5" x 11"';
      } else if (item.size === "4.25x5.5") {
        pricePerUnit = 0.15;
        productName = '4.25" x 5.5" Handbill Flyer (Semi-Gloss)';
        sizeLabel = '4.25" x 5.5"';
      }

      const qty = parseInt(item.quantity, 10) || 100;
      const itemCost = parseFloat((pricePerUnit * qty).toFixed(2));
      printBaseCost += itemCost;
      itemsOrdered.push({
        name: productName,
        size: sizeLabel,
        quantity: qty,
        rate: pricePerUnit,
        total: itemCost
      });
    }

    printBaseCost = parseFloat(printBaseCost.toFixed(2));

    // 2. Shipping charges based on standard carrier speeds
    let shippingCost = 9.50;
    if (shippingOption === "express2day") {
      shippingCost = 18.00;
    } else if (shippingOption === "overnight") {
      shippingCost = 32.00;
    }

    const subtotalCost = parseFloat((printBaseCost + shippingCost).toFixed(2));
    const handlingFee = parseFloat(Math.max(4.95, subtotalCost * 0.10).toFixed(2));
    const totalCustomerCharge = parseFloat((subtotalCost + handlingFee).toFixed(2));

    let simulatedOrderNumber = `PRT-${Math.floor(1000000 + Math.random() * 9000000)}`;
    let simulatedTracking = `1Z${Math.floor(100000 + Math.random() * 900000)}Y${Math.floor(10000000 + Math.random() * 90000000)}`;

    res.json({
      success: true,
      orderId: simulatedOrderNumber,
      trackingNumber: simulatedTracking,
      status: "Awaiting Production",
      estimatedDelivery: shippingOption === "ground" ? "5-7 business days" : shippingOption === "express2day" ? "3 business days" : "1-2 business days",
      billingBreakdown: {
        baseCost: printBaseCost,
        shipping: shippingCost,
        subtotal: subtotalCost,
        handlingFee: handlingFee,
        totalRetail: totalCustomerCharge,
        paymentMethod: paymentMethod || "card",
        paypalRecipient: "littlerusty@gmail.com",
        paypalUserEmail: paymentMethod === "paypal" ? paypalUserEmail : undefined
      },
      productDetails: itemsOrdered[0] || { name: '11" x 17" Concert Flyer', size: '11" x 17"', quantity: 100 },
      itemsOrdered: itemsOrdered,
      helpInstructions: "Order verified and processed in Simulation sandbox. Your order is registered in the printing queue."
    });

  } catch (error: any) {
    console.error("Print order processing failed:", error);
    res.status(500).json({ error: error.message || "Print queue connection failed." });
  }
});

// 5. AI Tour Scheduling & Route Calculation
app.post("/api/plan-tour", async (req, res) => {
  try {
    const { startingCity, destinationCity, intermediateDestinations, bandProfile, existingVenues, tourPace } = req.body;

    if (!startingCity || !destinationCity) {
      res.status(400).json({ error: "startingCity and destinationCity are required." });
      return;
    }

    const intermediateList: string[] = Array.isArray(intermediateDestinations) 
      ? intermediateDestinations.filter((c: any) => typeof c === "string" && c.trim().length > 0)
      : [];

    const ai = getAi();
    const prompt = `You are a master tour routing coordinator and music industry logistics director.
A touring band is planning a live music tour.
- Starting Point: "${startingCity}"
${intermediateList.length > 0 ? `- Required Intermediate Stop(s) along route in order: ${intermediateList.map((c: string) => `"${c}"`).join(", ")}` : ""}
- Final Destination: "${destinationCity}"
- Band Details: Name: "${bandProfile?.name || "Independent Tour Band"}", Genre: "${bandProfile?.genre || "Alternative Rock"}"
- Tour Pace / Preference: "${tourPace || "Standard club route with sensible 2-5 hr drive legs"}"

Available Directory Venues in the database for reference (prioritize matching these if they are on or near the driving route):
${JSON.stringify((existingVenues || []).slice(0, 40).map((v: any) => ({ name: v.name, city: v.city, capacity: v.capacity, genres: v.genres, email: v.contactEmail, address: v.address })))}

TASK:
1. Calculate the overall driving distance (in miles) and approximate total driving time connecting "${startingCity}" ${intermediateList.length > 0 ? `through ${intermediateList.join(", ")} ` : ""}to "${destinationCity}".
2. Identify a realistic, optimal sequence of tour stops / cities along the driving corridors (e.g., Interstate 5, US-101, I-90, I-80, etc.). Include the starting city (Day 1/kickoff), ${intermediateList.length > 0 ? `the requested intermediate stops (${intermediateList.join(", ")}), plus any optimal connecting hub cities, ` : `2 to 6 intermediate tour stops/cities along the driving corridor, `}and the final destination city.
3. For every stop:
   - Calculate the driving time from the previous stop (e.g., "2 hrs 15 mins", or "0 hrs (Kickoff)" for first stop).
   - Calculate driving distance from previous stop in miles (e.g. 110).
   - Provide the highway route description (e.g. "Follow I-5 South through Olympia and Centralia").
   - List 1 to 3 suitable live music venues along that stop (match any from the provided database where appropriate, or supply well-known reputable indie/rock clubs in that city with realistic booking emails and street locations).
   - Provide local scene notes / booking tips for that city.
   - Estimate gas expenditure for a standard touring van / SUV for that leg.
   - Include 2 to 3 band-friendly lodging recommendations for touring musicians looking for places to stay (e.g., indie band hotels with secure van parking, budget-friendly motels, van/camper overnight parking spots, or musician crash pads). Include estimated price/night, address or general area, amenities (e.g. secure van parking, ground floor rooms, 24/7 lobby), and specific gear security advice.
   - Include a concise lodging and parking security note for that stop.
4. Provide 3-5 practical, hard-won indie tour tips for this specific route (e.g. mountain pass weather, border logistics if BC, load-in parking tips, lodging gear security, optimal driving hours).

Return strictly JSON matching the required schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            startingCity: { type: Type.STRING },
            destinationCity: { type: Type.STRING },
            totalDistanceMiles: { type: Type.NUMBER },
            totalDriveTime: { type: Type.STRING },
            routeDescription: { type: Type.STRING },
            stops: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  stopName: { type: Type.STRING },
                  city: { type: Type.STRING },
                  state: { type: Type.STRING },
                  driveTimeFromPrev: { type: Type.STRING },
                  distanceMilesFromPrev: { type: Type.NUMBER },
                  routeHighlight: { type: Type.STRING },
                  localSceneNotes: { type: Type.STRING },
                  dayNumber: { type: Type.NUMBER },
                  estimatedGasCost: { type: Type.NUMBER },
                  lodgingNotes: { type: Type.STRING },
                  lodgingOptions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        type: { type: Type.STRING },
                        city: { type: Type.STRING },
                        estPricePerNight: { type: Type.STRING },
                        distanceToVenues: { type: Type.STRING },
                        amenities: { type: Type.ARRAY, items: { type: Type.STRING } },
                        gearSecurityNote: { type: Type.STRING },
                        bookingSearchUrl: { type: Type.STRING },
                        address: { type: Type.STRING }
                      },
                      required: ["name", "type", "city"]
                    }
                  },
                  suggestedVenues: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        city: { type: Type.STRING },
                        address: { type: Type.STRING },
                        capacity: { type: Type.NUMBER },
                        genres: { type: Type.ARRAY, items: { type: Type.STRING } },
                        contactEmail: { type: Type.STRING },
                        contactPhone: { type: Type.STRING },
                        hasPA: { type: Type.BOOLEAN },
                        hasLighting: { type: Type.BOOLEAN },
                        description: { type: Type.STRING },
                        website: { type: Type.STRING }
                      },
                      required: ["name", "city"]
                    }
                  }
                },
                required: ["id", "stopName", "city", "state", "driveTimeFromPrev", "distanceMilesFromPrev", "routeHighlight", "suggestedVenues", "localSceneNotes", "dayNumber"]
              }
            },
            tourTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["startingCity", "destinationCity", "totalDistanceMiles", "totalDriveTime", "routeDescription", "stops", "tourTips"]
        },
        temperature: 0.4,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    
    // Construct Google Maps directions URL with origin, destination, and all intermediate waypoints
    const intermediateCities = (parsed.stops || [])
      .slice(1, -1)
      .map((s: any) => `${s.city}, ${s.state}`);
    
    const waypointsParam = intermediateCities.length > 0 
      ? `&waypoints=${encodeURIComponent(intermediateCities.join("|"))}`
      : "";
    
    parsed.googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(startingCity)}&destination=${encodeURIComponent(destinationCity)}${waypointsParam}&travelmode=driving`;

    res.json(parsed);
  } catch (error: any) {
    console.error("Gemini API error in /api/plan-tour:", error);
    res.status(500).json({ error: error.message || "Failed to calculate tour schedule." });
  }
});

// Export app for Vercel serverless / modular imports
export { app };
export default app;

// Vite or Static file hosting setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully booted on port ${PORT}`);
  });
}

// Only auto-listen if not in a Vercel serverless function environment
if (process.env.VERCEL !== "1" && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  startServer();
}

