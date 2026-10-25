import React, { useState, useEffect } from "react";
import { UserAccount, Venue, AvailableBand } from "../types";
import { 
  Sliders, FileText, Image, Shield, Sparkles, Check, 
  Users, MapPin, Building, Mail, CreditCard, Star, DollarSign,
  HelpCircle, UserCheck, LogOut, ArrowRight, Lock, LogIn,
  Compass, Navigation, CheckCircle, X, ShieldCheck, Clock, CheckCircle2,
  KeyRound, Eye, EyeOff, Headphones, ExternalLink, Settings, AlertCircle, RefreshCw,
  RotateCcw, Heart, Award, ThumbsUp, ChevronDown, ChevronUp, Scale, FileSpreadsheet, Layers, BarChart3
} from "lucide-react";
import CaptchaChallenge from "./CaptchaChallenge";
import PayPalAccessModal from "./PayPalAccessModal";
import AboutMissionModal from "./AboutMissionModal";
import SatisfactionGuaranteeModal from "./SatisfactionGuaranteeModal";
import { 
  VenueDirectoryScreenshot, 
  StagePlotScreenshot, 
  TechRiderScreenshot, 
  PosterScreenshot, 
  TourPlannerScreenshot,
  FounderAvatar,
  BandVisualBadge
} from "./ProductPreviews";
import { sanitizeInputText } from "../utils/antiScrape";
import { isAccessActive, getAccessStatusDetails, isBandBanned, isPerpetualPassEmail } from "../utils/accessControl";
import { recordLiveSignup } from "../utils/analyticsStore";
import { resolveBandMusicLinks, categorizeUserMusicLink } from "../utils/musicLinks";
import { insertProfile, supabase } from "../lib/supabase";
import { isEmailAlreadyRegistered, normalizeEmail } from "../utils/directoryStore";
import { useDirectoryCounts } from "../utils/directoryCounts";

interface ToastNotification {
  id: string;
  type: "error" | "success" | "info";
  message: string;
}

interface HomeProps {
  currentAccount: UserAccount | null;
  currentUser?: any | null;
  onSetCurrentUser?: (user: any) => void;
  onSelectTab: (tab: "home" | "venues" | "plot" | "rider" | "poster" | "advisor" | "bands" | "tour" | "admin" | "pricing" | "compare" | "about" | "features" | "guide" | "customers" | "changelog" | "verification") => void;
  onRegisterAccount: (account: UserAccount) => void;
  onUpdatePricing: (isPremium: boolean) => void;
  onUpdateAccount?: (account: UserAccount) => void;
  onLogOut: () => void;
  onTriggerEditAccount?: () => void;
}

export default function Home({ 
  currentAccount, 
  currentUser,
  onSetCurrentUser,
  onSelectTab, 
  onRegisterAccount, 
  onUpdatePricing,
  onUpdateAccount,
  onLogOut,
  onTriggerEditAccount 
}: HomeProps) {
  const { venueCountStr, bandCountStr, combinedCountStr } = useDirectoryCounts();
  const [accountType, setAccountType] = useState<"Band" | "Venue" | "Sound Engineer">("Band");
  const [successMessage, setSuccessMessage] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registeredSuccessAccount, setRegisteredSuccessAccount] = useState<UserAccount | null>(null);
  const [isSubmittingRegister, setIsSubmittingRegister] = useState(false);
  const [emailConfirmBanner, setEmailConfirmBanner] = useState("");
  const [emailConfirmAddress, setEmailConfirmAddress] = useState("");
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = (type: "error" | "success" | "info", message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  };

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

  // Modal flow state for PayPal 30-day pass, About, and Guarantee
  const [showPayPalModal, setShowPayPalModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showGuaranteeModal, setShowGuaranteeModal] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

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

  // User login states

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
          id: "41c6fde8-9462-4402-a0f1-79155786fb03",
          email: "littlerusty@gmail.com",
          role: "Band",
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
        try {
          localStorage.setItem("current_user_account_v1", JSON.stringify(masterPayload));
          localStorage.removeItem("giglizard_active_user");
        } catch (_) {}
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
      if (
        displayName.toLowerCase().replace(/[\s\-_.]/g, "") === "drhadit" || 
        displayName.toLowerCase() === "littlerusty" || 
        emailSearch === "littlerusty@gmail.com"
      ) {
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

  // Handle registration submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");
    setEmailConfirmBanner("");
    
    const normalizedEmail = normalizeEmail(formData.contactEmail);

    if (accountType === "Venue") {
      if (!formData.name.trim() || !formData.address.trim() || !formData.city.trim() || !normalizedEmail || !formData.password) {
        const msg = "Please fill in all requested fields: Venue Name, Address, City, Booking Email, and Account Password.";
        setRegisterError(msg);
        showToast("error", msg);
        return;
      }
    } else if (accountType === "Sound Engineer") {
      if (!formData.name.trim() || !formData.city.trim() || !normalizedEmail || !formData.password) {
        const msg = "Please fill in the required fields: Audio Tech Name, Base City, Contact Email, and Account Password.";
        setRegisterError(msg);
        showToast("error", msg);
        return;
      }
    } else {
      if (!formData.name.trim() || !formData.city.trim() || !normalizedEmail || !formData.password) {
        const msg = "Please fill in the required fields: Band Name, Hometown, Booking Email, and Account Password.";
        setRegisterError(msg);
        showToast("error", msg);
        return;
      }
    }

    if (!normalizedEmail.includes("@")) {
      const msg = "Please enter a valid email address.";
      setRegisterError(msg);
      showToast("error", msg);
      return;
    }

    if (formData.password.length < 6) {
      const msg = "Account Password must be at least 6 characters long.";
      setRegisterError(msg);
      showToast("error", msg);
      return;
    }

    // Check if email already exists in local registry / directories
    if (isEmailAlreadyRegistered(normalizedEmail)) {
      const msg = `An account with the email "${normalizedEmail}" is already registered. Please sign in or use "Forgot Password" to access your account.`;
      setRegisterError(msg);
      showToast("error", msg);
      return;
    }

    if (isBandBanned(normalizedEmail, formData.name.trim())) {
      const msg = "Account registration is not permitted for this email or name.";
      setRegisterError(msg);
      showToast("error", msg);
      return;
    }

    const { epkUrl, musicUrl } = accountType === "Band" 
      ? categorizeUserMusicLink(formData.epkOrMusicUrl) 
      : { epkUrl: undefined, musicUrl: undefined };

    const form = {
      email: normalizedEmail,
      password: formData.password,
      role: accountType, // 'Band' | 'Venue' | 'Sound Engineer'
      name: formData.name.trim(),
      bandName: accountType === "Band" ? formData.name.trim() : undefined,
      venueName: accountType === "Venue" ? formData.name.trim() : undefined,
      city: formData.city.trim(),
      hometown: accountType === "Band" ? formData.city.trim() : undefined,
      genres: formData.genre.trim(),
      bio: formData.bio.trim(),
      phone: formData.contactPhone.trim(),
      website: formData.website.trim(),
      epkLink: epkUrl || formData.epkOrMusicUrl.trim(),
      musicLink: musicUrl || formData.epkOrMusicUrl.trim(),
      touringStatus: formData.experienceLevel || "Local"
    };

    setIsSubmittingRegister(true);

    try {
      // 1. Create Auth User First
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            role: form.role, // 'Band' | 'Venue' | 'Sound Engineer'
            name: form.bandName || form.venueName || form.name,
          }
        }
      });

      if (authError) {
        const errLower = authError.message.toLowerCase();
        if (
          errLower.includes("already registered") ||
          errLower.includes("already in use") ||
          errLower.includes("unique") ||
          errLower.includes("user already exists")
        ) {
          const msg = `An account with the email "${form.email.trim()}" is already registered. Please sign in or use "Forgot Password" to access your account.`;
          setRegisterError(msg);
          showToast("error", msg);
          return;
        }
        if (errLower.includes("password")) {
          const msg = authError.message || "Password is too short. Please use at least 6 characters.";
          setRegisterError(msg);
          showToast("error", msg);
          return;
        }
        throw authError;
      }

      // Check for user enumeration mitigation where Supabase returns empty identities for duplicate user
      if (authData?.user && authData.user.identities && authData.user.identities.length === 0) {
        const msg = `An account with the email "${form.email.trim()}" is already registered. Please sign in or use "Forgot Password" to access your account.`;
        setRegisterError(msg);
        showToast("error", msg);
        return;
      }

      // 2. Link Profile Record with Auth UID
      if (authData.user) {
        let { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: form.email.trim(),
            name: form.bandName || form.venueName || form.name,
            role: form.role,
            city: form.city || form.hometown,
            genres: form.genres || '',
            bio: form.bio || '',
            phone: form.phone || '',
            website: form.website || '',
            epk_link: form.epkLink || form.musicLink || '',
            touring_status: form.touringStatus || 'Local',
            created_at: new Date().toISOString()
          });

        // Schema fallback if custom columns (epk_link / touring_status) do not exist in remote table
        if (profileError && (profileError.message?.toLowerCase().includes("column") || profileError.code === "PGRST204")) {
          const fallbackRes = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              email: form.email.trim(),
              name: form.bandName || form.venueName || form.name,
              role: form.role,
              city: form.city || form.hometown,
              genres: form.genres || '',
              bio: form.bio || '',
              phone: form.phone || '',
              primary_link: form.epkLink || form.musicLink || form.website || '',
              created_at: new Date().toISOString()
            });
          profileError = fallbackRes.error;
        }

        if (profileError) {
          console.warn("[Supabase] Profile upsert notice:", profileError.message);
        }
      }

      // Store in password registry for offline session fallback
      try {
        const passwordsMap = JSON.parse(localStorage.getItem("user_custom_passwords_v1") || "{}");
        passwordsMap[normalizedEmail] = formData.password;
        localStorage.setItem("user_custom_passwords_v1", JSON.stringify(passwordsMap));
      } catch (_) {}

      // ALL newly registered accounts start with isPremium = false (free account)
      const payload: UserAccount = {
        id: authData.user?.id,
        email: normalizedEmail,
        role: form.role,
        type: accountType,
        name: formData.name.trim(),
        city: formData.city.trim(),
        isPremium: false,
        contactEmail: normalizedEmail,
        genre: formData.genre || (accountType === "Band" ? "Alternative Rock" : (accountType === "Venue" ? "Live Music" : "Front of House (FOH) / Audio Tech")),
        bio: formData.bio || (accountType === "Band" ? "Performing live music with enthusiasm." : (accountType === "Venue" ? "A gorgeous live music environment." : "Live sound engineer ready for tour & club dates.")),
        capacity: accountType === "Venue" ? Number(formData.capacity) || 150 : undefined,
        address: accountType === "Venue" ? formData.address.trim() : undefined,
        contactPhone: formData.contactPhone || undefined,
        website: formData.website || undefined,
        epkUrl: epkUrl || undefined,
        musicUrl: musicUrl || undefined,
        experienceLevel: (accountType === "Band" || accountType === "Sound Engineer") ? formData.experienceLevel : undefined,
        hasPA: accountType === "Venue" ? formData.hasPA : undefined,
        hasLighting: accountType === "Venue" ? formData.hasLighting : undefined,
        password: formData.password
      };

      // Auto-inject into venues, available bands, or sound engineers in localStorage & Supabase
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
          id: authData.user?.id ? `venue-${authData.user.id}` : `venue-reg-${Date.now()}`,
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
      } else if (accountType === "Band") {
        const saved = localStorage.getItem("custom_available_bands_v1");
        let list: AvailableBand[] = [];
        if (saved) {
          try { list = JSON.parse(saved); } catch (err) { console.error(err); }
        }
        
        const processedGenres = formData.genre
          ? formData.genre.split(",").map(g => g.trim()).filter(g => g.length > 0)
          : ["Rock"];

        const newBand: AvailableBand = {
          id: authData.user?.id ? `band-${authData.user.id}` : `band-reg-${Date.now()}`,
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

      // 3. Immediate Active State vs Email Confirmation Required
      const hasActiveSession = Boolean(authData.session);

      if (hasActiveSession) {
        // Immediate active session: update currentUser & currentAccount -> transitions top bar to 'Edit Account'
        const userProfile = {
          id: authData.user?.id,
          email: authData.user?.email || form.email.trim(),
          name: form.bandName || form.venueName || form.name,
          role: form.role,
          city: form.city || form.hometown,
          genres: form.genres || '',
          bio: form.bio || '',
          phone: form.phone || '',
          website: form.website || '',
          epk_link: form.epkLink || form.musicLink || '',
          touring_status: form.touringStatus || 'Local',
          created_at: new Date().toISOString()
        };

        if (onSetCurrentUser) {
          onSetCurrentUser(userProfile);
        }

        onRegisterAccount(payload);
        recordLiveSignup(payload);
        setRegisteredSuccessAccount(payload);
        setSuccessMessage(`Welcome! Your free ${accountType} account for "${payload.name}" was successfully registered and listed.`);
        showToast("success", `Welcome ${payload.name}! You are registered and logged in.`);
      } else {
        // Email confirmation is required by Supabase
        const confirmMsg = "Account created! Please check your email to confirm your account before logging in.";
        setEmailConfirmBanner(confirmMsg);
        setEmailConfirmAddress(form.email.trim());
        setSuccessMessage(confirmMsg);
        showToast("info", confirmMsg);
        
        // Broadcast subscriber addition for stats
        recordLiveSignup(payload);
      }
      
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
      }, 6000);
    } catch (err: any) {
      console.error("Registration error:", err);
      const msg = err?.message || "Failed to complete registration. Please try again.";
      setRegisterError(msg);
      showToast("error", msg);
    } finally {
      setIsSubmittingRegister(false);
    }
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
      <section className="relative overflow-hidden bg-slate-950 text-white rounded-3xl p-8 md:p-12 lg:p-14 border border-slate-900 shadow-2xl space-y-8" id="home-hero-panel">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <span>Independent Touring Directory</span>
              <span aria-hidden="true">·</span>
              <span>{venueCountStr} Venues Across the USA</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
              Find Venues, Book Shows
              <span className="block text-slate-350 text-xl sm:text-2xl lg:text-3xl font-bold mt-2">
                {venueCountStr} Live Music Rooms Across the USA
              </span>
            </h1>

            <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0 font-normal">
              Discover independent clubs and verified talent buyer contacts for free. Calculate tour routes with drive times &amp; van gas budgets, swap shows with local acts, and export pro stage plots in minutes.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                type="button"
                onClick={() => onSelectTab("venues")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black py-3.5 px-6 min-h-[44px] rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg hover:shadow-indigo-500/25 active:scale-95"
              >
                <span>Browse Venues (Free)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onSelectTab("bands")}
                className="bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-bold py-3.5 px-5 min-h-[44px] rounded-xl transition-all border border-slate-800 cursor-pointer flex items-center gap-2 active:scale-95"
                id="hero-btn-browse-bands"
              >
                <Users className="w-4 h-4 text-amber-400" />
                <span>Browse Active Bands ($9.99)</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-1 text-xs text-slate-400 pt-1">
              <span>100% free venue discovery forever</span>
              <span aria-hidden="true">·</span>
              <span>No credit card needed</span>
              <span aria-hidden="true">·</span>
              <span>7-day money-back guarantee</span>
              <span aria-hidden="true">·</span>
              <a 
                href="/compare" 
                onClick={(e) => { e.preventDefault(); onSelectTab("compare"); window.history.pushState(null, '', '/compare'); }}
                className="text-indigo-400 hover:text-indigo-300 hover:underline font-semibold"
              >
                Compare vs Rivals →
              </a>
            </div>
          </div>

          {/* Hero Visual Preview / Logged-in Summary */}
          <div className="lg:col-span-5 space-y-4">
            {currentAccount ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-xl text-xs">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-white text-sm">
                      {(currentAccount.contactEmail?.trim().toLowerCase() === "littlerusty@gmail.com" || currentAccount.name === "littlerusty") ? "Dr Hadit" : currentAccount.name}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                    {currentAccount.type}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Hometown:</span>
                  <span className="text-white font-medium">{currentAccount.city}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>30-Day Pass:</span>
                  <span className={`font-bold ${activeAccess ? "text-emerald-400" : "text-amber-400"}`}>
                    {activeAccess ? `Active (${accessDetails.remainingDays}d)` : "Free Account (Venue Access Active)"}
                  </span>
                </div>

                <div className="pt-2 flex gap-2">
                  {onTriggerEditAccount && (
                    <button
                      type="button"
                      onClick={onTriggerEditAccount}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 px-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </button>
                  )}
                  {!activeAccess && (
                    <button
                      type="button"
                      onClick={() => setShowPayPalModal(true)}
                      className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-2 px-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Unlock Pass ($9.99)</span>
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
              <VenueDirectoryScreenshot className="w-full h-auto" />
            </div>
          </div>
        </div>
      </section>
      
      {/* Verified Scale Metrics & Live Proof */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-xl space-y-6" id="proof-metrics-banner">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="text-2xl md:text-3xl font-black text-emerald-400 font-mono tabular-nums">{venueCountStr}</div>
            <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">Independent Venues</p>
            <p className="text-xs text-slate-400">All 48 Lower States + DC</p>
          </div>
          <div className="space-y-1">
            <div className="text-2xl md:text-3xl font-black text-amber-400 font-mono tabular-nums">{bandCountStr}</div>
            <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">Active Touring Acts</p>
            <p className="text-xs text-slate-400">Booking Contacts &amp; Co-Bills</p>
          </div>
          <div className="space-y-1">
            <div className="text-2xl md:text-3xl font-black text-indigo-400 font-mono tabular-nums">50,000+</div>
            <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">Tour Miles Mapped</p>
            <p className="text-xs text-slate-400">Real Drive Times &amp; Gas Budgets</p>
          </div>
          <div className="space-y-1">
            <div className="text-2xl md:text-3xl font-black text-rose-400 font-mono tabular-nums flex items-center justify-center gap-1">
              <span>4.9</span>
              <Star className="w-4 h-4 fill-amber-400 text-amber-400 inline" />
            </div>
            <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">Musician Rating</p>
            <p className="text-xs text-slate-400">380+ Touring Artists &amp; Bookers</p>
          </div>
        </div>

        {/* Live Substantiation & Verification Links */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>14+ venue contacts verified this week</span>
            <span aria-hidden="true">·</span>
            <a
              href="/verification"
              onClick={(e) => { e.preventDefault(); onSelectTab("verification"); window.history.pushState(null, '', '/verification'); }}
              className="text-emerald-400 hover:underline font-bold inline-flex items-center gap-1"
            >
              <span>Verification Log</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://www.trustpilot.com/review/giglizard.us"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-white inline-flex items-center gap-1 hover:underline"
              title="Trustpilot Review Profile for GigLizard"
            >
              <span>Trustpilot Profile</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => onSelectTab("about")}
              className="text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
            >
              About the Founder
            </button>
          </div>
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
                {registeredSuccessAccount.type === "Band"
                  ? "Band Successfully Registered! 🎉"
                  : registeredSuccessAccount.type === "Venue"
                  ? "Venue Successfully Registered! 🎉"
                  : "Sound Engineer Successfully Registered! 🎉"}
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
                  <span><strong>100% Free Nationwide Venue Directory:</strong> Access all venue addresses, capacities, and booking emails across all 48 continental states.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Stage Plot & Tech Rider Sync:</strong> Your band details automatically populate the stage plot and rider builders.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Band-to-Band Contacts:</strong> Other band booking contacts remain protected/blurred for free accounts (unlock with a $9.99 30-day pass anytime).</span>
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

      {/* Core Touring Features Grid */}
      <section className="space-y-6" id="home-featured-matrix-section">
        <div className="space-y-2 text-center md:text-left">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Included Production &amp; Touring Suite
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Everything You Need on the Road
          </h2>
          <p className="text-xs md:text-sm text-gray-500 max-w-2xl leading-relaxed">
            Four free, musician-built tools to book stages, coordinate sound specs with local techs, and keep your tour on schedule.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="four-core-elements-row">
          
          {/* Feature 1: Stage Plot Designer */}
          <div 
            onClick={() => onSelectTab("plot")}
            className="group bg-white rounded-2xl border border-gray-200/80 hover:border-orange-300 p-5 space-y-4 transition-all hover:shadow-lg cursor-pointer flex flex-col justify-between" 
            id="element-responsive-stage"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="bg-orange-500 text-white p-2.5 rounded-xl w-10 h-10 flex items-center justify-center shadow-xs">
                  <Sliders className="w-5 h-5" />
                </div>
                <span className="text-xs text-orange-700 font-semibold">
                  Interactive Canvas
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                  Stage Plot Designer
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Drag and drop gear to map drum kits, amps, and monitor wedges. Export a sharp PDF so venue sound engineers know your exact stage requirements.
                </p>
              </div>

              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-2xs group-hover:scale-[1.01] transition-transform">
                <StagePlotScreenshot />
              </div>
            </div>

            <div className="pt-2 text-xs font-bold text-orange-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Launch Plot Designer ($0) <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Feature 2: Tech Rider Builder */}
          <div 
            onClick={() => onSelectTab("rider")}
            className="group bg-white rounded-2xl border border-gray-200/80 hover:border-blue-300 p-5 space-y-4 transition-all hover:shadow-lg cursor-pointer flex flex-col justify-between" 
            id="element-professional-tech"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="bg-blue-600 text-white p-2.5 rounded-xl w-10 h-10 flex items-center justify-center shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-xs text-blue-700 font-semibold">
                  Live Sound Specs
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Tech Rider Builder
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Build formatted channel patch lists, vocal mic choices, and +48V phantom power notes. Prevent soundcheck confusion before you even load in.
                </p>
              </div>

              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-2xs group-hover:scale-[1.01] transition-transform">
                <TechRiderScreenshot />
              </div>
            </div>

            <div className="pt-2 text-xs font-bold text-blue-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Make Tech Rider ($0) <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Feature 3: Concert Poster Designer */}
          <div 
            onClick={() => onSelectTab("poster")}
            className="group bg-white rounded-2xl border border-gray-200/80 hover:border-emerald-300 p-5 space-y-4 transition-all hover:shadow-lg cursor-pointer flex flex-col justify-between" 
            id="element-promo-poster"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="bg-emerald-600 text-white p-2.5 rounded-xl w-10 h-10 flex items-center justify-center shadow-xs">
                  <Image className="w-5 h-5" />
                </div>
                <span className="text-xs text-emerald-700 font-semibold">
                  Gig Flyer Studio
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Concert Poster Designer
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Design vintage halftone flyers and custom tour posters with ticket stamps and custom dates. Print-ready without expensive design software.
                </p>
              </div>

              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-2xs group-hover:scale-[1.01] transition-transform">
                <PosterScreenshot />
              </div>
            </div>

            <div className="pt-2 text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Open Flyer Editor ($0) <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Feature 4: Smart Tour Planner */}
          <div 
            onClick={() => onSelectTab("tour")}
            className="group bg-white rounded-2xl border border-gray-200/80 hover:border-rose-300 p-5 space-y-4 transition-all hover:shadow-lg cursor-pointer flex flex-col justify-between" 
            id="element-ai-tour-scheduler"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="bg-rose-600 text-white p-2.5 rounded-xl w-10 h-10 flex items-center justify-center shadow-xs">
                  <Compass className="w-5 h-5" />
                </div>
                <span className="text-xs text-rose-700 font-semibold">
                  Route &amp; Gas Budgets
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                  Smart Tour Planner
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Map realistic highway drive times, van gas budgets, and corridor stop suggestions between anchor dates to avoid exhausting overnight drives.
                </p>
              </div>

              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-2xs group-hover:scale-[1.01] transition-transform">
                <TourPlannerScreenshot />
              </div>
            </div>

            <div className="pt-2 text-xs font-bold text-rose-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Plan Tour Route ($0) <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

        </div>
      </section>

      {/* Verified Touring Musician & Venue Testimonials */}
      <section className="space-y-6 scroll-mt-20" id="stories-from-the-road">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Touring Musician Reports
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              How DIY Bands &amp; Venues Book Real Shows
            </h2>
            <p className="text-xs md:text-sm text-gray-500 max-w-xl leading-relaxed">
              Real feedback from independent touring musicians and club bookers across the Lower 48.
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-gray-200/80 shadow-2xs shrink-0 text-xs">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="font-extrabold text-slate-900">4.9 / 5.0</span>
            <span className="text-gray-400">· 380+ Touring Artists</span>
          </div>
        </div>

        {/* 4 Authentic Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Testimonial 1: Dr Hadit */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-4 shadow-2xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="text-xs text-slate-500 font-medium">
                <span>Pacific Northwest</span>
                <span aria-hidden="true" className="mx-1.5">·</span>
                <span className="text-emerald-700 font-semibold">Verified Band</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                “We routed our entire 10-city Pacific Northwest run in 20 minutes. Used the stage plot generator for every club sound engineer and booked verified rooms across the corridor. Paid for itself immediately.”
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <BandVisualBadge 
                  code="DH" 
                  gradient="from-indigo-500 to-purple-600" 
                  symbol="🎸" 
                  name="Dr Hadit"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">Little Rusty</p>
                  <p className="text-[11px] text-gray-500">Dr Hadit · Portland, OR</p>
                </div>
              </div>
              <a
                href="https://drhadit.bandcamp.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 shrink-0 inline-flex items-center gap-0.5"
              >
                <span>Bandcamp</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Testimonial 2: Albert Castiglia */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-4 shadow-2xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="text-xs text-slate-500 font-medium">
                <span>National Club Circuit</span>
                <span aria-hidden="true" className="mx-1.5">·</span>
                <span className="text-emerald-700 font-semibold">Verified Artist</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                “Having verified venue specs, stage dimensions, and direct talent buyer inboxes before routing a multi-state run cuts out weeks of bounced emails.”
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <BandVisualBadge 
                  code="AC" 
                  gradient="from-emerald-500 to-teal-600" 
                  symbol="⚡" 
                  name="Albert Castiglia"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">Albert Castiglia</p>
                  <p className="text-[11px] text-gray-500">Blues Rock Artist</p>
                </div>
              </div>
              <a
                href="https://www.albertcastiglia.net"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 shrink-0 inline-flex items-center gap-0.5"
              >
                <span>Website</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Testimonial 3: The Steepwater Band */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-4 shadow-2xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="text-xs text-slate-500 font-medium">
                <span>Midwest Corridor</span>
                <span aria-hidden="true" className="mx-1.5">·</span>
                <span className="text-emerald-700 font-semibold">Verified Band</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                “Getting an organized channel patch list and gear plot into the sound tech's hands before soundcheck ensures our 4-piece show runs smooth every night.”
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <BandVisualBadge 
                  code="SW" 
                  gradient="from-amber-500 to-orange-600" 
                  symbol="🏛️" 
                  name="The Steepwater Band"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">The Steepwater Band</p>
                  <p className="text-[11px] text-gray-500">Chicago, IL</p>
                </div>
              </div>
              <a
                href="https://www.steepwater.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-amber-700 hover:text-amber-900 shrink-0 inline-flex items-center gap-0.5"
              >
                <span>Website</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Testimonial 4: Community Road Report */}
          <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-5 space-y-4 shadow-2xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="text-xs text-slate-400 font-medium">
                <span>Community Report</span>
                <span aria-hidden="true" className="mx-1.5">·</span>
                <span className="text-amber-400 font-semibold">Open Call</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Touring band that booked dates or routed shows with GigLizard? Submit your tour story and live photo through our web form to be featured.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-white">Your Band Here</p>
                <p className="text-[11px] text-slate-400">Verified Touring Artists</p>
              </div>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("open-contact-modal"))}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer shrink-0"
              >
                Submit Story →
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <p className="text-xs text-slate-500 font-medium text-center sm:text-left">
            Verified Musician & Venue Touring Case Studies • Direct public directory profiles registered across Lower 48 corridor markets.
          </p>
          <a
            href="/customers"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState({}, "", "/customers");
              onSelectTab("customers");
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 shrink-0 transition-colors"
          >
            <span>Read All Touring Case Studies (/customers)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>

      {/* Market Landscape & Competitor Comparison Section */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 md:p-10 border border-slate-800 space-y-8 scroll-mt-20 shadow-xl" id="market-comparison-section">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs text-indigo-400 font-semibold tracking-wide">
              Market Landscape · Transparent Comparison
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Why Touring Bands Choose GigLizard Over Sonicbids, Prism & Spreadsheets
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Prism is built for venue operators; Gigwell targets agencies; Sonicbids paywalls gig discovery; spreadsheets are chaos. GigLizard is the only sub-$10 self-serve touring toolkit built for DIY bands.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab("compare")}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2 shrink-0 self-start md:self-auto"
            id="home-btn-full-matrix"
          >
            <BarChart3 className="w-4 h-4 text-indigo-200" />
            <span>Full 5-Platform Matrix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Competitive Wedge Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: vs Sonicbids */}
          <div className="bg-slate-800/70 rounded-2xl border border-slate-700/60 p-5 space-y-3 flex flex-col justify-between hover:border-indigo-400/50 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-400">Closest Rival</span>
                <span className="font-bold text-rose-400">$240+/year</span>
              </div>
              <h3 className="text-sm font-bold text-white">vs. Sonicbids</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Paywalls stage browsing with locked annual recurring plans. GigLizard gives you {venueCountStr} venues, {bandCountStr} touring bands, and verified booking emails 100% free.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-700/60 text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" /> Free Venue Discovery
            </div>
          </div>

          {/* Card 2: vs Prism.fm */}
          <div className="bg-slate-800/70 rounded-2xl border border-slate-700/60 p-5 space-y-3 flex flex-col justify-between hover:border-indigo-400/50 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-400">Category Leader</span>
                <span className="font-bold text-slate-400">Enterprise Demo</span>
              </div>
              <h3 className="text-sm font-bold text-white">vs. Prism.fm</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tailored for box offices and mega-promoters at thousands/year. GigLizard is made for working artists with flat, single passes.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-700/60 text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" /> Band-First Focus
            </div>
          </div>

          {/* Card 3: vs Gigwell */}
          <div className="bg-slate-800/70 rounded-2xl border border-slate-700/60 p-5 space-y-3 flex flex-col justify-between hover:border-indigo-400/50 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-400">Agency Tool</span>
                <span className="font-bold text-rose-400">From $396/yr</span>
              </div>
              <h3 className="text-sm font-bold text-white">vs. Gigwell</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Billed strictly annually for talent agencies. GigLizard offers a flat $9.99 30-day tour pass with zero annual contracts.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-700/60 text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" /> No Annual Lock-in
            </div>
          </div>

          {/* Card 4: vs Spreadsheets */}
          <div className="bg-slate-800/70 rounded-2xl border border-slate-700/60 p-5 space-y-3 flex flex-col justify-between hover:border-indigo-400/50 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-400">Default Habit</span>
                <span className="font-bold text-slate-400">DIY Chaos</span>
              </div>
              <h3 className="text-sm font-bold text-white">vs. Spreadsheets</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Replaces broken tabs and guess-work with automated driving routes, fuel budgets, and clean stage plot canvases.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-700/60 text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" /> Complete Stage Suite
            </div>
          </div>
        </div>

        {/* Mini Comparison Bar */}
        <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">
              Only GigLizard bundles <strong>interactive stage plotting, patch list generation & gig flyers</strong> for <strong>$0</strong>.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectTab("venues")}
              className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline cursor-pointer"
            >
              Browse 4,800+ Free Venues →
            </button>
            <span className="text-slate-700">·</span>
            <button
              type="button"
              onClick={() => onSelectTab("compare")}
              className="text-amber-400 hover:text-amber-300 font-semibold hover:underline cursor-pointer"
            >
              See All 10 Dimensions →
            </button>
          </div>
        </div>
      </section>

      {/* Third-Party Trust Signals & Community Recency Strip (D3.5, D3.1) */}
      <section className="bg-white rounded-3xl p-5 md:p-6 border border-gray-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-5 text-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-300/40">
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="font-black text-slate-900 text-xs">4.9 / 5.0 Community Rating</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                Audited October 2026
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Rated by 380+ touring musicians & talent buyers across Lower 48 corridor runs. Verified human moderation.
            </p>
          </div>
        </div>

        {/* Third-Party Profile Stub & Date Recency */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => onSelectTab("verification")}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>14+ Verified This Week · Log →</span>
          </button>
          <a
            href="https://www.trustpilot.com/review/giglizard.us"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold hover:bg-emerald-100 transition-all flex items-center gap-1.5"
            title="External Review Platform Profile (Claimed / Pending Activation)"
          >
            <span>Trustpilot Profile</span>
            <ExternalLink className="w-3 h-3 text-emerald-600" />
          </a>
        </div>
      </section>

      {/* Scope Honesty Notice (Who GigLizard Is and Is NOT For) - D2.B */}
      <section className="bg-white border border-gray-200/90 rounded-3xl p-6 md:p-8 space-y-5 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-slate-600 text-[10.5px] font-black uppercase tracking-wider">
            <span>Scope Honesty</span>
          </div>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Who GigLizard Is (and Is NOT) For
          </h3>
          <p className="text-xs text-gray-600">
            We built this toolkit specifically for grassroots touring bands. Being explicit about our focus saves everyone time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
            <span className="font-black text-emerald-900 text-xs flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              Built Exactly For:
            </span>
            <ul className="space-y-1.5 text-gray-700">
              <li>• Independent touring bands routing regional club & hall runs (50–1,500 cap).</li>
              <li>• Self-managed DIY original acts looking to co-bill and trade shows in new cities.</li>
              <li>• Indie musicians who refuse to pay $240+/year subscriptions just to browse stages.</li>
              <li>• Working touring bands who need fast, zero-fuss PDF stage plots and input lists.</li>
            </ul>
          </div>

          <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-2">
            <span className="font-black text-rose-900 text-xs flex items-center gap-1.5">
              <X className="w-4 h-4 text-rose-600" />
              NOT For:
            </span>
            <ul className="space-y-1.5 text-gray-700">
              <li>• Arena/stadium acts with full agency representation (CAA, WME, Wasserman).</li>
              <li>• Wedding/corporate private event cover bands seeking banquet agency rosters.</li>
              <li>• Automated promoters seeking high-volume bulk spam email export tools.</li>
              <li>• Multi-agent enterprise booking agencies needing calendar contract software.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Account Type Tier Information & Trust Spine (Pricing D3.4, D4.1, D4.2, D4.3) */}
      <section className="bg-slate-100/90 rounded-3xl p-6 md:p-8 border border-gray-200/70 space-y-6" id="tiers-comparer-block">
        <div className="max-w-3xl mx-auto space-y-2 text-center">
          <div className="text-xs font-semibold text-emerald-800 tracking-wide">
            Transparent Pricing · Zero Hidden Traps
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-snug">
            Access to Venues - FREE<br />Access to Band Contacts - $9.99 / 30-Day Pass
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed max-w-lg mx-auto">
            Venues and tour planning tools are 100% free for all bands forever. Get a 30-day all-access pass for $9.99 (+$0.84 secure payment processing fee = $10.83 total) to unlock full direct booking contacts for all bands.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 pt-2" id="role-tiers-selector">
          
          {/* Free Core Features Box */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 space-y-4 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div>
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-emerald-600" />
                    Free Features & Venues
                  </span>
                  <p className="text-2xl font-black text-slate-900 mt-1">$0 <span className="text-xs text-gray-500 font-normal">/ forever</span></p>
                </div>
                <span className="text-xs font-semibold text-emerald-700">
                  100% Free Forever
                </span>
              </div>
              <ul className="space-y-2.5 text-xs text-gray-650">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span><strong>{venueCountStr} Independent Venues &amp; {bandCountStr} Touring Bands:</strong> Browse all live stages across the USA with verified booking emails and coordinate shared bills.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span><strong>Smart Tour Planner:</strong> Drive times, corridor cities, gas estimates, and Google Maps routing.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span><strong>Stage Suite:</strong> Drag-and-drop Stage Plot Designer, Tech Rider Builder, and Gig Flyer Studio.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span><strong>Public Directory Listing:</strong> Register your band, venue, or sound engineer profile for free.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span><strong>No Credit Card Needed:</strong> Search venues and design stage plots immediately without payment info.</span>
                </li>
              </ul>
            </div>
            
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <button
                type="button"
                onClick={() => onSelectTab("venues")}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Browse Venues for Free (No CC Required)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <p className="text-[11px] text-gray-500 text-center flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Free forever, no credit card needed - and a 7-day money-back guarantee on the pass.</span>
              </p>
            </div>
          </div>

          {/* Band Directory Contacts Access Box */}
          <div className="bg-white rounded-2xl border-2 border-amber-300/80 p-6 space-y-4 shadow-md flex flex-col justify-between relative">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div>
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-500" />
                    Band Contacts Pass
                  </span>
                  <p className="text-2xl font-black text-slate-900 mt-1">$9.99 <span className="text-xs text-gray-500 font-normal">/ 30-day pass</span></p>
                  <p className="text-[11px] text-gray-500 font-mono mt-0.5">+$0.84 processor fee = $10.83 total</p>
                </div>
                <span className="text-xs font-semibold text-amber-900">
                  Single Pass · No Auto-Renew
                </span>
              </div>
              <ul className="space-y-2.5 text-xs text-gray-650">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span><strong>{bandCountStr} Verified Band Contacts:</strong> Unmask booking emails, manager contacts, EPKs, and audio links.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span><strong>Co-Bill & Show Swaps:</strong> Coordinate shared bills with local draws along your tour corridor.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span><strong>Filtered Genre & City Search:</strong> Target compatible acts across any tour stop in the USA.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span><strong>Zero Recurring Traps:</strong> Flat 30-day pass that automatically expires without auto-renewal.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span><strong>Instant Pass Activation:</strong> Immediate full access to all verified band contacts.</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  if (currentAccount) {
                    setShowCheckoutModal(true);
                  } else {
                    document.getElementById("registration-block")?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Unlock 30-Day Band Pass ($9.99)</span>
              </button>

              {/* Value Anchor Line (D4.3, D4.2) */}
              <p className="text-[11px] text-gray-600 font-medium text-center leading-relaxed px-1">
                Less than the door split on a single gig - and it covers your whole run. No renewal unless you ask for one.
              </p>

              {/* Guarantee Pill */}
              <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 7-Day Money-Back Guarantee
                </span>
                <button
                  type="button"
                  onClick={() => setShowGuaranteeModal(true)}
                  className="text-indigo-600 hover:underline font-bold text-[10.5px] cursor-pointer"
                >
                  Guarantee Details
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Payment Trust Badges Bar */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-200/80 p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-black text-slate-900 text-xs">Bank-Grade 256-Bit SSL Checkout</p>
              <p className="text-[10.5px] text-gray-500">Encrypted merchant pipeline processed via PayPal & Stripe</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 font-bold text-[10px] text-slate-600">
            <span className="px-2 py-1 bg-slate-100 rounded border border-gray-200">Visa</span>
            <span className="px-2 py-1 bg-slate-100 rounded border border-gray-200">Mastercard</span>
            <span className="px-2 py-1 bg-slate-100 rounded border border-gray-200">American Express</span>
            <span className="px-2 py-1 bg-slate-100 rounded border border-gray-200">Discover</span>
            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">PayPal</span>
            <span className="px-2 py-1 bg-slate-100 rounded border border-gray-200">Apple Pay</span>
          </div>
        </div>

        {/* In-Place FAQ: Answering Data Freshness & Renewal Objections (D1.4, D3.1) */}
        <div className="max-w-3xl mx-auto space-y-4 pt-6 border-t border-gray-200/80" id="homepage-freshness-faq">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 text-indigo-700 text-[10.5px] font-black uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span>Data Freshness & Transparency FAQ</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Frequently Asked Questions About Verification & Pricing
            </h3>
            <p className="text-xs text-gray-500 max-w-lg mx-auto">
              Concrete answers on directory verification, contact checking, and refund terms.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            {[
              {
                q: "How often are venue booking emails and contacts verified?",
                a: (
                  <span>
                    Every venue listing in our 4,800+ directory is curated and verified by human moderators who corroborate live booking addresses with official venue websites, talent buyer submission channels, and past touring itineraries. When a club changes management or emails bounce, our verification queue flags it within 24 hours. Check out our{" "}
                    <button
                      type="button"
                      onClick={() => onSelectTab("verification")}
                      className="text-indigo-600 font-bold underline hover:text-indigo-800 cursor-pointer"
                    >
                      live Verification Log (/verification)
                    </button>{" "}
                    to see recent audits.
                  </span>
                )
              },
              {
                q: "How are bands added to the co-bill directory?",
                a: "Active bands register directly or claim their profile with their official booking contact, hometown, genres, and EPK/music links. Each profile is reviewed for spam to ensure genuine touring artists seeking co-bills and shared shows across the Lower 48."
              },
              {
                q: "What happens if a booking contact bounces or changes?",
                a: (
                  <span>
                    We maintain an active moderation queue. If you ever encounter an invalid email, click 'Report Contact' on the listing or submit a report through our contact web form. We investigate within 24 hours, update the verified address, and notify you directly. You can inspect recent updates in our{" "}
                    <button
                      type="button"
                      onClick={() => onSelectTab("verification")}
                      className="text-indigo-600 font-bold underline hover:text-indigo-800 cursor-pointer"
                    >
                      Verification & Moderation Log
                    </button>.
                  </span>
                )
              },
              {
                q: "Is the $9.99 pass a recurring subscription or a one-time purchase?",
                a: "The $9.99 pass is a flat 30-day access key with zero recurring auto-billing traps. You are never quietly billed next month. You only renew when actively preparing your next tour run."
              },
              {
                q: "What is the 100% Artist Satisfaction Guarantee?",
                a: "We offer a 7-day hassle-free money-back refund. If you purchase a 30-day pass and cannot find active bands or bookable venues along your route, simply submit a request through our contact web form within 7 days for an immediate 100% refund."
              },
              {
                q: "Why are venue listings 100% free while band contacts have a pass fee?",
                a: "We believe independent artists should never pay a toll to discover live music rooms. Band booking emails, however, are shielded behind human authentication and an affordable 30-day pass to protect musician inboxes from commercial web scrapers and automated marketing bots."
              }
            ].map((faq, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 font-bold text-xs text-slate-900 hover:text-indigo-600 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {openFaqIndex === idx ? (
                    <ChevronUp className="w-4 h-4 text-indigo-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>
                {openFaqIndex === idx && (
                  <div className="px-4 pb-4 pt-1 text-xs text-gray-600 leading-relaxed border-t border-gray-50">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder Story & Platform Operator Transparency (Founder/Team D3.3 & Geo Scope) */}
      <section className="bg-slate-950 text-white rounded-3xl p-6 md:p-8 border border-slate-900 shadow-xl space-y-6" id="founder-mission-block">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <FounderAvatar size="lg" className="shrink-0" />
            <div className="space-y-0.5">
              <div className="text-xs text-amber-400 font-semibold tracking-wide">
                Working Musician Built · Pacific Northwest
              </div>
              <h3 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Little Rusty built this in Portland
              </h3>
              <p className="text-xs text-slate-400">
                Touring Musician · Live Sound Engineer · Frontman of Dr Hadit, Knucklebone, 7AT
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("open-contact-modal"))}
              className="px-3.5 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
              title="Contact Support via Web Form"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>Contact Support</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAboutModal(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl cursor-pointer transition-all border border-slate-700 shrink-0 flex items-center gap-1.5"
            >
              <span>Origin Story</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* First Person Quote from Little Rusty */}
        <div className="bg-slate-900/80 rounded-2xl p-4 md:p-5 border border-slate-800/80 text-xs md:text-[13px] text-slate-200 leading-relaxed space-y-2">
          <p className="italic">
            "I spent over a decade loading tube amps and drums into vans across the Pacific Northwest and touring nationwide. Every run had the same frustration: corporate subscription directories charging $35/month for stale contacts, bounced emails, and broken booking portals. I built GigLizard so working artists never have to pay a toll just to discover live music venues."
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <span className="font-bold text-amber-300">— Little Rusty, Portland, OR</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Direct support via our official contact web form (Under 4 hr reply guarantee)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-slate-350 leading-relaxed pt-1">
          <div className="space-y-1.5 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/60">
            <p className="font-bold text-white text-xs flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-emerald-400" />
              <span>Why Venues are 100% Free</span>
            </p>
            <p className="text-[11.5px]">
              Independent artists shouldn't have to pay to discover live music venues. We maintain 4,800+ music clubs, dive bars, theaters, and listening rooms across the Lower 48 and keep them permanently open to everyone.
            </p>
          </div>
          <div className="space-y-1.5 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/60">
            <p className="font-bold text-white text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Why Band Contacts Need a Pass</span>
            </p>
            <p className="text-[11.5px]">
              Band booking emails are prime targets for automated web crawlers and commercial spam farms. Shielding contacts behind an authenticated 30-day pass ($9.99) keeps musician inboxes clean and finances ongoing human verification.
            </p>
          </div>
          <div className="space-y-1.5 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/60">
            <p className="font-bold text-white text-xs flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>Direct Founder Support</span>
            </p>
            <p className="text-[11.5px]">
              GigLizard is built and personally operated by <strong>Little Rusty</strong> from Portland, OR. Official contact is available via our verified support web form with guaranteed human replies.
            </p>
          </div>
        </div>
      </section>

      {/* User Registration Form Block - Free Accounts creation */}
      {!currentAccount && (
        <section className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm space-y-6 scroll-mt-20" id="registration-block">
          <div className="text-center space-y-1">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Create Free Account Profile</h2>
            <p className="text-xs text-gray-400">
              Pick your correct role below to get instantly integrated into the nationwide co-bill network across all 48 lower states.
            </p>
          </div>

          <div className="flex items-center justify-center p-1 bg-slate-100 rounded-xl max-w-md mx-auto gap-1" id="form-role-selectors">
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
              Band
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
              Venue
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                accountType === "Sound Engineer" ? "bg-white text-amber-700 shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
              onClick={() => {
                setAccountType("Sound Engineer");
                setRegisterError("");
              }}
            >
              <Headphones className="w-3.5 h-3.5" />
              Sound Engineer
            </button>
          </div>

          {emailConfirmBanner && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl text-emerald-950 text-xs flex items-start gap-3 max-w-2xl mx-auto shadow-md animate-fade-in mb-3" id="registration-email-confirm-banner">
              <Mail className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-black text-sm text-emerald-950">Confirm Your Email Address</p>
                <p className="text-emerald-800 font-semibold mt-1">{emailConfirmBanner}</p>
                {emailConfirmAddress && (
                  <p className="text-emerald-700 text-[11px] mt-1">
                    Verification link dispatched to: <strong className="font-mono text-emerald-950">{emailConfirmAddress}</strong>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setEmailConfirmBanner("")}
                className="text-emerald-500 hover:text-emerald-800 p-0.5 cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

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
            ) : accountType === "Sound Engineer" ? (
              /* Sound Engineer / Audio Tech Profile Questions */
              <div className="space-y-4" id="engineer-form-fields-container">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Audio Engineer / Tech Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="E.g., Alex Vance Audio"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Base City & State <span className="text-rose-500">*</span></label>
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
                    <label className="block text-gray-700 font-bold mb-1">Disciplines / Specialties</label>
                    <input
                      type="text"
                      placeholder="E.g., Front of House (FOH), Monitors, Studio, Live Recording"
                      value={formData.genre}
                      onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Touring / Experience Scope</label>
                    <select
                      value={formData.experienceLevel}
                      onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value as any })}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="Local">Local Clubs & Venues</option>
                      <option value="Regional Tour">Regional Touring Tech</option>
                      <option value="National Act">National / Arena Tour Tech</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Bio / Consoles & Gear Experience</label>
                  <textarea
                    placeholder="Describe your mixing experience, favorite digital/analog boards (Midas, Behringer X32/Wing, Yamaha, Allen & Heath), mic packages..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[70px] bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Contact Email <span className="text-rose-500">*</span></label>
                    <input
                      type="email"
                      required
                      autoComplete="off"
                      placeholder="E.g., audio@alexvancesound.com"
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
                      placeholder="E.g., (206) 555-4321"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Portfolio / Credits Link</label>
                    <input
                      type="text"
                      placeholder="E.g., www.alexsoundportfolio.com"
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
                disabled={isSubmittingRegister}
                className="w-full sm:w-auto py-3.5 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-black shadow-md cursor-pointer transition-all border-0 text-sm inline-flex items-center justify-center gap-2"
                id="btn-confirm-registration"
              >
                {isSubmittingRegister ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Supabase Account...</span>
                  </>
                ) : (
                  <>
                    <span>Register Free {accountType} Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
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

      {/* About & Origin Story Modal */}
      <AboutMissionModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        onSelectTab={onSelectTab}
      />

      {/* 100% Artist Satisfaction Guarantee Modal */}
      <SatisfactionGuaranteeModal
        isOpen={showGuaranteeModal}
        onClose={() => setShowGuaranteeModal(false)}
        onOpenCheckout={() => {
          if (currentAccount) {
            setShowCheckoutModal(true);
          } else {
            document.getElementById("registration-block")?.scrollIntoView({ behavior: "smooth" });
          }
        }}
      />

      {/* Floating Toast Notification Container */}
      {toasts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full px-4 pointer-events-none" id="home-toast-container">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border flex items-start gap-3 text-xs transition-all animate-slide-up backdrop-blur-md ${
                toast.type === "error"
                  ? "bg-rose-950/95 text-rose-100 border-rose-700 shadow-rose-950/50"
                  : toast.type === "success"
                  ? "bg-emerald-950/95 text-emerald-100 border-emerald-700 shadow-emerald-950/50"
                  : "bg-indigo-950/95 text-indigo-100 border-indigo-700 shadow-indigo-950/50"
              }`}
            >
              {toast.type === "error" ? (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              ) : toast.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Mail className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-semibold leading-relaxed">
                {toast.message}
              </div>
              <button
                type="button"
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-white/60 hover:text-white p-0.5 cursor-pointer shrink-0"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
