import React, { useState, useEffect } from "react";
import { Venue, UserAccount } from "../types";
import { MUSIC_VENUES } from "../data/venues";
import { Search, MapPin, Mail, Phone, Globe, Volume2, Lightbulb, Ticket, Users, AlertTriangle, PlusCircle, Check, Lock, Sparkles, ShieldCheck, ShieldAlert, KeyRound, RefreshCw, Star, MessageSquare } from "lucide-react";
import ProtectedContact from "./ProtectedContact";
import SecurityShieldModal from "./SecurityShieldModal";
import CaptchaChallenge from "./CaptchaChallenge";
import RatingStars from "./RatingStars";
import ReviewsModal from "./ReviewsModal";
import { getRatingStats } from "../utils/reviewsManager";
import { sanitizeInputText, escapeRegexSpecial, detectAutomatedBot, checkRapidHarvestingAttempt } from "../utils/antiScrape";
import { getOwnerVenueEdits, getOwnerDeletedVenueIds, isEmailAlreadyRegistered, normalizeEmail } from "../utils/directoryStore";

interface VenueDirectoryProps {
  onSelectVenueForPoster: (venue: Venue) => void;
  selectedVenueId?: string;
  currentAccount?: UserAccount | null;
  onTriggerUpgrade?: () => void;
}

export default function VenueDirectory({ 
  onSelectVenueForPoster, 
  selectedVenueId, 
  currentAccount, 
  onTriggerUpgrade 
}: VenueDirectoryProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedState, setSelectedState] = useState("All");
  const [selectedCapacity, setSelectedCapacity] = useState("All");
  const [selectedRatingFilter, setSelectedRatingFilter] = useState("All");

  const [showAddForm, setShowAddForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [honeypotBot, setHoneypotBot] = useState("");
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [reviewModalVenue, setReviewModalVenue] = useState<Venue | null>(null);
  const [reviewsVersion, setReviewsVersion] = useState(0);
  const [isBotSuspicious, setIsBotSuspicious] = useState(false);
  const [botFlags, setBotFlags] = useState<string[]>([]);
  const [captchaPassed, setCaptchaPassed] = useState(true);


  const [form, setForm] = useState({
    name: "",
    capacity: 150,
    address: "",
    city: "",
    genres: "",
    contactEmail: "",
    contactPhone: "",
    description: "",
    website: "",
    hasPA: true,
    hasLighting: true
  });

  useEffect(() => {
    // 1. Check for automated headless scrapers (Puppeteer, Selenium, headless Chrome)
    const botCheck = detectAutomatedBot();
    if (botCheck.isBot) {
      console.warn("[Anti-Scraping Defense] Automated crawler signature identified:", botCheck.flags);
      setIsBotSuspicious(true);
      setBotFlags(botCheck.flags);
      setCaptchaPassed(false);
    }

    const onReviewsUpdated = () => {
      setReviewsVersion(v => v + 1);
    };
    window.addEventListener("giglizard_reviews_updated", onReviewsUpdated);
    return () => window.removeEventListener("giglizard_reviews_updated", onReviewsUpdated);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("custom_venues_v1");

    let customList: Venue[] = [];
    if (saved) {
      try {
        customList = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }

    let userVenueList: Venue[] = [];
    if (currentAccount && currentAccount.type === "Venue" && currentAccount.name) {
      const userVenueObj: Venue = {
        id: `venue-user-${currentAccount.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: currentAccount.name,
        capacity: currentAccount.capacity || 150,
        address: currentAccount.address || "123 Music Ave",
        city: currentAccount.city || "Seattle, WA",
        genres: currentAccount.genre ? currentAccount.genre.split(",").map(g => g.trim()).filter(Boolean) : ["Live Music"],
        contactEmail: currentAccount.contactEmail || "",
        contactPhone: currentAccount.contactPhone || "Inquire",
        description: currentAccount.bio || "Live music performance space.",
        website: currentAccount.website || "www.inquire-booking.com",
        hasPA: currentAccount.hasPA ?? true,
        hasLighting: currentAccount.hasLighting ?? true
      };
      userVenueList = [userVenueObj];
    }

    const rawMerged = [...userVenueList, ...customList, ...MUSIC_VENUES];
    const deletedIds = new Set(getOwnerDeletedVenueIds());
    const ownerEdits = getOwnerVenueEdits();

    const seenNames = new Set<string>();
    const deduplicatedVenues: Venue[] = [];
    for (let v of rawMerged) {
      const key = v.name?.trim().toLowerCase();
      if (deletedIds.has(v.id) || (key && deletedIds.has(key))) {
        continue;
      }
      if (ownerEdits[v.id]) {
        v = { ...v, ...ownerEdits[v.id] };
      } else if (key && ownerEdits[key]) {
        v = { ...v, ...ownerEdits[key] };
      }
      if (key && !seenNames.has(key)) {
        seenNames.add(key);
        deduplicatedVenues.push(v);
      }
    }

    setVenues(deduplicatedVenues);

    const onVenuesUpdated = () => {
      const updatedSaved = localStorage.getItem("custom_venues_v1");
      let updatedCustom: Venue[] = [];
      if (updatedSaved) {
        try { updatedCustom = JSON.parse(updatedSaved); } catch (_) {}
      }
      const updatedMerged = [...userVenueList, ...updatedCustom, ...MUSIC_VENUES];
      const updatedDelIds = new Set(getOwnerDeletedVenueIds());
      const updatedEdits = getOwnerVenueEdits();
      const updatedSeen = new Set<string>();
      const updatedList: Venue[] = [];
      for (let uv of updatedMerged) {
        const ukey = uv.name?.trim().toLowerCase();
        if (updatedDelIds.has(uv.id) || (ukey && updatedDelIds.has(ukey))) {
          continue;
        }
        if (updatedEdits[uv.id]) {
          uv = { ...uv, ...updatedEdits[uv.id] };
        } else if (ukey && updatedEdits[ukey]) {
          uv = { ...uv, ...updatedEdits[ukey] };
        }
        if (ukey && !updatedSeen.has(ukey)) {
          updatedSeen.add(ukey);
          updatedList.push(uv);
        }
      }
      setVenues(updatedList);
    };

    window.addEventListener("giglizard_venues_updated", onVenuesUpdated);
    return () => {
      window.removeEventListener("giglizard_venues_updated", onVenuesUpdated);
    };
  }, [currentAccount?.name, currentAccount?.type, currentAccount?.contactEmail]);

  const handleAddVenueSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Bot trap check
    if (honeypotBot.trim().length > 0) {
      console.warn("Bot submission deflected by honeypot.");
      try {
        fetch("/api/security-honeypot", { method: "GET" }).catch(() => {});
      } catch (_) {}
      return;
    }

    const cleanName = sanitizeInputText(form.name, 100);
    const cleanAddress = sanitizeInputText(form.address, 150);
    const cleanCity = sanitizeInputText(form.city, 100);
    const cleanEmail = normalizeEmail(sanitizeInputText(form.contactEmail, 100));
    const cleanPhone = sanitizeInputText(form.contactPhone, 50);
    const cleanDesc = sanitizeInputText(form.description, 500);
    const cleanWeb = sanitizeInputText(form.website, 100);

    if (!cleanName || !cleanAddress || !cleanCity || !cleanEmail) {
      alert("Please fill in all requested fields: Venue Name, Address, City & Email.");
      return;
    }

    if (!cleanEmail.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    if (isEmailAlreadyRegistered(cleanEmail)) {
      alert(`An account with the email "${cleanEmail}" already exists. Please log in or use a different email.`);
      return;
    }

    const processedGenres = form.genres 
      ? form.genres.split(",").map(g => sanitizeInputText(g.trim(), 30)).filter(g => g.length > 0)
      : ["Live Music"];

    const newVenue: Venue = {
      id: `venue-${Date.now()}`,
      name: cleanName,
      capacity: Number(form.capacity) || 100,
      address: cleanAddress,
      city: cleanCity,
      genres: processedGenres,
      contactEmail: cleanEmail,
      contactPhone: cleanPhone || "Inquire",
      description: `[Capacity: ${form.capacity} guests] ${cleanDesc || "A gorgeous live music environment ready for exciting performances."}`,
      website: cleanWeb || "www.inquire-booking.com",
      hasPA: form.hasPA,
      hasLighting: form.hasLighting
    };

    const saved = localStorage.getItem("custom_venues_v1");
    let customList: Venue[] = [];
    if (saved) {
      try {
        customList = JSON.parse(saved);
      } catch (err) {
        console.error(err);
      }
    }
    const updatedCustomList = [newVenue, ...customList.filter(v => v.name.toLowerCase() !== cleanName.toLowerCase() && v.contactEmail.toLowerCase() !== cleanEmail.toLowerCase())];
    localStorage.setItem("custom_venues_v1", JSON.stringify(updatedCustomList));

    const combined = [newVenue, ...venues.filter(v => v.name.toLowerCase() !== cleanName.toLowerCase())];
    setVenues(combined);
    setShowAddForm(false);
    setSuccessMsg(`Successfully added "${cleanName}" to Venue Directory!`);
    setTimeout(() => setSuccessMsg(""), 4000);
    
    // Reset form
    setForm({
      name: "",
      capacity: 150,
      address: "",
      city: "",
      genres: "",
      contactEmail: "",
      contactPhone: "",
      description: "",
      website: "",
      hasPA: true,
      hasLighting: true
    });
    setSuccessMsg("Successfully registered your music venue space!");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const genres = ["All", "Grunge", "Punk", "Alternative Rock", "Indie Rock", "Synthwave", "Folk", "Acoustic", "Electronic", "Psychedelic", "Metal", "Jazz"];

  const filteredVenues = venues.filter((venue) => {
    // 1. Genre filter
    const matchesGenre = selectedGenre === "All" || venue.genres.includes(selectedGenre);
    
    // 2. State filter (Washington, Oregon, Other)
    let matchesState = true;
    if (selectedState === "WA") {
      matchesState = venue.address.includes(", WA") || venue.city.includes("WA") || venue.id.startsWith("wa-");
    } else if (selectedState === "OR") {
      matchesState = venue.address.includes(", OR") || venue.city.includes("OR") || venue.id.startsWith("or-");
    } else if (selectedState === "OTHER") {
      matchesState = !(venue.address.includes(", WA") || venue.address.includes(", OR") || venue.id.startsWith("wa-") || venue.id.startsWith("or-"));
    }

    // 3. Search match
    const text = `${venue.name} ${venue.city} ${venue.genres.join(" ")} ${venue.description}`.toLowerCase();
    const matchesSearch = text.includes(searchTerm.toLowerCase());

    // 4. Capacity filter
    let matchesCapacity = true;
    if (selectedCapacity === "small") {
      matchesCapacity = venue.capacity < 150;
    } else if (selectedCapacity === "medium") {
      matchesCapacity = venue.capacity >= 150 && venue.capacity <= 300;
    } else if (selectedCapacity === "large") {
      matchesCapacity = venue.capacity > 300;
    }

    if (!matchesGenre || !matchesState || !matchesSearch || !matchesCapacity) return false;

    // 5. Rating filter
    if (selectedRatingFilter !== "All") {
      const stats = getRatingStats(venue.id, venue.name, "venue");
      const minRating = parseFloat(selectedRatingFilter);
      if (stats.average < minRating) return false;
    }

    return true;
  });


  return (
    <div className="space-y-6" id="venues-directory-panel">
      {/* Bot Verification Gate if Suspicious Headless Activity Detected */}
      {isBotSuspicious && !captchaPassed && (
        <div className="bg-slate-900 border-2 border-amber-500/80 rounded-2xl p-6 shadow-2xl text-white space-y-4 animate-scale-up" id="bot-challenge-venue-gate">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl flex-shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Automated Crawler Shield Verification
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Our defensive anti-scraping system detected an automated browsing signature ({botFlags.join(", ") || "Headless runtime"}). Please solve the verification challenge below to confirm human identity and view venue data.
              </p>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <CaptchaChallenge
              onVerified={(isValid) => {
                if (isValid) {
                  setCaptchaPassed(true);
                  setIsBotSuspicious(false);
                }
              }}
              theme="dark"
            />
          </div>
        </div>
      )}

      {/* Anti-Scraping Active Status Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-4 border border-indigo-500/30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Anti-Scraping Armor: 100% Active
              </span>
              <span className="bg-emerald-500/10 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                Protected Directory
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Venue contacts are shielded with DOM deconstruction, honeytoken traps, and bad bot firewalls to stop automated harvesters.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowSecurityModal(true)}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold py-2 px-3.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>View Security Shield Diagnostics</span>
        </button>
      </div>

      {/* Dynamic CTA wrapper for registration */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 justify-between border border-slate-950 shadow-md" id="venues-cta-panel">
        <div className="space-y-1.5 text-center md:text-left">
          <div className="inline-flex items-center gap-1 bg-indigo-500/30 text-indigo-200 text-xs font-bold py-1 px-3 rounded-full">
            <Volume2 className="w-3.5 h-3.5" />
            Coordinated Venues Circle
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Are you a Venue Owner or Promoter?
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Register your live music spaces, stages, or DIY basement rooms to our booking directory so active bands can instantly find details, compile riders, and design stunning concert posters for your venue.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 px-5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg"
        >
          <PlusCircle className="w-4 h-4" />
          {showAddForm ? "Cancel Space Add" : "Register Your Venue"}
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-900 text-xs font-semibold flex items-center gap-2" id="success-banner-venue">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Show collapsible add venue form */}
      {showAddForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-md space-y-4 animate-slide-down" id="add-venue-form-layout">
          <div className="border-b border-gray-100 pb-3">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Add Your Live Music Venue
            </h4>
            <p className="text-[11px] text-gray-400">
              Provide your stage layouts and contact info to appear instantly in this independent bookable space list.
            </p>
          </div>

          <form onSubmit={handleAddVenueSubmit} className="space-y-4 text-xs">
            {/* Honeypot Bot Trap Field */}
            <div style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, width: 0, overflow: "hidden" }}>
              <label htmlFor="hp-field-bot">Leave this field blank to confirm human:</label>
              <input
                id="hp-field-bot"
                type="text"
                tabIndex={-1}
                value={honeypotBot}
                onChange={(e) => setHoneypotBot(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Venue Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Starry Heavens lounge"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Max Capacity Audience <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  required
                  placeholder="E.g., 200"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) || 0 })}
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Street Address <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="E.g., 555 Velvet Highway"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">City & State <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Seattle, WA"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Vibe/Genres <span className="text-gray-400 font-normal">(Comma separated tags)</span></label>
                <input
                  type="text"
                  placeholder="E.g., Alternative Rock, Folk, Acoustic"
                  value={form.genres}
                  onChange={(e) => setForm({ ...form, genres: e.target.value })}
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

            <div className="grid grid-cols-2 gap-2 pt-5">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.hasPA}
                    onChange={(e) => setForm({ ...form, hasPA: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                  />
                  Has house PA System
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.hasLighting}
                    onChange={(e) => setForm({ ...form, hasLighting: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                  />
                  Has Stage Lighting
                </label>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">Short Stage/Vibe Description</label>
              <textarea
                placeholder="Give details about your staging, floor dimensions, or load-in directives..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[70px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Booking Email <span className="text-rose-500">*</span></label>
                <input
                  type="email"
                  required
                  placeholder="E.g., bookings@myvenue.com"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="E.g., (206) 555-9000"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Official Website</label>
                <input
                  type="text"
                  placeholder="E.g., www.myvenue.com"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="py-2 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold cursor-pointer"
              >
                Close Form
              </button>
              <button
                type="submit"
                className="py-2 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer"
              >
                Register My Venue Space
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filters heading row */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-5 space-y-4" id="venue-filter-box">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2" id="dir-filter-title-row">
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight" id="dir-filter-title">
            Music Booking & Venues Locator
          </h3>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 font-semibold select-none">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Anti-Scraping Active • Safe Contact Channel</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3" id="filters-layout">
          {/* Keyword Search */}
          <div className="relative" id="search-input-wrap">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              id="venue-keyword-search"
              placeholder="Search venue name, city, vibe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
            />
          </div>

          {/* State / Region filter */}
          <div id="state-select-wrap">
            <select
              id="venue-state-select"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-800"
            >
              <option value="All">All Regions / States</option>
              <option value="WA">🌲 Washington State (105+)</option>
              <option value="OR">🌲 Oregon (105+)</option>
              <option value="OTHER">🇺🇸 National / Other</option>
            </select>
          </div>

          {/* Genre drop down */}
          <div id="genre-select-wrap">
            <select
              id="venue-genre-select"
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="All">All Genre Directives</option>
              {genres.slice(1).map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Capacity selection */}
          <div id="capacity-select-wrap">
            <select
              id="venue-capacity-select"
              value={selectedCapacity}
              onChange={(e) => setSelectedCapacity(e.target.value)}
              className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="All">All Capacities</option>
              <option value="small">Small Dive (&lt; 150)</option>
              <option value="medium">Medium (150 - 300)</option>
              <option value="large">Large (300+)</option>
            </select>
          </div>

          {/* Star Rating selection */}
          <div id="rating-select-wrap">
            <select
              id="venue-rating-select"
              value={selectedRatingFilter}
              onChange={(e) => setSelectedRatingFilter(e.target.value)}
              className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium text-slate-700"
            >
              <option value="All">★ All Ratings</option>
              <option value="4.8">★ 4.8+ Stars</option>
              <option value="4.5">★ 4.5+ Stars</option>
              <option value="4.0">★ 4.0+ Stars</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of searchable venues */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="venues-listing-grid">
        
        {/* Invisible Honeypot Canary Venue Card to catch automated DOM scrapers */}
        <div 
          aria-hidden="true" 
          style={{ 
            position: "absolute", 
            left: "-9999px", 
            width: "1px", 
            height: "1px", 
            overflow: "hidden", 
            opacity: 0, 
            pointerEvents: "none" 
          }}
          className="venue-card-canary-honeypot"
        >
          <h4>Pacific Canary Trap Music Hall</h4>
          <p>Seattle, WA • 1000 Fake St</p>
          <a href="mailto:spider-trap@pacifictour-honeypot.internal">spider-trap@pacifictour-honeypot.internal</a>
          <span>(555) 019-9999</span>
        </div>

        {filteredVenues.map((v) => {
          const isChosen = selectedVenueId === v.id;
          const stats = getRatingStats(v.id, v.name, "venue");

          return (
            <div
              key={v.id}
              id={`venue-card-${v.id}`}
              className={`bg-white rounded-xl border p-5 flex flex-col justify-between transition-all ${
                isChosen
                  ? "border-indigo-600 ring-2 ring-indigo-500/5 shadow-xs"
                  : "border-gray-100 hover:border-gray-200 shadow-xs"
              }`}
            >
              <div className="space-y-3" id={`venue-main-body-${v.id}`}>
                {/* Visual Header */}
                <div className="flex justify-between items-start" id={`venue-title-row-${v.id}`}>
                  <div>
                    <h4 className="text-base font-black text-gray-900 tracking-tight" id={`venue-name-${v.id}`}>
                      {v.name}
                    </h4>
                    <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-0.5" id={`venue-loc-${v.id}`}>
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {v.city} • {v.address}
                    </p>
                  </div>
                  <span className="bg-slate-100 text-slate-800 text-[10px] font-extrabold px-2 py-1 rounded flex items-center gap-1" id={`venue-cap-${v.id}`}>
                    <Users className="w-3 h-3 text-slate-500" />
                    {v.capacity} Cap
                  </span>
                </div>

                {/* 5-Star Rating Badge & Review Launcher */}
                <div className="flex items-center justify-between bg-amber-50/60 border border-amber-200/60 px-3 py-1.5 rounded-lg">
                  <RatingStars
                    rating={stats.average}
                    size="sm"
                    showNumber={true}
                    reviewCount={stats.count}
                    onClickReviewBadge={() => setReviewModalVenue(v)}
                  />
                  <button
                    type="button"
                    onClick={() => setReviewModalVenue(v)}
                    className="text-[11px] font-black text-amber-900 hover:text-amber-700 bg-amber-200/70 hover:bg-amber-200 px-2.5 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Reviews ({stats.count})</span>
                  </button>
                </div>

                {/* Genres list */}
                <div className="flex flex-wrap gap-1" id={`venue-genres-${v.id}`}>
                  {v.genres.map((g) => (
                    <span
                      key={g}
                      className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded"
                      id={`venue-genre-tag-${g}`}
                    >
                      {g}
                    </span>
                  ))}
                </div>

                {/* Room description info */}
                <p className="text-xs text-gray-600 leading-relaxed" id={`venue-desc-${v.id}`}>
                  {v.description}
                </p>

                {/* Tech specifications bar */}
                <div className="grid grid-cols-2 gap-2 py-2 border-y border-gray-50 text-[11px] font-semibold text-gray-500" id={`venue-tech-specs-${v.id}`}>
                  <div className="flex items-center gap-1.5" id={`venue-pa-${v.id}`}>
                    <Volume2 className={`w-4 h-4 ${v.hasPA ? "text-emerald-500" : "text-amber-500"}`} />
                    <span>Active House PA: <strong>{v.hasPA ? "Supplied" : "None (Inquire)"}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5" id={`venue-lights-${v.id}`}>
                    <Lightbulb className={`w-4 h-4 ${v.hasLighting ? "text-emerald-500" : "text-amber-500"}`} />
                    <span>Stage Lights: <strong>{v.hasLighting ? "Installed" : "None / DIY"}</strong></span>
                  </div>
                </div>

                {/* Warning message if no PA */}
                {!v.hasPA && (
                  <div className="bg-amber-50 text-amber-900 px-3 py-2 rounded-lg text-[10px] flex items-start gap-1.5 border border-amber-100" id={`venue-warning-${v.id}`}>
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span><strong>House PA Alert:</strong> This location does not offer a physical vocal system setup. You'll need to coordinate a portable sound column or speakers.</span>
                  </div>
                )}

                {/* Booking contact channels - Protected with Anti-Scraping Deconstructed DOM */}
                <div className="bg-slate-50/90 p-3 rounded-xl text-xs space-y-2 border border-slate-200/70 select-none" id={`venue-contacts-${v.id}`}>
                  <div className="flex flex-col gap-1.5" id={`venue-email-${v.id}`}>
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                      <span>Booking Contact:</span>
                      <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5">
                        <ShieldCheck className="w-2.5 h-2.5" /> Anti-Scrape Protected
                      </span>
                    </span>
                    <ProtectedContact
                      type="email"
                      value={v.contactEmail}
                      isUnlocked={true}
                      sourceContext="venue"
                    />
                  </div>
                  {v.contactPhone && (
                    <div className="flex flex-col gap-1 pt-1 border-t border-slate-200/50" id={`venue-phone-${v.id}`}>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Direct Phone:</span>
                      <ProtectedContact
                        type="phone"
                        value={v.contactPhone}
                        isUnlocked={true}
                        sourceContext="venue"
                      />
                    </div>
                  )}
                  {v.website && (
                    <div className="flex items-center gap-2 text-slate-700 pt-1 border-t border-slate-200/50" id={`venue-site-${v.id}`}>
                      <Globe className="w-3.5 h-3.5 text-gray-400" />
                      <a 
                        href={v.website.startsWith("http") ? v.website : `https://${v.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer nofollow" 
                        className="font-mono text-[11px] text-indigo-600 hover:underline cursor-pointer"
                      >
                        {v.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Selection and Review buttons */}
              <div className="mt-4 border-t border-gray-50 pt-3 flex flex-col gap-2" id={`venue-actions-${v.id}`}>
                <button
                  type="button"
                  id={`btn-review-venue-${v.id}`}
                  onClick={() => setReviewModalVenue(v)}
                  className="w-full py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 flex items-center justify-center gap-1.5"
                >
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  Rate & View Community Reviews ({stats.count})
                </button>

                <button
                  type="button"
                  id={`btn-select-venue-${v.id}`}
                  onClick={() => onSelectVenueForPoster(v)}
                  className={`w-full py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isChosen
                      ? "bg-slate-100 text-slate-800 border border-slate-200"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                  }`}
                >
                  <Ticket className="w-3.5 h-3.5" />
                  {isChosen 
                    ? "Selected Venue for Promotional Materials" 
                    : "Select Venue for Gig Plan"}
                </button>
              </div>
            </div>
          );
        })}

        {filteredVenues.length === 0 && (
          <div className="col-span-full bg-white border border-gray-100 rounded-xl p-8 text-center text-gray-400 text-xs font-semibold" id="no-venues-state">
            No booking venues fit your search terms. Open options and clear search variables.
          </div>
        )}
      </div>

      {/* Security Shield Diagnostic Modal */}
      <SecurityShieldModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
      />

      {/* 5-Star Ratings & Reviews Modal */}
      {reviewModalVenue && (
        <ReviewsModal
          isOpen={Boolean(reviewModalVenue)}
          onClose={() => setReviewModalVenue(null)}
          targetId={reviewModalVenue.id}
          targetName={reviewModalVenue.name}
          targetType="venue"
          currentAccount={currentAccount || null}
        />
      )}
    </div>
  );
}


