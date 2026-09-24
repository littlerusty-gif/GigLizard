import React, { useState, useEffect } from "react";
import { AvailableBand, UserAccount } from "../types";
import { INITIAL_AVAILABLE_BANDS } from "../data/availableBands";
import { 
  Search, MapPin, Mail, Globe, Shield, Users, PlusCircle, 
  Check, HelpCircle, BadgeCheck, Star, Lock, ChevronLeft, 
  ChevronRight, ShieldCheck, Sparkles, AlertCircle, CheckCircle2, Clock, Zap,
  MessageSquare, Headphones, FileText, ExternalLink, Music, LogIn, UserCheck, Video
} from "lucide-react";
import ProtectedContact from "./ProtectedContact";
import PayPalAccessModal from "./PayPalAccessModal";
import UserLoginModal from "./UserLoginModal";
import RatingStars from "./RatingStars";
import ReviewsModal from "./ReviewsModal";
import { getRatingStats } from "../utils/reviewsManager";
import { sanitizeInputText } from "../utils/antiScrape";
import { resolveMostRelevantBandLink, categorizeUserMusicLink } from "../utils/musicLinks";
import { 
  isAccessActive, 
  isUserLoggedIn,
  canViewBandContacts,
  getAccessStatusDetails, 
  maskContactEmail, 
  isBandBanned
} from "../utils/accessControl";
import { getOwnerBandEdits, getOwnerDeletedBandIds, isEmailAlreadyRegistered, normalizeEmail } from "../utils/directoryStore";

interface BandDirectoryProps {
  onUpdateAvailableBands?: (bands: AvailableBand[]) => void;
  currentAccount?: UserAccount | null;
  onTriggerUpgrade?: () => void;
  onTriggerLogin?: () => void;
  onUpdateAccount?: (account: UserAccount) => void;
  onTriggerEditAccount?: () => void;
}

export default function BandDirectory({ 
  onUpdateAvailableBands,
  currentAccount,
  onTriggerUpgrade,
  onTriggerLogin,
  onUpdateAccount,
  onTriggerEditAccount
}: BandDirectoryProps) {
  const [bands, setBands] = useState<AvailableBand[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedState, setSelectedState] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedRatingFilter, setSelectedRatingFilter] = useState("All");

  const [showAddForm, setShowAddForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [honeypotValue, setHoneypotValue] = useState("");
  const [showPayPalModal, setShowPayPalModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [reviewModalBand, setReviewModalBand] = useState<AvailableBand | null>(null);
  const [reviewsVersion, setReviewsVersion] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Access-check helper: Only logged-in paid subscribers with unexpired access can see contacts
  const isLoggedIn = isUserLoggedIn(currentAccount);
  const isSubscriptionActive = isAccessActive(currentAccount);
  const activeAccess = isLoggedIn && isSubscriptionActive;
  const accessDetails = getAccessStatusDetails(currentAccount);

  const [drmWarning, setDrmWarning] = useState("");

  // Keyboard shortcut listener to prevent scraping, printing, source inspection, and copying
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+C / Cmd+C on directory
      if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C")) {
        if (!activeAccess) {
          e.preventDefault();
          setDrmWarning("🔒 Content Protected: Copying is restricted. Direct online view is enabled with an active 30-day subscription.");
          setTimeout(() => setDrmWarning(""), 4000);
        }
      }
      // Prevent Ctrl+S / Cmd+S (saving web page), Ctrl+P / Cmd+P (printing to scrape), Ctrl+U / Cmd+U (view source)
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S" || e.key === "p" || e.key === "P" || e.key === "u" || e.key === "U")) {
        e.preventDefault();
        setDrmWarning("🔒 Content Protection Active: Downloading, saving, and printing the directory are disabled to prevent unauthorized data harvesting.");
        setTimeout(() => setDrmWarning(""), 4000);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeAccess]);

  // Listen to reviews updates
  useEffect(() => {
    const onReviewsUpdated = () => {
      setReviewsVersion(v => v + 1);
    };
    window.addEventListener("giglizard_reviews_updated", onReviewsUpdated);
    return () => window.removeEventListener("giglizard_reviews_updated", onReviewsUpdated);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedGenre, selectedState, selectedLevel, selectedRatingFilter]);


  // New band form fields state
  const [formData, setFormData] = useState({
    name: "",
    genres: "",
    city: "",
    bio: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    epkOrMusicUrl: "",
    experienceLevel: "Local" as "Local" | "Regional Tour" | "National Act"
  });

  // Fetch bands securely from backend /api/bands endpoint (with server-side redaction fallback)
  useEffect(() => {
    let isMounted = true;
    const fetchBands = async () => {
      let rawApiBands: AvailableBand[] = [];
      try {
        const expiresHeader = currentAccount?.accessExpiresAt || "";
        const emailHeader = currentAccount?.contactEmail || "";
        const response = await fetch("/api/bands", {
          headers: {
            "x-access-expires-at": expiresHeader,
            "x-user-email": emailHeader
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.bands && Array.isArray(data.bands)) {
            rawApiBands = data.bands;
          }
        }
      } catch (err) {
        console.warn("API bands fetch fallback to static dataset:", err);
      }

      if (!rawApiBands.length) {
        rawApiBands = INITIAL_AVAILABLE_BANDS;
      }

      if (isMounted) {
        const saved = localStorage.getItem("custom_available_bands_v1");
        let customList: AvailableBand[] = [];
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              // Filter out any banned bands such as sherie.szubski
              customList = parsed.filter(b => !isBandBanned(b?.contactEmail, b?.name));
              localStorage.setItem("custom_available_bands_v1", JSON.stringify(customList));
            }
          } catch (e) {
            console.error(e);
          }
        }

        // Include current logged-in Band account if not already in directory and not banned
        let userBandList: AvailableBand[] = [];
        if (currentAccount && currentAccount.type === "Band" && currentAccount.name && !isBandBanned(currentAccount.contactEmail, currentAccount.name)) {
          const userBandObj: AvailableBand = {
            id: `band-user-${currentAccount.name.toLowerCase().replace(/\s+/g, "-")}`,
            name: currentAccount.name,
            genres: currentAccount.genre 
              ? currentAccount.genre.split(",").map(g => g.trim()).filter(Boolean) 
              : ["Alternative Rock"],
            city: currentAccount.city || "Seattle, WA",
            bio: currentAccount.bio || "Live music artist registered on BandGig.",
            contactEmail: currentAccount.contactEmail || "",
            website: currentAccount.website,
            experienceLevel: currentAccount.experienceLevel || "Local",
            epkUrl: currentAccount.epkUrl,
            musicUrl: currentAccount.musicUrl
          };
          userBandList = [userBandObj];
        }

        // Deduplicate prioritizing newly registered/user bands at the top and filtering out banned bands
        const rawMerged = [...userBandList, ...customList, ...rawApiBands].filter(b => !isBandBanned(b?.contactEmail, b?.name));
        const deletedIds = new Set(getOwnerDeletedBandIds());
        const ownerEdits = getOwnerBandEdits();

        const seenNames = new Set<string>();
        const deduplicatedBands: AvailableBand[] = [];
        for (let b of rawMerged) {
          const key = b.name?.trim().toLowerCase();
          if (deletedIds.has(b.id) || (key && deletedIds.has(key))) {
            continue;
          }
          if (ownerEdits[b.id]) {
            b = { ...b, ...ownerEdits[b.id] };
          } else if (key && ownerEdits[key]) {
            b = { ...b, ...ownerEdits[key] };
          }
          if (key && !seenNames.has(key)) {
            seenNames.add(key);
            deduplicatedBands.push(b);
          }
        }

        const isUserAuthorized = canViewBandContacts(currentAccount);
        const processedBands = deduplicatedBands.map((b) => {
          // Remove any phone numbers strictly from all band listings
          const { contactPhone, ...rest } = b as any;
          if (!isUserAuthorized) {
            return {
              ...rest,
              contactEmail: "--****",
              website: b.website ? "[Protected — Active Subscription Required]" : undefined,
              epkUrl: undefined,
              musicUrl: undefined
            } as AvailableBand;
          }
          return rest as AvailableBand;
        });

        setBands(processedBands);
        if (onUpdateAvailableBands) {
          onUpdateAvailableBands(processedBands);
        }
      }
    };

    fetchBands();

    const onBandsUpdated = () => {
      fetchBands();
    };
    window.addEventListener("giglizard_bands_updated", onBandsUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener("giglizard_bands_updated", onBandsUpdated);
    };
  }, [
    currentAccount?.accessExpiresAt, 
    currentAccount?.contactEmail, 
    currentAccount?.name, 
    currentAccount?.type, 
    currentAccount?.hasPaidAccess, 
    currentAccount?.isPremium,
    currentAccount?.epkUrl,
    currentAccount?.musicUrl,
    currentAccount?.bio,
    currentAccount?.genre,
    currentAccount?.city
  ]);

  const handleOpenPayment = () => {
    if (onTriggerUpgrade) {
      onTriggerUpgrade();
    } else {
      setShowPayPalModal(true);
    }
  };

  const handleRegisterBandSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Bot trap check
    if (honeypotValue.trim().length > 0) {
      console.warn("Bot submission deflected by honeypot.");
      return;
    }

    const cleanName = sanitizeInputText(formData.name, 100);
    const cleanCity = sanitizeInputText(formData.city, 100);
    const cleanEmail = normalizeEmail(sanitizeInputText(formData.contactEmail, 100));
    const cleanPhone = sanitizeInputText(formData.contactPhone, 50);
    const cleanBio = sanitizeInputText(formData.bio, 500);
    const cleanWeb = sanitizeInputText(formData.website, 100);

    if (!cleanName || !cleanCity || !cleanEmail) {
      alert("Please fill in the required fields: Band Name, Hometown, and Booking Email.");
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

    if (isBandBanned(cleanEmail, cleanName)) {
      alert("Registration for this band account is not permitted.");
      return;
    }

    const processedGenres = formData.genres
      ? formData.genres.split(",").map((g) => sanitizeInputText(g.trim(), 30)).filter((g) => g.length > 0)
      : ["Rock"];

    const { epkUrl, musicUrl } = categorizeUserMusicLink(formData.epkOrMusicUrl);

    const newBand: AvailableBand = {
      id: `band-${Date.now()}`,
      name: cleanName,
      genres: processedGenres,
      city: cleanCity,
      bio: cleanBio || "No description provided yet.",
      contactEmail: cleanEmail,
      contactPhone: cleanPhone || "Inquire",
      website: cleanWeb || undefined,
      epkUrl: epkUrl || undefined,
      musicUrl: musicUrl || undefined,
      experienceLevel: formData.experienceLevel
    };

    // Register on backend server endpoint as well
    try {
      fetch("/api/bands/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ band: newBand })
      }).catch(err => console.warn("Backend band registration notice:", err));
    } catch (_) {}

    const saved = localStorage.getItem("custom_available_bands_v1");
    let customList: AvailableBand[] = [];
    if (saved) {
      try {
        customList = JSON.parse(saved);
      } catch (err) {
        console.error(err);
      }
    }
    // Remove if already exists with same name/email
    const updatedCustom = [newBand, ...customList.filter(b => b.name.toLowerCase() !== cleanName.toLowerCase() && b.contactEmail.toLowerCase() !== cleanEmail.toLowerCase())];
    localStorage.setItem("custom_available_bands_v1", JSON.stringify(updatedCustom));

    const combined = [newBand, ...bands.filter(b => b.name.toLowerCase() !== cleanName.toLowerCase())];
    setBands(combined);
    if (onUpdateAvailableBands) {
      onUpdateAvailableBands(combined);
    }

    setFormData({
      name: "",
      genres: "",
      city: "",
      bio: "",
      contactEmail: "",
      contactPhone: "",
      website: "",
      epkOrMusicUrl: "",
      experienceLevel: "Local"
    });
    setSuccessMsg(`Successfully registered "${cleanName}" to Available Bands Directory!`);
    setShowAddForm(false);
    setTimeout(() => {
      setSuccessMsg("");
    }, 4000);
  };

  const allGenresList = ["All", ...Array.from(new Set(bands.flatMap((b) => b.genres)))];

  const filteredBands = bands.filter((band) => {
    const matchesGenre = selectedGenre === "All" || band.genres.includes(selectedGenre);
    const matchesLevel = selectedLevel === "All" || band.experienceLevel === selectedLevel;
    
    // State filter (Oregon, Washington, Colorado, Arizona, California, Other)
    let matchesState = true;
    if (selectedState === "OR") {
      matchesState = band.city.includes(", OR") || band.id.startsWith("or-");
    } else if (selectedState === "WA") {
      matchesState = band.city.includes(", WA") || band.id.startsWith("wa-");
    } else if (selectedState === "CO") {
      matchesState = band.city.includes(", CO") || band.id.startsWith("co-");
    } else if (selectedState === "AZ") {
      matchesState = band.city.includes(", AZ") || band.id.startsWith("az-");
    } else if (selectedState === "CA") {
      matchesState = band.city.includes(", CA") || band.id.startsWith("ca-");
    } else if (selectedState === "OTHER") {
      matchesState = !(
        band.city.includes(", OR") || band.id.startsWith("or-") ||
        band.city.includes(", WA") || band.id.startsWith("wa-") ||
        band.city.includes(", CO") || band.id.startsWith("co-") ||
        band.city.includes(", AZ") || band.id.startsWith("az-") ||
        band.city.includes(", CA") || band.id.startsWith("ca-")
      );
    }

    const text = `${band.name} ${band.city} ${band.genres.join(" ")} ${band.bio}`.toLowerCase();
    const matchesSearch = text.includes(searchTerm.toLowerCase());
    
    if (!matchesGenre || !matchesLevel || !matchesState || !matchesSearch) return false;

    if (selectedRatingFilter !== "All") {
      const stats = getRatingStats(band.id, band.name, "band");
      const minRating = parseFloat(selectedRatingFilter);
      if (stats.average < minRating) return false;
    }

    return true;
  });


  const totalPages = Math.ceil(filteredBands.length / itemsPerPage);
  const paginatedBands = filteredBands.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 select-none" id="bands-directory-viewport">
      
      {/* Anti-Scraping / DRM Security Notification */}
      {drmWarning && (
        <div 
          className="fixed bottom-6 right-6 z-50 bg-slate-950 text-amber-300 border-2 border-amber-500/80 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in text-xs font-semibold max-w-md"
          id="drm-protection-alert"
        >
          <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 animate-pulse" />
          <span>{drmWarning}</span>
        </div>
      )}

              {/* Access Gating Top Banner */}
      {!isLoggedIn ? (
        <div 
          className="bg-slate-900 border-2 border-indigo-500/60 text-white rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg animate-fade-in"
          id="login-required-top-banner"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse"></span>
                <h3 className="text-sm font-black text-indigo-300 tracking-tight">
                  🔒 Account Sign In Required — Band Contacts, EPKs & Listen Links Protected
                </h3>
              </div>
              <p className="text-xs text-slate-350 font-medium mt-0.5">
                Band contact info, press kits, and audio links are hidden for non-logged-in users. Only paid subscribers with up-to-date subscriptions who are logged into their account can view band contact info, EPK, and Listen links.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowLoginModal(true)}
              className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-black py-2.5 px-4 rounded-xl cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5"
              id="btn-banner-login"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In to Account</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPayPalModal(true)}
              className="flex-1 sm:flex-initial bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 text-xs font-black py-2.5 px-4 rounded-xl cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5"
              id="btn-banner-get-pass"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Get 30-Day Pass ($9.99)</span>
            </button>
          </div>
        </div>
      ) : activeAccess ? (
        <div 
          className="bg-emerald-50 border-2 border-emerald-500/40 text-emerald-950 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-fade-in"
          id="active-pass-top-banner"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-sm font-black text-emerald-900 tracking-tight">
                  {accessDetails.isPerpetual 
                    ? "🟢 Lifetime VIP Owner Pass Active (Full Unmasked Access for Life • Never Expires)" 
                    : `🟢 30-Day Pass Active (${currentAccount?.autoRenew ? "Renews" : "Expires"} in ${accessDetails.remainingDays} ${accessDetails.remainingDays === 1 ? "day" : "days"})`}
                </h3>
              </div>
              <p className="text-xs text-emerald-800 font-medium mt-0.5">
                Logged in as <span className="font-mono font-bold text-emerald-900">{currentAccount?.contactEmail}</span>. Full unmasked booking emails, EPKs, and streaming Listen links are unlocked across all 1600+ live bands.
                {currentAccount?.autoRenew && " Automatic 30-day renewal is enabled."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {onTriggerEditAccount && (
              <button
                type="button"
                onClick={onTriggerEditAccount}
                className="bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black py-2.5 px-3.5 rounded-xl cursor-pointer transition-all shadow-2xs flex items-center gap-1.5"
                id="btn-banner-edit-account"
              >
                <span>Edit Account</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowPayPalModal(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black py-2.5 px-4 rounded-xl cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
              id="btn-extend-band-pass"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>All Access Contacts ($9.99 / 30 Days)</span>
            </button>
          </div>
        </div>
      ) : (
        <div 
          className="bg-slate-900 border-2 border-amber-500/60 text-white rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg animate-fade-in"
          id="expired-pass-top-banner"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Lock className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <h3 className="text-sm font-black text-amber-300 tracking-tight">
                  {accessDetails.isExpired 
                    ? "🔒 30-Day Access Expired — Renew for $9.99 to Unlock Contacts, EPK & Audio" 
                    : "🔒 Free Tier (Contacts, EPK & Listen Links Masked) — Active Paid Subscription Required"}
                </h3>
              </div>
              <p className="text-xs text-slate-350 font-medium mt-0.5">
                Logged in as <span className="font-mono text-amber-200">{currentAccount?.contactEmail}</span>. An active paid subscription is required to unmask band booking emails, view press kits, and listen to music.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {onTriggerEditAccount && (
              <button
                type="button"
                onClick={onTriggerEditAccount}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold py-2.5 px-3.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                id="btn-banner-edit-account-expired"
              >
                <span>Edit Account</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowPayPalModal(true)}
              className="bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 text-xs font-black py-2.5 px-5 rounded-xl cursor-pointer transition-all shadow-md flex items-center gap-1.5"
              id="btn-renew-30-day-pass"
            >
              <Lock className="w-4 h-4" />
              <span>{accessDetails.isExpired ? "Renew Pass ($9.99)" : "Unlock 30-Day Pass ($9.99)"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Visual Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 justify-between border border-slate-950 shadow-md animate-fade-in" id="bands-welcome-card">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1 bg-amber-500/30 text-amber-200 text-xs font-bold py-1 px-3 rounded-full">
            <PlusCircle className="w-3.5 h-3.5" />
            Live Artist Exchange
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Discover Live Bands & Local Talents
          </h2>
          <p className="text-xs text-slate-350 max-w-2xl leading-relaxed">
            Browse and connect with verified touring bands, indie projects, and solo artists looking to secure gigs, play co-bills, fill lineup slots, or coordinate independent tours across the Rockies and West Coast.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isLoggedIn && onTriggerEditAccount && (
            <button
              type="button"
              onClick={onTriggerEditAccount}
              className="flex-shrink-0 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs py-3 px-4 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              id="btn-trigger-edit-my-page"
            >
              <span>Edit My Account / Page</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 px-5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg"
            id="btn-trigger-add-band"
          >
            <PlusCircle className="w-4 h-4" />
            {showAddForm ? "Cancel Registration" : "Join Available Bands"}
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-900 text-xs font-semibold flex items-center gap-2" id="success-banner-band">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Slide down form for registration */}
      {showAddForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-md space-y-4 animate-slide-down" id="add-band-form-block">
          <div className="border-b border-gray-100 pb-3">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Register Your Band Profile
            </h4>
            <p className="text-[11px] text-gray-400">
              Your details will be listed in the Live Bands exchange to let venues, booking coordinators, and other performers reach out.
            </p>
          </div>

          <form onSubmit={handleRegisterBandSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Band Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Lunar Reverberator"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Hometown City & State <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Seattle, WA"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Genres <span className="text-gray-400 font-normal">(Comma separated)</span></label>
                <input
                  type="text"
                  placeholder="E.g., Grunge, Punk, Alternative Rock"
                  value={formData.genres}
                  onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Touring Status / Experience Level</label>
                <select
                  value={formData.experienceLevel}
                  onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value as any })}
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Local">Local (Mainly home city clubs)</option>
                  <option value="Regional Tour">Regional Tour (Active regional tours / co-bills)</option>
                  <option value="National Act">National Act (Fully established national tour circuit)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">Band Bio / Stage Spells <span className="text-gray-400 font-normal">(Explain your vibe and draw)</span></label>
              <textarea
                placeholder="Describe your instrumentation, general crowd vibe, and performance specifications..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Booking Email <span className="text-rose-500">*</span></label>
                <input
                  type="email"
                  required
                  placeholder="E.g., contact@lunarband.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Official Website</label>
                <input
                  type="text"
                  placeholder="E.g., www.lunarband.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">EPK or Music Link</label>
                <input
                  type="url"
                  placeholder="E.g., Bandcamp, Spotify, or EPK link"
                  value={formData.epkOrMusicUrl}
                  onChange={(e) => setFormData({ ...formData, epkOrMusicUrl: e.target.value })}
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
                Register My Band
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Directory Searching and Filters Heading Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-5 space-y-4" id="bands-filter-box">
        <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Filter Available Bands</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search band name, genre, bio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            />
          </div>

          {/* State / Region filter */}
          <div>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-800"
            >
              <option value="All">All States / Regions</option>
              <option value="OR">🌲 Oregon (140+ Bands)</option>
              <option value="WA">🌲 Washington (140+ Bands)</option>
              <option value="CO">🏔️ Colorado (140+ Bands)</option>
              <option value="AZ">🌵 Arizona (140+ Bands)</option>
              <option value="CA">☀️ California (140+ Bands)</option>
              <option value="OTHER">🇺🇸 Other / National</option>
            </select>
          </div>

          {/* Genre drop down */}
          <div>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="All">All Genre Directives</option>
              {allGenresList.filter(g => g !== "All").map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Experience level filter */}
          <div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="All">All Experience Ranges</option>
              <option value="Local">Local Acts (Neighborhood)</option>
              <option value="Regional Tour">Regional Touring</option>
              <option value="National Act">National Touring Acts</option>
            </select>
          </div>

          {/* 5-Star Rating Filter */}
          <div>
            <select
              value={selectedRatingFilter}
              onChange={(e) => setSelectedRatingFilter(e.target.value)}
              className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium text-slate-700"
            >
              <option value="All">★ All Star Ratings</option>
              <option value="4.8">★ 4.8+ Stars</option>
              <option value="4.5">★ 4.5+ Stars</option>
              <option value="4.0">★ 4.0+ Stars</option>
            </select>
          </div>
        </div>
      </div>

      {/* Core Band grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="bands-listing-grid">
        {paginatedBands.map((band) => {
          const stats = getRatingStats(band.id, band.name, "band");
          return (
          <div
            key={band.id}
            id={`band-card-${band.id}`}
            className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 p-5 flex flex-col justify-between shadow-xs transition-all hover:shadow-sm"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-base font-black text-gray-900 tracking-tight flex items-center gap-1.5">
                    {band.name}
                    {band.experienceLevel === "National Act" && (
                      <span className="text-amber-500" title="National Act">
                        <Star className="w-4 h-4 fill-amber-400" />
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    Hometown: {band.city}
                  </p>
                </div>

                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border ${
                  band.experienceLevel === "National Act"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : band.experienceLevel === "Regional Tour"
                    ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                    : "bg-slate-50 text-slate-800 border-slate-200"
                }`}>
                  {band.experienceLevel}
                </span>
              </div>

              {/* 5-Star Rating Badge & Review Launcher */}
              <div className="flex items-center justify-between bg-amber-50/60 border border-amber-200/60 px-3 py-1.5 rounded-lg">
                <RatingStars
                  rating={stats.average}
                  size="sm"
                  showNumber={true}
                  reviewCount={stats.count}
                  onClickReviewBadge={() => setReviewModalBand(band)}
                />
                <button
                  type="button"
                  onClick={() => setReviewModalBand(band)}
                  className="text-[11px] font-black text-amber-900 hover:text-amber-700 bg-amber-200/70 hover:bg-amber-200 px-2.5 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Reviews ({stats.count})</span>
                </button>
              </div>

              {/* Genres list */}
              <div className="flex flex-wrap gap-1">
                {band.genres.map((g) => (
                  <span
                    key={g}
                    className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded cursor-default"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Bio/description */}
              <p className="text-xs text-gray-600 leading-relaxed italic border-l-2 border-slate-200 pl-3.5">
                "{band.bio}"
              </p>

              {/* Single Most Relevant Band Link (Priority: EPK > Website > Bandcamp > YouTube > Spotify > Facebook > Other) */}
              {(() => {
                const primaryLink = resolveMostRelevantBandLink(band);
                return (
                  <div className="p-2.5 bg-gradient-to-r from-slate-50 to-indigo-50/40 rounded-xl border border-slate-200/80">
                    <a
                      href={primaryLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full inline-flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg text-xs font-black shadow-2xs hover:shadow-xs transition-all cursor-pointer ${
                        primaryLink.type === "epk"
                          ? "text-indigo-950 bg-white hover:bg-indigo-50/90 border border-indigo-200"
                          : primaryLink.type === "website"
                          ? "text-blue-950 bg-white hover:bg-blue-50/90 border border-blue-200"
                          : primaryLink.type === "bandcamp"
                          ? "text-cyan-950 bg-cyan-50/90 hover:bg-cyan-100/80 border border-cyan-300"
                          : primaryLink.type === "youtube"
                          ? "text-rose-950 bg-rose-50/90 hover:bg-rose-100/80 border border-rose-300"
                          : primaryLink.type === "spotify"
                          ? "text-emerald-950 bg-emerald-50/90 hover:bg-emerald-100/80 border border-emerald-300"
                          : primaryLink.type === "facebook"
                          ? "text-sky-950 bg-sky-50/90 hover:bg-sky-100/80 border border-sky-300"
                          : "text-slate-900 bg-white hover:bg-slate-50 border border-slate-200"
                      }`}
                      title={`Open ${band.name}'s ${primaryLink.badge} link`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {primaryLink.type === "epk" && <FileText className="w-4 h-4 text-indigo-600 shrink-0" />}
                        {primaryLink.type === "website" && <Globe className="w-4 h-4 text-blue-600 shrink-0" />}
                        {primaryLink.type === "bandcamp" && <Headphones className="w-4 h-4 text-cyan-700 shrink-0" />}
                        {primaryLink.type === "youtube" && <Video className="w-4 h-4 text-rose-600 shrink-0" />}
                        {primaryLink.type === "spotify" && <Music className="w-4 h-4 text-emerald-600 shrink-0" />}
                        {primaryLink.type === "facebook" && <Users className="w-4 h-4 text-sky-600 shrink-0" />}
                        {primaryLink.type === "other" && <ExternalLink className="w-4 h-4 text-slate-600 shrink-0" />}
                        <span className="truncate">{primaryLink.actionText}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          primaryLink.type === "epk"
                            ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                            : primaryLink.type === "website"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : primaryLink.type === "bandcamp"
                            ? "bg-cyan-200/70 text-cyan-900 border-cyan-300"
                            : primaryLink.type === "youtube"
                            ? "bg-rose-200/70 text-rose-900 border-rose-300"
                            : primaryLink.type === "spotify"
                            ? "bg-emerald-200/70 text-emerald-900 border-emerald-300"
                            : primaryLink.type === "facebook"
                            ? "bg-sky-200/70 text-sky-900 border-sky-300"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>
                          {primaryLink.badge}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                      </div>
                    </a>
                  </div>
                );
              })()}

              {/* Band Member Contact Gating (Protected Booking Email) */}
              {isLoggedIn && isSubscriptionActive ? (
                /* Active Access State: Clear unmasked contact details exclusively for paid subscribers */
                <div 
                  className="space-y-3 pt-1 select-none"
                  onCopy={(e) => {
                    e.preventDefault();
                    setDrmWarning("🔒 Content Protected: Copying is restricted. Direct online view is enabled with your active subscription.");
                    setTimeout(() => setDrmWarning(""), 4000);
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <div className="bg-slate-50/95 p-3.5 rounded-xl text-xs space-y-2 border border-slate-200">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Booking Email (Unmasked):</span>
                      <ProtectedContact
                        type="email"
                        value={band.contactEmail}
                        isUnlocked={true}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewModalBand(band)}
                      className="w-full py-2 px-3 text-xs font-black rounded-lg transition-all bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      Rate & View Reviews ({stats.count})
                    </button>
                  </div>
                </div>
              ) : (
                /* Locked/Masked Contact State: Only paywall banner is shown for non-logged-in or non-subscribers */
                <div className="space-y-3 pt-2 select-none" onContextMenu={(e) => e.preventDefault()}>
                  <div className="bg-slate-900/95 p-3.5 rounded-xl text-xs space-y-2.5 border border-slate-800">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[10px] uppercase font-bold text-amber-400">
                      <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-400" />
                        {!isLoggedIn ? "Account Sign In Required" : "Paid Subscribers Only"}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {!isLoggedIn ? "Not Logged In" : (accessDetails.isExpired ? "Expired" : "Free Tier")}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-normal">
                      {!isLoggedIn 
                        ? "Band contact info is hidden for users who are not logged in. Log into an account with an active paid subscription to view." 
                        : "Band booking emails are hidden. Active paid subscription required to unmask contacts."}
                    </p>

                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-[11px] font-medium text-slate-400">Booking Email:</span>
                      <span className="font-mono text-slate-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                        --****
                      </span>
                    </div>
                  </div>

                  {/* Actions row: Rate Band + Sign In or Renew pass */}
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewModalBand(band)}
                      className="w-full py-2 px-3 text-xs font-black rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      <span>Rate & Review This Band</span>
                    </button>

                    {!isLoggedIn ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setShowLoginModal(true)}
                          className="w-full py-2.5 px-2 text-xs font-black rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                          id={`btn-login-to-view-${band.id}`}
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Sign In</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPayPalModal(true)}
                          className="w-full py-2.5 px-2 text-xs font-black rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                          id={`btn-unlock-band-${band.id}`}
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Get Pass ($9.99)</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowPayPalModal(true)}
                        className="w-full py-2.5 px-3 text-xs font-black rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                        id={`btn-unlock-band-${band.id}`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{accessDetails.isExpired ? "Renew 30-Day Pass ($9.99)" : "Unlock 30-Day Pass ($9.99)"}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        })}


        {filteredBands.length === 0 && (
          <div className="col-span-full bg-white border border-gray-100 rounded-xl p-8 text-center text-gray-400 text-xs font-semibold">
            No dynamic live bands match your filtering details. Modify search tags.
          </div>
        )}
      </div>

      {/* Modern Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100" id="directory-pagination">
          <p className="text-xs text-slate-500 font-medium">
            Showing <span className="font-extrabold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
            <span className="font-extrabold text-slate-900">
              {Math.min(currentPage * itemsPerPage, filteredBands.length)}
            </span>{" "}
            of <span className="font-extrabold text-slate-900">{filteredBands.length}</span> dynamic bands
          </p>

          <div className="flex items-center gap-1.5" id="pagination-buttons">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage((p) => Math.max(p - 1, 1));
                const gridEl = document.getElementById("bands-listing-grid");
                if (gridEl) gridEl.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all text-slate-700 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
              let pageNum = idx + 1;
              if (totalPages > 5) {
                if (currentPage > 3) {
                  pageNum = currentPage - 2 + idx;
                  if (pageNum + (4 - idx) > totalPages) {
                    pageNum = totalPages - 4 + idx;
                  }
                }
              }

              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => {
                    setCurrentPage(pageNum);
                    const gridEl = document.getElementById("bands-listing-grid");
                    if (gridEl) gridEl.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "border border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => {
                setCurrentPage((p) => Math.min(p + 1, totalPages));
                const gridEl = document.getElementById("bands-listing-grid");
                if (gridEl) gridEl.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all text-slate-700 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* User Login Modal */}
      <UserLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={(loggedAccount) => {
          if (onUpdateAccount) {
            onUpdateAccount(loggedAccount);
          }
          setSuccessMsg(`✅ Welcome back, ${loggedAccount.name}! Account connected.`);
          setTimeout(() => setSuccessMsg(""), 4000);
        }}
        onOpenCheckout={() => setShowPayPalModal(true)}
      />

      {/* Integrated PayPal Access Modal */}
      <PayPalAccessModal
        isOpen={showPayPalModal}
        onClose={() => setShowPayPalModal(false)}
        currentAccount={currentAccount || null}
        onPaymentSuccess={(updatedAccount) => {
          if (onUpdateAccount) {
            onUpdateAccount(updatedAccount);
          }
          setShowPayPalModal(false);
          setSuccessMsg("✅ Payment Successful! Full contact information is unlocked for 30 days.");
          setTimeout(() => setSuccessMsg(""), 5000);
        }}
      />

      {/* 5-Star Ratings & Reviews Modal */}
      {reviewModalBand && (
        <ReviewsModal
          isOpen={Boolean(reviewModalBand)}
          onClose={() => setReviewModalBand(null)}
          targetId={reviewModalBand.id}
          targetName={reviewModalBand.name}
          targetType="band"
          currentAccount={currentAccount || null}
        />
      )}
    </div>
  );
}

