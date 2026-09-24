// Analytics & Telemetry Storage Engine for GigLizard
// Manages daily visits, account signups, subscriber contact directory, and platform metrics

export interface DailyMetric {
  date: string; // "YYYY-MM-DD" e.g. "2026-08-29"
  label: string; // "Aug 29"
  visits: number;
  signups: number;
  paidSubscribers: number;
  conversionRate: number; // percentage
  tourPlansCreated: number;
  postersDesigned: number;
  reviewsSubmitted: number;
}

export interface SubscriberMember {
  id: string;
  name: string;
  contactEmail: string;
  type: "Band" | "Venue" | "Sound Engineer";
  city: string;
  isPaid: boolean;
  plan: "30-Day All-Access Pass ($9.99/mo)" | "Free Community Member" | "Annual VIP Pass";
  signupDate: string;
  renewalDate?: string;
  paypalOrderId?: string;
  experienceLevel?: string;
  notes?: string;
  status: "Active" | "Pending Renewal" | "Free Tier";
}

// Default Seed Subscriber List (all general community members are Free Tier; only verified PayPal payments or owner grant paid status)
export const INITIAL_SUBSCRIBERS: SubscriberMember[] = [
  {
    id: "sub-1",
    name: "Dr Hadit",
    contactEmail: "littlerusty@gmail.com",
    type: "Band",
    city: "Seattle, WA",
    isPaid: true,
    plan: "30-Day All-Access Pass ($9.99/mo)",
    signupDate: "2026-06-15",
    renewalDate: "Never Expires (Auto-Renews Every 30 Days Forever)",
    paypalOrderId: "SUB-VIP-PERPETUAL-OWNER",
    experienceLevel: "National Act",
    status: "Active",
    notes: "Platform Owner & Artist (Dr Hadit) • Auto-Renews Every 30 Days Forever (Never Expires)"
  },
  {
    id: "sub-1b",
    name: "Silent Velocity",
    contactEmail: "velocitybooking@northwestdiy.org",
    type: "Band",
    city: "Seattle, WA",
    isPaid: false,
    plan: "Free Community Member",
    signupDate: "2026-06-20",
    experienceLevel: "Regional Tour",
    status: "Free Tier",
    notes: "PNW grunge energy • Free Community Member"
  },
  {
    id: "sub-2",
    name: "The Subterranean Cellar",
    contactEmail: "booking@subterraneancellarseattle.com",
    type: "Venue",
    city: "Seattle, WA",
    isPaid: false,
    plan: "Free Community Member",
    signupDate: "2026-07-01",
    status: "Free Tier",
    notes: "250-cap historic grunge basement"
  },
  {
    id: "sub-3",
    name: "Neon Velvet",
    contactEmail: "mgmt@neonvelvetband.com",
    type: "Band",
    city: "Portland, OR",
    isPaid: false,
    plan: "Free Community Member",
    signupDate: "2026-07-12",
    experienceLevel: "Regional Tour",
    status: "Free Tier",
    notes: "Dream pop 4-piece touring Pacific NW"
  },
  {
    id: "sub-4",
    name: "Blackwood Tavern & Stage",
    contactEmail: "shows@blackwoodtavern.org",
    type: "Venue",
    city: "Portland, OR",
    isPaid: false,
    plan: "Free Community Member",
    signupDate: "2026-07-18",
    status: "Free Tier",
    notes: "Indie rock venue & taproom"
  },
  {
    id: "sub-5",
    name: "Static Horizon",
    contactEmail: "statichorizon.band@gmail.com",
    type: "Band",
    city: "San Francisco, CA",
    isPaid: false,
    plan: "Free Community Member",
    signupDate: "2026-07-22",
    experienceLevel: "Regional Tour",
    status: "Free Tier",
    notes: "Post-punk duo"
  },
  {
    id: "sub-6",
    name: "The Echo Chamber Lounge",
    contactEmail: "music@echochamberatx.com",
    type: "Venue",
    city: "Austin, TX",
    isPaid: false,
    plan: "Free Community Member",
    signupDate: "2026-08-02",
    status: "Free Tier",
    notes: "180-cap room in Red River Cultural District"
  },
  {
    id: "sub-7",
    name: "Canyon Sound & Lights",
    contactEmail: "dave.audio@canyonsound.live",
    type: "Sound Engineer",
    city: "Denver, CO",
    isPaid: false,
    plan: "Free Community Member",
    signupDate: "2026-08-05",
    status: "Free Tier",
    notes: "FOH Sound tech and festival stage manager"
  },
  {
    id: "sub-8",
    name: "Velvet Rust",
    contactEmail: "contact@velvetrustmusic.com",
    type: "Band",
    city: "Austin, TX",
    isPaid: false,
    plan: "Free Community Member",
    signupDate: "2026-08-09",
    experienceLevel: "National Act",
    status: "Free Tier",
    notes: "Heavy psych & garage rock"
  },
  {
    id: "sub-9",
    name: "Mercury Social Club",
    contactEmail: "booker@mercurysocialclub.com",
    type: "Venue",
    city: "Denver, CO",
    isPaid: false,
    plan: "Free Community Member",
    signupDate: "2026-08-11",
    status: "Free Tier",
    notes: "Downtown multi-tier performance stage"
  },
  {
    id: "sub-10",
    name: "The Sunken Cathedral",
    contactEmail: "gigs@sunkencathedral.net",
    type: "Venue",
    city: "Chicago, IL",
    isPaid: false,
    plan: "Free Community Member",
    signupDate: "2026-08-14",
    status: "Free Tier",
    notes: "350-cap gothic hall"
  },
  {
    id: "sub-11",
    name: "Silver Pines",
    contactEmail: "silverpines.folk@gmail.com",
    type: "Band",
    city: "Spokane, WA",
    isPaid: false,
    plan: "Free Community Member",
    signupDate: "2026-08-16",
    experienceLevel: "Local",
    status: "Free Tier",
    notes: "Indie folk acoustic trio"
  },
  {
    id: "sub-12",
    name: "Radio Room East",
    contactEmail: "radioroomeast@gmail.com",
    type: "Venue",
    city: "Nashville, TN",
    isPaid: false,
    plan: "Free Community Member",
    signupDate: "2026-08-18",
    status: "Free Tier",
    notes: "Americana & rock showcase venue"
  },
  {
    id: "sub-13",
    name: "Prism Waves",
    contactEmail: "prismwaves.synth@outlook.com",
    type: "Band",
    city: "Los Angeles, CA",
    isPaid: false,
    plan: "Free Community Member",
    signupDate: "2026-08-20",
    experienceLevel: "Regional Tour",
    status: "Free Tier",
    notes: "Synth-pop quartet"
  },
  {
    id: "sub-14",
    name: "The High Volt Lounge",
    contactEmail: "booking@highvoltlounge.com",
    type: "Venue",
    city: "Boise, ID",
    isPaid: false,
    plan: "Free Community Member",
    signupDate: "2026-08-22",
    status: "Free Tier",
    notes: "Indie club stop on I-84 route"
  },
  {
    id: "sub-15",
    name: "Ghost Frequency",
    contactEmail: "ghostfrequency.rock@gmail.com",
    type: "Band",
    city: "Tacoma, WA",
    isPaid: false,
    plan: "Free Community Member",
    signupDate: "2026-08-25",
    experienceLevel: "Local",
    status: "Free Tier",
    notes: "Local post-hardcore band"
  },
  {
    id: "sub-16",
    name: "Thunderhead Brewery & Stage",
    contactEmail: "events@thunderheadlive.com",
    type: "Venue",
    city: "Bellingham, WA",
    isPaid: false,
    plan: "Free Community Member",
    signupDate: "2026-08-27",
    status: "Free Tier",
    notes: "Craft taproom with full 24-channel PA"
  }
];

// Helper to generate realistic historical 30-day time series data leading up to August 29, 2026
export function generateHistoricalMetrics(): DailyMetric[] {
  const result: DailyMetric[] = [];
  const now = new Date(2026, 7, 29); // August 29, 2026

  // 30 days history pattern
  const baseTrafficPattern = [
    { dayOffset: 29, visits: 142, signups: 6, paid: 0, tour: 8, poster: 12, rev: 2 },
    { dayOffset: 28, visits: 156, signups: 8, paid: 0, tour: 11, poster: 14, rev: 3 },
    { dayOffset: 27, visits: 189, signups: 11, paid: 0, tour: 15, poster: 19, rev: 4 },
    { dayOffset: 26, visits: 214, signups: 14, paid: 0, tour: 18, poster: 22, rev: 5 },
    { dayOffset: 25, visits: 168, signups: 9, paid: 0, tour: 12, poster: 15, rev: 2 },
    { dayOffset: 24, visits: 175, signups: 10, paid: 0, tour: 14, poster: 16, rev: 3 },
    { dayOffset: 23, visits: 192, signups: 12, paid: 0, tour: 17, poster: 20, rev: 4 },
    { dayOffset: 22, visits: 208, signups: 13, paid: 0, tour: 19, poster: 21, rev: 3 },
    { dayOffset: 21, visits: 235, signups: 16, paid: 0, tour: 23, poster: 25, rev: 6 },
    { dayOffset: 20, visits: 274, signups: 19, paid: 0, tour: 28, poster: 31, rev: 8 },
    { dayOffset: 19, visits: 290, signups: 22, paid: 0, tour: 30, poster: 34, rev: 7 },
    { dayOffset: 18, visits: 225, signups: 14, paid: 0, tour: 20, poster: 24, rev: 4 },
    { dayOffset: 17, visits: 240, signups: 15, paid: 0, tour: 22, poster: 26, rev: 5 },
    { dayOffset: 16, visits: 265, signups: 18, paid: 0, tour: 25, poster: 28, rev: 6 },
    { dayOffset: 15, visits: 282, signups: 20, paid: 0, tour: 27, poster: 30, rev: 5 },
    { dayOffset: 14, visits: 310, signups: 24, paid: 0, tour: 32, poster: 36, rev: 8 },
    { dayOffset: 13, visits: 345, signups: 27, paid: 0, tour: 38, poster: 42, rev: 9 },
    { dayOffset: 12, visits: 368, signups: 29, paid: 0, tour: 40, poster: 45, rev: 11 },
    { dayOffset: 11, visits: 295, signups: 19, paid: 0, tour: 28, poster: 32, rev: 6 },
    { dayOffset: 10, visits: 315, signups: 21, paid: 0, tour: 31, poster: 35, rev: 7 },
    { dayOffset: 9, visits: 338, signups: 25, paid: 0, tour: 35, poster: 39, rev: 8 },
    { dayOffset: 8, visits: 360, signups: 28, paid: 0, tour: 39, poster: 44, rev: 9 },
    { dayOffset: 7, visits: 392, signups: 32, paid: 0, tour: 44, poster: 48, rev: 12 },
    { dayOffset: 6, visits: 435, signups: 38, paid: 0, tour: 50, poster: 54, rev: 14 },
    { dayOffset: 5, visits: 458, signups: 41, paid: 0, tour: 54, poster: 58, rev: 16 },
    { dayOffset: 4, visits: 380, signups: 28, paid: 0, tour: 42, poster: 46, rev: 10 },
    { dayOffset: 3, visits: 405, signups: 33, paid: 0, tour: 47, poster: 51, rev: 11 },
    { dayOffset: 2, visits: 442, signups: 37, paid: 0, tour: 52, poster: 56, rev: 13 },
    { dayOffset: 1, visits: 475, signups: 42, paid: 0, tour: 58, poster: 62, rev: 15 },
    { dayOffset: 0, visits: 512, signups: 46, paid: 0, tour: 64, poster: 68, rev: 18 } // Today (Aug 29) - 0 verified paid transactions today
  ];

  for (const item of baseTrafficPattern) {
    const d = new Date(now);
    d.setDate(d.getDate() - item.dayOffset);
    
    const year = d.getFullYear();
    const monthStr = String(d.getMonth() + 1).padStart(2, "0");
    const dayStr = String(d.getDate()).padStart(2, "0");
    const dateKey = `${year}-${monthStr}-${dayStr}`;

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const label = `${monthNames[d.getMonth()]} ${d.getDate()}`;

    const convRate = parseFloat(((item.signups / item.visits) * 100).toFixed(1));

    result.push({
      date: dateKey,
      label,
      visits: item.visits,
      signups: item.signups,
      paidSubscribers: item.paid,
      conversionRate: convRate,
      tourPlansCreated: item.tour,
      postersDesigned: item.poster,
      reviewsSubmitted: item.rev
    });
  }

  return result;
}

// Read current analytics data combining static seeds with live localStorage telemetry
export function getAnalyticsData() {
  const storedVisitsKey = "giglizard_live_visits_v1";
  const storedSignupsKey = "giglizard_live_signups_v1";
  
  let metrics = generateHistoricalMetrics();

  try {
    const rawVisits = localStorage.getItem(storedVisitsKey);
    const rawSignups = localStorage.getItem(storedSignupsKey);
    
    const liveVisitsCount = rawVisits ? parseInt(rawVisits, 10) : 0;
    const liveSignupsCount = rawSignups ? parseInt(rawSignups, 10) : 0;

    // Apply live additions to today's entry
    if (metrics.length > 0) {
      const todayEntry = metrics[metrics.length - 1];
      todayEntry.visits += liveVisitsCount;
      todayEntry.signups += liveSignupsCount;
      todayEntry.conversionRate = parseFloat(((todayEntry.signups / todayEntry.visits) * 100).toFixed(1));
    }
  } catch (e) {
    console.warn("Could not read live metrics from localStorage:", e);
  }

  return metrics;
}

// Track a live page visit
export function recordLiveVisit() {
  try {
    const storedVisitsKey = "giglizard_live_visits_v1";
    const current = parseInt(localStorage.getItem(storedVisitsKey) || "0", 10);
    localStorage.setItem(storedVisitsKey, String(current + 1));

    // Send async ping to server
    fetch("/api/track/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: window.location.pathname + window.location.hash,
        timestamp: new Date().toISOString(),
        referrer: document.referrer || "direct"
      })
    }).catch(() => {});
  } catch (_) {}
}

// Track a live signup
export function recordLiveSignup(account: any) {
  try {
    const storedSignupsKey = "giglizard_live_signups_v1";
    const current = parseInt(localStorage.getItem(storedSignupsKey) || "0", 10);
    localStorage.setItem(storedSignupsKey, String(current + 1));

    // Store in subscribers list
    const subscribersKey = "giglizard_custom_subscribers_v1";
    const existing = JSON.parse(localStorage.getItem(subscribersKey) || "[]");
    
    const newSub: SubscriberMember = {
      id: `sub-usr-${Date.now()}`,
      name: account.name || "Member",
      contactEmail: account.contactEmail || "",
      type: account.type || "Band",
      city: account.city || "Seattle, WA",
      isPaid: account.isPremium || account.hasPaidAccess || false,
      plan: account.isPremium || account.hasPaidAccess ? "30-Day All-Access Pass ($9.99/mo)" : "Free Community Member",
      signupDate: new Date().toISOString().split("T")[0],
      renewalDate: account.accessExpiresAt?.split("T")[0] || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      paypalOrderId: account.paypalOrderId,
      experienceLevel: account.experienceLevel,
      status: account.isPremium || account.hasPaidAccess ? "Active" : "Free Tier"
    };

    const updated = [newSub, ...existing.filter((s: any) => s.contactEmail.toLowerCase() !== newSub.contactEmail.toLowerCase())];
    localStorage.setItem(subscribersKey, JSON.stringify(updated));

    // Notify listeners
    window.dispatchEvent(new CustomEvent("giglizard_subscribers_updated"));
  } catch (_) {}
}

// Retrieve combined subscriber list (Seeds + dynamically registered users with strict payment verification)
export function getAllSubscribers(): SubscriberMember[] {
  let list = [...INITIAL_SUBSCRIBERS];

  try {
    // 1. Check custom registered accounts
    const customSubStr = localStorage.getItem("giglizard_custom_subscribers_v1");
    if (customSubStr) {
      const customSubs: SubscriberMember[] = JSON.parse(customSubStr);
      list = [...customSubs, ...list.filter(s => !customSubs.some(c => c.contactEmail.toLowerCase() === s.contactEmail.toLowerCase()))];
    }

    // 2. Check current logged-in user
    const currentAccStr = localStorage.getItem("current_user_account_v1");
    if (currentAccStr) {
      const currentAcc = JSON.parse(currentAccStr);
      if (currentAcc?.contactEmail) {
        const isOwner = currentAcc.contactEmail.trim().toLowerCase() === "littlerusty@gmail.com";
        const hasVerifiedPayment = isOwner || Boolean(
          currentAcc.paypalOrderId && 
          currentAcc.accessExpiresAt && 
          new Date(currentAcc.accessExpiresAt) > new Date()
        );

        const found = list.find(s => s.contactEmail.toLowerCase() === currentAcc.contactEmail.toLowerCase());
        if (!found) {
          list.unshift({
            id: `sub-cur-${Date.now()}`,
            name: currentAcc.name,
            contactEmail: currentAcc.contactEmail,
            type: currentAcc.type || "Band",
            city: currentAcc.city || "Seattle, WA",
            isPaid: hasVerifiedPayment,
            plan: hasVerifiedPayment ? "30-Day All-Access Pass ($9.99/mo)" : "Free Community Member",
            signupDate: new Date().toISOString().split("T")[0],
            renewalDate: hasVerifiedPayment ? currentAcc.accessExpiresAt?.split("T")[0] : undefined,
            paypalOrderId: currentAcc.paypalOrderId,
            experienceLevel: currentAcc.experienceLevel,
            status: hasVerifiedPayment ? "Active" : "Free Tier",
            notes: isOwner ? "Platform Owner & Artist (Dr Hadit) • Auto-Renews Every 30 Days Forever (Never Expires)" : undefined
          });
        }
      }
    }

    // Strict validation: Only littlerusty@gmail.com or accounts with active unexpired paypalOrderId are marked as isPaid: true
    list = list.map(s => {
      const email = s.contactEmail.trim().toLowerCase();
      if (email === "littlerusty@gmail.com") {
        return {
          ...s,
          isPaid: true,
          status: "Active" as const,
          plan: "30-Day All-Access Pass ($9.99/mo)" as const,
          renewalDate: "Never Expires (Auto-Renews Every 30 Days Forever)",
          notes: "Platform Owner & Artist (Dr Hadit) • Auto-Renews Every 30 Days Forever (Never Expires)"
        };
      }
      
      // For standard accounts: strictly verify payment
      const hasValidOrder = Boolean(
        s.paypalOrderId && 
        s.paypalOrderId.length > 5 &&
        !s.paypalOrderId.startsWith("PAYID-") && // exclude former placeholder mock IDs
        s.renewalDate && 
        new Date(s.renewalDate) > new Date()
      );

      if (!hasValidOrder) {
        return {
          ...s,
          isPaid: false,
          status: "Free Tier" as const,
          plan: "Free Community Member" as const,
          renewalDate: undefined,
          paypalOrderId: undefined
        };
      }

      return s;
    });
  } catch (e) {
    console.error("Error building subscriber list:", e);
  }

  return list;
}

// Generate a CSV export string for subscriber email list
export function generateSubscribersCSV(subscribers: SubscriberMember[]): string {
  const headers = ["Name", "Email", "Account Type", "City", "Plan", "Status", "Signup Date", "Renewal Date", "Experience / Notes"];
  const rows = subscribers.map(s => [
    `"${(s.name || "").replace(/"/g, '""')}"`,
    `"${(s.contactEmail || "").replace(/"/g, '""')}"`,
    `"${s.type}"`,
    `"${(s.city || "").replace(/"/g, '""')}"`,
    `"${s.plan}"`,
    `"${s.status}"`,
    `"${s.signupDate || ""}"`,
    `"${s.renewalDate || "N/A"}"`,
    `"${(s.experienceLevel || s.notes || "").replace(/"/g, '""')}"`
  ]);

  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
}

// Generate direct mailto link for batch email broadcasting
export function buildSubscribersMailto(
  subscribers: SubscriberMember[],
  filter: "all" | "paid" | "bands" | "venues" = "all",
  subject: string = "GigLizard Community Announcement",
  body: string = "Hello GigLizard artists and venue partners,\n\n"
): string {
  let targets = subscribers;
  if (filter === "paid") {
    targets = subscribers.filter(s => s.isPaid);
  } else if (filter === "bands") {
    targets = subscribers.filter(s => s.type === "Band");
  } else if (filter === "venues") {
    targets = subscribers.filter(s => s.type === "Venue");
  }

  const validEmails = targets
    .map(s => s.contactEmail.trim())
    .filter(e => e && e.includes("@") && !e.startsWith("--"));

  // Put emails in BCC so recipients' emails remain confidential
  const bccList = encodeURIComponent(validEmails.join(","));
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);

  return `mailto:littlerusty@gmail.com?bcc=${bccList}&subject=${encodedSubject}&body=${encodedBody}`;
}
