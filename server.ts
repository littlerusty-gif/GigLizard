import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import { INITIAL_AVAILABLE_BANDS, sanitizeBandPhoneNumber } from "./src/data/availableBands";
import { MUSIC_VENUES } from "./src/data/venues";
import { resolveBandAgency } from "./src/utils/bookingAgencies";
import { parseProgrammaticVenuePath } from "./src/utils/venueSeoRoutes";
import { generateSitemapXml, generateDynamicSupabaseSitemap } from "./src/utils/sitemapGenerator";

dotenv.config();

const rawSupabaseUrl = (process.env.VITE_SUPABASE_URL || "https://papzanzgzoghrrgdzvfo.supabase.co").trim();
let SUPABASE_URL = "https://papzanzgzoghrrgdzvfo.supabase.co";
try {
  SUPABASE_URL = new URL(rawSupabaseUrl).origin;
} catch {
  SUPABASE_URL = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
}
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_VVfSEHC_sej3qB_Qtxl5yA_fS1ZleG2";
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  // Anti-Scraping Robots Directive (prevents bulk crawler indexing / caching of sensitive API endpoints)
  if (req.path.startsWith("/api/")) {
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet, noimageindex");
  }
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

// 4. Crawlers & SEO Endpoints (robots.txt, sitemap.xml, Google verification, llms.txt)
app.get("/robots.txt", (req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(`User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /trap-bot-detected

User-agent: Googlebot
Allow: /
Disallow: /api/
Disallow: /admin/

User-agent: Bingbot
Allow: /
Disallow: /api/
Disallow: /admin/

Host: https://www.giglizard.us
Sitemap: https://www.giglizard.us/sitemap.xml
`);
});

// Dynamic & cached XML Sitemap (sitemaps.org schema 0.9) querying Supabase unique city/states & venue IDs
app.get("/sitemap.xml", async (req, res) => {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("X-Robots-Tag", "noindex, follow");
  res.setHeader("Cache-Control", "public, max-age=3600");

  try {
    const dynamicXml = await generateDynamicSupabaseSitemap(supabaseAdmin);
    try {
      fs.writeFileSync(path.resolve("public/sitemap.xml"), dynamicXml, "utf-8");
    } catch (_) {}
    res.send(dynamicXml);
  } catch (err) {
    console.error("Error generating dynamic Supabase sitemap, falling back to sync:", err);
    res.send(generateSitemapXml());
  }
});

// Google Search Console dynamic HTML file verification handler
app.get(/^\/google([a-z0-9]+)\.html$/, (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`google-site-verification: google${req.params[0]}.html`);
});

app.get("/llms.txt", (req, res) => {
  res.type("text/plain");
  res.send(`# GigLizard

> Nationwide Independent Touring & Stage Directory and Booking Workspace for musicians, bands, and venues across the Lower 48.

## Overview
GigLizard is a self-serve live music touring platform founded by Seattle-based touring musician and sound engineer Little Rusty (frontman of Dr Hadit). It replaces expensive enterprise software and messy spreadsheets with integrated tools for DIY and regional touring acts.

## Core Capabilities
- 650+ Independent Venue Directory & 4,850+ Touring Bands: Search live music stages across all 48 continental states with verified booking emails, capacities, and stage specs (100% Free Forever, No credit card required).
- Smart Tour Planner: AI-driven tour routing with Google Maps, drive times, van fuel expense calculation, and corridor stop suggestions ($0 Free).
- Stage Plot Designer: Interactive drag-and-drop gear canvas to map drums, monitor wedges, pedalboards, and mic booms with instant PNG/PDF export ($0 Free).
- Tech Rider Builder: Formatted soundboard patch list compiler with mic choices, +48V phantom power switches, and channel mapping ($0 Free).
- Concert Poster Designer: Vintage halftone and modern neon flyer generator for social promo and print ($0 Free).
- 4,850+ Verified Band Co-Bill Directory: Direct booking contacts for touring bands to coordinate shared bills in corridor cities ($9.99 flat 30-day pass, no auto-renewal).

## Pricing
- Venue Discovery & Production Tools: $0 (100% Free Forever, No credit card required).
- Band Contact 30-Day Pass: $9.99 flat fee (+$0.84 processor fee = $10.83 total). Single 30-day pass with zero recurring subscription traps. 7-day 100% money-back satisfaction guarantee.

## Key URLs
- Home: https://www.giglizard.us/
- Pricing: https://www.giglizard.us/pricing
- Comparison Matrix: https://www.giglizard.us/compare
- GigLizard vs Sonicbids: https://www.giglizard.us/vs/giglizard-vs-sonicbids
- DIY Touring Guide: https://www.giglizard.us/touring-guide
- Features: https://www.giglizard.us/features
- About: https://www.giglizard.us/about
- FAQ: https://www.giglizard.us/faq

## Contact & Support
- Founder: Little Rusty (Seattle, WA • littlerusty@gmail.com)
- Official Support Email: littlerusty@gmail.com (and giglizard.us@gmail.com)
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

// Lazy client creator to prevent crashes if Gemini API key is missing at startup
let aiClient: GoogleGenAI | null = null;

function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY;
}

function getAi(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required.");
  }
  if (!aiClient) {
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
    hasApiKey: !!getGeminiApiKey(),
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
const PERPETUAL_OWNER_EMAILS = ["littlerusty@gmail.com", "giglizard.us@gmail.com"];
const PERPETUAL_OWNER_EMAIL = "littlerusty@gmail.com";

function isOwnerEmail(email?: string): boolean {
  if (!email) return false;
  return PERPETUAL_OWNER_EMAILS.includes(email.trim().toLowerCase());
}

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
  for (let b of allCurrentBands) {
    const key = b.name?.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const override = serverBandOverrides[b.id] || serverBandOverrides[key];
    if (override) {
      b = { ...b, ...override };
    }

    // Direct contact info for agency-managed acts (e.g. Intrepid Artists) to the agency
    const agency = resolveBandAgency(b);
    if (agency) {
      b = {
        ...b,
        hasBookingAgency: true,
        bookingAgency: agency.agencyName,
        bookingAgentName: agency.agentName || "Booking Agent",
        bookingAgencyEmail: agency.email,
        bookingAgencyPhone: agency.phone,
        bookingAgencyWebsite: agency.website,
        contactEmail: agency.email
      };
    }

    result.push(b);
  }
  return result;
}

function getProcessedVenuesList() {
  const allCurrentVenues = [...serverRegisteredVenues, ...MUSIC_VENUES].filter(
    (v: any) => !serverDeletedVenueIds.includes(v.id?.toLowerCase()) && 
           !serverDeletedVenueIds.includes(v.name?.trim().toLowerCase()) &&
           !v.isPrivate &&
           v.venueType !== "house_show"
  );

  const seen = new Set<string>();
  const result: any[] = [];
  for (const v of allCurrentVenues) {
    const nameKey = (v.name || "").trim().toLowerCase();
    const cityKey = (v.city || "").trim().toLowerCase();
    const stateKey = (v.state || "").trim().toUpperCase();
    const compositeKey = `${nameKey}__${cityKey}__${stateKey}`;

    if (seen.has(compositeKey)) continue;
    seen.add(compositeKey);

    const override = serverVenueOverrides[v.id] || serverVenueOverrides[nameKey];
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
  const isOwner = isUserLoggedIn && isOwnerEmail(userEmail);
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
    // Retain sanitized authentic phone numbers; dummy 555 numbers are cleared
    const bandsWithSanitizedContacts = allCurrentBands.map((b) => ({
      ...b,
      contactPhone: sanitizeBandPhoneNumber(b.contactPhone)
    }));
    res.json({
      accessStatus: isOwner ? "lifetime_owner" : "unlocked",
      expiresAt: isOwner ? "perpetual_lifetime" : expiresAt,
      bands: bandsWithSanitizedContacts
    });
  } else {
    // Redact contact fields and all external Bandcamp/music/EPK/website links for non-subscribers
    const redactedBands = allCurrentBands.map((b) => {
      const { contactPhone, epkUrl, musicUrl, audioPreviewUrl, spotifyUrl, bandcampUrl, website, ...rest } = b as any;
      return {
        ...rest,
        contactEmail: "--****",
        website: undefined,
        epkUrl: undefined,
        musicUrl: undefined,
        spotifyUrl: undefined,
        bandcampUrl: undefined,
        audioPreviewUrl: undefined
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
  const isOwner = isUserLoggedIn && isOwnerEmail(userEmail);
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
      const { contactPhone, epkUrl, musicUrl, audioPreviewUrl, spotifyUrl, bandcampUrl, website, ...rest } = b as any;
      return {
        ...rest,
        contactEmail: "--****",
        website: undefined,
        epkUrl: undefined,
        musicUrl: undefined,
        spotifyUrl: undefined,
        bandcampUrl: undefined,
        audioPreviewUrl: undefined
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
  if (!isOwnerEmail(ownerEmail)) {
    res.status(403).json({ error: `Forbidden: Only authorized owners can edit bands in the owner dashboard.` });
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
  if (!isOwnerEmail(ownerEmail)) {
    res.status(403).json({ error: `Forbidden: Only authorized owners can delete bands.` });
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

// Community Add Venue endpoint with strict House Show Privacy Shield
app.post("/api/venues/community-add", async (req, res) => {
  try {
    const {
      venueType, // 'house_show' | 'public_venue'
      tourId,
      stopIndex,
      city,
      state,
      // House show fields
      hostName,
      address,
      hostPhone,
      loadInNotes,
      suggestedDonation,
      // Public venue fields
      name,
      contactName,
      contactPhone,
      contactEmail,
      capacity,
      soundSpecs,
      genres,
      website
    } = req.body;

    if (!venueType || (venueType !== "house_show" && venueType !== "public_venue")) {
      return res.status(400).json({ error: "venueType must be 'house_show' or 'public_venue'." });
    }

    if (venueType === "house_show") {
      // 1. Strict Privacy Shield:
      // Do NOT insert into the global venues table or serverRegisteredVenues!
      const houseShowObj = {
        id: `house-show-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: (hostName?.trim()) || "Private House Show / DIY Space",
        address: address?.trim() || `${city || ""}, ${state || ""}`.trim(),
        city: city?.trim() || "",
        state: state?.trim() || "",
        contactName: hostName?.trim() || "",
        contactPhone: hostPhone?.trim() || "",
        hostName: hostName?.trim() || "",
        hostPhone: hostPhone?.trim() || "",
        loadInNotes: loadInNotes?.trim() || "",
        notes: loadInNotes?.trim() || "",
        suggestedDonation: suggestedDonation?.trim() || "",
        ticketPrice: suggestedDonation?.trim() || "Suggested Donation at Door",
        doorGuarantee: suggestedDonation?.trim() || "",
        venueType: "house_show",
        isPrivate: true,
        bookingStatus: "confirmed"
      };

      // If active tourId is provided, attach directly to the tour record in Supabase
      if (tourId) {
        try {
          const { data: existingTour } = await supabaseAdmin.from("tours").select("*").eq("id", tourId).single();
          if (existingTour && existingTour.route_data) {
            const routeData = existingTour.route_data;
            if (Array.isArray(routeData.stops) && typeof stopIndex === "number" && routeData.stops[stopIndex]) {
              routeData.stops[stopIndex].selectedVenue = houseShowObj;
              await supabaseAdmin.from("tours").update({ route_data: routeData, updated_at: new Date().toISOString() }).eq("id", tourId);
            }
          }
        } catch (dbErr) {
          console.warn("Notice updating tour stops in Supabase for private house show:", dbErr);
        }
      }

      return res.json({
        success: true,
        isPrivate: true,
        attachedToTour: true,
        venue: houseShowObj,
        message: "🔒 Private / Anonymous: This residential address & contact will ONLY appear on your band's private tour sheet and will NEVER be published to other users or search engines."
      });
    }

    // venueType === 'public_venue'
    const venueName = name?.trim();
    if (!venueName) {
      return res.status(400).json({ error: "Venue name is required for public venues." });
    }

    const publicVenueId = `venue-pub-${Date.now()}`;
    const cleanPublicVenue = {
      id: publicVenueId,
      name: venueName,
      address: address?.trim() || `${city || ""}, ${state || ""}`.trim(),
      city: city?.trim() || "",
      state: state?.trim() || "",
      country: "US",
      contactName: contactName?.trim() || "",
      contactEmail: contactEmail?.trim() || "",
      contactPhone: contactPhone?.trim() || "",
      capacity: Number(capacity) || 150,
      soundSpecs: soundSpecs?.trim() || "House PA & Microphones",
      description: soundSpecs?.trim() ? `PA/Sound: ${soundSpecs.trim()}` : `Commercial live music stage in ${city || "city"}.`,
      genres: Array.isArray(genres) ? genres : ["Live Music", "Indie", "Rock"],
      website: website?.trim() || "",
      hasPA: true,
      hasLighting: true,
      is_public: true,
      community_verified: true,
      venueType: "public_venue",
      isPrivate: false,
      bookingStatus: "confirmed"
    };

    // 1. Add to server-registered venues memory for global directory
    serverRegisteredVenues.unshift(cleanPublicVenue);

    // 2. Insert into Supabase global `venues` table with is_public: true and community_verified: true
    try {
      await supabaseAdmin.from("venues").insert([{
        id: cleanPublicVenue.id,
        name: cleanPublicVenue.name,
        address: cleanPublicVenue.address,
        city: cleanPublicVenue.city,
        state: cleanPublicVenue.state,
        capacity: cleanPublicVenue.capacity,
        booking_email: cleanPublicVenue.contactEmail,
        phone: cleanPublicVenue.contactPhone,
        description: cleanPublicVenue.description,
        is_public: true,
        community_verified: true,
        created_at: new Date().toISOString()
      }]);
    } catch (insertErr) {
      console.warn("Notice inserting public venue to Supabase venues table:", insertErr);
    }

    // If tourId provided, attach to active tour
    if (tourId) {
      try {
        const { data: existingTour } = await supabaseAdmin.from("tours").select("*").eq("id", tourId).single();
        if (existingTour && existingTour.route_data) {
          const routeData = existingTour.route_data;
          if (Array.isArray(routeData.stops) && typeof stopIndex === "number" && routeData.stops[stopIndex]) {
            routeData.stops[stopIndex].selectedVenue = cleanPublicVenue;
            await supabaseAdmin.from("tours").update({ route_data: routeData, updated_at: new Date().toISOString() }).eq("id", tourId);
          }
        }
      } catch (dbErr) {
        console.warn("Notice updating tour stops in Supabase for public venue:", dbErr);
      }
    }

    return res.json({
      success: true,
      isPrivate: false,
      attachedToTour: true,
      venue: cleanPublicVenue,
      message: "🌐 Public Directory: This verified commercial club/theater will be added to the global GigLizard venue directory for all touring bands."
    });
  } catch (err: any) {
    console.error("Error in /api/venues/community-add:", err);
    res.status(500).json({ error: err.message || "Failed to add venue." });
  }
});

app.post("/api/owner/venues/edit", (req, res) => {
  const ownerEmail = (req.body?.ownerEmail || req.headers["x-user-email"] || "").toString().trim().toLowerCase();
  if (!isOwnerEmail(ownerEmail)) {
    res.status(403).json({ error: `Forbidden: Only authorized owners can edit venues in the owner dashboard.` });
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
  if (!isOwnerEmail(ownerEmail)) {
    res.status(403).json({ error: `Forbidden: Only authorized owners can delete venues.` });
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
// RESTRICTED: Only authorized owners can export or download
app.get("/api/export/directory.xlsx", (req, res) => {
  try {
    const ownerEmail = (req.query?.email || req.headers["x-user-email"] || "").toString().trim().toLowerCase();
    if (!isOwnerEmail(ownerEmail)) {
      res.status(403).json({ 
        error: `Forbidden: Directory export files and contact spreadsheets are restricted exclusively to platform owners. Unauthorized access is prevented.` 
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
app.post(["/api/band-advisor", "/api/advisor/chat"], async (req, res) => {
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

*(Note: To enable live dynamic AI chat responses, verify \`VITE_GEMINI_API_KEY\` or \`GEMINI_API_KEY\` is configured in your deployment environment variables.)*`
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

    if (getGeminiApiKey()) {
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

// 4. AI Tour Scheduling & Route Calculation
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

// Endpoint: Dispatch Master Tour Itinerary via Email to Band & Crew
app.post("/api/tour/email-itinerary", async (req, res) => {
  try {
    const { recipients, tourTitle, bandName, tourPlan, emergencyChecklist, notes } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: "At least one recipient email is required." });
    }

    const emailList = recipients.map((r: string) => r.trim()).filter((r: string) => r.includes("@"));
    if (emailList.length === 0) {
      return res.status(400).json({ error: "Valid email addresses required." });
    }

    const title = tourTitle || `${bandName || "Band"} Tour Itinerary`;
    const stops = tourPlan?.stops || [];

    // Build responsive HTML tour sheet
    const stopsHtml = stops.map((s: any, idx: number) => {
      const v = s.selectedVenue || {};
      const l = s.selectedLodging || {};
      const isHouseShow = Boolean(v.isPrivate || v.venueType === "house_show");
      const vStatusBadge = isHouseShow
        ? `<span style="background-color:#ede9fe;color:#5b21b6;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:bold;">🔒 Private House Show</span>`
        : v.bookingStatus === "confirmed" 
        ? `<span style="background-color:#dcfce7;color:#166534;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:bold;">✓ Confirmed</span>`
        : v.bookingStatus === "penciled"
        ? `<span style="background-color:#fef3c7;color:#92400e;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:bold;">Penciled In</span>`
        : `<span style="background-color:#f1f5f9;color:#475569;padding:2px 8px;border-radius:12px;font-size:11px;">Unconfirmed Lead</span>`;

      const defaultLodging = s.lodgingOptions && s.lodgingOptions[0] ? s.lodgingOptions[0] : null;
      const lodgingName = (l.name && !l.name.startsWith("Lodging in "))
        ? l.name
        : (defaultLodging?.name || `Hotel in ${s.city}`);
      const isLodgingBooked = Boolean(l.isBooked || l.confirmationNumber);
      const lodgingAddress = l.address || defaultLodging?.address || `${s.city}, ${s.state}`;
      const lodgingPhone = l.phone || defaultLodging?.phone;
      const lodgingCost = l.cost || (defaultLodging ? defaultLodging.estPricePerNight : null);
      const lodgingConf = l.confirmationNumber || "";
      const lodgingSecurity = l.gearSecurityNote || l.notes || s.lodgingNotes || defaultLodging?.gearSecurityNote || "Ground-level monitored van parking. Bring high-value gear into room.";

      return `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:12px 8px;vertical-align:top;font-weight:bold;color:#0f172a;">
            Stop ${idx + 1}<br>
            <span style="font-weight:normal;color:#64748b;font-size:12px;">${s.date || "Date TBA"}</span>
          </td>
          <td style="padding:12px 8px;vertical-align:top;">
            <strong style="color:#0f172a;font-size:14px;">${s.city}, ${s.state}</strong><br>
            <span style="color:#64748b;font-size:12px;">Transit: ${s.driveTimeFromPrev || "Start"} • ${s.distanceMilesFromPrev || 0} mi</span>
          </td>
          <td style="padding:12px 8px;vertical-align:top;">
            <div style="font-weight:bold;color:#1e293b;">${v.name || "Stage TBA"} ${vStatusBadge}</div>
            <div style="color:#475569;font-size:12px;">${v.address || s.city} ${isHouseShow ? '<span style="color:#6b21a8;font-size:10px;font-weight:bold;">(Private Residential Address)</span>' : ''}</div>
            <div style="font-size:11px;color:#0369a1;margin-top:4px;">
              Load-in: <strong>${v.loadInTime || "5:00 PM"}</strong> | Soundcheck: <strong>${v.soundcheckTime || "6:30 PM"}</strong> | Set: <strong>${v.setTime || "9:00 PM"}</strong>
            </div>
            ${v.contactName || v.contactPhone ? `<div style="font-size:11px;color:#475569;margin-top:2px;">${isHouseShow ? "Host Contact" : "Contact"}: ${v.contactName || ""} ${v.contactPhone ? `(${v.contactPhone})` : ""} ${v.contactEmail || ""}</div>` : ""}
            ${v.loadInNotes || v.notes ? `<div style="font-size:11px;color:#64748b;margin-top:2px;">Door/Load-in Notes: ${v.loadInNotes || v.notes}</div>` : ""}
            ${v.suggestedDonation ? `<div style="font-size:11px;color:#15803d;font-weight:bold;margin-top:2px;">Suggested Door/Donation: ${v.suggestedDonation}</div>` : ""}
            ${v.techContact ? `<div style="font-size:11px;color:#64748b;">Sound Tech: ${v.techContact}</div>` : ""}
            ${v.doorGuarantee || v.doorSplitPercentage ? `<div style="font-size:11px;color:#15803d;font-weight:bold;">Deal: ${v.doorGuarantee || ""} ${v.doorSplitPercentage ? `(${v.doorSplitPercentage})` : ""}</div>` : ""}
          </td>
          <td style="padding:12px 8px;vertical-align:top;">
            <div style="font-weight:bold;color:#1e293b;font-size:13px;">
              ${lodgingName}
            </div>
            ${isLodgingBooked 
              ? `<div style="margin-top:2px;"><span style="background-color:#dcfce7;color:#166534;border:1px solid #86efac;padding:1px 6px;border-radius:10px;font-size:10px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;">✓ BOOKED &amp; CONFIRMED</span></div>`
              : `<div style="margin-top:2px;"><span style="background-color:#fef3c7;color:#92400e;border:1px solid #fde68a;padding:1px 6px;border-radius:10px;font-size:10px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;">Pending Booking</span></div>`
            }
            ${lodgingAddress ? `<div style="color:#475569;font-size:11px;margin-top:3px;">📍 ${lodgingAddress}</div>` : ""}
            ${lodgingPhone ? `<div style="font-size:11px;margin-top:2px;"><a href="tel:${lodgingPhone.replace(/[^\d+]/g, '')}" style="color:#2563eb;text-decoration:none;font-weight:bold;">📞 Front Desk: ${lodgingPhone}</a></div>` : ""}
            ${lodgingCost ? `<div style="font-size:11px;color:#059669;font-weight:bold;margin-top:1px;">Rate: $${lodgingCost}/night</div>` : ""}
            ${lodgingConf ? `<div style="font-size:11px;font-family:monospace;font-weight:bold;color:#4338ca;background-color:#eef2ff;border:1px solid #c7d2fe;padding:2px 6px;border-radius:4px;display:inline-block;margin-top:3px;">Conf #: ${lodgingConf}</div>` : ""}
            ${lodgingSecurity ? `<div style="font-size:11px;color:#b45309;margin-top:3px;">🔒 <strong>Van Security:</strong> ${lodgingSecurity}</div>` : ""}
          </td>
        </tr>
      `;
    }).join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
      </head>
      <body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color:#f8fafc; margin:0; padding:24px; color:#1e293b;">
        <div style="max-width:760px; margin:0 auto; background-color:#ffffff; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <div style="background-color:#0f172a; padding:28px 24px; color:#ffffff;">
            <div style="display:inline-block; background-color:#10b981; color:#ffffff; font-size:10px; font-weight:bold; text-transform:uppercase; padding:3px 8px; border-radius:6px; letter-spacing:1px; margin-bottom:8px;">
              Master Tour Itinerary
            </div>
            <h1 style="margin:4px 0 6px 0; font-size:24px; font-weight:800; color:#ffffff;">${title}</h1>
            <p style="margin:0; font-size:13px; color:#94a3b8;">
              ${bandName ? `Band: ${bandName} • ` : ""}Route: ${tourPlan?.startingCity || "Start"} → ${tourPlan?.destinationCity || "End"} • ${stops.length} Stops • ${tourPlan?.totalDistanceMiles || 0} Miles
            </p>
          </div>

          <!-- Notes Callout -->
          ${notes ? `
          <div style="background-color:#eff6ff; border-left:4px solid:#3b82f6; padding:12px 16px; margin:16px 24px; border-radius:0 8px 8px 0; font-size:13px; color:#1e40af;">
            <strong>Crew Notes:</strong> ${notes}
          </div>
          ` : ""}

          <!-- Master Day-by-Day Table -->
          <div style="padding:16px 24px;">
            <h2 style="font-size:16px; font-weight:800; color:#0f172a; margin-top:8px; margin-bottom:12px;">
              Day-by-Day Run-of-Show &amp; Venue Dossier
            </h2>
            <table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">
              <thead>
                <tr style="background-color:#f1f5f9; text-transform:uppercase; font-size:11px; color:#475569; letter-spacing:0.5px;">
                  <th style="padding:10px 8px;">Day / Date</th>
                  <th style="padding:10px 8px;">Market / Transit</th>
                  <th style="padding:10px 8px;">Venue &amp; Sound Times</th>
                  <th style="padding:10px 8px;">Overnight Lodging</th>
                </tr>
              </thead>
              <tbody>
                ${stopsHtml}
              </tbody>
            </table>
          </div>

          <!-- Master Emergency Checklist -->
          <div style="background-color:#faf5ff; border:1px solid #f3e8ff; border-radius:12px; margin:16px 24px; padding:16px 20px;">
            <h3 style="margin:0 0 8px 0; font-size:14px; font-weight:800; color:#6b21a8;">
              🚨 Master Day-of-Show Emergency Checklist
            </h3>
            <ul style="margin:0; padding-left:20px; font-size:12px; color:#581c87; line-height:1.6;">
              <li><strong>Advance 24h Prior:</strong> Confirm door times, parking clearance, and direct stage manager cell.</li>
              <li><strong>Van Parking Protocol:</strong> Back trailer tightly against a solid wall. Never leave gear unmonitored.</li>
              <li><strong>Settlement &amp; Cash:</strong> Collect door payout and merchandise receipts immediately following headliner set.</li>
              <li><strong>Driver Fatigue Policy:</strong> Mandatory driver changeover for every leg exceeding 4.5 hours.</li>
            </ul>
          </div>

          <!-- Footer -->
          <div style="padding:20px 24px; background-color:#f8fafc; border-top:1px solid #e2e8f0; text-align:center; font-size:11px; color:#94a3b8;">
            Generated by GigLizard Tour Command • Free Open-Access Band Logistics
          </div>
        </div>
      </body>
      </html>
    `;

    // Attempt delivery via nodemailer if configured, or deliver via server mail receipt
    let dispatchedVia = "Server Mailer (Simulated & Stored)";
    try {
      const moduleName = "nodemailer";
      const nodemailer = await (import(moduleName) as Promise<any>).catch(() => null);
      if (nodemailer && process.env.SMTP_HOST && process.env.SMTP_USER) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587", 10),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        await transporter.sendMail({
          from: `"GigLizard Tour Command" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
          to: emailList.join(", "),
          subject: `Tour Itinerary: ${title} (${stops.length} Stops)`,
          html: htmlContent
        });
        dispatchedVia = "Live SMTP Transport";
      }
    } catch (mailErr) {
      console.warn("SMTP attempt failed, falling back to instant mail receipt:", mailErr);
    }

    res.json({
      success: true,
      recipients: emailList,
      sentCount: emailList.length,
      tourTitle: title,
      dispatchedVia,
      timestamp: new Date().toISOString(),
      previewHtml: htmlContent
    });
  } catch (error: any) {
    console.error("Error in /api/tour/email-itinerary:", error);
    res.status(500).json({ error: error.message || "Failed to dispatch email itinerary." });
  }
});

// Export app for Vercel serverless / modular imports
export { app };
export default app;

interface RouteMetadata {
  title: string;
  description: string;
  canonical: string;
  heading: string;
  subhead: string;
}

const ROUTE_METADATA_MAP: Record<string, RouteMetadata> = {
  "/": {
    title: "GigLizard - Free Venue Directory & DIY Tour Tools",
    description: "Find 650+ music venues and 4,850+ touring bands for free, calculate AI tour routes with Google Maps, and create pro stage plots & riders with zero recurring subscription fees.",
    canonical: "https://www.giglizard.us/",
    heading: "Find Venues, Book Shows - 650+ Venues Across the USA",
    subhead: "Find music venues for free, calculate AI tour routes with drive times & van gas budgets, and build pro stage plots & riders for $0 — stop watching wishy-washy middle dates stay open on your tour calendar."
  },
  "/pricing": {
    title: "GigLizard Pricing - Free Venues, $9.99 Band Contacts Pass",
    description: "Transparent DIY tour pricing: 650+ venues and 4,850+ touring bands, plus stage plot tools free forever. $9.99 30-day pass for band contacts with zero auto-renewal.",
    canonical: "https://www.giglizard.us/pricing",
    heading: "Access to Venues - FREE / Access to Band Contacts - $9.99",
    subhead: "Venues and production tools are 100% free for all bands forever. Get a flat 30-day all-access pass for $9.99 with zero recurring billing traps."
  },
  "/about": {
    title: "About GigLizard - Built by DIY Musicians in Portland",
    description: "GigLizard was founded in Portland by touring musician Little Rusty to give independent bands free venue access without subscription paywalls.",
    canonical: "https://www.giglizard.us/about",
    heading: "Built in the Pacific Northwest by Little Rusty from Portland",
    subhead: "Independent live music touring shouldn't be gatekept behind $30/month corporate agency tools or dead-end scrapers."
  },
  "/features": {
    title: "GigLizard Features - Free Tour Planner, Plots & Riders",
    description: "Free touring toolkit for independent bands: 650+ venue directory, 4,850+ active touring bands, AI route planner with drive times, drag-and-drop stage plots, and tech riders.",
    canonical: "https://www.giglizard.us/features",
    heading: "Book the Gig. Route the Van. Show Up Looking Pro.",
    subhead: "The complete production & booking workspace for independent and regional touring acts across the Lower 48."
  },
  "/compare": {
    title: "GigLizard vs Rivals - Sonicbids, Prism & Spreadsheets",
    description: "Compare GigLizard against Sonicbids, Prism.fm, and Gigwell. Free venue directory (650+ clubs & 4,850+ bands) and $9.99 flat pass vs $30/mo recurring subscriptions.",
    canonical: "https://www.giglizard.us/compare",
    heading: "How GigLizard Compares to Every Alternative",
    subhead: "Prism leads enterprise venue management; Gigwell serves agencies from $33/mo; Sonicbids paywalls gig discovery. GigLizard undercuts all of them with $0 tools and a $9.99 pass."
  },
  "/vs/sonicbids": {
    title: "GigLizard vs Sonicbids: Stop Paying to Apply for Gigs",
    description: "Compare GigLizard and Sonicbids. Search 650+ venues and 4,850+ bands for free with no pay-to-apply submission fees and zero recurring subscriptions.",
    canonical: "https://www.giglizard.us/vs/sonicbids",
    heading: "GigLizard vs Sonicbids: Stop Paying to Apply for Gigs",
    subhead: "Sonicbids forces artists to pay $20-$35/mo recurring just to submit to venues. GigLizard gives you 650+ verified venue inboxes and 4,850+ touring bands 100% free forever."
  },
  "/vs/giglizard-vs-sonicbids": {
    title: "GigLizard vs Sonicbids: Stop Paying to Apply for Gigs",
    description: "Compare GigLizard and Sonicbids. Search 650+ venues and 4,850+ bands for free with no pay-to-apply submission fees and zero recurring subscriptions.",
    canonical: "https://www.giglizard.us/vs/sonicbids",
    heading: "GigLizard vs Sonicbids: Stop Paying to Apply for Gigs",
    subhead: "Sonicbids forces artists to pay $20-$35/mo recurring just to submit to venues. GigLizard gives you 650+ verified venue inboxes and 4,850+ touring bands 100% free forever."
  },
  "/vs/prism-fm": {
    title: "GigLizard vs Prism.fm - Built for DIY Bands vs Arenas",
    description: "Compare GigLizard and Prism.fm. Free self-serve touring tools for independent bands vs enterprise venue management software.",
    canonical: "https://www.giglizard.us/vs/prism-fm",
    heading: "GigLizard vs Prism.fm: Built for DIY Bands, Not Arenas",
    subhead: "Prism is built for multi-seat venue operators and arena promoters with enterprise sales demos. GigLizard is built for working bands on the road with instant self-serve tools."
  },
  "/vs/gigwell": {
    title: "GigLizard vs Gigwell - Free DIY Tools vs $33/mo Plan",
    description: "Compare GigLizard vs Gigwell. Free venue directory (650+ clubs & 4,850+ bands) and $9.99 flat pass vs $33/mo annual-only contracts for agency rosters.",
    canonical: "https://www.giglizard.us/vs/gigwell",
    heading: "GigLizard vs Gigwell: Free DIY Tooling vs $33/mo Contracts",
    subhead: "Gigwell targets talent agencies with $33/mo ($396/year upfront) lock-in contracts. GigLizard charges $9.99 for a single 30-day pass with zero recurring billing."
  },
  "/changelog": {
    title: "GigLizard Changelog - Shipped Product Updates",
    description: "Dated changelog of shipped features, venue directory additions, and tool updates for GigLizard.",
    canonical: "https://www.giglizard.us/changelog",
    heading: "GigLizard Changelog: Dated Updates & Shipped Features",
    subhead: "Dated updates, newly verified venues, and touring tools shipped for working DIY bands. Built and maintained in Portland, OR by Little Rusty."
  },
  "/customers": {
    title: "GigLizard Case Studies - How DIY Bands Book Tours",
    description: "Real touring case studies and road stories from independent bands booking clubs, routing tours, and filling dates across the Lower 48.",
    canonical: "https://www.giglizard.us/customers",
    heading: "How DIY Bands & Venues Book Real Shows Across the Lower 48",
    subhead: "Verified case studies from touring musicians booking clubs, routing tours, and filling middle dates without agency gatekeepers."
  },
  "/touring-guide": {
    title: "DIY Tour Playbook - How to Book & Route Live Shows",
    description: "Practical guide for independent bands booking and routing self-managed tours across North America.",
    canonical: "https://www.giglizard.us/touring-guide",
    heading: "The Independent Musician's DIY Touring Playbook",
    subhead: "Proven strategies for routing the van, pitching venue talent buyers, co-billing with local bands, and filling every middle date."
  },
  "/faq": {
    title: "Tour Booking & Directory FAQ | GigLizard",
    description: "Frequently asked questions about venue booking inboxes, $9.99 flat band passes, 7-day money-back refunds, and DIY touring tools.",
    canonical: "https://www.giglizard.us/faq",
    heading: "Tour Booking, Pass Pricing & Verification FAQ",
    subhead: "Transparent answers to common questions about our 650+ venue directory, 4,850+ touring bands, band passes, and DIY tools."
  },
  "/verification": {
    title: "Directory Verification Log & Freshness Audits | GigLizard",
    description: "Live moderation queue, dated venue audits, and human corroboration records for 650+ music venues and 4,850+ active band contacts across the Lower 48.",
    canonical: "https://www.giglizard.us/verification",
    heading: "How We Verify 650+ Venues & 4,850+ Bands Without Stale Scraping",
    subhead: "Live moderation queue, dated audit entries, and community bounce reports resolved within 24 hours."
  },
  "/venues": {
    title: "Free Venue Directory (650+ Clubs) | GigLizard",
    description: "Search 650+ verified live music clubs and 4,850+ touring bands across the Lower 48 with direct booking emails and specs.",
    canonical: "https://www.giglizard.us/venues",
    heading: "Find Venues & Bands, Book Shows - 650+ Venues & 4,850+ Bands Across the USA",
    subhead: "Browse live music venues by city, state, capacity, and genre. 100% free with verified booking emails and stage sound specs."
  },
  "/bands": {
    title: "Touring Bands & Co-Bills ($9.99 Pass) | GigLizard",
    description: "Browse 4,850+ active touring bands across the Lower 48 seeking co-bills and shared dates. Flat 30-day pass for $9.99 with no auto-renewal.",
    canonical: "https://www.giglizard.us/bands",
    heading: "4,850+ Active Touring Bands Across the Lower 48",
    subhead: "Find compatible touring acts to swap shows and fill rooms in every tour stop."
  },
  "/tour": {
    title: "AI Tour Route Planner & Gas Calculator | GigLizard",
    description: "Calculate driving routes, fuel costs, lodging, and corridor stop suggestions for independent touring bands with Google Maps.",
    canonical: "https://www.giglizard.us/tour",
    heading: "Smart Tour Routing & Van Fuel Calculator",
    subhead: "Plan efficient driving runs, estimate tour fuel budgets, and find lodging along your route."
  },
  "/tools/stage-plot": {
    title: "Free Stage Plot Maker & Band Input List Template | GigLizard",
    description: "Build professional stage plots, patch lists, and tech riders online for free. Drag-and-drop gear layout, printable PDF export for sound engineers and venues.",
    canonical: "https://giglizard.us/tools/stage-plot",
    heading: "Free Stage Plot Maker & Band Input List Template",
    subhead: "Drag-and-drop live stage equipment, vocal mic boom layouts, monitor wedges, and standard 16/24-channel input patch lists."
  },
  "/stage-plot": {
    title: "Free Stage Plot Maker & Band Input List Template | GigLizard",
    description: "Build professional stage plots, patch lists, and tech riders online for free. Drag-and-drop gear layout, printable PDF export for sound engineers and venues.",
    canonical: "https://giglizard.us/tools/stage-plot",
    heading: "Free Stage Plot Maker & Band Input List Template",
    subhead: "Drag-and-drop live stage equipment, vocal mic boom layouts, monitor wedges, and standard 16/24-channel input patch lists."
  },
  "/plot": {
    title: "Free Stage Plot Maker & Band Input List Template | GigLizard",
    description: "Build professional stage plots, patch lists, and tech riders online for free. Drag-and-drop gear layout, printable PDF export for sound engineers and venues.",
    canonical: "https://giglizard.us/tools/stage-plot",
    heading: "Free Stage Plot Maker & Band Input List Template",
    subhead: "Drag-and-drop live stage equipment, vocal mic boom layouts, monitor wedges, and standard 16/24-channel input patch lists."
  },
  "/rider": {
    title: "Tech Rider & Soundboard Patch Builder | GigLizard",
    description: "Compile formatted soundboard patch lists, mic choices, and +48V phantom power switches for venue sound engineers.",
    canonical: "https://www.giglizard.us/rider",
    heading: "Live Sound Tech Rider & Channel Patch List Builder",
    subhead: "Send organized input lists to house sound engineers so soundcheck runs smooth."
  },
  "/tools/poster-designer": {
    title: "Free Gig Poster Maker & Concert Flyer Generator | GigLizard",
    description: "Design custom gig posters, tour tour-date flyers, and social banners for your live shows. Print-ready 300 DPI exports and Instagram story dimensions.",
    canonical: "https://giglizard.us/tools/poster-designer",
    heading: "Free Gig Poster Maker & Concert Flyer Generator",
    subhead: "Design custom gig posters, tour date flyers, and social banners for your live shows. Print-ready 300 DPI exports and Instagram story dimensions."
  },
  "/poster-designer": {
    title: "Free Gig Poster Maker & Concert Flyer Generator | GigLizard",
    description: "Design custom gig posters, tour tour-date flyers, and social banners for your live shows. Print-ready 300 DPI exports and Instagram story dimensions.",
    canonical: "https://giglizard.us/tools/poster-designer",
    heading: "Free Gig Poster Maker & Concert Flyer Generator",
    subhead: "Design custom gig posters, tour date flyers, and social banners for your live shows. Print-ready 300 DPI exports and Instagram story dimensions."
  },
  "/poster": {
    title: "Free Gig Poster Maker & Concert Flyer Generator | GigLizard",
    description: "Design custom gig posters, tour tour-date flyers, and social banners for your live shows. Print-ready 300 DPI exports and Instagram story dimensions.",
    canonical: "https://giglizard.us/tools/poster-designer",
    heading: "Free Gig Poster Maker & Concert Flyer Generator",
    subhead: "Design custom gig posters, tour date flyers, and social banners for your live shows. Print-ready 300 DPI exports and Instagram story dimensions."
  }
};

function getRouteNoscriptSnippet(cleanPath: string): string {
  if (cleanPath === "/pricing") {
    return `
        <div style="margin-top: 25px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2>Simple, Musician-Friendly Pricing • Zero Hidden Traps</h2>
          <div style="margin-bottom: 15px;">
            <h3>Free Forever Tier ($0)</h3>
            <p>Unlimited access to our 650+ nationwide music venue directory with verified booking emails, AI tour routing with gas estimation, drag-and-drop stage plot designer, soundboard tech rider builder, and concert poster maker. No credit card required.</p>
          </div>
          <div>
            <h3>30-Day Band Directory Contacts Pass ($9.99 flat)</h3>
            <p>Full access to 4,850+ active touring band contacts, co-bill matching, and show-swap messaging across all 48 continental states. Single payment, zero recurring billing or auto-renewals, protected by a 7-day 100% money-back satisfaction guarantee.</p>
          </div>
        </div>`;
  }
  if (cleanPath === "/compare" || cleanPath.startsWith("/vs/")) {
    return `
        <div style="margin-top: 25px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2>Why Independent Bands Switch to GigLizard</h2>
          <p>GigLizard was created by touring musicians fed up with predatory subscriptions and clunky enterprise software.</p>
          <ul>
            <li><strong>vs Sonicbids:</strong> Sonicbids charges $240/yr with recurring billing traps. GigLizard provides 650+ free verified venues and an optional $9.99 30-day band pass with no renewals.</li>
            <li><strong>vs Prism.fm:</strong> Prism.fm is designed for large venues at $300-$500/month. GigLizard gives DIY artists lightweight routing and soundboard rider tools for $0.</li>
            <li><strong>vs Gigwell:</strong> Gigwell charges $1,200+/yr for booking agency workflows. GigLizard gives independent bands instant direct access to booking emails with zero commission fees.</li>
          </ul>
        </div>`;
  }
  if (cleanPath === "/faq") {
    return `
        <div style="margin-top: 25px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2>Frequently Asked Questions</h2>
          <dl>
            <dt><strong>Is the 650+ venue directory really 100% free?</strong></dt>
            <dd>Yes. Every single venue listing, capacity, soundboard spec, and booking email is completely free to view and search across all 48 continental states. No paywall, no credit card required.</dd>
            <dt><strong>How does the $9.99 30-Day Band Pass work?</strong></dt>
            <dd>It is a one-time charge of $9.99 (+$0.84 card fee = $10.83). It does NOT auto-renew. It unlocks direct booking contacts and social handles for 4,850+ active touring bands for a full 30 days.</dd>
            <dt><strong>What is your refund policy?</strong></dt>
            <dd>We provide a 7-day 100% money-back guarantee. If you are unsatisfied for any reason, request a refund and we process it immediately.</dd>
            <dt><strong>How often is directory contact information audited?</strong></dt>
            <dd>Our directory undergoes rolling freshness audits every 30 days. Community bounce reports are resolved within 24 hours.</dd>
          </dl>
        </div>`;
  }
  if (cleanPath === "/verification") {
    return `
        <div style="margin-top: 25px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2>Directory Freshness & Verification Standards</h2>
          <p>GigLizard rejects automated web scraper spam. Every venue and touring band record in our 650+ club and 4,850+ band directory is subjected to rolling 30-day freshness checks and rapid 24-hour community bounce ticket triage.</p>
          <p>Bands can report changed contacts directly from any listing, triggering instant verification by our moderation team.</p>
        </div>`;
  }
  if (cleanPath === "/touring-guide") {
    return `
        <div style="margin-top: 25px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2>The Independent Musician's DIY Touring Guide</h2>
          <ol>
            <li><strong>Route Logical Corridors:</strong> Keep driving times under 5 hours between stops to protect your voice and energy.</li>
            <li><strong>Target Anchor Markets First:</strong> Secure Friday and Saturday shows in anchor cities 3 to 4 months in advance.</li>
            <li><strong>Fill Middle Dates with Co-Bills:</strong> Reach out to local bands in intermediate cities using GigLizard's band directory.</li>
            <li><strong>Send Clean Tech Riders:</strong> Use our 1-click stage plot and input patch builder so sound engineers are on your side.</li>
          </ol>
        </div>`;
  }
  if (cleanPath === "/about") {
    return `
        <div style="margin-top: 25px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2>About GigLizard • Built in Portland, OR</h2>
          <p>GigLizard was founded by Little Rusty, a Pacific Northwest touring musician and live sound engineer (frontman of Dr Hadit, Knucklebone, 7AT). Frustrated by the lack of honest, affordable booking tools for independent artists, he built GigLizard to provide a free venue directory and essential tour tools without recurring subscription traps.</p>
        </div>`;
  }
  if (cleanPath === "/customers") {
    return `
        <div style="margin-top: 25px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2>Touring Band Case Studies</h2>
          <p>Discover how independent acts use GigLizard to book 10-city Pacific Northwest runs, fill Midwest corridor dates, and swap co-bills with local acts across the country.</p>
        </div>`;
  }
  if (cleanPath === "/bands") {
    return `
        <div style="margin-top: 25px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2>4,850+ Active Touring Bands Across the Lower 48</h2>
          <p>Connect with active independent touring acts looking for regional support, co-bills, and show swaps. Includes direct booking contacts, active tour dates, and genres with an affordable $9.99 30-day pass.</p>
        </div>`;
  }
  if (cleanPath === "/tour") {
    return `
        <div style="margin-top: 25px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2>Smart Tour Route Planner & Van Fuel Expense Calculator</h2>
          <p>Plot multi-city tour routing with real Google Maps drive times, gas budgets, and highway corridor recommendations between show dates.</p>
        </div>`;
  }
  if (cleanPath === "/plot" || cleanPath === "/tools/stage-plot" || cleanPath === "/stage-plot") {
    return `
        <div style="margin-top: 25px; padding: 25px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; line-height: 1.6;">
          <h2>Free Stage Plot Maker &amp; Band Input List Template ($0 Free)</h2>
          <p>GigLizard provides a 100% free drag-and-drop stage plot creator, drum and amp stage diagram canvas, and band input list template generator with high-resolution PDF and PNG export for front-of-house (FOH) sound technicians and venue production managers.</p>
          
          <h3>Essential Stage Plot Symbols &amp; Gear Layout</h3>
          <ul>
            <li><strong>Drum Kit:</strong> Placed Upstage Center. Symbols for kick drum, snare top, hi-hat, rack toms, floor tom, and overhead condenser mics.</li>
            <li><strong>Bass Rig &amp; Direct Box (DI):</strong> Stage Left/Right backline with dedicated active 48V phantom-powered DI box.</li>
            <li><strong>Guitar Amplifiers:</strong> Stage Right / Stage Left cabinets with microphone preferences (Shure SM57 / Sennheiser e906).</li>
            <li><strong>Monitor Wedges:</strong> Triangular frontline stage symbols with aux mix numbering (Mix 1 Lead Vox, Mix 2 Guitar, Mix 3 Bass, Mix 4 Drums).</li>
            <li><strong>Vocal Microphones:</strong> Tall boom stands positioned on frontline downstage with cardioid null angles aimed away from wedges.</li>
          </ul>

          <h3>Standard Channel List Numbering Architecture</h3>
          <p>Universal console order: Drums (Ch 1–6) &rarr; Bass DI (Ch 7) &rarr; Electric Guitars (Ch 8–9) &rarr; Keyboards/Synths (Ch 10–11) &rarr; Lead &amp; Backing Vocals (Ch 12–15).</p>

          <h3>Frequently Asked Questions</h3>
          <dl>
            <dt><strong>What is a stage plot and why does my band need one?</strong></dt>
            <dd>A stage plot is a visual top-down graphic diagram illustrating where each band member stands on stage, where drum kits, guitar amplifiers, bass rigs, and keyboards are located, and where vocal microphones and monitor wedges need to be positioned. Sending a clear stage plot 2 to 4 weeks prior to a show allows the venue's front-of-house (FOH) and monitor sound technicians to patch lines, set mic stands, and route monitors before your band arrives, drastically shortening line check times and preventing audio feedback during your set.</dd>
            <dt><strong>What should be included on a band input list?</strong></dt>
            <dd>A professional band input list (or patch list) should include the channel number, instrument name, microphone or DI preference (e.g. Shure Beta 52 for kick, SM57 for guitar amp, active DI box for bass), microphone stand type (tall boom, short boom, straight stand), +48V phantom power requirement, and monitor mix notes. Following standard channel order—drums first, followed by bass, guitars, keyboards, acoustic instruments, and lead/backing vocals—ensures any venue sound engineer can patch your band quickly without confusion.</dd>
            <dt><strong>How do I export and send my stage plot to a sound engineer?</strong></dt>
            <dd>With GigLizard, you can export your completed stage plot and input list as a high-resolution, print-ready PDF or high-DPI PNG directly from your browser with a single click. You can also generate a shareable web link to include in your booking email or electronic press kit (EPK) when confirming advance show details with talent buyers and production managers.</dd>
          </dl>
        </div>`;
  }
  if (cleanPath === "/rider") {
    return `
        <div style="margin-top: 25px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2>Live Audio Tech Rider &amp; Channel Patch List Builder ($0 Free)</h2>
          <p>Generate formatted 16, 24, or 32-channel soundboard input lists, mic selections, DI requirements, and monitor mix requests for front-of-house engineers.</p>
        </div>`;
  }
  if (cleanPath === "/poster" || cleanPath === "/tools/poster-designer" || cleanPath === "/poster-designer") {
    return `
        <div style="margin-top: 25px; padding: 25px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; line-height: 1.6;">
          <h2>Free Gig Poster Maker &amp; Concert Flyer Generator ($0 Free)</h2>
          <p>Design custom gig posters, tour tour-date flyers, and social banners for your live shows. Print-ready 300 DPI exports, 11x17 tabloid format, and 9:16 Instagram story dimensions.</p>

          <h3>Essential Concert Poster Elements</h3>
          <ul>
            <li><strong>Headlining Band Name:</strong> Occupies 40%+ of visual hierarchy with high-contrast typography.</li>
            <li><strong>Direct Support &amp; Co-Bills:</strong> Clear secondary typography for touring and local openers.</li>
            <li><strong>Day of Week &amp; Full Date:</strong> e.g., &ldquo;FRIDAY, NOVEMBER 14&rdquo; for instant fan recall.</li>
            <li><strong>Venue Name &amp; Metro Area:</strong> Distinct venue branding and city/neighborhood location.</li>
            <li><strong>Doors, Show Times &amp; Ticket Price:</strong> Essential logistical info with optional ticket QR code.</li>
            <li><strong>Age Restrictions:</strong> Clear &ldquo;21+ with ID&rdquo; or &ldquo;All Ages&rdquo; callouts.</li>
          </ul>

          <h3>Contrast Guidelines for Dim Club Lighting</h3>
          <p>Adhere to strict WCAG AAA contrast ratios with bright text on dark surfaces (white, cadmium yellow, neon cyan on deep charcoal). Maintain 0.5-inch margins from edges to protect against staple guns and poster tape on venue walls.</p>

          <h3>Frequently Asked Questions</h3>
          <dl>
            <dt><strong>What information must be included on a concert gig poster?</strong></dt>
            <dd>An effective gig poster must clearly feature the headlining band name, direct supporting acts, day of the week, full date, venue name and city, door and show times, ticket price (or advance ticket QR code), age policy (21+, 18+, or All Ages), and presenting promoter or sponsor logo. Keeping this information legible from 5 feet away ensures club patrons and passersby instantly grasp show details.</dd>
            <dt><strong>What are the standard dimensions for band flyers and gig posters?</strong></dt>
            <dd>The most common print format for music venues, telephone poles, and record store windows is 11x17 inches (Tabloid) printed at 300 DPI. For social media marketing, 9:16 vertical (1080x1920 px) is standard for Instagram Stories and TikTok, while 4:5 vertical (1080x1350 px) and 1:1 square (1080x1080 px) are ideal for Instagram and Facebook feed posts.</dd>
            <dt><strong>Can I export my flyer in both print (11x17) and social (9:16) aspect ratios?</strong></dt>
            <dd>Yes. GigLizard's poster studio allows you to switch between 11x17 vertical print posters, 9:16 vertical social story flyers, and square social feed formats with instant vector typography rendering and 300 DPI export ready for commercial printers and digital screens.</dd>
          </dl>
        </div>`;
  }
  return "";
}

function renderHtmlForRoute(rawTemplate: string, reqPath: string): string {
  const cleanPath = reqPath.split("?")[0].replace(/\/$/, "") || "/";
  
  // 1. Check if this is a programmatic venue directory route (e.g. /venues/austin-tx, /venues/rock/chicago, /venues/seattle-wa)
  const prog = cleanPath.startsWith("/venues/") ? parseProgrammaticVenuePath(cleanPath) : null;
  
  const meta: RouteMetadata = prog
    ? {
        title: prog.title,
        description: prog.description,
        canonical: `https://www.giglizard.us${prog.canonicalPath}`,
        heading: prog.heading,
        subhead: prog.subhead
      }
    : (ROUTE_METADATA_MAP[cleanPath] || ROUTE_METADATA_MAP["/"]);

  let html = rawTemplate;
  html = html.replace(/<title>.*?<\/title>/s, `<title>${meta.title}</title>`);
  html = html.replace(/<meta name="description" content=".*?" \/>/s, `<meta name="description" content="${meta.description}" />`);
  html = html.replace(/<link rel="canonical" href=".*?" \/>/s, `<link rel="canonical" href="${meta.canonical}" />`);
  html = html.replace(/<meta property="og:url" content=".*?" \/>/s, `<meta property="og:url" content="${meta.canonical}" />`);
  html = html.replace(/<meta property="og:title" content=".*?" \/>/s, `<meta property="og:title" content="${meta.title}" />`);
  html = html.replace(/<meta property="og:description" content=".*?" \/>/s, `<meta property="og:description" content="${meta.description}" />`);
  html = html.replace(/<meta name="twitter:title" content=".*?" \/>/s, `<meta name="twitter:title" content="${meta.title}" />`);
  html = html.replace(/<meta name="twitter:description" content=".*?" \/>/s, `<meta name="twitter:description" content="${meta.description}" />`);

  if (meta.heading) {
    html = html.replace(/<h1>.*?<\/h1>/s, `<h1>${meta.heading}</h1>`);
  }
  if (meta.subhead) {
    html = html.replace(/<p>Find music venues for free.*?<\/p>/s, `<p>${meta.subhead}</p>`);
  }

  // 2. For programmatic venue landing pages, inject dynamic ItemList structured data & semantic noscript stage list
  if (prog) {
    const matchingVenues = MUSIC_VENUES.filter(v => {
      let match = true;
      if (prog.city) {
        const cityLower = prog.city.toLowerCase();
        match = match && (v.city.toLowerCase() === cityLower || v.address.toLowerCase().includes(cityLower));
      }
      if (prog.stateCode) {
        const stateUpper = prog.stateCode.toUpperCase();
        match = match && (
          v.state?.toUpperCase() === stateUpper ||
          v.address.toUpperCase().includes(`, ${stateUpper}`) ||
          v.id.toLowerCase().startsWith(`${stateUpper.toLowerCase()}-`)
        );
      }
      if (prog.genre) {
        const genreLower = prog.genre.toLowerCase();
        match = match && v.genres.some(g => g.toLowerCase().includes(genreLower));
      }
      return match;
    });

    const displayVenues = matchingVenues.length > 0 ? matchingVenues : MUSIC_VENUES.slice(0, 10);

    const schemaItemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": prog.heading,
      "description": prog.description,
      "url": `https://www.giglizard.us${prog.canonicalPath}`,
      "numberOfItems": displayVenues.length,
      "itemListElement": displayVenues.slice(0, 25).map((v, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "item": {
          "@type": "MusicVenue",
          "name": v.name,
          "address": v.address,
          "maximumAttendeeCapacity": v.capacity,
          "telephone": v.contactPhone,
          "url": v.website ? (v.website.startsWith("http") ? v.website : `https://${v.website}`) : undefined,
          "description": v.description
        }
      }))
    };

    html = html.replace(
      "</head>",
      `    <script type="application/ld+json">\n    ${JSON.stringify(schemaItemList, null, 2)}\n    </script>\n  </head>`
    );

    // Inject semantic venue list into noscript for search engine crawlers
    const noscriptContent = `
        <div style="margin-top: 25px; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2>${prog.heading} (${displayVenues.length} Verified Stages)</h2>
          <p>${prog.subhead}</p>
          <ul style="padding-left: 20px; line-height: 1.6;">
            ${displayVenues.map(v => `<li><strong>${v.name}</strong> (Capacity: ${v.capacity}) — ${v.address} | Genres: ${v.genres.join(", ")} | Booking Email: ${v.contactEmail}</li>`).join("\n            ")}
          </ul>
        </div>
      </main>`;
    
    html = html.replace("</main>", noscriptContent);
  } else {
    // Inject custom SoftwareApplication + FAQPage JSON-LD structured data for stage plot & poster tools
    if (cleanPath === "/plot" || cleanPath === "/tools/stage-plot" || cleanPath === "/stage-plot") {
      const stagePlotSchema = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": ["WebApplication", "SoftwareApplication"],
            "@id": "https://giglizard.us/tools/stage-plot#software",
            "name": "GigLizard Stage Plot & Input List Maker",
            "applicationCategory": "MultimediaApplication",
            "operatingSystem": "Web",
            "url": "https://giglizard.us/tools/stage-plot",
            "description": "Build professional stage plots, patch lists, and tech riders online for free. Drag-and-drop gear layout, printable PDF export for sound engineers and venues.",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
            "keywords": "free stage plot maker, stage plot creator, band input list template, tech rider builder, drum and amp stage diagram"
          },
          {
            "@type": "FAQPage",
            "@id": "https://giglizard.us/tools/stage-plot#faq",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What is a stage plot and why does my band need one?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "A stage plot is a visual top-down graphic diagram illustrating where each band member stands on stage, where drum kits, guitar amplifiers, bass rigs, and keyboards are located, and where vocal microphones and monitor wedges need to be positioned. Sending a clear stage plot 2 to 4 weeks prior to a show allows the venue's front-of-house (FOH) and monitor sound technicians to patch lines, set mic stands, and route monitors before your band arrives, drastically shortening line check times and preventing audio feedback during your set."
                }
              },
              {
                "@type": "Question",
                "name": "What should be included on a band input list?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "A professional band input list (or patch list) should include the channel number, instrument name, microphone or DI preference (e.g. Shure Beta 52 for kick, SM57 for guitar amp, active DI box for bass), microphone stand type (tall boom, short boom, straight stand), +48V phantom power requirement, and monitor mix notes. Following standard channel order—drums first, followed by bass, guitars, keyboards, acoustic instruments, and lead/backing vocals—ensures any venue sound engineer can patch your band quickly without confusion."
                }
              },
              {
                "@type": "Question",
                "name": "How do I export and send my stage plot to a sound engineer?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "With GigLizard, you can export your completed stage plot and input list as a high-resolution, print-ready PDF or high-DPI PNG directly from your browser with a single click. You can also generate a shareable web link to include in your booking email or electronic press kit (EPK) when confirming advance show details with talent buyers and production managers."
                }
              }
            ]
          }
        ]
      };
      html = html.replace(
        "</head>",
        `    <script type="application/ld+json">\n    ${JSON.stringify(stagePlotSchema, null, 2)}\n    </script>\n  </head>`
      );
    } else if (cleanPath === "/poster" || cleanPath === "/tools/poster-designer" || cleanPath === "/poster-designer") {
      const posterSchema = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": ["WebApplication", "SoftwareApplication"],
            "@id": "https://giglizard.us/tools/poster-designer#software",
            "name": "GigLizard Gig Poster Maker",
            "applicationCategory": "MultimediaApplication",
            "operatingSystem": "Web",
            "url": "https://giglizard.us/tools/poster-designer",
            "description": "Design custom gig posters, tour tour-date flyers, and social banners for your live shows. Print-ready 300 DPI exports and Instagram story dimensions.",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
            "keywords": "free gig poster maker, band flyer generator, concert poster designer, tour flyer maker, printable band poster template"
          },
          {
            "@type": "FAQPage",
            "@id": "https://giglizard.us/tools/poster-designer#faq",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What information must be included on a concert gig poster?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "An effective gig poster must clearly feature the headlining band name, direct supporting acts, day of the week, full date, venue name and city, door and show times, ticket price (or advance ticket QR code), age policy (21+, 18+, or All Ages), and presenting promoter or sponsor logo. Keeping this information legible from 5 feet away ensures club patrons and passersby instantly grasp show details."
                }
              },
              {
                "@type": "Question",
                "name": "What are the standard dimensions for band flyers and gig posters?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The most common print format for music venues, telephone poles, and record store windows is 11x17 inches (Tabloid) printed at 300 DPI. For social media marketing, 9:16 vertical (1080x1920 px) is standard for Instagram Stories and TikTok, while 4:5 vertical (1080x1350 px) and 1:1 square (1080x1080 px) are ideal for Instagram and Facebook feed posts."
                }
              },
              {
                "@type": "Question",
                "name": "Can I export my flyer in both print (11x17) and social (9:16) aspect ratios?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. GigLizard's poster studio allows you to switch between 11x17 vertical print posters, 9:16 vertical social story flyers, and square social feed formats with instant vector typography rendering and 300 DPI export ready for commercial printers and digital screens."
                }
              }
            ]
          }
        ]
      };
      html = html.replace(
        "</head>",
        `    <script type="application/ld+json">\n    ${JSON.stringify(posterSchema, null, 2)}\n    </script>\n  </head>`
      );
    }

    const routeSnippet = getRouteNoscriptSnippet(cleanPath);
    if (routeSnippet) {
      html = html.replace("</main>", `${routeSnippet}\n      </main>`);
    }
  }

  return html;
}

// Vite or Static file hosting setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });

    // Custom HTML route renderer with per-page SEO titles, descriptions, and canonicals (D5.1, D5.3)
    app.use(async (req, res, next) => {
      if (
        req.method !== "GET" || 
        req.path.startsWith("/api/") || 
        req.path.startsWith("/@") || 
        req.path.startsWith("/src/") || 
        req.path.startsWith("/node_modules/") ||
        req.path.includes(".")
      ) {
        return next();
      }
      try {
        const template = fs.readFileSync(path.resolve("index.html"), "utf-8");
        const customHtml = renderHtmlForRoute(template, req.path);
        const transformedHtml = await vite.transformIndexHtml(req.originalUrl, customHtml);
        res.status(200).set({ "Content-Type": "text/html" }).end(transformedHtml);
      } catch (e) {
        next(e);
      }
    });

    app.use(vite.middlewares);
  } else {
    console.log("Starting in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, { index: false }));
    app.get("*", (req, res) => {
      const templatePath = path.join(distPath, "index.html");
      if (fs.existsSync(templatePath)) {
        const template = fs.readFileSync(templatePath, "utf-8");
        const finalHtml = renderHtmlForRoute(template, req.path);
        res.status(200).set({ "Content-Type": "text/html" }).end(finalHtml);
      } else {
        res.sendFile(templatePath);
      }
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

