import React, { useState, useEffect, useRef } from "react";
import { App as CapacitorApp } from "@capacitor/app";
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
import ResetPasswordModal from "./components/ResetPasswordModal";
import UserLoginModal from "./components/UserLoginModal";
import TermsOfServiceModal from "./components/TermsOfServiceModal";
import ArtistRegistrationModal from "./components/ArtistRegistrationModal";
import AboutMissionModal from "./components/AboutMissionModal";
import SatisfactionGuaranteeModal from "./components/SatisfactionGuaranteeModal";
import Footer from "./components/Footer";
import gigLizardLogo from "./assets/images/giglizard_logo_hd.png";
import { recordLiveVisit } from "./utils/analyticsStore";
import { isBandBanned, isPerpetualPassEmail } from "./utils/accessControl";
import { insertProfile, supabase, resolveAccountFromDatabase, linkAuthUidToBand } from "./lib/supabase";
import { 
  syncLocalBandsAndVenuesToSupabase, 
  downloadEmbeddedBandsAndVenuesCSV, 
  MigrationSyncResult 
} from "./utils/adminMigration";
import { 
  Music, MapPin, Sliders, FileText, Image, MessageSquare, 
  Settings, Sparkles, CheckCircle, Info, Calendar, Users,
  Compass, Navigation, ShieldCheck, BarChart3, Crown, LogIn, HelpCircle,
  RefreshCw, Download, CheckCircle2, AlertTriangle, X, Menu
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

export default function GigLizardApp() {
  type TabType = "home" | "venues" | "plot" | "rider" | "poster" | "advisor" | "bands" | "tour" | "admin";
  const validTabs: TabType[] = ["home", "venues", "plot", "rider", "poster", "advisor", "bands", "tour", "admin"];

  // Mobile navigation drawer toggle state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Android back-swipe / double-tap exit state
  const [showExitToast, setShowExitToast] = useState(false);
  const lastBackPressTimeRef = useRef<number>(0);

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

  const getInitialStagePlotBandId = (): string | null => {
    try {
      // 1. Check path: /stage-plot/:bandId
      const path = window.location.pathname;
      const pathMatch = path.match(/^\/stage-plot\/([a-zA-Z0-9_-]+)/i);
      if (pathMatch && pathMatch[1]) return decodeURIComponent(pathMatch[1]);

      // 2. Check hash: #stage-plot/:bandId or #stage-plot=:bandId
      const rawHash = window.location.hash.replace("#", "");
      const hashMatch = rawHash.match(/^stage-plot[\/=:]([a-zA-Z0-9_-]+)/i);
      if (hashMatch && hashMatch[1]) return decodeURIComponent(hashMatch[1]);

      // 3. Check query param: ?stage-plot=:bandId or ?stagePlot=:bandId
      const urlParams = new URLSearchParams(window.location.search);
      const qParam = urlParams.get("stage-plot") || urlParams.get("stagePlot");
      if (qParam) return decodeURIComponent(qParam);
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const getInitialTab = (): TabType => {
    try {
      // Check if arriving via direct shareable stage-plot link
      if (getInitialStagePlotBandId()) return "plot";

      const isOwner = isStoredAccountOwner();
      const rawHash = window.location.hash.replace("#", "").toLowerCase();
      if (rawHash === "dashboard" || rawHash === "admin") return isOwner ? "admin" : "home";
      if (rawHash.startsWith("stage-plot")) return "plot";
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

  const [publicStagePlotBandId, setPublicStagePlotBandId] = useState<string | null>(getInitialStagePlotBandId);

  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [showPayPalModal, setShowPayPalModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showUserLoginModal, setShowUserLoginModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showArtistRegistrationModal, setShowArtistRegistrationModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showGuaranteeModal, setShowGuaranteeModal] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState<"login" | "signup" | "forgot">("login");
  const [loginModalEmail, setLoginModalEmail] = useState("");

  // 1. Initial state MUST default to null, never mock Dr Hadit data
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Admin Data Migration / Seed Tool State
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [syncStatusProgress, setSyncStatusProgress] = useState<string | null>(null);
  const [syncToastMessage, setSyncToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // User Accounts State
  const [currentAccount, setCurrentAccount] = useState<UserAccount | null>(() => {
    // Clear any stale legacy localStorage keys
    try {
      localStorage.removeItem("giglizard_active_user");
    } catch (_) {}

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
        if (!parsed || !parsed.contactEmail || isBandBanned(parsed?.contactEmail, parsed?.name)) {
          localStorage.removeItem("current_user_account_v1");
          return null;
        }

        const isOwner = parsed.contactEmail?.trim().toLowerCase() === "littlerusty@gmail.com" || 
                        isPerpetualPassEmail(parsed?.contactEmail) || 
                        parsed.name?.trim().toLowerCase() === "littlerusty";

        if (isOwner) {
          const ownerAccount: UserAccount = {
            ...parsed,
            id: parsed.id || "41c6fde8-9462-4402-a0f1-79155786fb03",
            email: "littlerusty@gmail.com",
            contactEmail: "littlerusty@gmail.com",
            role: parsed.role || "Band",
            type: "Band",
            name: "Dr Hadit", // Explicitly ensure Dr Hadit, never email prefix or stale cache
            hasPaidAccess: true,
            isPremium: true,
            autoRenew: true,
            accessExpiresAt: new Date(Date.now() + 36500 * 24 * 60 * 60 * 1000).toISOString()
          };
          localStorage.setItem("current_user_account_v1", JSON.stringify(ownerAccount));
          return ownerAccount;
        }

        // If stale name was email prefix 'littlerusty', fix it
        if (parsed.name === "littlerusty") {
          parsed.name = "Dr Hadit";
          localStorage.setItem("current_user_account_v1", JSON.stringify(parsed));
        }

        return parsed; 
      } catch (e) { console.error(e); }
    }
    return null;
  });

  // 2. Resolve the real session on load with database priority
  useEffect(() => {
    // Clear any stale legacy keys immediately
    try {
      localStorage.removeItem("giglizard_active_user");
    } catch (_) {}

    const initAuth = async () => {
      try {
        // Get current active session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Explicitly link auth.uid() to user_id in public.bands matching official_email
          await linkAuthUidToBand(session.user.id, session.user.email || "");

          // Check database prioritizing public.bands then public.profiles
          const resolved = await resolveAccountFromDatabase(session.user.id, session.user.email);
          const isVip = session.user.email === 'giglizard.us@gmail.com' || isPerpetualPassEmail(session.user.email) || resolved.isOwner;

          const roleType = (resolved.role || "Band") as any;
          const finalName = resolved.isOwner || session.user.email?.trim().toLowerCase() === "littlerusty@gmail.com"
            ? "Dr Hadit"
            : resolved.name;

          const mappedAccount: UserAccount = {
            id: resolved.bandRecord?.id || resolved.profileRecord?.id || session.user.id,
            email: session.user.email || "",
            role: roleType,
            type: roleType,
            name: finalName,
            city: resolved.city,
            isPremium: Boolean(resolved.profileRecord?.is_premium || resolved.profileRecord?.is_paid || isVip),
            hasPaidAccess: Boolean(resolved.profileRecord?.is_paid || resolved.profileRecord?.is_premium || isVip),
            autoRenew: Boolean(resolved.profileRecord?.auto_renew ?? true),
            accessExpiresAt: resolved.profileRecord?.access_expires_at || (isVip ? new Date(Date.now() + 36500 * 24 * 60 * 60 * 1000).toISOString() : undefined),
            contactEmail: resolved.bandRecord?.official_email || resolved.profileRecord?.contact_email || resolved.profileRecord?.email || session.user.email || "",
            genre: Array.isArray(resolved.bandRecord?.genres) 
              ? resolved.bandRecord.genres.join(", ") 
              : (resolved.bandRecord?.genres || resolved.profileRecord?.genres || resolved.profileRecord?.genre || undefined),
            bio: resolved.bandRecord?.bio || resolved.profileRecord?.bio || undefined,
            website: resolved.bandRecord?.website || resolved.profileRecord?.website || resolved.profileRecord?.primary_link || undefined,
            epkUrl: resolved.bandRecord?.epk_url || resolved.profileRecord?.epk_url || undefined,
            musicUrl: resolved.bandRecord?.music_url || resolved.profileRecord?.music_url || undefined,
            experienceLevel: resolved.bandRecord?.touring_tier
              ? (resolved.bandRecord.touring_tier.includes("National") ? "National Act" : resolved.bandRecord.touring_tier.includes("Regional") ? "Regional Tour" : "Local")
              : ((resolved.profileRecord?.experience_level as any) || "Local")
          };

          const userObj = {
            ...(resolved.profileRecord || {}),
            id: session.user.id,
            email: session.user.email,
            name: finalName,
            isVip
          };

          setCurrentUser(userObj);
          setCurrentAccount(mappedAccount);
          localStorage.setItem("current_user_account_v1", JSON.stringify(mappedAccount));
          localStorage.removeItem("giglizard_active_user");
        } else {
          // No session exists (fresh guest or incognito)
          setCurrentUser(null);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        setCurrentUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    };

    initAuth();

    // Listen for Supabase login / logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Explicitly link auth.uid() to user_id in public.bands matching official_email
        await linkAuthUidToBand(session.user.id, session.user.email || "");

        const resolved = await resolveAccountFromDatabase(session.user.id, session.user.email);
        const isVip = session.user.email === 'giglizard.us@gmail.com' || isPerpetualPassEmail(session.user.email) || resolved.isOwner;

        const roleType = (resolved.role || "Band") as any;
        const finalName = resolved.isOwner || session.user.email?.trim().toLowerCase() === "littlerusty@gmail.com"
          ? "Dr Hadit"
          : resolved.name;

        const mappedAccount: UserAccount = {
          id: resolved.bandRecord?.id || resolved.profileRecord?.id || session.user.id,
          email: session.user.email || "",
          role: roleType,
          type: roleType,
          name: finalName,
          city: resolved.city,
          isPremium: Boolean(resolved.profileRecord?.is_premium || resolved.profileRecord?.is_paid || isVip),
          hasPaidAccess: Boolean(resolved.profileRecord?.is_paid || resolved.profileRecord?.is_premium || isVip),
          autoRenew: Boolean(resolved.profileRecord?.auto_renew ?? true),
          accessExpiresAt: resolved.profileRecord?.access_expires_at || (isVip ? new Date(Date.now() + 36500 * 24 * 60 * 60 * 1000).toISOString() : undefined),
          contactEmail: resolved.bandRecord?.official_email || resolved.profileRecord?.contact_email || resolved.profileRecord?.email || session.user.email || "",
          genre: Array.isArray(resolved.bandRecord?.genres) 
            ? resolved.bandRecord.genres.join(", ") 
            : (resolved.bandRecord?.genres || resolved.profileRecord?.genres || resolved.profileRecord?.genre || undefined),
          bio: resolved.bandRecord?.bio || resolved.profileRecord?.bio || undefined,
          website: resolved.bandRecord?.website || resolved.profileRecord?.website || resolved.profileRecord?.primary_link || undefined,
          epkUrl: resolved.bandRecord?.epk_url || resolved.profileRecord?.epk_url || undefined,
          musicUrl: resolved.bandRecord?.music_url || resolved.profileRecord?.music_url || undefined,
          experienceLevel: resolved.bandRecord?.touring_tier
            ? (resolved.bandRecord.touring_tier.includes("National") ? "National Act" : resolved.bandRecord.touring_tier.includes("Regional") ? "Regional Tour" : "Local")
            : ((resolved.profileRecord?.experience_level as any) || "Local")
        };

        const userObj = {
          ...(resolved.profileRecord || {}),
          id: session.user.id,
          email: session.user.email,
          name: finalName,
          isVip
        };

        setCurrentUser(userObj);
        setCurrentAccount(mappedAccount);
        localStorage.setItem("current_user_account_v1", JSON.stringify(mappedAccount));
        localStorage.removeItem("giglizard_active_user");
      } else {
        // Explicitly wipe state when signed out or unauthenticated
        setCurrentUser(null);
        setCurrentAccount(null);
        localStorage.removeItem("current_user_account_v1");
        localStorage.removeItem("giglizard_active_user");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const [activeTab, setActiveTabState] = useState<TabType>(getInitialTab);

  // Automatic Scroll-to-Top on View / Tab Mount / Change:
  // When activeTab changes (e.g., navigating to Poster Builder), instantly scroll to the top
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } catch (_) {
      try {
        window.scrollTo(0, 0);
      } catch (__) {}
    }
  }, [activeTab]);

  // Track whether navigation state change originated from a browser popstate event
  const isNavigatingViaPopstateRef = useRef<boolean>(false);

  const setActiveTab = (tab: TabType, pushToHistory = true) => {
    if (tab === "admin" && currentAccount?.contactEmail?.trim().toLowerCase() !== "littlerusty@gmail.com") {
      setActiveTabState("home");
      try {
        window.history.replaceState({ tab: "home" }, "", "#home");
      } catch (e) {}
      return;
    }
    setActiveTabState(tab);
    try {
      if (pushToHistory && !isNavigatingViaPopstateRef.current) {
        window.history.pushState({ tab }, "", `#${tab}`);
      } else if (window.location.hash !== `#${tab}`) {
        window.history.replaceState({ tab }, "", `#${tab}`);
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

  // Set document title on mount
  useEffect(() => {
    document.title = "GigLizard";
  }, []);

  // Track page visit on mount and tab switch
  useEffect(() => {
    recordLiveVisit();
  }, [activeTab]);

  // Check direct URL routes (e.g. /about, /features, /customers, /pricing, /guarantee, /security)
  const resolveTargetRoute = (targetStr: string): boolean => {
    const clean = targetStr.replace(/^[/#]+/, "").toLowerCase();
    if (!clean) return false;

    if (clean === "about" || clean === "mission") {
      setShowAboutModal(true);
      setActiveTabState("home");
      return true;
    }
    if (clean === "guarantee" || clean === "refund") {
      setShowGuaranteeModal(true);
      setActiveTabState("home");
      return true;
    }
    if (clean === "security" || clean === "anti-scraping") {
      setShowSecurityModal(true);
      return true;
    }
    if (clean === "customers" || clean === "stories" || clean === "testimonials") {
      setActiveTabState("home");
      setTimeout(() => {
        document.getElementById("stories-from-the-road")?.scrollIntoView({ behavior: "smooth" });
      }, 150);
      return true;
    }
    if (clean === "features" || clean === "tools") {
      setActiveTabState("home");
      setTimeout(() => {
        document.getElementById("home-featured-matrix-section")?.scrollIntoView({ behavior: "smooth" });
      }, 150);
      return true;
    }
    if (clean === "pricing" || clean === "tiers") {
      setActiveTabState("home");
      setTimeout(() => {
        document.getElementById("tiers-comparer-block")?.scrollIntoView({ behavior: "smooth" });
      }, 150);
      return true;
    }
    return false;
  };

  // Check URL path/hash on initial mount
  useEffect(() => {
    const rawPath = window.location.pathname;
    const rawHash = window.location.hash;
    resolveTargetRoute(rawHash) || resolveTargetRoute(rawPath);
  }, []);

  // Listen to browser hash changes (e.g. back/forward or direct URL clicks)
  useEffect(() => {
    const handleHashChange = () => {
      const stageBandId = getInitialStagePlotBandId();
      if (stageBandId) {
        setPublicStagePlotBandId(stageBandId);
        setActiveTabState("plot");
        return;
      }

      const rawHash = window.location.hash.replace("#", "").toLowerCase();
      const rawPath = window.location.pathname.replace(/^\//, "").toLowerCase();
      if (resolveTargetRoute(rawHash) || resolveTargetRoute(rawPath)) {
        return;
      }

      const isOwner = currentAccount?.contactEmail?.trim().toLowerCase() === "littlerusty@gmail.com";
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
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [currentAccount]);

  // Listen for Supabase Auth PASSWORD_RECOVERY event or recovery hash URLs
  useEffect(() => {
    const checkRecoveryHash = () => {
      const hash = window.location.hash;
      if (
        hash.includes("reset-password") || 
        hash.includes("type=recovery") || 
        (hash.includes("access_token") && hash.includes("recovery"))
      ) {
        setShowResetPasswordModal(true);
      }
    };

    checkRecoveryHash();
    window.addEventListener("hashchange", checkRecoveryHash);
    window.addEventListener("popstate", checkRecoveryHash);

    // Official Supabase Auth state listener for recovery events from default redirect
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setShowUserLoginModal(false);
        setShowResetPasswordModal(true);
      }
    });

    // Global listener for opening user login / forgot password modal from any component
    const handleGlobalOpenLogin = (e: any) => {
      const mode = e?.detail?.mode || "login";
      const email = e?.detail?.email || "";
      setLoginModalMode(mode);
      if (email) setLoginModalEmail(email);
      setShowUserLoginModal(true);
    };
    window.addEventListener("giglizard_open_login", handleGlobalOpenLogin);

    return () => {
      window.removeEventListener("hashchange", checkRecoveryHash);
      window.removeEventListener("popstate", checkRecoveryHash);
      window.removeEventListener("giglizard_open_login", handleGlobalOpenLogin);
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Ref to hold current navigation and modal states for back button listeners
  const modalStatesRef = useRef({
    showEditAccountModal,
    showUserLoginModal,
    showPayPalModal,
    showResetPasswordModal,
    showSecurityModal,
    showTermsModal,
    publicStagePlotBandId,
    activeTab
  });

  useEffect(() => {
    modalStatesRef.current = {
      showEditAccountModal,
      showUserLoginModal,
      showPayPalModal,
      showResetPasswordModal,
      showSecurityModal,
      showTermsModal,
      publicStagePlotBandId,
      activeTab
    };
  }, [
    showEditAccountModal,
    showUserLoginModal,
    showPayPalModal,
    showResetPasswordModal,
    showSecurityModal,
    showTermsModal,
    publicStagePlotBandId,
    activeTab
  ]);

  // Push history state whenever any modal opens so back gestures capture it cleanly
  useEffect(() => {
    if (
      showEditAccountModal || 
      showUserLoginModal || 
      showPayPalModal || 
      showResetPasswordModal || 
      showSecurityModal || 
      showTermsModal
    ) {
      try {
        window.history.pushState({ tab: activeTab, giglizardModal: true }, "", window.location.href);
      } catch (_) {}
    }
  }, [
    showEditAccountModal,
    showUserLoginModal,
    showPayPalModal,
    showResetPasswordModal,
    showSecurityModal,
    showTermsModal,
    activeTab
  ]);

  // Core back navigation handler for Capacitor hardware button and Web popstate
  const handleBackNavigation = (canGoBackFromPlugin?: boolean) => {
    // 1. Check child overlays first (e.g. TourLodgingModal, TourPrintModal, StagePlot export sheet, TechRider dialogs)
    const childBackEvent = new CustomEvent("giglizard_back_press", { cancelable: true });
    window.dispatchEvent(childBackEvent);
    if (childBackEvent.defaultPrevented) {
      try {
        window.history.pushState({ tab: modalStatesRef.current.activeTab, giglizard: "active" }, "", window.location.href);
      } catch (_) {}
      return;
    }

    const state = modalStatesRef.current;

    // 2. If any modal is open (TourLodgingModal, PrintModal, TechRider, EditAccountModal, UserLoginModal, etc.), close the active modal first
    if (state.showEditAccountModal) {
      setShowEditAccountModal(false);
      try { window.history.pushState({ tab: state.activeTab, giglizard: "active" }, "", window.location.href); } catch (_) {}
      return;
    }
    if (state.showUserLoginModal) {
      setShowUserLoginModal(false);
      try { window.history.pushState({ tab: state.activeTab, giglizard: "active" }, "", window.location.href); } catch (_) {}
      return;
    }
    if (state.showPayPalModal) {
      setShowPayPalModal(false);
      try { window.history.pushState({ tab: state.activeTab, giglizard: "active" }, "", window.location.href); } catch (_) {}
      return;
    }
    if (state.showResetPasswordModal) {
      setShowResetPasswordModal(false);
      try { window.history.pushState({ tab: state.activeTab, giglizard: "active" }, "", window.location.href); } catch (_) {}
      return;
    }
    if (state.showSecurityModal) {
      setShowSecurityModal(false);
      try { window.history.pushState({ tab: state.activeTab, giglizard: "active" }, "", window.location.href); } catch (_) {}
      return;
    }
    if (state.showTermsModal) {
      setShowTermsModal(false);
      try { window.history.pushState({ tab: state.activeTab, giglizard: "active" }, "", window.location.href); } catch (_) {}
      return;
    }

    // Check public stage plot review mode (/stage-plot/:bandId)
    if (state.publicStagePlotBandId) {
      setPublicStagePlotBandId(null);
      try {
        window.history.pushState({ tab: "home", giglizard: "root" }, "", "/#home");
      } catch (_) {}
      setActiveTabState("home");
      return;
    }

    // 3. If canGoBack and window.history.length > 1 on a sub-route, execute window.history.back()
    const isSubRoute = window.location.pathname !== "/" && window.location.pathname !== "";
    if (isSubRoute && (canGoBackFromPlugin || window.history.length > 1)) {
      window.history.back();
      return;
    }

    // 4. If the user is on an inner view or secondary tab (e.g., activeTab !== 'home'), navigate back to the home view instead of exiting
    if (state.activeTab !== "home") {
      setActiveTab("home", false);
      try { window.history.pushState({ tab: "home", giglizard: "root" }, "", "#home"); } catch (_) {}
      return;
    }

    // 5. Only call CapacitorApp.exitApp() if the user is already on the root home screen with no modals open and double-taps back within 2 seconds
    const now = Date.now();
    if (now - lastBackPressTimeRef.current < 2000) {
      try {
        CapacitorApp.exitApp();
      } catch (err) {
        console.debug("Capacitor exitApp note:", err);
      }
    } else {
      lastBackPressTimeRef.current = now;
      setShowExitToast(true);
      setTimeout(() => {
        setShowExitToast(false);
      }, 2000);
      try {
        window.history.pushState({ tab: "home", giglizard: "root" }, "", window.location.href);
      } catch (_) {}
    }
  };

  // 1. Handle Hardware & Gesture Back Button (Capacitor/Native Wrapper)
  useEffect(() => {
    let removePluginListener: (() => void) | null = null;

    const setupCapacitor = async () => {
      try {
        const handle = await CapacitorApp.addListener("backButton", ({ canGoBack }) => {
          handleBackNavigation(canGoBack);
        });
        removePluginListener = () => {
          handle.remove();
        };
      } catch (err) {
        console.debug("Capacitor App plugin listener note:", err);
      }
    };

    setupCapacitor();

    return () => {
      if (removePluginListener) removePluginListener();
    };
  }, []);

  // 2. Sync In-App Navigation State with Browser History (PWA / Mobile Browser):
  // Whenever user swipes from the edge to trigger a back gesture, capture popstate event, prevent app exit, and step backward cleanly
  useEffect(() => {
    try {
      if (!window.history.state || !window.history.state.tab) {
        window.history.replaceState({ tab: activeTab, giglizard: "root" }, "", window.location.href);
      }
    } catch (_) {}

    const handleWebPopState = (e: PopStateEvent) => {
      isNavigatingViaPopstateRef.current = true;
      try {
        // If an in-app modal or child overlay was open, close it first
        const state = modalStatesRef.current;
        const hasOpenModal = 
          state.showEditAccountModal || 
          state.showUserLoginModal || 
          state.showPayPalModal || 
          state.showResetPasswordModal || 
          state.showSecurityModal || 
          state.showTermsModal || 
          Boolean(state.publicStagePlotBandId);

        if (hasOpenModal) {
          handleBackNavigation(false);
          return;
        }

        // If history state specifies a tab, transition cleanly
        if (e.state && e.state.tab && validTabs.includes(e.state.tab as TabType)) {
          const targetTab = e.state.tab as TabType;
          if (targetTab === "admin" && currentAccount?.contactEmail?.trim().toLowerCase() !== "littlerusty@gmail.com") {
            setActiveTabState("home");
          } else {
            setActiveTabState(targetTab);
          }
          return;
        }

        // Otherwise handle general back navigation (sub-tab to home, or double-tap exit check)
        handleBackNavigation(false);
      } finally {
        setTimeout(() => {
          isNavigatingViaPopstateRef.current = false;
        }, 50);
      }
    };

    window.addEventListener("popstate", handleWebPopState);
    return () => {
      window.removeEventListener("popstate", handleWebPopState);
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
    setCurrentUser(prev => prev ? {
      ...prev,
      name: account.name,
      city: account.city,
      genre: account.genre,
      genres: account.genre,
      bio: account.bio,
      website: account.website,
      epk_link: account.epkUrl,
      music_link: account.musicUrl
    } : {
      id: account.id || "local-user",
      email: account.contactEmail,
      name: account.name,
      city: account.city,
      role: account.type
    });
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

    // Always ensure profile record is written into Supabase profiles table
    insertProfile({
      name: account.name,
      contact_email: account.contactEmail,
      email: account.contactEmail,
      type: account.type,
      role: account.type,
      city: account.city,
      genre: account.genre,
      bio: account.bio,
      capacity: account.capacity,
      address: account.address,
      contact_phone: account.contactPhone,
      website: account.website,
      epk_url: account.epkUrl,
      music_url: account.musicUrl,
      experience_level: account.experienceLevel,
      has_pa: account.hasPA,
      has_lighting: account.hasLighting,
      is_premium: account.isPremium,
      password: account.password
    }).catch(err => console.warn("Supabase profile sync error in App.tsx:", err));
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

  const handleLogOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (_) {}
    setCurrentUser(null);
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

  // Concert poster config (defaults to clean empty strings so users don't have to backspace placeholder text)
  const [posterConfig, setPosterConfig] = useState<PosterConfig>(() => {
    try {
      const saved = localStorage.getItem("user_saved_poster_v1");
      if (saved) return JSON.parse(saved);
    } catch (_) {}

    // Check if user is already authenticated with a band profile
    let defaultBand = "";
    try {
      const savedAccount = localStorage.getItem("current_user_account_v1");
      if (savedAccount) {
        const acc = JSON.parse(savedAccount);
        if (acc?.name && acc?.name !== "littlerusty") {
          defaultBand = acc.name;
        }
      }
    } catch (_) {}

    return {
      bandName: defaultBand,
      supportingActs: "",
      secondaryText: "",
      venueName: "",
      venueAddress: "",
      dateStr: "",
      timeStr: "",
      priceStr: "",
      allAges: "All Ages",
      amenities: {
        servesFood: false,
        servesAlcohol: false,
        merchArea: false
      },
      extraDetails: "",
      themeId: "heavy-grunge",
      colorId: "default",
      fontStyle: "impact"
    };
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

  const isAuthenticated = Boolean(currentAccount?.contactEmail || currentUser?.email);
  const isOwnerUser = (currentAccount?.contactEmail || currentUser?.email || "").trim().toLowerCase() === "littlerusty@gmail.com";

  // Admin Data Migration Handlers
  const handleSyncToSupabase = async () => {
    if (isSyncingSupabase) return;
    setIsSyncingSupabase(true);
    setSyncStatusProgress("Initializing migration batches...");
    setSyncToastMessage({ text: "Beginning data sync of local bands & venues to Supabase...", type: "info" });

    try {
      const result: MigrationSyncResult = await syncLocalBandsAndVenuesToSupabase((progress) => {
        setSyncStatusProgress(progress);
      });

      const successToast = `${result.bandsCount} bands, ${result.venuesCount} venues, and ${result.profilesCount} relative profiles successfully pushed to Supabase!`;
      setSyncToastMessage({ text: successToast, type: "success" });
    } catch (err: any) {
      console.error("Data sync to Supabase encountered error:", err);
      const errMsg = `Sync completed with warning: ${err?.message || "Please check Supabase connection."}`;
      setSyncToastMessage({ text: errMsg, type: "error" });
    } finally {
      setIsSyncingSupabase(false);
      setSyncStatusProgress(null);
      setTimeout(() => {
        setSyncToastMessage(null);
      }, 6000);
    }
  };

  const handleExportOfflineCSVs = () => {
    try {
      downloadEmbeddedBandsAndVenuesCSV();
      setSyncToastMessage({ 
        text: "Downloaded offline backups: 'giglizard_bands.csv' & 'giglizard_venues.csv'!", 
        type: "success" 
      });
      setTimeout(() => {
        setSyncToastMessage(null);
      }, 5000);
    } catch (err: any) {
      console.error("Failed to download offline CSVs:", err);
      alert(err?.message || "Failed to export CSVs.");
    }
  };

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-slate-50 text-slate-800 flex flex-col font-sans relative" id="applet-viewport">
      {/* In-app loading splash screen overlay (fades out as soon as initial auth check finishes) */}
      {isAuthLoading && (
        <div 
          id="app-auth-loading-splash" 
          className="fixed inset-0 bg-[#121212] z-[99999] flex flex-col items-center justify-center p-6 sm:p-8 transition-opacity duration-300"
          role="status"
          aria-live="polite"
        >
          {/* Centered circular glowing emerald emblem badge */}
          <div className="relative flex items-center justify-center">
            {/* Subtle emerald pulsing glow perimeter halo */}
            <div 
              className="absolute -inset-3 md:-inset-4 rounded-full bg-radial from-emerald-500/45 via-emerald-600/20 to-transparent blur-xl md:blur-2xl animate-pulse" 
              aria-hidden="true" 
            />
            
            {/* Inner circle container (mobile: w-[85vw] max-w-[360px] aspect-square; desktop: md:w-[500px] md:max-w-[500px] md:h-[500px] aspect-square) */}
            <div className="relative w-[85vw] max-w-[360px] md:w-[500px] md:max-w-[500px] md:h-[500px] aspect-square rounded-full overflow-hidden shadow-[0_0_45px_rgba(16,185,129,0.5),0_0_90px_rgba(5,150,105,0.25)] border-2 border-emerald-500/70 bg-[#121212] flex items-center justify-center">
              <img 
                src="/icon-512.png" 
                alt="GigLizard: The Ultimate Live Music Stage Director" 
                className="w-full h-full object-contain block"
              />
            </div>
          </div>

          {/* Animated emerald loading dots cleanly below the circular badge */}
          <div className="mt-7 flex flex-col items-center gap-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-bounce" />
            </div>
            <span className="text-slate-400 font-sans text-[11px] font-extrabold tracking-widest uppercase">
              Loading GigLizard...
            </span>
          </div>
        </div>
      )}

      {/* Visual Workspace Bar Header */}
      <header className="bg-white border-b border-gray-200/60 sticky top-0 z-50 py-2 sm:py-3 md:py-4 px-3 sm:px-6 md:px-8 max-w-full overflow-x-hidden" id="main-header">
        <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-2 sm:gap-4" id="header-inner">
          
          {/* Logo pinned on the far left */}
          <div className="flex items-center shrink-0" id="logo-row">
            <button
              type="button"
              onClick={() => { setActiveTab("home"); setIsMobileMenuOpen(false); }}
              className="flex items-center cursor-pointer text-left focus:outline-hidden group"
              id="header-brand-link"
              title="GigLizard Home"
            >
              <img
                src={gigLizardLogo || "/giglizard_logo.png"}
                alt="GigLizard"
                className="h-10 sm:h-14 md:h-20 lg:h-24 max-w-[140px] sm:max-w-[200px] md:max-w-[320px] lg:max-w-[420px] w-auto object-contain flex-shrink-0 transition-transform group-hover:scale-102"
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

          {/* Mobile Right Controls: Compact + Claim Pill + Hamburger Menu (< md) */}
          <div className="flex md:hidden items-center gap-1.5 shrink-0" id="header-mobile-controls">
            <button
              type="button"
              onClick={() => { setShowArtistRegistrationModal(true); setIsMobileMenuOpen(false); }}
              id="header-claim-band-btn-mobile"
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-black cursor-pointer rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 text-white shadow-xs transition-all active:scale-95 shrink-0"
              title="Claim or submit your band"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200 shrink-0" />
              <span>+ Claim</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              aria-label="Toggle Navigation Menu"
              className="p-1.5 sm:p-2 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200/80 cursor-pointer transition-colors shrink-0"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-slate-800" /> : <Menu className="w-5 h-5 text-slate-800" />}
            </button>
          </div>

          {/* Desktop Navigation Bar (md+): Clean horizontal bar */}
          <nav className="hidden md:flex flex-row items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/60 shadow-2xs shrink-0" id="main-nav">
            <button
              onClick={() => setActiveTab("venues")}
              id="tab-btn-venues"
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold cursor-pointer rounded-xl transition-all ${
                activeTab === "venues"
                  ? "bg-white text-slate-950 shadow-xs ring-1 ring-slate-200"
                  : "text-slate-600 hover:text-slate-950 hover:bg-white/80"
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Venues</span>
            </button>

            <button
              onClick={() => setActiveTab("bands")}
              id="tab-btn-bands"
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold cursor-pointer rounded-xl transition-all ${
                activeTab === "bands"
                  ? "bg-white text-slate-950 shadow-xs ring-1 ring-slate-200"
                  : "text-slate-600 hover:text-slate-950 hover:bg-white/80"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Bands</span>
            </button>

            <button
              onClick={() => setActiveTab("tour")}
              id="tab-btn-tour"
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold cursor-pointer rounded-xl transition-all ${
                activeTab === "tour"
                  ? "bg-white text-slate-950 shadow-xs ring-1 ring-slate-200"
                  : "text-slate-600 hover:text-slate-950 hover:bg-white/80"
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Tour</span>
            </button>

            <button
              type="button"
              onClick={() => setShowArtistRegistrationModal(true)}
              id="header-claim-band-btn"
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black cursor-pointer rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
              title="Claim or submit your band to the verified touring directory"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200 shrink-0" />
              <span>+ Claim / List Your Band</span>
            </button>

            <button
              onClick={() => setActiveTab("advisor")}
              id="tab-btn-advisor"
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold cursor-pointer rounded-xl transition-all ${
                activeTab === "advisor"
                  ? "bg-white text-slate-950 shadow-xs ring-1 ring-slate-200"
                  : "text-slate-600 hover:text-slate-950 hover:bg-white/80"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <span>Help</span>
            </button>

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
                <span>Owner</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </button>
            )}

            {/* Dynamic Account Action Button: Edit Account if authenticated, Sign In if guest */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5" id="header-authenticated-actions">
                <span 
                  id="header-user-display-badge"
                  className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-slate-800 bg-white border border-slate-200/90 rounded-xl shadow-2xs"
                  title={`Active account: ${isOwnerUser ? "Dr Hadit" : (currentAccount?.name || currentUser?.name || "Dr Hadit")}`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="truncate max-w-[120px] text-slate-900 font-extrabold">
                    {isOwnerUser ? "Dr Hadit" : (currentAccount?.name || currentUser?.name || "Dr Hadit")}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowEditAccountModal(true)}
                  id="tab-btn-edit-account"
                  className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-black cursor-pointer rounded-xl transition-all shadow-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 whitespace-nowrap"
                  title="Edit your account password, view status, or update your band or venue page"
                >
                  <Settings className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Account</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setLoginModalMode("login");
                  setShowUserLoginModal(true);
                }}
                id="tab-btn-sign-in"
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-black cursor-pointer rounded-xl transition-all shadow-xs bg-indigo-600 hover:bg-indigo-500 text-white whitespace-nowrap"
                title="Sign in or register your GigLizard profile"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span>Sign In</span>
              </button>
            )}
          </nav>

        </div>

        {/* Mobile Navigation Dropdown Menu (< md) */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/80 bg-white/98 backdrop-blur-md px-4 py-3 space-y-2.5 animate-in slide-in-from-top-2 duration-150 shadow-xl" id="mobile-nav-dropdown">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setActiveTab("venues"); setIsMobileMenuOpen(false); }}
                className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "venues" ? "bg-indigo-50 text-indigo-900 border border-indigo-200 shadow-xs" : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60"
                }`}
              >
                <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Venues</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("bands"); setIsMobileMenuOpen(false); }}
                className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "bands" ? "bg-amber-50 text-amber-900 border border-amber-200 shadow-xs" : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60"
                }`}
              >
                <Users className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Bands</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("tour"); setIsMobileMenuOpen(false); }}
                className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "tour" ? "bg-indigo-50 text-indigo-900 border border-indigo-200 shadow-xs" : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60"
                }`}
              >
                <Compass className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Tour Master</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("advisor"); setIsMobileMenuOpen(false); }}
                className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "advisor" ? "bg-purple-50 text-purple-900 border border-purple-200 shadow-xs" : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60"
                }`}
              >
                <HelpCircle className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Help & FAQ</span>
              </button>
            </div>

            {/* Full Claim CTA button in mobile menu */}
            <button
              type="button"
              onClick={() => { setShowArtistRegistrationModal(true); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 text-white text-xs font-black shadow-xs cursor-pointer active:scale-98 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-200 shrink-0" />
              <span>+ Claim / List Your Band in Directory</span>
            </button>

            {/* Dynamic Account / Auth Row in mobile menu */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                    <span className="truncate">{isOwnerUser ? "Dr Hadit (Owner)" : (currentAccount?.name || currentUser?.name || "Dr Hadit")}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowEditAccountModal(true); setIsMobileMenuOpen(false); }}
                    className="px-3 py-1.5 text-xs font-black rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 shrink-0"
                  >
                    <Settings className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Account</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => { setLoginModalMode("login"); setShowUserLoginModal(true); setIsMobileMenuOpen(false); }}
                  className="w-full py-2 text-xs font-black rounded-xl bg-indigo-600 text-white flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In to GigLizard</span>
                </button>
              )}

              {currentAccount?.contactEmail?.trim().toLowerCase() === "littlerusty@gmail.com" && (
                <button
                  type="button"
                  onClick={() => { setActiveTab("admin"); setIsMobileMenuOpen(false); }}
                  className="px-3 py-1.5 text-xs font-black rounded-xl bg-amber-500 text-slate-950 flex items-center gap-1 shrink-0"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Owner</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Core Tab Workspace Grid */}
      <main className="flex-grow p-3 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 max-w-full overflow-x-hidden" id="main-content-layout">

        {/* Real-time Toast Feedback Banner */}
        {syncToastMessage && (
          <div 
            id="global-migration-toast-banner"
            className={`p-4 rounded-2xl flex items-center justify-between gap-3 shadow-lg border transition-all animate-in fade-in slide-in-from-top-4 ${
              syncToastMessage.type === "success"
                ? "bg-emerald-950 text-emerald-100 border-emerald-500/50 shadow-emerald-950/20"
                : syncToastMessage.type === "error"
                ? "bg-rose-950 text-rose-100 border-rose-500/50 shadow-rose-950/20"
                : "bg-indigo-950 text-indigo-100 border-indigo-500/50 shadow-indigo-950/20"
            }`}
          >
            <div className="flex items-center gap-3">
              {syncToastMessage.type === "success" ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : syncToastMessage.type === "error" ? (
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                </div>
              )}
              <div>
                <p className="text-xs sm:text-sm font-black">{syncToastMessage.text}</p>
                {syncStatusProgress && (
                  <p className="text-[11px] text-slate-300 font-mono mt-0.5">{syncStatusProgress}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSyncToastMessage(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Temporary Admin / Owner Migration Banner across the app (visible to owner or on admin hash) */}
        {isOwnerUser && (
          <div 
            id="admin-migration-seed-banner"
            className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-amber-400/30 rounded-2xl p-4 sm:p-5 shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                    Admin Tool
                  </span>
                  <span className="text-xs font-bold text-slate-300">
                    Embedded Static Datasets (1,016 Bands & 220 Venues)
                  </span>
                </div>
                <p className="text-xs text-slate-200">
                  Sync static datasets directly into Supabase tables or export offline CSV backups.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSyncToSupabase}
                disabled={isSyncingSupabase}
                id="btn-banner-sync-supabase"
                className={`px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
                  isSyncingSupabase ? "opacity-75 cursor-not-allowed animate-pulse" : ""
                }`}
                title="Batch upsert all static venues and bands into Supabase matching columns"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSupabase ? "animate-spin" : ""}`} />
                <span>{isSyncingSupabase ? "Syncing..." : "Sync Local Bands & Venues to Supabase"}</span>
              </button>

              <button
                type="button"
                onClick={handleExportOfflineCSVs}
                id="btn-banner-export-csv"
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                title="Download offline backup CSVs: giglizard_bands.csv and giglizard_venues.csv"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Export Embedded Bands & Venues as CSV</span>
              </button>
            </div>
          </div>
        )}
        
        {activeTab === "home" && (
          <div className="space-y-6" id="view-home-wrapper">
            <Home 
              currentAccount={currentAccount}
              currentUser={currentUser}
              onSetCurrentUser={setCurrentUser}
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
              bandProfile={bandProfile}
              currentAccount={currentAccount}
              currentUser={currentUser}
              onTriggerLogin={() => {
                setLoginModalMode("login");
                setShowUserLoginModal(true);
              }}
              publicBandId={publicStagePlotBandId}
              onClearPublicView={() => {
                setPublicStagePlotBandId(null);
                try {
                  window.history.pushState(null, "", "#plot");
                } catch (_) {}
              }}
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
              currentUser={currentUser}
              currentAccount={currentAccount}
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
              currentUser={currentUser}
              isAuthLoading={isAuthLoading}
              onUpdateAccount={handleUpdateAccount}
              onTriggerEditAccount={() => setShowEditAccountModal(true)}
              onTriggerUpgrade={() => {
                setShowPayPalModal(true);
              }}
              onTriggerLogin={() => {
                setLoginModalMode("login");
                setShowUserLoginModal(true);
              }}
            />
          </div>
        )}

        {activeTab === "tour" && (
          <div className="space-y-6" id="view-tour-wrapper">
            <TourScheduler 
              bandProfile={bandProfile}
              onSelectVenueForPoster={handleSelectVenueForGig}
              currentUser={currentUser}
              currentAccount={currentAccount}
              onTriggerLogin={() => {
                setLoginModalMode("login");
                setShowUserLoginModal(true);
              }}
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

      {/* High-quality legal and copyright footer */}
      <Footer 
        onOpenTerms={() => setShowTermsModal(true)} 
        onOpenSecurity={() => setShowSecurityModal(true)} 
        onOpenAbout={() => setShowAboutModal(true)}
        onOpenGuarantee={() => setShowGuaranteeModal(true)}
        userEmail={currentAccount?.contactEmail || currentUser?.email || ""}
        userName={currentAccount?.name || ""}
      />

      {/* About & Origin Story Modal */}
      <AboutMissionModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        onSelectTab={setActiveTab}
      />

      {/* 100% Artist Satisfaction Guarantee Modal */}
      <SatisfactionGuaranteeModal
        isOpen={showGuaranteeModal}
        onClose={() => setShowGuaranteeModal(false)}
        onOpenCheckout={() => {
          if (currentAccount) {
            setShowPayPalModal(true);
          } else {
            setActiveTab("home");
            setTimeout(() => {
              document.getElementById("registration-block")?.scrollIntoView({ behavior: "smooth" });
            }, 100);
          }
        }}
      />

      {/* Security & Anti-Scraping Diagnostics Modal */}
      <SecurityShieldModal 
        isOpen={showSecurityModal} 
        onClose={() => setShowSecurityModal(false)} 
      />

      {/* Edit Account Modal */}
      {showEditAccountModal && currentAccount && (
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

      {/* Dedicated Reset Password Recovery Modal */}
      <ResetPasswordModal
        isOpen={showResetPasswordModal}
        onClose={() => {
          setShowResetPasswordModal(false);
          if (
            window.location.hash.includes("reset-password") || 
            window.location.hash.includes("type=recovery") || 
            window.location.hash.includes("access_token")
          ) {
            window.location.hash = "";
            try {
              window.history.replaceState(null, "", window.location.pathname + window.location.search);
            } catch (_) {}
          }
        }}
        onSuccessLoginRedirect={() => {
          setShowResetPasswordModal(false);
          setLoginModalMode("login");
          setShowUserLoginModal(true);
        }}
      />

      {/* Global User Login, Registration, and Forgot Password Modal */}
      <UserLoginModal
        isOpen={showUserLoginModal}
        onClose={() => setShowUserLoginModal(false)}
        initialMode={loginModalMode}
        initialEmail={loginModalEmail}
        onLoginSuccess={(account) => {
          handleUpdateAccount(account);
          setShowUserLoginModal(false);
        }}
        onOpenCheckout={() => setShowPayPalModal(true)}
      />

      {/* Formal Terms of Service Modal */}
      <TermsOfServiceModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />

      {/* Artist Directory Registration Modal */}
      <ArtistRegistrationModal
        isOpen={showArtistRegistrationModal}
        onClose={() => setShowArtistRegistrationModal(false)}
        onNavigateToBands={() => {
          setShowArtistRegistrationModal(false);
          setActiveTab("bands");
        }}
        onBandRegistered={() => {
          setActiveTab("bands");
        }}
      />

      {/* Android Back Button Double-Tap Exit Toast */}
      {showExitToast && (
        <div 
          id="android-back-exit-toast"
          role="status"
          aria-live="polite"
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[10000] px-4 py-2.5 bg-slate-900/95 text-slate-100 text-xs font-semibold rounded-full shadow-2xl border border-slate-700/80 backdrop-blur-md flex items-center gap-2 pointer-events-none transition-all"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Press back again to exit GigLizard</span>
        </div>
      )}
    </div>
  );
}

export { GigLizardApp as App };
