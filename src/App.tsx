import React, { useState, useEffect } from "react";
import { Venue, StageElement, TechRider, PosterConfig, UserAccount } from "./types";
import Home from "./components/Home";
import VenueDirectory from "./components/VenueDirectory";
import StagePlotDesigner from "./components/StagePlotDesigner";
import TechRiderBuilder from "./components/TechRiderBuilder";
import PosterDesigner from "./components/PosterDesigner";
import BandAdvisor from "./components/BandAdvisor";
import BandDirectory from "./components/BandDirectory";
import TourScheduler from "./components/TourScheduler";
import AdminDashboard from "./components/AdminDashboard";
import SecurityShieldModal from "./components/SecurityShieldModal";
import EditAccountModal from "./components/EditAccountModal";
import PayPalAccessModal from "./components/PayPalAccessModal";
import gigLizardLogo from "./assets/images/giglizard_logo_hd.png";
import { recordLiveVisit } from "./utils/analyticsStore";
import { isBandBanned, isPerpetualPassEmail } from "./utils/accessControl";
import { 
  Music, MapPin, Sliders, FileText, Image, MessageSquare, 
  Settings, Sparkles, CheckCircle, Info, Calendar, Users,
  Compass, Navigation, ShieldCheck, BarChart3, Crown
} from "lucide-react";

// Default preset values for first-load
const INITIAL_BAND_PROFILE = {
  name: "Dr Hadit",
  genre: "Alternative Rock / Pacific NW",
  city: "Seattle, WA",
  vibe: "High-octane Pacific Northwest rock with heavy overdrive riffs and soaring anthems"
};

const INITIAL_RIDER_INPUTS = [
  { channel: 1, instrument: "Kick Drum", micOrDi: "Beta 52", stand: "Short Boom", phantomPower: false, notes: "Compress heavily in FOH" },
  { channel: 2, instrument: "Snare Drum", micOrDi: "SM57", stand: "Short Boom", phantomPower: false, notes: "High snare pop requested" },
  { channel: 3, instrument: "Bass Amp DI", micOrDi: "Active DI Box", stand: "None", phantomPower: true, notes: "Direct post-EQ balanced lines" },
  { channel: 4, instrument: "Guitar Amp Left", micOrDi: "SM57", stand: "Short Boom", phantomPower: false, notes: "Pan left 25%" },
  { channel: 5, instrument: "Lead Vocals", micOrDi: "SM58", stand: "Tall Boom", phantomPower: false, notes: "Reverb & Delay requested" },
  { channel: 6, instrument: "Backing Vocals (Drums)", micOrDi: "SM58", stand: "Tall Boom", phantomPower: false, notes: "Noise gate needed" }
];

export default function App() {
  type TabType = "home" | "venues" | "plot" | "rider" | "poster" | "advisor" | "bands" | "tour" | "admin";
  const validTabs: TabType[] = ["home", "venues", "plot", "rider", "poster", "advisor", "bands", "tour", "admin"];

  const isStoredAccountOwner = (): boolean => {
    try {
      const saved = localStorage.getItem("current_user_account_v1");
      if (!saved) return false;
      const acc = JSON.parse(saved);
      return acc?.contactEmail?.trim().toLowerCase() === "littlerusty@gmail.com";
    } catch {
      return false;
    }
  };

  const getInitialTab = (): TabType => {
    try {
      const isOwner = isStoredAccountOwner();
      const rawHash = window.location.hash.replace("#", "").toLowerCase();
      if (rawHash === "dashboard" || rawHash === "admin") return isOwner ? "admin" : "home";
      if (validTabs.includes(rawHash as TabType)) {
        if (rawHash === "admin" && !isOwner) return "home";
        return rawHash as TabType;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const rawParam = urlParams.get("tab")?.toLowerCase() || "";
      if (rawParam === "dashboard" || rawParam === "admin") return isOwner ? "admin" : "home";
      if (validTabs.includes(rawParam as TabType)) {
        if (rawParam === "admin" && !isOwner) return "home";
        return rawParam as TabType;
      }
    } catch (e) {
      console.error(e);
    }
    return "home";
  };

  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [showPayPalModal, setShowPayPalModal] = useState(false);

  // User Accounts State
  const [currentAccount, setCurrentAccount] = useState<UserAccount | null>(() => {
    // Purge any banned bands from custom storage on initialization
    try {
      const savedBands = localStorage.getItem("custom_available_bands_v1");
      if (savedBands) {
        const parsedBands = JSON.parse(savedBands);
        if (Array.isArray(parsedBands)) {
          const cleanedBands = parsedBands.filter(b => !isBandBanned(b?.contactEmail, b?.name));
          localStorage.setItem("custom_available_bands_v1", JSON.stringify(cleanedBands));
        }
      }
    } catch (_) {}

    const saved = localStorage.getItem("current_user_account_v1");
    if (saved) {
      try { 
        const parsed: UserAccount = JSON.parse(saved);
        if (isBandBanned(parsed?.contactEmail, parsed?.name)) {
          localStorage.removeItem("current_user_account_v1");
          return null;
        }
        if (isPerpetualPassEmail(parsed?.contactEmail)) {
          const ownerAccount: UserAccount = {
            ...parsed,
            name: (!parsed.name || parsed.name === "The Midnight Echoes") ? "Dr Hadit" : parsed.name,
            hasPaidAccess: true,
            isPremium: true,
            autoRenew: true,
            accessExpiresAt: new Date(Date.now() + 36500 * 24 * 60 * 60 * 1000).toISOString()
          };
          localStorage.setItem("current_user_account_v1", JSON.stringify(ownerAccount));
          return ownerAccount;
        }
        return parsed; 
      } catch (e) { console.error(e); }
    }
    return null;
  });

  const [activeTab, setActiveTabState] = useState<TabType>(getInitialTab);

  const setActiveTab = (tab: TabType) => {
    if (tab === "admin" && currentAccount?.contactEmail?.trim().toLowerCase() !== "littlerusty@gmail.com") {
      setActiveTabState("home");
      try {
        window.history.replaceState(null, "", "#home");
      } catch (e) {}
      return;
    }
    setActiveTabState(tab);
    try {
      if (window.location.hash !== `#${tab}`) {
        window.history.replaceState(null, "", `#${tab}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Ensure non-owner accounts cannot remain on admin tab
  useEffect(() => {
    if (activeTab === "admin" && currentAccount?.contactEmail?.trim().toLowerCase() !== "littlerusty@gmail.com") {
      setActiveTabState("home");
      try {
        window.history.replaceState(null, "", "#home");
      } catch (e) {}
    }
  }, [currentAccount, activeTab]);

  // Track page visit on mount and tab switch
  useEffect(() => {
    recordLiveVisit();
  }, [activeTab]);

  // Listen to browser hash changes (e.g. back/forward or direct URL clicks)
  useEffect(() => {
    const handleHashChange = () => {
      const isOwner = currentAccount?.contactEmail?.trim().toLowerCase() === "littlerusty@gmail.com";
      const rawHash = window.location.hash.replace("#", "").toLowerCase();
      if (rawHash === "dashboard" || rawHash === "admin") {
        if (isOwner) {
          setActiveTabState("admin");
        } else {
          setActiveTabState("home");
          window.history.replaceState(null, "", "#home");
        }
      } else if (validTabs.includes(rawHash as TabType)) {
        if (rawHash === "admin" && !isOwner) {
          setActiveTabState("home");
          window.history.replaceState(null, "", "#home");
        } else {
          setActiveTabState(rawHash as TabType);
        }
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
    };
  }, [currentAccount]);

  const handleRegisterAccount = (account: UserAccount) => {
    if (isBandBanned(account?.contactEmail, account?.name)) {
      alert("Registration for this account is not permitted.");
      return;
    }

    if (isPerpetualPassEmail(account?.contactEmail)) {
      account = {
        ...account,
        name: (!account.name || account.name === "The Midnight Echoes") ? "Dr Hadit" : account.name,
        hasPaidAccess: true,
        isPremium: true,
        autoRenew: true,
        accessExpiresAt: new Date(Date.now() + 36500 * 24 * 60 * 60 * 1000).toISOString()
      };
    }

    setCurrentAccount(account);
    localStorage.setItem("current_user_account_v1", JSON.stringify(account));
    
    // Automatically apply Band Profile values if user is a Band
    if (account.type === "Band") {
      setBandProfile({
        name: account.name,
        genre: account.genre || "Alternative Rock",
        city: account.city,
        vibe: account.bio || "Performing live music with enthusiasm."
      });
      setTechRider(prev => ({
        ...prev,
        bandName: account.name,
        genre: account.genre || "Alternative Rock",
        contactEmail: account.contactEmail
      }));
      setPosterConfig(prev => ({
        ...prev,
        bandName: account.name.toUpperCase()
      }));

      // Ensure custom band directory entry exists in localStorage if not banned
      try {
        const savedBands = localStorage.getItem("custom_available_bands_v1");
        let list: any[] = [];
        if (savedBands) {
          try { 
            const parsed = JSON.parse(savedBands); 
            if (Array.isArray(parsed)) list = parsed.filter(b => !isBandBanned(b?.contactEmail, b?.name));
          } catch (_) {}
        }
        const bandEntry = {
          id: `band-reg-${Date.now()}`,
          name: account.name,
          genres: account.genre ? account.genre.split(",").map(g => g.trim()).filter(Boolean) : ["Alternative Rock"],
          city: account.city || "Seattle, WA",
          bio: account.bio || "Live music artist registered on BandGig.",
          contactEmail: account.contactEmail || "",
          contactPhone: account.contactPhone || "Inquire",
          website: account.website,
          experienceLevel: account.experienceLevel || "Local"
        };
        const updated = [bandEntry, ...list.filter(b => b.name.toLowerCase() !== account.name.toLowerCase() && !isBandBanned(b?.contactEmail, b?.name))];
        localStorage.setItem("custom_available_bands_v1", JSON.stringify(updated));

        // Push to server-side endpoint
        fetch("/api/bands/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ band: bandEntry })
        }).catch(() => {});
      } catch (err) {
        console.warn("Could not sync band registration to directory:", err);
      }
    } else if (account.type === "Venue") {
      // Ensure custom venue directory entry exists in localStorage
      try {
        const savedVenues = localStorage.getItem("custom_venues_v1");
        let list: any[] = [];
        if (savedVenues) {
          try { list = JSON.parse(savedVenues); } catch (_) {}
        }
        const venueEntry = {
          id: `venue-reg-${Date.now()}`,
          name: account.name,
          capacity: account.capacity || 150,
          address: account.address || "123 Music Ave",
          city: account.city || "Seattle, WA",
          genres: account.genre ? account.genre.split(",").map(g => g.trim()).filter(Boolean) : ["Live Music"],
          contactEmail: account.contactEmail || "",
          contactPhone: account.contactPhone || "Inquire",
          description: account.bio || "Live music performance space.",
          website: account.website || "www.inquire-booking.com",
          hasPA: account.hasPA ?? true,
          hasLighting: account.hasLighting ?? true
        };
        const updated = [venueEntry, ...list.filter(v => v.name.toLowerCase() !== account.name.toLowerCase())];
        localStorage.setItem("custom_venues_v1", JSON.stringify(updated));
      } catch (err) {
        console.warn("Could not sync venue registration to directory:", err);
      }
    }
  };

  const handleUpdatePricing = (isPremium: boolean) => {
    if (currentAccount) {
      const now = Date.now();
      const updated: UserAccount = { 
        ...currentAccount, 
        isPremium,
        hasPaidAccess: isPremium,
        lastPaymentDate: isPremium ? new Date(now).toISOString() : undefined,
        accessExpiresAt: isPremium ? new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined
      };
      setCurrentAccount(updated);
      localStorage.setItem("current_user_account_v1", JSON.stringify(updated));
    }
  };

  const handleUpdateAccount = (account: UserAccount) => {
    setCurrentAccount(account);
    localStorage.setItem("current_user_account_v1", JSON.stringify(account));
  };

  const handleLogOut = () => {
    setCurrentAccount(null);
    localStorage.removeItem("current_user_account_v1");
  };

  // Band profile general settings
  const [bandProfile, setBandProfile] = useState(INITIAL_BAND_PROFILE);
  const [selectedVenueId, setSelectedVenueId] = useState<string>("subterranean-cellar");

  // Stage items configuration
  const [stageElements, setStageElements] = useState<StageElement[]>([]);

  // Tech rider inputs
  const [techRider, setTechRider] = useState<TechRider>({
    bandName: INITIAL_BAND_PROFILE.name,
    genre: INITIAL_BAND_PROFILE.genre,
    contactName: "Dr Hadit (Tour Representative)",
    contactEmail: "littlerusty@gmail.com",
    contactPhone: "(206) 555-0199",
    inputs: INITIAL_RIDER_INPUTS,
    audioNotes: "We require 3 independent monitor mixes. Center vocalist needs high power monitors with plenty of low-mids. Drummer prefers a stereo headphone mix if available. Soundcheck duration of 30 minutes is optimized.",
    hospitalityNotes: "Catering: Please provide 4 bottles of still water on stage. A simple box lunch or vegetarian-friendly snack tray is requested in the dressing room. Towels: 4 clean stage towels.",
    bandState: "Washington",
    governingState: "Washington"
  });

  // Concert poster config
  const [posterConfig, setPosterConfig] = useState<PosterConfig>({
    bandName: INITIAL_BAND_PROFILE.name.toUpperCase(),
    secondaryText: "LIVE ON STAGE",
    venueName: "The Subterranean Cellar",
    venueAddress: "412 Pike St, Seattle, WA 98101",
    dateStr: "Friday, Nov 14th",
    timeStr: "Doors at 8:00 PM • Music at 9:00 PM",
    priceStr: "$12 Adv / $15 Day of Show",
    allAges: "All Ages",
    amenities: {
      servesFood: true,
      servesAlcohol: true,
      merchArea: true
    },
    extraDetails: "Cash only bar. Nearby parking available. Proof of reservation required.",
    themeId: "heavy-grunge",
    colorId: "default"
  });

  // Cascade Band Profile edits to related modules
  const handleUpdateBandProfile = (field: keyof typeof INITIAL_BAND_PROFILE, value: string) => {
    const updated = { ...bandProfile, [field]: value };
    setBandProfile(updated);

    // Sync to tech rider name
    if (field === "name") {
      setTechRider(prev => ({ ...prev, bandName: value }));
      setPosterConfig(prev => ({ ...prev, bandName: value.toUpperCase() }));
    } else if (field === "genre") {
      setTechRider(prev => ({ ...prev, genre: value }));
    }
  };

  // Sync selected venue to both Poster and State
  const handleSelectVenueForGig = (venue: Venue) => {
    setSelectedVenueId(venue.id);
    
    // Auto-update values inside the poster configuration
    setPosterConfig(prev => ({
      ...prev,
      venueName: venue.name,
      venueAddress: venue.address
    }));

    // Alert visually
    setActiveTab("poster");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans" id="applet-viewport">
      {/* Visual Workspace Bar Header */}
      <header className="bg-white border-b border-gray-200/60 sticky top-0 z-50 py-3.5 px-4 md:px-8" id="main-header">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4" id="header-inner">
          
          <div className="flex items-center" id="logo-row">
            <button
              type="button"
              onClick={() => setActiveTab("home")}
              className="flex items-center cursor-pointer text-left focus:outline-hidden group"
              id="header-brand-link"
              title="GigLizard Home"
            >
              <img
                src={gigLizardLogo || "/giglizard_logo.png"}
                alt="GigLizard"
                className="h-14 md:h-18 lg:h-20 max-h-24 w-auto object-contain transition-transform group-hover:scale-102"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  if (e.currentTarget.src !== window.location.origin + "/giglizard_logo.png") {
                    e.currentTarget.src = "/giglizard_logo.png";
                  }
                }}
                id="giglizard-logo-img"
              />
            </button>
          </div>

          {/* Quick tab controllers - Optimized for all viewports & screen sizes */}
          <nav className="flex flex-wrap items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl w-full xl:w-auto border border-slate-200/60 shadow-2xs" id="main-nav">
            <button
              onClick={() => setActiveTab("home")}
              id="tab-btn-home"
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold cursor-pointer rounded-xl transition-all ${
                activeTab === "home"
                  ? "bg-indigo-650 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-950 hover:bg-white/80"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Home</span>
            </button>

            <button
              onClick={() => setActiveTab("venues")}
              id="tab-btn-venues"
              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-bold cursor-pointer rounded-xl transition-all ${
                activeTab === "venues"
                  ? "bg-white text-slate-950 shadow-xs ring-1 ring-slate-200"
                  : "text-slate-600 hover:text-slate-950 hover:bg-white/80"
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <span>1. Venues</span>
            </button>

            <button
              onClick={() => setActiveTab("plot")}
              id="tab-btn-plot"
              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-bold cursor-pointer rounded-xl transition-all ${
                activeTab === "plot"
                  ? "bg-white text-slate-950 shadow-xs ring-1 ring-slate-200"
                  : "text-slate-600 hover:text-slate-950 hover:bg-white/80"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-orange-500" />
              <span>2. Stage Plot</span>
            </button>

            <button
              onClick={() => setActiveTab("rider")}
              id="tab-btn-rider"
              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-bold cursor-pointer rounded-xl transition-all ${
                activeTab === "rider"
                  ? "bg-white text-slate-950 shadow-xs ring-1 ring-slate-200"
                  : "text-slate-600 hover:text-slate-950 hover:bg-white/80"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>3. Tech Rider</span>
            </button>

            <button
              onClick={() => setActiveTab("poster")}
              id="tab-btn-poster"
              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-bold cursor-pointer rounded-xl transition-all ${
                activeTab === "poster"
                  ? "bg-white text-slate-950 shadow-xs ring-1 ring-slate-200"
                  : "text-slate-600 hover:text-slate-950 hover:bg-white/80"
              }`}
            >
              <Image className="w-3.5 h-3.5 text-emerald-500" />
              <span>4. Posters</span>
            </button>

            <button
              onClick={() => setActiveTab("advisor")}
              id="tab-btn-advisor"
              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-bold cursor-pointer rounded-xl transition-all ${
                activeTab === "advisor"
                  ? "bg-white text-slate-950 shadow-xs ring-1 ring-slate-200"
                  : "text-slate-600 hover:text-slate-950 hover:bg-white/80"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
              <span>5. AI Advisor</span>
            </button>

            <button
              onClick={() => setActiveTab("bands")}
              id="tab-btn-bands"
              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-bold cursor-pointer rounded-xl transition-all ${
                activeTab === "bands"
                  ? "bg-white text-slate-950 shadow-xs ring-1 ring-slate-200"
                  : "text-slate-600 hover:text-slate-950 hover:bg-white/80"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-500" />
              <span>6. Bands</span>
            </button>

            <button
              onClick={() => setActiveTab("tour")}
              id="tab-btn-tour"
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black cursor-pointer rounded-xl transition-all shadow-xs ${
                activeTab === "tour"
                  ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-300"
                  : "bg-rose-50/80 text-rose-700 hover:bg-rose-100/90 border border-rose-200/80"
              }`}
            >
              <Compass className={`w-3.5 h-3.5 ${activeTab === "tour" ? "text-white" : "text-rose-600"} animate-spin-slow`} />
              <span>7. Smart Tour Planner</span>
            </button>

            {/* Edit Account & Page Button for logged-in users */}
            {currentAccount && (
              <button
                type="button"
                onClick={() => setShowEditAccountModal(true)}
                id="tab-btn-edit-account"
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black cursor-pointer rounded-xl transition-all shadow-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                title="Edit your account password, view status, or update your band or venue page"
              >
                <Settings className="w-3.5 h-3.5 text-indigo-600" />
                <span>Edit Account</span>
              </button>
            )}

            {/* Owner & Private Analytics Dashboard Button - strictly visible to littlerusty@gmail.com only */}
            {currentAccount?.contactEmail?.trim().toLowerCase() === "littlerusty@gmail.com" && (
              <button
                onClick={() => setActiveTab("admin")}
                id="tab-btn-admin"
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black cursor-pointer rounded-xl transition-all shadow-xs ${
                  activeTab === "admin"
                    ? "bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300"
                    : "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200"
                }`}
                title="Private Owner Analytics & Subscriber Contact Hub (littlerusty@gmail.com)"
              >
                <Crown className={`w-3.5 h-3.5 ${activeTab === "admin" ? "text-slate-950" : "text-amber-600"}`} />
                <span>Owner Dashboard</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </button>
            )}
          </nav>

        </div>
      </header>

      {/* Core Tab Workspace Grid */}
      <main className="flex-grow p-4 md:p-8 max-w-7xl w-full mx-auto" id="main-content-layout">
        
        {activeTab === "home" && (
          <div className="space-y-6" id="view-home-wrapper">
            <Home 
              currentAccount={currentAccount}
              onSelectTab={setActiveTab}
              onRegisterAccount={handleRegisterAccount}
              onUpdatePricing={handleUpdatePricing}
              onUpdateAccount={handleUpdateAccount}
              onLogOut={handleLogOut}
              onTriggerEditAccount={() => setShowEditAccountModal(true)}
            />
          </div>
        )}

        {activeTab === "venues" && (
          <div className="space-y-6" id="view-venues-wrapper">
            <VenueDirectory 
              onSelectVenueForPoster={handleSelectVenueForGig}
              selectedVenueId={selectedVenueId}
              currentAccount={currentAccount}
              onTriggerUpgrade={() => {
                setActiveTab("home");
                setTimeout(() => {
                  document.getElementById("quick-status-widget")?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
            />
          </div>
        )}

        {activeTab === "plot" && (
          <div className="space-y-6" id="view-plot-wrapper">
            <StagePlotDesigner 
              elements={stageElements}
              onUpdateElements={setStageElements}
            />
          </div>
        )}

        {activeTab === "rider" && (
          <div className="space-y-6" id="view-rider-wrapper">
            <TechRiderBuilder 
              rider={techRider}
              onUpdateRider={setTechRider}
            />
          </div>
        )}

        {activeTab === "poster" && (
          <div className="space-y-6" id="view-poster-wrapper">
            <PosterDesigner 
              config={posterConfig}
              onChangeConfig={setPosterConfig}
            />
          </div>
        )}

        {activeTab === "advisor" && (
          <div className="space-y-6" id="view-advisor-wrapper">
            <BandAdvisor 
              bandProfile={bandProfile}
            />
          </div>
        )}

        {activeTab === "bands" && (
          <div className="space-y-6" id="view-bands-wrapper">
            <BandDirectory 
              currentAccount={currentAccount}
              onUpdateAccount={handleUpdateAccount}
              onTriggerEditAccount={() => setShowEditAccountModal(true)}
              onTriggerUpgrade={() => {
                setShowPayPalModal(true);
              }}
              onTriggerLogin={() => {
                setActiveTab("home");
                setTimeout(() => {
                  document.getElementById("btn-user-login-trigger")?.click();
                  document.getElementById("guest-helper-widget")?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
            />
          </div>
        )}

        {activeTab === "tour" && (
          <div className="space-y-6" id="view-tour-wrapper">
            <TourScheduler 
              bandProfile={bandProfile}
              onSelectVenueForPoster={handleSelectVenueForGig}
            />
          </div>
        )}

        {activeTab === "admin" && (
          currentAccount?.contactEmail?.trim().toLowerCase() === "littlerusty@gmail.com" ? (
            <div className="space-y-6" id="view-admin-wrapper">
              <AdminDashboard 
                currentAccount={currentAccount}
                onSwitchAccount={handleUpdateAccount}
              />
            </div>
          ) : (
            <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-rose-200 rounded-3xl shadow-xl text-center space-y-4" id="admin-access-denied-gate">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Owner Dashboard Restricted</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                The Owner Dashboard is strictly confidential and restricted to <strong className="text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded">littlerusty@gmail.com</strong> only. No other users or accounts are permitted.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("home")}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md"
                >
                  Return to GigLizard
                </button>
              </div>
            </div>
          )
        )}

      </main>

      {/* Master Information Section beneath workspace */}
      <section className="bg-white border-t border-gray-100 py-10 px-4 md:px-8 mt-12" id="planner-facts-strip">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8" id="quick-facts-layout">
          <div className="space-y-2 text-xs" id="fact-stage">
            <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5" id="title-stage-fact">
              <Sliders className="w-4 h-4 text-indigo-500" />
              Responsive Stage Arrangement
            </h4>
            <p className="text-slate-500 leading-normal" id="desc-stage-fact">
              Our interactive Stage Plot canvas utilizes robust percentage calculations. Gear arrangements remain structurally clean on laptop, tablet, or smartphone previews to handle live gig updates beautifully.
            </p>
          </div>

          <div className="space-y-2 text-xs" id="fact-rider">
            <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5" id="title-rider-fact">
              <FileText className="w-4 h-4 text-emerald-500" />
              Professional Tech Delivery
            </h4>
            <p className="text-slate-500 leading-normal" id="desc-rider-fact">
              Generate structured, dynamic ASCII stage patches in seconds. Tap presets to instantly map drum snares, kick, guitars, keys, or vocals. Instantly copy to stage clipboard or download direct text configurations.
            </p>
          </div>

          <div className="space-y-2 text-xs" id="fact-poster">
            <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5" id="title-poster-fact">
              <Image className="w-4 h-4 text-purple-505" />
              Distinguished Promo Poster Layouts
            </h4>
            <p className="text-slate-500 leading-normal" id="desc-poster-fact">
              Export concert templates styled using custom fonts, neon grid aesthetics, acoustic leaf details, or distressed grunge colorways. Directly customize price lists, food icons, 21+ limit warnings, and AI generated taglines.
            </p>
          </div>
        </div>
      </section>

      {/* High-quality footer */}
      <footer className="py-6 border-t border-gray-200 text-center text-xs text-gray-400 bg-slate-50" id="main-footer">
        <p id="footer-text-cop">Band Gig Planning Workspace • Designed to help rising indie artists and unsigned performers book with absolute, pristine professional style.</p>
      </footer>

      {/* Security & Anti-Scraping Diagnostics Modal */}
      <SecurityShieldModal 
        isOpen={showSecurityModal} 
        onClose={() => setShowSecurityModal(false)} 
      />

      {/* Edit Account Modal */}
      {currentAccount && (
        <EditAccountModal
          isOpen={showEditAccountModal}
          onClose={() => setShowEditAccountModal(false)}
          currentAccount={currentAccount}
          onUpdateAccount={(updated) => {
            handleUpdateAccount(updated);
            if (updated.type === "Band") {
              setBandProfile(prev => ({
                ...prev,
                name: updated.name,
                genre: updated.genre || prev.genre,
                city: updated.city,
                vibe: updated.bio || prev.vibe
              }));
              setTechRider(prev => ({
                ...prev,
                bandName: updated.name,
                genre: updated.genre || prev.genre,
                contactEmail: updated.contactEmail
              }));
              setPosterConfig(prev => ({
                ...prev,
                bandName: updated.name.toUpperCase()
              }));
            }
          }}
          onOpenCheckout={() => setShowPayPalModal(true)}
        />
      )}

      {/* Direct PayPal Access Modal */}
      <PayPalAccessModal
        isOpen={showPayPalModal}
        onClose={() => setShowPayPalModal(false)}
        currentAccount={currentAccount}
        onPaymentSuccess={() => {
          if (currentAccount) {
            handleUpdatePricing(true);
          }
        }}
      />
    </div>
  );
}
