/**
 * Anti-Scraping, Bot Defense, and Security Utilities
 */

// 1. Email and Contact Masking / De-obfuscation
export function encodeProtectedString(str: string): string {
  if (!str) return "";
  try {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      })
    );
  } catch (e) {
    return str;
  }
}

export function decodeProtectedString(encoded: string): string {
  if (!encoded) return "";
  try {
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(encoded), (c: string) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
  } catch (e) {
    return encoded;
  }
}

/**
 * Splits a sensitive contact string (email/phone) into segmented DOM chunks
 * interleaved with randomized honeypot decoy spans that are invisible to humans
 * but contaminate raw HTML parsers, Cheerio, Selenium, Puppeteer, and regex harvesters.
 */
export interface ObfuscatedChunk {
  text: string;
  isDecoy: boolean;
  decoyId?: string;
}

const DECOY_NOISE_TOKENS = [
  "<!--anti-scrape-shield-->",
  "bot-trap-harvest-null",
  "spider-deflect-2026",
  "crawl-reject",
  "no-harvest",
  "shield-guard",
  "honeypot-token"
];

export function generateDeconstructedContactChunks(value: string): ObfuscatedChunk[] {
  if (!value) return [];
  
  const chunks: ObfuscatedChunk[] = [];
  // Break into 2-4 character segments
  let i = 0;
  while (i < value.length) {
    const chunkSize = Math.min(Math.floor(Math.random() * 3) + 2, value.length - i);
    const segment = value.slice(i, i + chunkSize);
    chunks.push({ text: segment, isDecoy: false });
    i += chunkSize;

    // Inject a decoy noise token at pseudo-random intervals
    if (i < value.length && Math.random() > 0.45) {
      const noise = DECOY_NOISE_TOKENS[Math.floor(Math.random() * DECOY_NOISE_TOKENS.length)];
      chunks.push({ text: noise, isDecoy: true, decoyId: `decoy-${Math.random().toString(36).slice(2, 7)}` });
    }
  }

  return chunks;
}

// Generates an HTML representation that is resistant to naive email harvester scrapers
export function getObfuscatedEmailParts(email: string): { user: string; domain: string; tld: string } {
  if (!email || !email.includes("@")) {
    return { user: "info", domain: "domain", tld: "com" };
  }
  const parts = email.split("@");
  const user = parts[0];
  const domainParts = parts[1].split(".");
  const domain = domainParts.slice(0, -1).join(".");
  const tld = domainParts[domainParts.length - 1] || "com";
  return { user, domain, tld };
}

// 2. Client-side Bot & Automated Headless Scraper Detection
export function detectAutomatedBot(): { isBot: boolean; flags: string[] } {
  const flags: string[] = [];

  if (typeof window === "undefined") {
    return { isBot: false, flags: [] };
  }

  // Check 1: navigator.webdriver flag (often set by Selenium, Puppeteer, Playwright)
  if (navigator.webdriver) {
    flags.push("Navigator webdriver active");
  }

  // Check 2: Headless user agent patterns
  const ua = navigator.userAgent.toLowerCase();
  const botKeywords = [
    "headlesschrome",
    "phantomjs",
    "selenium",
    "puppeteer",
    "scrapy",
    "crawler",
    "spider",
    "bot",
    "python-requests",
    "curl",
    "wget"
  ];
  for (const keyword of botKeywords) {
    if (ua.includes(keyword)) {
      flags.push(`Suspicious bot signature in User-Agent (${keyword})`);
      break;
    }
  }

  // Check 3: Missing standard browser plugins/languages in automated environments
  if (!navigator.languages || navigator.languages.length === 0) {
    flags.push("Missing browser navigator languages");
  }

  // Check 4: Automation attributes on window
  const win = window as any;
  if (
    win._phantom ||
    win.__nightmare ||
    win.callPhantom ||
    win.__selenium_unwrapped ||
    win.__webdriver_evaluate ||
    win.__driver_evaluate
  ) {
    flags.push("Headless automation runtime globals detected");
  }

  return {
    isBot: flags.length > 0,
    flags
  };
}

// 3. Client-Side Rapid Harvesting / Mass Scraper Rate Limiter
const clientInteractionLog: number[] = [];
const RAPID_ACCESS_THRESHOLD = 18; // 18 rapid reads in 2.5 seconds
const TIME_WINDOW_MS = 2500;

export function checkRapidHarvestingAttempt(): boolean {
  const now = Date.now();
  clientInteractionLog.push(now);

  // Keep only logs within current window
  while (clientInteractionLog.length > 0 && clientInteractionLog[0] < now - TIME_WINDOW_MS) {
    clientInteractionLog.shift();
  }

  if (clientInteractionLog.length > RAPID_ACCESS_THRESHOLD) {
    // Notify server of honeypot / aggressive scraping trigger
    try {
      fetch("/api/security-honeypot", { method: "GET", keepalive: true }).catch(() => {});
    } catch (_) {}
    return true;
  }
  return false;
}

// 4. Input Sanitization to protect against XSS and injection
export function sanitizeInputText(input: string, maxLength: number = 500): string {
  if (!input || typeof input !== "string") return "";
  let clean = input
    .replace(/[<>]/g, "") // Remove HTML tag brackets
    .replace(/javascript:/gi, "") // Remove javascript protocol
    .replace(/data:/gi, "") // Remove data URI scheme
    .replace(/on\w+\s*=/gi, "") // Remove inline event handlers
    .trim();
  
  if (clean.length > maxLength) {
    clean = clean.substring(0, maxLength);
  }
  return clean;
}

// 5. Safe Regular Expression Escaping (Prevents ReDoS attacks)
export function escapeRegexSpecial(str: string): string {
  if (!str) return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 6. Captcha Code Generator & Math Puzzle
export interface CaptchaData {
  id: string;
  code: string;
  mathQuestion: string;
  mathAnswer: number;
  createdAt: number;
}

const CHAR_SET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Omitted 0, 1, I, O to prevent ambiguity

export function generateLocalCaptcha(): CaptchaData {
  let code = "";
  for (let i = 0; i < 5; i++) {
    const idx = Math.floor(Math.random() * CHAR_SET.length);
    code += CHAR_SET[idx];
  }

  const num1 = Math.floor(Math.random() * 8) + 2; // 2 to 9
  const num2 = Math.floor(Math.random() * 7) + 1; // 1 to 7
  const isAdd = Math.random() > 0.3;
  
  const mathQuestion = isAdd ? `${num1} + ${num2}` : `${num1 + num2} - ${num2}`;
  const mathAnswer = isAdd ? num1 + num2 : num1;

  return {
    id: `cap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    code,
    mathQuestion,
    mathAnswer,
    createdAt: Date.now()
  };
}

