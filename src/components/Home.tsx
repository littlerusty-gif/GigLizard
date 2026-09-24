import React, { useState, useEffect } from "react";
import { UserAccount, Venue, AvailableBand } from "../types";
import { 
  Sliders, FileText, Image, Shield, Sparkles, Check, 
  Users, MapPin, Building, Mail, CreditCard, Star, DollarSign,
  HelpCircle, UserCheck, LogOut, ArrowRight, Lock, LogIn,
  Compass, Navigation, CheckCircle, X, ShieldCheck, Clock, CheckCircle2,
  KeyRound, Eye, EyeOff, Headphones, ExternalLink, Settings, AlertCircle
} from "lucide-react";
import CaptchaChallenge from "./CaptchaChallenge";
import PayPalAccessModal from "./PayPalAccessModal";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { sanitizeInputText } from "../utils/antiScrape";
import { isAccessActive, getAccessStatusDetails, isBandBanned, isPerpetualPassEmail } from "../utils/accessControl";
import { recordLiveSignup } from "../utils/analyticsStore";
import { resolveBandMusicLinks, categorizeUserMusicLink } from "../utils/musicLinks";
import { isEmailAlreadyRegistered, normalizeEmail } from "../utils/directoryStore";

interface HomeProps {
  currentAccount: UserAccount | null;
  onSelectTab: (tab: "home" | "venues" | "plot" | "rider" | "poster" | "advisor" | "bands" | "tour" | "admin") => void;
  onRegisterAccount: (account: UserAccount) => void;
  onUpdatePricing: (isPremium: boolean) => void;
  onUpdateAccount?: (account: UserAccount) => void;
  onLogOut: () => void;
  onTriggerEditAccount?: () => void;
}

export default function Home({ 
  currentAccount, 
  onSelectTab, 
  onRegisterAccount, 
  onUpdatePricing,
  onUpdateAccount,
  onLogOut,
  onTriggerEditAccount 
}: HomeProps) {
  const [accountType, setAccountType] = useState<"Band" | "Venue">("Band");
  const [successMessage, setSuccessMessage] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registeredSuccessAccount, setRegisteredSuccessAccount] = useState<UserAccount | null>(null);

  // Common Form Fields - expanded to match directory registration forms exactly
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    contactEmail: "",
    password: "",
    genre: "",
    bio: "",
    capacity: 150,
    address: "",
    contactPhone: "",
    website: "",
    epkOrMusicUrl: "",
    experienceLevel: "Local" as "Local" | "Regional Tour" | "National Act",
    hasPA: true,
    hasLighting: true
  });

  // Modal flow state for PayPal 30-day pass
  const [showPayPalModal, setShowPayPalModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const activeAccess = isAccessActive(currentAccount);
  const accessDetails = getAccessStatusDetails(currentAccount);

  // User login states
  const [showUserLoginForm, setShowUserLoginForm] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPasswordText, setShowLoginPasswordText] = useState(false);
  const [loginRole, setLoginRole] = useState<"Band" | "Venue">("Band");
  const [loginError, setLoginError] = useState("");
  const [isLoginCaptchaVerified, setIsLoginCaptchaVerified] = useState(false);

  // Forgot password modal states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordToken, setForgotPasswordToken] = useState("");

  // Listen for reset-password link clicks from email or direct hash navigation
  useEffect(() => {
    const handleCheckResetUrl = () => {
      const hash = window.location.hash;
      if (hash.includes("reset-password") || hash.includes("token=")) {
        const matchToken = hash.match(/token=([^&]+)/);
        const matchEmail = hash.match(/email=([^&]+)/);
        if (matchToken && matchToken[1]) {
          setForgotPasswordToken(decodeURIComponent(matchToken[1]));
          if (matchEmail && matchEmail[1]) {
            setForgotPasswordEmail(decodeURIComponent(matchEmail[1]));
          }
          setShowForgotPassword(true);
          setShowUserLoginForm(false);
        }
      }
    };

    handleCheckResetUrl();
    window.addEventListener("hashchange", handleCheckResetUrl);
    window.addEventListener("popstate", handleCheckResetUrl);
    return () => {
      window.removeEventListener("hashchange", handleCheckResetUrl);
      window.removeEventListener("popstate", handleCheckResetUrl);
    };
  }, []);

  const handleUserLogin = () => {
    setLoginError("");
    
    // Anti-Bot Captcha Verification enforcement
    if (!isLoginCaptchaVerified) {
      setLoginError("Security Check Required: Please complete the Anti-Bot Captcha verification challenge below.");
      return;
    }

    const cleanEmail = sanitizeInputText(loginEmail, 100);
    const cleanPassword = sanitizeInputText(loginPassword, 100);

    if (!cleanEmail) {
      setLoginError("Please enter a valid email address.");
      return;
    }
    if (!cleanPassword) {
      setLoginError("Please enter your password.");
      return;
    }

    const emailSearch = cleanEmail.toLowerCase();

    if (isBandBanned(emailSearch)) {
      setLoginError("Access denied: This account has been removed and is not permitted.");
      return;
    }

    // Check custom updated passwords registry
    const customPasswordsMap: Record<string, string> = (() => {
      try {
        return JSON.parse(localStorage.getItem("user_custom_passwords_v1") || "{}");
      } catch {
        return {};
      }
    })();
    const expectedCustomPass = customPasswordsMap[emailSearch];

    // 1. Check master accounts - strictly littlerusty@gmail.com only
    if (emailSearch === "littlerusty@gmail.com") {
      const validAdminPass = expectedCustomPass || "L,eilani1228";
      if (cleanPassword === validAdminPass) {
        const masterPayload: UserAccount = {
          type: "Band",
          name: "Dr Hadit",
          city: "Seattle, WA",
          isPremium: true,
          hasPaidAccess: true,
          autoRenew: true,
          accessExpiresAt: new Date(Date.now() + 36500 * 24 * 60 * 60 * 1000).toISOString(),
          contactEmail: "littlerusty@gmail.com",
          genre: "Alternative Rock / Synthwave",
          bio: "Platform Owner & Artist (Dr Hadit) • Lifetime VIP Owner with full unmasked access for life.",
          experienceLevel: "National Act"
        };
        onRegisterAccount(masterPayload);
        setSuccessMessage(`Logged in successfully as Platform Owner (littlerusty@gmail.com)! Lifetime Full Access Enabled.`);
        setTimeout(() => setSuccessMessage(""), 4000);
        return;
      }
    }

    // Check basic length for non-admin password safety
    if (cleanPassword.length < 4) {
      setLoginError("Password must be at least 4 characters.");
      return;
    }

    // 2. Check custom registered bands and custom registered venues in localStorage
    const savedBandsStr = localStorage.getItem("custom_available_bands_v1");
    let customBands: any[] = [];
    if (savedBandsStr) {
      try { customBands = JSON.parse(savedBandsStr); } catch (err) { console.error(err); }
    }

    const savedVenuesStr = localStorage.getItem("custom_venues_v1");
    let customVenues: any[] = [];
    if (savedVenuesStr) {
      try { customVenues = JSON.parse(savedVenuesStr); } catch (err) { console.error(err); }
    }

    const foundCustomBand = customBands.find(b => 
      b.contactEmail?.trim().toLowerCase() === emailSearch ||
      b.name?.trim().toLowerCase() === emailSearch
    );
    if (foundCustomBand) {
      const requiredPass = expectedCustomPass || foundCustomBand.password || "password";
      if (loginPassword !== requiredPass) {
        setLoginError("Access denied: Incorrect password for registered band account.");
        return;
      }
      const payload: UserAccount = {
        type: "Band",
        name: foundCustomBand.name,
        city: foundCustomBand.city,
        isPremium: false,
        contactEmail: foundCustomBand.contactEmail,
        genre: Array.isArray(foundCustomBand.genres) ? foundCustomBand.genres.join(", ") : (foundCustomBand.genre || "Alternative Rock"),
        bio: foundCustomBand.bio,
        experienceLevel: foundCustomBand.experienceLevel,
        website: foundCustomBand.website,
        contactPhone: foundCustomBand.contactPhone,
        password: requiredPass
      };
      onRegisterAccount(payload);
      setSuccessMessage(`Welcome back! Logged in as Band: ${foundCustomBand.name}.`);
      setTimeout(() => setSuccessMessage(""), 4000);
      return;
    }

    const foundCustomVenue = customVenues.find(v => 
      v.contactEmail?.trim().toLowerCase() === emailSearch ||
      v.name?.trim().toLowerCase() === emailSearch
    );
    if (foundCustomVenue) {
      const requiredPass = expectedCustomPass || foundCustomVenue.password || "password";
      if (loginPassword !== requiredPass) {
        setLoginError("Access denied: Incorrect password for registered venue account.");
        return;
      }
      const payload: UserAccount = {
        type: "Venue",
        name: foundCustomVenue.name,
        city: foundCustomVenue.city,
        isPremium: false,
        contactEmail: foundCustomVenue.contactEmail,
        genre: Array.isArray(foundCustomVenue.genres) ? foundCustomVenue.genres.join(", ") : "Live Music",
        bio: foundCustomVenue.description,
        capacity: foundCustomVenue.capacity,
        address: foundCustomVenue.address,
        hasPA: foundCustomVenue.hasPA,
        hasLighting: foundCustomVenue.hasLighting,
        contactPhone: foundCustomVenue.contactPhone,
        website: foundCustomVenue.website,
        password: requiredPass
      };
      onRegisterAccount(payload);
      setSuccessMessage(`Welcome back! Logged in as Venue: ${foundCustomVenue.name}.`);
      setTimeout(() => setSuccessMessage(""), 4000);
      return;
    }

    // 3. Fallback check inside preset registries
    const presetBands = [
      { email: "littlerusty@gmail.com", name: "Dr Hadit", type: "Band" as const, city: "Seattle, WA", isPremium: true, genre: "Alternative Rock", bio: "High-octane Pacific Northwest rock powered by Dr Hadit." },
      { email: "velocitybooking@northwestdiy.org", name: "Silent Velocity", type: "Band" as const, city: "Seattle, WA", isPremium: false, genre: "Punk", bio: "PNW grunge energy." },
      { email: "booking@blackwaterholylight.com", name: "Blackwater Holylight", type: "Band" as const, city: "Portland, OR", isPremium: false, genre: "Psychedelic Rock", bio: "Ethereal fuzz rock." }
    ];

    const presetVenues = [
      { email: "booking@crocodile.com", name: "The Crocodile", type: "Venue" as const, city: "Seattle, WA", isPremium: false, address: "2200 2nd Ave, Seattle, WA 98121", bio: "Legendary live music venue." },
      { email: "shows@sunsettavern.com", name: "Sunset Tavern", type: "Venue" as const, city: "Seattle, WA", isPremium: false, address: "5433 Ballard Ave NW, Seattle, WA 98107", bio: "Intimate historic music room." }
    ];

    const matchedPresetBand = presetBands.find(b => b.email === emailSearch);
    if (matchedPresetBand) {
      const requiredPass = expectedCustomPass || "password";
      if (loginPassword !== requiredPass) {
        setLoginError("Access denied: Incorrect password for preset band account.");
        return;
      }
      const payload: UserAccount = {
        type: "Band",
        name: matchedPresetBand.name,
        city: matchedPresetBand.city,
        isPremium: false,
        contactEmail: matchedPresetBand.email,
        genre: matchedPresetBand.genre,
        bio: matchedPresetBand.bio,
        experienceLevel: "National Act",
        password: requiredPass
      };
      onRegisterAccount(payload);
      setSuccessMessage(`Demo User Connected! Logged in as Band: ${matchedPresetBand.name}.`);
      setTimeout(() => setSuccessMessage(""), 4000);
      return;
    }

    const matchedPresetVenue = presetVenues.find(v => v.email === emailSearch);
    if (matchedPresetVenue) {
      const requiredPass = expectedCustomPass || "password";
      if (loginPassword !== requiredPass) {
        setLoginError("Access denied: Incorrect password for preset venue account.");
        return;
      }
      const payload: UserAccount = {
        type: "Venue",
        name: matchedPresetVenue.name,
        city: matchedPresetVenue.city,
        isPremium: false,
        contactEmail: matchedPresetVenue.email,
        genre: "Live Music",
        bio: matchedPresetVenue.bio,
        address: matchedPresetVenue.address,
        capacity: 350,
        password: requiredPass
      };
      onRegisterAccount(payload);
      setSuccessMessage(`Demo User Connected! Logged in as Venue: ${matchedPresetVenue.name}.`);
      setTimeout(() => setSuccessMessage(""), 4000);
      return;
    }

    // 4. Fallback instantiate a generic brand new account context for typing custom emails to keep it fully functional and protected
    if (loginRole === "Venue") {
      let displayVenueName = emailSearch.includes("@") ? emailSearch.split("@")[0] : emailSearch;
      displayVenueName = displayVenueName.split(/[\s._-]+/).map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join(" ") + " Room";

      const finalPass = expectedCustomPass || loginPassword;
      if (expectedCustomPass && loginPassword !== expectedCustomPass) {
        setLoginError("Access denied: Incorrect password for this account.");
        return;
      }

      const newVenue: any = {
        id: `venue-reg-${Date.now()}`,
        name: displayVenueName,
        capacity: 150,
        address: "123 Music Ave",
        city: "Seattle, WA",
        genres: ["Live Music"],
        contactEmail: emailSearch.includes("@") ? emailSearch : `${emailSearch.toLowerCase().replace(/\s+/g, "")}@example.com`,
        contactPhone: "Inquire",
        description: `A newly registered live music venue room ready for touring bands.`,
        website: "www.myvenue.com",
        hasPA: true,
        hasLighting: true,
        password: finalPass
      };
      const updatedVenues = [newVenue, ...customVenues.filter(v => v.name.toLowerCase() !== newVenue.name.toLowerCase() && v.contactEmail.toLowerCase() !== newVenue.contactEmail.toLowerCase())];
      localStorage.setItem("custom_venues_v1", JSON.stringify(updatedVenues));

      const fallbackPayload: UserAccount = {
        type: "Venue",
        name: newVenue.name,
        city: newVenue.city,
        isPremium: false,
        contactEmail: newVenue.contactEmail,
        genre: "Live Music",
        bio: newVenue.description,
        capacity: newVenue.capacity,
        address: newVenue.address,
        password: finalPass
      };
      onRegisterAccount(fallbackPayload);
      setSuccessMessage(`Registered and logged in as venue: ${newVenue.name}! Available in directory.`);
    } else {
      let displayName = emailSearch.includes("@") ? emailSearch.split("@")[0] : emailSearch;
      if (displayName.toLowerCase().replace(/[\s\-_.]/g, "") === "drhadit") {
        displayName = "Dr Hadit";
      } else {
        displayName = displayName.split(/[\s._-]+/).map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join(" ");
      }

      const finalPass = expectedCustomPass || loginPassword;
      if (expectedCustomPass && loginPassword !== expectedCustomPass) {
        setLoginError("Access denied: Incorrect password for this account.");
        return;
      }

      const newBand: any = {
        id: `band-reg-${Date.now()}`,
        name: displayName,
        genres: ["Alternative Rock"],
        city: "Seattle, WA",
        bio: `Live touring artist ready for regional and national shows.`,
        contactEmail: emailSearch.includes("@") ? emailSearch : `${emailSearch.toLowerCase().replace(/\s+/g, "")}@example.com`,
        contactPhone: "Inquire",
        password: finalPass
      };
      
      // Register with backend server endpoint
      try {
        fetch("/api/bands/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ band: newBand })
        }).catch(() => {});
      } catch (_) {}

      const updatedBands = [newBand, ...customBands.filter(b => b.name.toLowerCase() !== displayName.toLowerCase() && b.contactEmail.toLowerCase() !== newBand.contactEmail.toLowerCase())];
      localStorage.setItem("custom_available_bands_v1", JSON.stringify(updatedBands));

      const fallbackPayload: UserAccount = {
        type: "Band",
        name: newBand.name,
        city: newBand.city,
        isPremium: false,
        contactEmail: newBand.contactEmail,
        genre: "Alternative Rock",
        bio: newBand.bio,
        password: finalPass
      };
      onRegisterAccount(fallbackPayload);
      setSuccessMessage(`Registered and logged in as: ${newBand.name}! Added directly to Band Directory.`);
    }
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  // Auto-fill defaults if logged-out to keep it smooth
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");
    
    const normalizedEmail = normalizeEmail(formData.contactEmail);

    if (accountType === "Venue") {
      if (!formData.name.trim() || !formData.address.trim() || !formData.city.trim() || !normalizedEmail || !formData.password) {
        const msg = "Please fill in all requested fields: Venue Name, Address, City, Booking Email, and Account Password.";
        setRegisterError(msg);
        alert(msg);
        return;
      }
    } else {
      if (!formData.name.trim() || !formData.city.trim() || !normalizedEmail || !formData.password) {
        const msg = "Please fill in the required fields: Band Name, Hometown, Booking Email, and Account Password.";
        setRegisterError(msg);
        alert(msg);
        return;
      }
    }

    if (!normalizedEmail.includes("@")) {
      const msg = "Please enter a valid email address.";
      setRegisterError(msg);
      alert(msg);
      return;
    }

    if (formData.password.length < 4) {
      const msg = "Account Password must be at least 4 characters long.";
      setRegisterError(msg);
      alert(msg);
      return;
    }

    // Check if email already exists in the database / directories
    if (isEmailAlreadyRegistered(normalizedEmail)) {
      const msg = `An account with the email "${normalizedEmail}" is already registered. Please sign in or use "Forgot Password" to access your account.`;
      setRegisterError(msg);
      alert(msg);
      return;
    }

    if (isBandBanned(normalizedEmail, formData.name.trim())) {
      const msg = "Account registration is not permitted for this email or name.";
      setRegisterError(msg);
      alert(msg);
      return;
    }

    const { epkUrl, musicUrl } = accountType === "Band" 
      ? categorizeUserMusicLink(formData.epkOrMusicUrl) 
      : { epkUrl: undefined, musicUrl: undefined };

    // ALL newly registered accounts start with isPremium = false (free account)
    const payload: UserAccount = {
      type: accountType,
      name: formData.name.trim(),
      city: formData.city.trim(),
      isPremium: false,
      contactEmail: normalizedEmail,
      genre: formData.genre || (accountType === "Band" ? "Alternative Rock" : "Live Music"),
      bio: formData.bio || (accountType === "Band" ? "Performing live music with enthusiasm." : "A gorgeous live music environment."),
      capacity: accountType === "Venue" ? Number(formData.capacity) || 150 : undefined,
      address: accountType === "Venue" ? formData.address.trim() : undefined,
      contactPhone: formData.contactPhone || undefined,
      website: formData.website || undefined,
      epkUrl: epkUrl || undefined,
      musicUrl: musicUrl || undefined,
      experienceLevel: accountType === "Band" ? formData.experienceLevel : undefined,
      hasPA: accountType === "Venue" ? formData.hasPA : undefined,
      hasLighting: accountType === "Venue" ? formData.hasLighting : undefined,
      password: formData.password
    };

    // Auto-inject into venues or available bands in localStorage to preserve seamless functional mechanics
    if (accountType === "Venue") {
      const saved = localStorage.getItem("custom_venues_v1");
      let list: Venue[] = [];
      if (saved) {
        try { list = JSON.parse(saved); } catch (err) { console.error(err); }
      }
      
      const processedGenres = formData.genre 
        ? formData.genre.split(",").map(g => g.trim()).filter(g => g.length > 0)
        : ["Live Music"];

      const newVenue: Venue = {
        id: `venue-reg-${Date.now()}`,
        name: formData.name.trim(),
        capacity: Number(formData.capacity) || 150,
        address: formData.address.trim(),
        city: formData.city.trim(),
        genres: processedGenres,
        contactEmail: normalizedEmail,
        contactPhone: formData.contactPhone || "Inquire",
        description: `[Capacity: ${formData.capacity} guests] ${formData.bio || "A vibrant live performance room ready to play host to high quality events."}`,
        website: formData.website || "www.customregisteredvenue.com",
        hasPA: formData.hasPA,
        hasLighting: formData.hasLighting,
        password: formData.password
      };
      const updatedVenues = [newVenue, ...list.filter(v => v.name.toLowerCase() !== newVenue.name.toLowerCase() && normalizeEmail(v.contactEmail) !== normalizedEmail)];
      localStorage.setItem("custom_venues_v1", JSON.stringify(updatedVenues));
    } else {
      const saved = localStorage.getItem("custom_available_bands_v1");
      let list: AvailableBand[] = [];
      if (saved) {
        try { list = JSON.parse(saved); } catch (err) { console.error(err); }
      }
      
      const processedGenres = formData.genre
        ? formData.genre.split(",").map(g => g.trim()).filter(g => g.length > 0)
        : ["Rock"];

      const newBand: AvailableBand = {
        id: `band-reg-${Date.now()}`,
        name: formData.name.trim(),
        genres: processedGenres,
        city: formData.city.trim(),
        bio: formData.bio || "Indie music makers excited to perform on brand new stages.",
        contactEmail: normalizedEmail,
        contactPhone: formData.contactPhone || "Inquire",
        website: formData.website || undefined,
        epkUrl: epkUrl || undefined,
        musicUrl: musicUrl || undefined,
        experienceLevel: formData.experienceLevel,
        password: formData.password
      };

      // Register with backend server endpoint
      try {
        fetch("/api/bands/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ band: newBand })
        }).catch(() => {});
      } catch (_) {}

      const updatedBands = [newBand, ...list.filter(b => b.name.toLowerCase() !== newBand.name.toLowerCase() && normalizeEmail(b.contactEmail) !== normalizedEmail)];
      localStorage.setItem("custom_available_bands_v1", JSON.stringify(updatedBands));
    }

    onRegisterAccount(payload);
    recordLiveSignup(payload);
    setRegisteredSuccessAccount(payload);
    setSuccessMessage(`Welcome! Your free ${accountType} account for "${payload.name}" was successfully registered and listed.`);
    
    // Reset form
    setFormData({
      name: "",
      city: "",
      contactEmail: "",
      password: "",
      genre: "",
      bio: "",
      capacity: 150,
      address: "",
      contactPhone: "",
      website: "",
      epkOrMusicUrl: "",
      experienceLevel: "Local",
      hasPA: true,
      hasLighting: true
    });

    setTimeout(() => {
      setSuccessMessage("");
    }, 5000);
  };

  return (
    <div className="space-y-10 animate-fade-in" id="homepage-dashboard">
      
      {/* Dynamic Success Alert Banner */}
      {successMessage && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 text-emerald-950 text-xs font-bold flex items-center gap-3 shadow-md" id="home-alert-success">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 bg-emerald-150 p-0.5 rounded-full" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Hero Welcome Panel */}
      <section className="relative overflow-hidden bg-slate-950 text-white rounded-3xl p-8 md:p-12 border border-slate-900 shadow-2xl flex flex-col lg:flex-row items-center gap-8 justify-between" id="home-hero-panel">
        <div className="space-y-4 max-w-2xl text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 text-[11px] font-extrabold py-1.5 px-3.5 rounded-full border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            Ultimate Live Music Stage Director 
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Connecting Rising Performers & Music Venues
          </h1>
          <p className="text-xs md:text-sm text-slate-350 leading-relaxed max-w-xl">
            Find music venues for free, calculate AI tour routes with drive times & Google Maps, create professional stage plots, band riders & posters instantly.
          </p>
          
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
            <button
              onClick={() => onSelectTab("venues")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black py-3 px-5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg"
            >
              Browse Venues (Free)
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSelectTab("bands")}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-black py-3 px-5 rounded-xl transition-all border border-slate-800 cursor-pointer flex items-center gap-2"
              id="hero-btn-browse-bands"
            >
              <Users className="w-4 h-4 text-amber-400" />
              Browse Active Bands (Premium)
            </button>
          </div>
        </div>

        {/* Dynamic Account Visual Block on Hero */}
        <div className="w-full lg:w-80 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg text-xs" id="quick-status-widget">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="font-bold text-slate-400">Current Status</span>
            <span className={`px-2 py-0.5 rounded-[4px] uppercase font-black text-[9px] ${
              currentAccount ? "bg-amber-500/20 text-amber-200 border border-amber-500/40" : "bg-slate-800 text-slate-400"
            }`}>
              {currentAccount ? currentAccount.type : "Guest Account"}
            </span>
          </div>

          {currentAccount ? (
            <div className="space-y-3" id="logged-in-spec-sheet">
              <div>
                <p className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  {currentAccount.type === "Band" ? <Users className="w-4 h-4 text-indigo-400" /> : <Building className="w-4 h-4 text-emerald-400" />}
                  {currentAccount.name}
                </p>
                <p className="text-gray-400 text-[11px] mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-500" />
                  {currentAccount.city}
                </p>
              </div>

              {currentAccount.type === "Band" && (() => {
                const musicInfo = resolveBandMusicLinks(currentAccount);
                return (
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Band Audio:</span>
                      {musicInfo.hasMusic && musicInfo.listenUrl ? (
                        <a
                          href={musicInfo.listenUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <Headphones className="w-3 h-3" />
                          <span>Listen ({musicInfo.platformLabel})</span>
                          <ExternalLink className="w-2.5 h-2.5 text-emerald-400" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Not listed</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-900">
                      <span className="text-slate-400">Press Kit:</span>
                      {musicInfo.hasEpk && musicInfo.epkUrl ? (
                        <a
                          href={musicInfo.epkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-bold"
                        >
                          <FileText className="w-3 h-3" />
                          <span>View EPK</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Not listed</span>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="bg-slate-950 p-3 rounded-lg space-y-2 border border-slate-800">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-slate-400">30-Day Access Pass:</span>
                  <span className={`font-black uppercase py-0.5 px-1.5 rounded text-[10px] ${
                    activeAccess 
                      ? "text-emerald-400 bg-emerald-400/10 border border-emerald-500/20" 
                      : accessDetails.isExpired 
                      ? "text-rose-400 bg-rose-400/10 border border-rose-500/20" 
                      : "text-amber-400 bg-amber-400/10 border border-amber-500/20"
                  }`}>
                    {activeAccess 
                      ? `🟢 Active (${accessDetails.remainingDays}d)` 
                      : accessDetails.isExpired 
                      ? "🔒 Expired" 
                      : "🔒 Locked"}
                  </span>
                </div>
                
                {/* Specific features state description */}
                <p className="text-[10px] text-gray-400 leading-normal">
                  {activeAccess 
                    ? `✓ Full Band Contacts, EPKs & Listen links unlocked. ${currentAccount?.autoRenew ? "Auto-renewal enabled." : "Pass expires in " + accessDetails.remainingDays + " days."}`
                    : "✓ 30-Day Pass ($9.99) to unlock unmasked booking emails, EPK, and Listen links across all 1600+ live bands (+$0.84 fee at checkout)."
                  }
                </p>
              </div>

              <div className="space-y-2 pt-1" id="act-control-buttons">
                {onTriggerEditAccount && (
                  <button
                    type="button"
                    onClick={onTriggerEditAccount}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-sm text-xs transition-all"
                    id="btn-quick-status-edit-account"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Edit Account & Page Info</span>
                  </button>
                )}

                {currentAccount?.contactEmail?.trim().toLowerCase() === "littlerusty@gmail.com" && (
                  <button
                    type="button"
                    onClick={() => onSelectTab("admin")}
                    className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-98 text-slate-950 font-black py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-md text-xs transition-all border border-amber-300 ring-2 ring-amber-400/30"
                    id="btn-owner-dashboard-shortcut"
                  >
                    <span className="text-sm">👑</span>
                    <span>Open Owner Analytics Dashboard</span>
                  </button>
                )}

                {!activeAccess ? (
                  <button
                    type="button"
                    onClick={() => setShowPayPalModal(true)}
                    className="w-full bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-black py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-md text-xs transition-all"
                    id="btn-quick-status-unlock"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{accessDetails.isExpired ? "Renew 30-Day Pass ($9.99)" : "Unlock 30-Day Pass ($9.99)"}</span>
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPayPalModal(true)}
                      className="w-full bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 font-bold py-2 rounded-lg text-center cursor-pointer text-[11px] transition-all flex items-center justify-center gap-1"
                      id="btn-extend-pass"
                    >
                      <Clock className="w-3 h-3 text-emerald-400" />
                      <span>All Access Contacts ($9.99 / 30 Days)</span>
                    </button>
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={onLogOut}
                  className="w-full bg-slate-800/30 hover:bg-slate-800 text-rose-300 hover:text-rose-400 text-[10px] font-bold py-1.5 rounded-md flex items-center justify-center gap-1 cursor-pointer transition-all border border-slate-800/60"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Log Out Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-1 text-center" id="guest-helper-widget">
              <UserCheck className="w-8 h-8 text-indigo-400 mx-auto" id="guest-icon" />
              <p className="font-bold text-gray-250" id="guest-title">No Profile Selected</p>
              <p className="text-gray-400 text-[10px] leading-relaxed" id="guest-desc">
                Create a free Band or Venue account below to list your group and interact with bookings.
              </p>
              <div className="flex flex-col gap-2 pt-1" id="guest-actions">
                <a 
                  href="#registration-block" 
                  className="inline-block text-indigo-400 hover:underline font-extrabold text-[11px]"
                  id="link-register-banner"
                >
                  Register Free Now ↓
                </a>
                <div className="border-t border-slate-800/80 my-1" id="guest-divider" />
                
                {!showUserLoginForm ? (
                  <button
                    type="button"
                    onClick={() => setShowUserLoginForm(true)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-md text-[11px] transition-all border border-slate-705"
                    id="btn-user-login-trigger"
                  >
                    <LogIn className="w-3.5 h-3.5 text-indigo-400" />
                    Login for Users
                  </button>
                ) : (
                  <div className="text-left space-y-2 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800" id="user-login-inline-form">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-indigo-400 pb-1 border-b border-slate-800/60">
                      <span>User Account Sign In</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          setShowUserLoginForm(false);
                          setLoginError("");
                        }}
                        className="text-gray-400 hover:text-white font-bold cursor-pointer text-[10px]"
                      >
                        ✕ Close
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => {
                          setLoginEmail(e.target.value);
                          setLoginError("");
                        }}
                        placeholder="e.g. littlerusty@gmail.com"
                        className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-550"
                        id="user-login-email-input"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1">
                          <span>Password</span>
                          <span className="text-[7.5px] text-indigo-400 lowercase italic font-normal">(min 4)</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotPasswordEmail(loginEmail);
                            setShowForgotPassword(true);
                            setShowUserLoginForm(false);
                          }}
                          className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer flex items-center gap-0.5 transition-colors"
                          id="btn-trigger-forgot-password"
                        >
                          <KeyRound className="w-2.5 h-2.5" />
                          <span>Forgot password?</span>
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showLoginPasswordText ? "text" : "password"}
                          value={loginPassword}
                          onChange={(e) => {
                            setLoginPassword(e.target.value);
                            setLoginError("");
                          }}
                          placeholder="••••••••"
                          className="w-full p-2 pr-8 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-550"
                          id="user-login-password-input"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPasswordText(!showLoginPasswordText)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                          tabIndex={-1}
                        >
                          {showLoginPasswordText ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1" id="role-select-login-row">
                      <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">
                        Role Type:
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setLoginRole("Band")}
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded transition-all cursor-pointer ${
                            loginRole === "Band" 
                              ? "bg-indigo-600 text-white font-black shadow-xs" 
                              : "bg-slate-900 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Band Rep
                        </button>
                        <button
                          type="button"
                          onClick={() => setLoginRole("Venue")}
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded transition-all cursor-pointer ${
                            loginRole === "Venue" 
                              ? "bg-emerald-600 text-white font-black shadow-xs" 
                              : "bg-slate-900 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Venue Booker
                        </button>
                      </div>
                    </div>

                    {/* Prepopulated user presets for testing convenience */}
                    <div className="space-y-1 pt-1.5 border-t border-slate-800/80">
                      <span className="block text-[8px] text-slate-500 uppercase tracking-widest leading-none font-bold">
                        💡 Click preset text to quick-paste:
                      </span>
                      <div className="flex flex-col gap-1 pt-1 text-[8.5px]">
                        <button
                          type="button"
                          onClick={() => {
                            setLoginEmail("littlerusty@gmail.com");
                            setLoginRole("Band");
                            setLoginPassword("password");
                          }}
                          className="w-full text-left bg-indigo-950/40 text-indigo-300 hover:bg-slate-900 px-1.5 py-0.5 rounded border border-indigo-950/30 font-bold flex justify-between"
                        >
                          <span>Dr Hadit</span>
                          <span className="text-[8px] text-indigo-400">Band Demo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLoginEmail("velocitybooking@northwestdiy.org");
                            setLoginRole("Band");
                            setLoginPassword("password");
                          }}
                          className="w-full text-left bg-slate-900 text-slate-300 hover:bg-slate-800 px-1.5 py-0.5 rounded hover:text-white flex justify-between"
                        >
                          <span>Silent Velocity</span>
                          <span className="text-[8px] text-slate-400">Free Band</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLoginEmail("booking@crocodile.com");
                            setLoginRole("Venue");
                            setLoginPassword("password");
                          }}
                          className="w-full text-left bg-emerald-950/40 text-emerald-300 hover:bg-slate-900 px-1.5 py-0.5 rounded border border-emerald-950/30 font-bold flex justify-between"
                        >
                          <span>The Crocodile</span>
                          <span className="text-[8px] text-emerald-400 font-bold">Venue Demo</span>
                        </button>
                      </div>
                    </div>

                    {/* Anti-Bot Captcha Security Challenge */}
                    <div className="pt-1">
                      <CaptchaChallenge
                        onVerified={(valid) => {
                          setIsLoginCaptchaVerified(valid);
                          if (valid) setLoginError("");
                        }}
                        idPrefix="login-user"
                        theme="dark"
                      />
                    </div>

                    {loginError && (
                      <p className="text-[9px] text-rose-400 font-bold italic leading-none">{loginError}</p>
                    )}

                    <button
                      type="button"
                      onClick={handleUserLogin}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2 rounded-lg text-[11px] cursor-pointer flex items-center justify-center gap-1 shadow-md transition-all mt-1"
                      id="btn-execute-user-login"
                    >
                      <LogIn className="w-3 h-3" />
                      Sign In Account
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Registration Confirmation Modal */}
      {registeredSuccessAccount && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs" id="registration-success-overlay">
          <div className="bg-white rounded-3xl border border-gray-100 max-w-lg w-full p-6 md:p-8 space-y-5 shadow-2xl relative animate-scale-up" id="registration-success-dialog">
            <button 
              onClick={() => setRegisteredSuccessAccount(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="bg-emerald-100 text-emerald-700 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-9 h-9 text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {registeredSuccessAccount.type === "Band" ? "Band Successfully Registered! 🎉" : "Venue Successfully Registered! 🎉"}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
                Welcome, <strong className="text-slate-800">{registeredSuccessAccount.name}</strong>. Your profile is now saved and active in the directory.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-700 pb-2 border-b border-gray-200">
                <span className="text-gray-500 font-semibold">Registered Entity:</span>
                <span className="font-extrabold text-slate-900">{registeredSuccessAccount.name} ({registeredSuccessAccount.city})</span>
              </div>
              <div className="flex justify-between items-center text-slate-700 pb-2 border-b border-gray-200">
                <span className="text-gray-500 font-semibold">Account Tier:</span>
                <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Free Account Active
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="text-gray-500 font-semibold">Booking Email:</span>
                <span className="font-mono text-slate-900 font-bold">{registeredSuccessAccount.contactEmail}</span>
              </div>
              {registeredSuccessAccount.type === "Band" && (() => {
                const musicInfo = resolveBandMusicLinks(registeredSuccessAccount);
                return (
                  <div className="flex justify-between items-center text-slate-700 pt-2 border-t border-gray-200">
                    <span className="text-gray-500 font-semibold">Music / EPK:</span>
                    {musicInfo.hasMusic && musicInfo.listenUrl ? (
                      <a
                        href={musicInfo.listenUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-emerald-700 font-black bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded text-xs transition-colors"
                      >
                        <Headphones className="w-3.5 h-3.5" />
                        <span>Listen ({musicInfo.platformLabel})</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : musicInfo.hasEpk && musicInfo.epkUrl ? (
                      <a
                        href={musicInfo.epkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-indigo-700 font-black bg-indigo-100 hover:bg-indigo-200 px-2.5 py-1 rounded text-xs transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View EPK</span>
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Not listed</span>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="space-y-2 text-xs text-gray-600 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              <h4 className="font-black text-indigo-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                What's Unlocked On Your Free Account:
              </h4>
              <ul className="space-y-1.5 pl-1 pt-1 text-[11.5px]">
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>100% Free West Coast Venue Directory:</strong> Access all venue addresses, capacities, and booking emails.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Stage Plot & Tech Rider Sync:</strong> Your band details automatically populate the stage plot and rider builders.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Band-to-Band Contacts:</strong> Other band booking contacts remain protected/blurred for free accounts (upgrade to $9.99/mo anytime).</span>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRegisteredSuccessAccount(null);
                  onSelectTab("venues");
                }}
                className="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5" />
                Browse Venues (Free)
              </button>
              <button
                type="button"
                onClick={() => {
                  setRegisteredSuccessAccount(null);
                  onSelectTab("bands");
                }}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5 text-slate-600" />
                View Band Directory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* The Three Core Features Grid - Labeled EXACTLY as requested */}
      <section className="space-y-4" id="home-featured-matrix-section">
        <div className="text-center md:text-left">
          <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600">Our Suite Directives</h3>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">Explore Professional Stage Utilities</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="four-core-elements-row">
          
          {/* Element 1: responsive stage arrangement */}
          <div 
            onClick={() => onSelectTab("plot")}
            className="group bg-white rounded-2xl border border-gray-100 hover:border-orange-200 p-6 space-y-4 transition-all hover:shadow-md cursor-pointer block relative overflow-hidden" 
            id="element-responsive-stage"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -z-10 group-hover:bg-orange-100 transition-all" />
            <div className="bg-orange-500 text-white p-3 rounded-xl w-12 h-12 flex items-center justify-center shadow-xs">
              <Sliders className="w-5.5 h-5.5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-orange-600 font-mono">Stage Layout canvas</p>
              <h3 className="text-base font-black text-slate-900 mt-1 capitalize group-hover:text-indigo-600 transition-all">
                Stage Plot Designer
              </h3>
              <p className="text-xs text-gray-500 mt-2.5 leading-relaxed">
                Map interactive equipment positions—drum modules, monitor wedges, key boards, and mic booms.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-orange-600 flex items-center gap-1 group-hover:translate-x-1 transition-all">
              Launch Plot Designer <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Element 2: professional tech delivery */}
          <div 
            onClick={() => onSelectTab("rider")}
            className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-200 p-6 space-y-4 transition-all hover:shadow-md cursor-pointer block relative overflow-hidden" 
            id="element-professional-tech"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-10 group-hover:bg-blue-100 transition-all" />
            <div className="bg-blue-600 text-white p-3 rounded-xl w-12 h-12 flex items-center justify-center shadow-xs">
              <FileText className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[10px] uppercase font-black tracking-widest text-blue-600 font-mono">Patch list & ascii</p>
                <span className="bg-blue-100 text-blue-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md">Beginner Friendly</span>
              </div>
              <h3 className="text-base font-black text-slate-900 mt-1 capitalize group-hover:text-indigo-600 transition-all">
                Tech Rider Builder
              </h3>
              <p className="text-xs text-gray-500 mt-2.5 leading-relaxed">
                Compile dynamic channels, mic choices, active +48V phantom switches, and export formatted tech riders. Beginner Friendly.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-blue-700 flex items-center gap-1 group-hover:translate-x-1 transition-all">
              Make Tech Rider <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Element 3: distinguished promo poster layouts */}
          <div 
            onClick={() => onSelectTab("poster")}
            className="group bg-white rounded-2xl border border-gray-100 hover:border-emerald-200 p-6 space-y-4 transition-all hover:shadow-md cursor-pointer block relative overflow-hidden" 
            id="element-promo-poster"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10 group-hover:bg-emerald-100 transition-all" />
            <div className="bg-emerald-600 text-white p-3 rounded-xl w-12 h-12 flex items-center justify-center shadow-xs">
              <Image className="w-5.5 h-5.5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-emerald-600 font-mono">Flyers & Promotion</p>
              <h3 className="text-base font-black text-slate-900 mt-1 capitalize group-hover:text-indigo-600 transition-all">
                Concert Poster Designer
              </h3>
              <p className="text-xs text-gray-500 mt-2.5 leading-relaxed">
                Design vintage and modern gig flyers with retro themes, ticket stamps, and AI promo taglines.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-all">
              Open Flyer Editor <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Element 4: Smart Tour Planner */}
          <div 
            onClick={() => onSelectTab("tour")}
            className="group bg-white rounded-2xl border border-gray-100 hover:border-rose-200 p-6 space-y-4 transition-all hover:shadow-md cursor-pointer block relative overflow-hidden" 
            id="element-ai-tour-scheduler"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -z-10 group-hover:bg-rose-100 transition-all" />
            <div className="bg-rose-600 text-white p-3 rounded-xl w-12 h-12 flex items-center justify-center shadow-xs">
              <Compass className="w-5.5 h-5.5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-rose-600 font-mono">Smart Tour Planner</p>
              <h3 className="text-base font-black text-slate-900 mt-1 capitalize group-hover:text-indigo-600 transition-all">
                Smart Tour Planner
              </h3>
              <p className="text-xs text-gray-500 mt-2.5 leading-relaxed">
                Calculate drive times, corridor stop cities, band-friendly lodging options, gas estimates, and bookable venues along the way using Google Maps.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-rose-600 flex items-center gap-1 group-hover:translate-x-1 transition-all">
              Plan Tour Route <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

        </div>
      </section>

      {/* Account Type Tier Information */}
      <section className="bg-slate-100/80 rounded-2xl p-6 md:p-8 border border-gray-200/50" id="tiers-comparer-block">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Access & Pricing</h3>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              Access to Venues - FREE<br />Access to Band Contacts - $9.99 / 30-Day Pass
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed max-w-lg mx-auto">
              Venues and tour planning tools are 100% free for bands. Get a 30-day all-access pass for $9.99 (adds $0.84 transaction fee at checkout) to unlock full direct booking contacts for all bands.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4" id="role-tiers-selector">
            
            {/* Free Core Features Box */}
            <div className="bg-white rounded-xl border border-gray-200/70 p-6 space-y-4 shadow-xs">
              <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                <span className="font-black text-slate-900 uppercase text-xs flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-emerald-600" />
                  Free Features & Venues
                </span>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 py-0.5 px-2 rounded-full border border-emerald-100">
                  100% Free
                </span>
              </div>
              <ul className="space-y-2 text-xs text-gray-650">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span>Browse all music venues across the West Coast with complete addresses and booking emails</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span>Smart Tour Planner with drive times, lodging finder, and Google Maps routing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span>Full access to Stage Plot Designer, Tech Rider Builder & Poster Designer</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span>Register your band or venue profile in the public directory</span>
                </li>
              </ul>
            </div>

            {/* Band Directory Contacts Access Box */}
            <div className="bg-white rounded-xl border border-gray-200/70 p-6 space-y-4 shadow-xs">
              <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                <span className="font-black text-slate-900 uppercase text-xs flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-500" />
                  Band Contacts Subscription
                </span>
                <span className="text-[10px] font-black text-amber-800 bg-amber-50 py-0.5 px-2 rounded-full border border-amber-200">
                  $9.99 / 30 Days
                </span>
              </div>
              <ul className="space-y-2 text-xs text-gray-650">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span>Unlock all booking emails and official contacts for 1,300+ West Coast bands</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span>Direct co-bill inquiries and shared gig coordination</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span>Filtered genre & city search across BC, WA, OR, and CA artists</span>
                </li>
                <li className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-lg text-[11px] text-amber-950 font-medium flex items-center justify-between">
                  <span><strong>30-Day Access:</strong> $9.99 Pass (+$0.84 fee at checkout)</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentAccount) {
                        setShowCheckoutModal(true);
                      } else {
                        document.getElementById("registration-block")?.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-2.5 py-1 rounded text-[10px] cursor-pointer"
                  >
                    Unlock ($9.99)
                  </button>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* User Registration Form Block - Free Accounts creation */}
      {!currentAccount && (
        <section className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm space-y-6 scroll-mt-20" id="registration-block">
          <div className="text-center space-y-1">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Create Free Account Profile</h2>
            <p className="text-xs text-gray-400">
              Pick your correct role below to get instantly integrated into the West Coast co-bill network.
            </p>
          </div>

          <div className="flex items-center justify-center p-1 bg-slate-100 rounded-xl max-w-sm mx-auto" id="form-role-selectors">
            <button
              type="button"
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                accountType === "Band" ? "bg-white text-indigo-700 shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
              onClick={() => {
                setAccountType("Band");
                setRegisterError("");
              }}
            >
              <Users className="w-3.5 h-3.5" />
              Band Representative
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                accountType === "Venue" ? "bg-white text-emerald-700 shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
              onClick={() => {
                setAccountType("Venue");
                setRegisterError("");
              }}
            >
              <Building className="w-3.5 h-3.5" />
              Venue Owner / Booker
            </button>
          </div>

          {registerError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5 max-w-2xl mx-auto shadow-xs" id="registration-error-banner">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Registration Alert</p>
                <p className="text-rose-600 mt-0.5">{registerError}</p>
              </div>
              <button
                type="button"
                onClick={() => setRegisterError("")}
                className="text-rose-400 hover:text-rose-700 p-0.5 cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={handleRegister} autoComplete="off" className="max-w-2xl mx-auto space-y-4 text-xs" id="register-raw-form">
            {accountType === "Venue" ? (
              /* Venue Owner / Booker Profile Questions - Matching VenueDirectory.tsx */
              <div className="space-y-4" id="venue-form-fields-container">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Venue Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="E.g., Starry Heavens lounge"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Max Capacity Audience <span className="text-rose-500">*</span></label>
                    <input
                      type="number"
                      required
                      placeholder="E.g., 200"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) || 0 })}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">City & State <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="E.g., Seattle, WA"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Vibe/Genres <span className="text-gray-400 font-normal">(Comma separated tags)</span></label>
                    <input
                      type="text"
                      placeholder="E.g., Alternative Rock, Folk, Acoustic"
                      value={formData.genre}
                      onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-5">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.hasPA}
                        onChange={(e) => setFormData({ ...formData, hasPA: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                      />
                      Has house PA System
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.hasLighting}
                        onChange={(e) => setFormData({ ...formData, hasLighting: e.target.checked })}
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
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[70px] bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Booking Email <span className="text-rose-500">*</span></label>
                    <input
                      type="email"
                      required
                      autoComplete="off"
                      placeholder="E.g., bookings@myvenue.com"
                      value={formData.contactEmail}
                      onChange={(e) => {
                        setFormData({ ...formData, contactEmail: e.target.value });
                        if (registerError) setRegisterError("");
                      }}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Account Password <span className="text-rose-500">*</span></label>
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      placeholder="Min 4 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="E.g., (206) 555-9000"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Official Website</label>
                    <input
                      type="text"
                      placeholder="E.g., www.myvenue.com"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Band Representative Profile Questions - Matching BandDirectory.tsx */
              <div className="space-y-4" id="band-form-fields-container">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Band Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="E.g., Lunar Reverberator"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Genres <span className="text-gray-400 font-normal">(Comma separated)</span></label>
                    <input
                      type="text"
                      placeholder="E.g., Grunge, Punk, Alternative Rock"
                      value={formData.genre}
                      onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px] bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Booking Email <span className="text-rose-500">*</span></label>
                    <input
                      type="email"
                      required
                      autoComplete="off"
                      placeholder="E.g., contact@lunarband.com"
                      value={formData.contactEmail}
                      onChange={(e) => {
                        setFormData({ ...formData, contactEmail: e.target.value });
                        if (registerError) setRegisterError("");
                      }}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Account Password <span className="text-rose-500">*</span></label>
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      placeholder="Min 4 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="E.g., (206) 555-0199"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Official Website</label>
                    <input
                      type="text"
                      placeholder="E.g., www.lunarband.com"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-gray-700 font-bold mb-1">
                    EPK or Music Link <span className="text-gray-400 font-normal text-xs">(Bandcamp, Spotify, SoundCloud, or EPK)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="E.g., https://yourband.bandcamp.com or Spotify artist link"
                    value={formData.epkOrMusicUrl}
                    onChange={(e) => setFormData({ ...formData, epkOrMusicUrl: e.target.value })}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Add your Electronic Press Kit (EPK) or online music link. This enables the prominent "Listen" button and EPK link on your public band profile.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-4 text-center" id="register-btn-wrap">
              <button
                type="submit"
                className="w-full sm:w-auto py-3.5 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md cursor-pointer transition-all border-0 text-sm inline-flex items-center justify-center gap-2"
                id="btn-confirm-registration"
              >
                <span>Register Free {accountType === "Band" ? "Band" : "Venue"} Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Integrated PayPal 30-Day Venue Pass Gate Modal */}
      <PayPalAccessModal
        isOpen={showPayPalModal || showCheckoutModal}
        onClose={() => {
          setShowPayPalModal(false);
          setShowCheckoutModal(false);
        }}
        currentAccount={currentAccount || null}
        onPaymentSuccess={(updatedAccount) => {
          if (onUpdateAccount) {
            onUpdateAccount(updatedAccount);
          } else {
            onUpdatePricing(true);
          }
          setShowPayPalModal(false);
          setShowCheckoutModal(false);
          setSuccessMessage("✅ Payment Successful! Full contact information is unlocked for 30 days.");
          setTimeout(() => setSuccessMessage(""), 5000);
        }}
      />

      {/* Integrated Forgot / Reset Password Flow Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => {
          setShowForgotPassword(false);
          setForgotPasswordToken("");
          // Clear any hash if we were on reset-password
          if (window.location.hash.includes("reset-password")) {
            window.location.hash = "";
          }
        }}
        onBackToLogin={() => {
          setShowForgotPassword(false);
          setForgotPasswordToken("");
          setShowUserLoginForm(true);
          if (window.location.hash.includes("reset-password")) {
            window.location.hash = "";
          }
        }}
        initialEmail={forgotPasswordEmail}
        initialToken={forgotPasswordToken}
        onPasswordResetSuccess={(updatedEmail) => {
          setLoginEmail(updatedEmail);
          setLoginPassword("");
          setSuccessMessage(`Password updated successfully for ${updatedEmail}! Please log in with your new password.`);
          setTimeout(() => setSuccessMessage(""), 6000);
        }}
      />
    </div>
  );
}
