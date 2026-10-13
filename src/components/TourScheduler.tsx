import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  TourPlan, 
  TourStop, 
  TourVenueStop, 
  TourLodgingOption, 
  TourSelectedVenue, 
  TourSelectedLodging,
  BandProfile,
  Venue,
  UserAccount
} from "../types";
import { MUSIC_VENUES } from "../data/venues";
import { findLodgingForCity, getCityHotelPhone } from "../utils/tourLodgingData";
import { 
  buildDynamicGoogleMapsUrl, 
  calculateTourFinancials, 
  formatPersonalizedItineraryText 
} from "../utils/tourRouteHelpers";
import { 
  calculateCorridorStops, 
  recalculateStopsMetrics, 
  KNOWN_CORRIDOR_CITIES,
  CorridorCity,
  formatDriveTime,
  detectDuplicateReturnStops,
  diversifyTourRoute,
  DuplicateReturnAnalysis,
  RouteDiversificationResult
} from "../utils/corridorOptimizer";
import { 
  supabase,
  saveTourToDatabase, 
  fetchUserTours, 
  deleteTourFromDatabase, 
  fetchVenuesFromDatabaseForCity,
  SavedTourRecord
} from "../lib/supabase";
import { TourPrintModal } from "./TourPrintModal";
import { TourLodgingModal, parseNightlyRate, parseBookingConfirmationSnippet, calculateStayCost } from "./TourLodgingModal";
import { generateLodgingDeepLinks, getTourStopLodgingDates } from "../utils/lodgingAffiliateLinks";
import { runTourReadinessAudit, TourReadinessReport } from "../utils/tourAuditEngine";
import { TourMap } from "./TourMap";
import { 
  MapPin, 
  Navigation, 
  Compass, 
  Calendar, 
  Clock, 
  Fuel, 
  DollarSign, 
  Hotel, 
  Building, 
  Share2, 
  Printer, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  ExternalLink, 
  AlertCircle, 
  AlertTriangle,
  ChevronRight, 
  ChevronLeft,
  Info, 
  CheckCircle2, 
  Music,
  Bookmark,
  RotateCcw,
  RefreshCw,
  Search,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  Save,
  ArrowLeftRight,
  Eye,
  Sliders,
  Car,
  Receipt,
  Mail,
  Send,
  ShieldAlert,
  Lock,
  Globe,
  Shield,
  Phone,
  User,
  Clipboard,
  Pencil
} from "lucide-react";

/**
 * Helper to compute check-in (show night) and check-out (following morning)
 */
const getStopCheckInAndOut = (stop: TourStop, tourStartDate: string, stopIndex: number) => {
  let checkIn = stop.date;
  if (!checkIn || !/^\d{4}-\d{2}-\d{2}$/.test(checkIn)) {
    try {
      const base = new Date(tourStartDate || new Date().toISOString().split("T")[0]);
      if (!isNaN(base.getTime())) {
        base.setDate(base.getDate() + stopIndex);
        checkIn = base.toISOString().split("T")[0];
      } else {
        const now = new Date();
        now.setDate(now.getDate() + stopIndex);
        checkIn = now.toISOString().split("T")[0];
      }
    } catch {
      checkIn = new Date().toISOString().split("T")[0];
    }
  }

  let checkOut = "";
  try {
    const parts = checkIn.split("-");
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    d.setDate(d.getDate() + 1);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    checkOut = `${yr}-${mo}-${day}`;
  } catch {
    checkOut = checkIn;
  }

  return { checkIn, checkOut };
};

/**
 * Format YYYY-MM-DD into readable date like "Fri, Nov 14, 2026"
 */
const formatReadableDate = (dateStr: string) => {
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    }
  } catch {}
  return dateStr;
};

/**
 * Generate pre-filtered lodging search links targeting low-cost, band-friendly accommodations
 * with parking suitable for vans or trailers.
 */
const generateHotelSearchUrls = (city: string, state: string, checkIn: string, checkOut: string) => {
  const fullCity = state ? `${city}, ${state}` : city;

  // Hotels.com query with price low-to-high and parking destination term
  const hotelsDotComUrl = `https://www.hotels.com/Hotel-Search?destination=${encodeURIComponent(
    fullCity
  )}&startDate=${checkIn}&endDate=${checkOut}&adults=2&sort=PRICE_LOW_TO_HIGH`;

  // Booking.com query with free parking filter (nflt=hotelfacility%3D2%3B) and lowest price first
  const bookingDotComUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
    fullCity
  )}&checkin=${checkIn}&checkout=${checkOut}&group_adults=2&no_rooms=1&order=price&nflt=hotelfacility%3D2%3B`;

  // Google Hotels search targeting trailer/van parking & budget motel
  const googleHotelsUrl = `https://www.google.com/travel/hotels/${encodeURIComponent(
    fullCity
  )}?q=${encodeURIComponent(`${fullCity} budget motel van trailer parking`)}&dates=${checkIn},${checkOut}`;

  return { hotelsDotComUrl, bookingDotComUrl, googleHotelsUrl };
};

interface TourSchedulerProps {
  bandProfile?: BandProfile;
  onSelectVenueForPoster?: (venueName: string, city: string) => void;
  onNavigateToBooking?: (venueName: string) => void;
  currentUser?: any;
  currentAccount?: UserAccount | null;
  onTriggerLogin?: () => void;
  onNavigateToHome?: () => void;
}

type ViewState = "landing" | "history" | "wizard";

const STORAGE_ACTIVE_DRAFT = "giglizard_active_tour_plan_v2";
const STORAGE_PENDING_DRAFT = "giglizard_pending_tour_draft";

export const TourScheduler: React.FC<TourSchedulerProps> = ({
  bandProfile,
  onSelectVenueForPoster,
  currentUser,
  currentAccount,
  onTriggerLogin,
  onNavigateToHome
}) => {
  // Navigation & View Mode
  const [viewState, setViewState] = useState<ViewState>("landing");
  const [wizardStep, setWizardStep] = useState<number>(1); // 1: Setup, 2: Optimization, 3: Stages, 4: Lodging, 5: Review

  // Saved tours list
  const [savedTours, setSavedTours] = useState<SavedTourRecord[]>([]);
  const [isLoadingTours, setIsLoadingTours] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"all" | "draft" | "confirmed">("all");

  // Active tour state
  const [tourId, setTourId] = useState<string>("");
  const [tourTitle, setTourTitle] = useState("");
  const [originCity, setOriginCity] = useState("Seattle, WA");
  const [destinationCity, setDestinationCity] = useState("Medford, OR");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [stops, setStops] = useState<TourStop[]>([]);
  const [totalDistanceMiles, setTotalDistanceMiles] = useState(0);
  const [totalDriveTime, setTotalDriveTime] = useState("");
  const [tourStatus, setTourStatus] = useState<"draft" | "confirmed">("draft");

  // Vehicle & MPG configuration and Round-Trip Loop toggle
  const [vehicleType, setVehicleType] = useState("15-Passenger Touring Van");
  const [vehicleMpg, setVehicleMpg] = useState(14);
  const [isRoundTripLoop, setIsRoundTripLoop] = useState(false);

  // Return Leg Diversification (Loop / Alternate Cities) state
  const [isReturnDiversified, setIsReturnDiversified] = useState(true);
  const [originalUndiversifiedStops, setOriginalUndiversifiedStops] = useState<TourStop[]>([]);
  const [replacedLoopPairs, setReplacedLoopPairs] = useState<
    Array<{ originalCity: string; newCity: string; newState: string; highway: string; highlight: string }>
  >([]);

  // Detect duplicate return stops on out-and-back routes
  const duplicateReturnAnalysis = useMemo<DuplicateReturnAnalysis>(() => {
    return detectDuplicateReturnStops(stops);
  }, [stops]);

  // Step 3 City-by-City stage & lodging navigation
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [cityVenuesMap, setCityVenuesMap] = useState<Record<string, Venue[]>>({});
  const [isLoadingVenues, setIsLoadingVenues] = useState(false);
  const [customVenueMode, setCustomVenueMode] = useState<Record<string, boolean>>({});
  const [customStageType, setCustomStageType] = useState<Record<string, "house_show" | "public_venue">>({});
  const [customStageInputs, setCustomStageInputs] = useState<
    Record<string, {
      hostName?: string;
      address?: string;
      hostPhone?: string;
      loadInNotes?: string;
      suggestedDonation?: string;
      name?: string;
      contactName?: string;
      contactPhone?: string;
      contactEmail?: string;
      capacity?: string;
      soundSpecs?: string;
    }>
  >({});
  const [isSubmittingCustomStage, setIsSubmittingCustomStage] = useState(false);

  // Step 3 Interstitial Lodging Prompt & Inline Lodging Module per stop
  const [interstitialLodgingPromptStop, setInterstitialLodgingPromptStop] = useState<number | null>(null);
  const [inlineLodgingStopIndex, setInlineLodgingStopIndex] = useState<number | null>(null);
  const [skippedLodgingMap, setSkippedLodgingMap] = useState<Record<number, boolean>>({});
  const [lodgingCategoryFilter, setLodgingCategoryFilter] = useState<"all" | "hotels" | "campgrounds" | "free">("all");
  const [customLodgingInputs, setCustomLodgingInputs] = useState<
    Record<number, { name: string; confirmationNumber: string; cost: string; notes: string }>
  >({});

  // Step 2 Edit Tour Stop State (City Switching & Real-Time Itinerary Recalculation)
  const [editingStopIndex, setEditingStopIndex] = useState<number | null>(null);
  const [editStopCity, setEditStopCity] = useState("");
  const [editStopState, setEditStopState] = useState("");
  const [editStopDate, setEditStopDate] = useState("");
  const [editStopNotes, setEditStopNotes] = useState("");
  const [editStopRoutingPriority, setEditStopRoutingPriority] = useState("");

  // Step 4 City-by-City lodging navigation & confirmation snippets
  const [activeLodgingIndex, setActiveLodgingIndex] = useState(0);
  const [pastedConfirmationSnippet, setPastedConfirmationSnippet] = useState<Record<number, string>>({});
  const [inlineHotelEditKey, setInlineHotelEditKey] = useState<string | null>(null);

  // In-app lodging booking modal state
  const [bookingModalStopIndex, setBookingModalStopIndex] = useState<number | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Email Itinerary Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [recipientEmailsInput, setRecipientEmailsInput] = useState("");
  const [emailNotesInput, setEmailNotesInput] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailDispatchResult, setEmailDispatchResult] = useState<{ success: boolean; count: number; recipients: string[] } | null>(null);

  // Live Tour Readiness Pre-Flight Audit
  const tourAuditReport: TourReadinessReport = useMemo(() => {
    return runTourReadinessAudit(stops);
  }, [stops]);

  // References to keep event listeners always pointing to latest state
  const wizardStepRef = useRef(wizardStep);
  wizardStepRef.current = wizardStep;

  const viewStateRef = useRef(viewState);
  viewStateRef.current = viewState;

  const bookingModalStopIndexRef = useRef(bookingModalStopIndex);
  bookingModalStopIndexRef.current = bookingModalStopIndex;

  const showPrintModalRef = useRef(showPrintModal);
  showPrintModalRef.current = showPrintModal;

  // 1. Wizard History State Synchronization:
  // Advances or updates wizard step and pushes history entry
  const goToWizardStep = (newStep: number, pushHistory = true) => {
    setWizardStep(newStep);
    if (pushHistory) {
      try {
        window.history.pushState({ wizardStep: newStep, isTourPlanner: true }, "");
      } catch (_) {}
    }
  };

  const handleOpenBookingModal = (stopIdx: number) => {
    setBookingModalStopIndex(stopIdx);
    try {
      window.history.pushState(
        { wizardStep: wizardStepRef.current, isTourPlanner: true, modal: "lodging", stopIndex: stopIdx },
        ""
      );
    } catch (_) {}
  };

  const handleOpenPrintModal = () => {
    setShowPrintModal(true);
    try {
      window.history.pushState(
        { wizardStep: wizardStepRef.current, isTourPlanner: true, modal: "print" },
        ""
      );
    } catch (_) {}
  };

  // Restore wizard step if state exists on initial mount
  useEffect(() => {
    try {
      if (window.history.state?.wizardStep) {
        setWizardStep(window.history.state.wizardStep);
        setViewState("wizard");
      }
    } catch (_) {}
  }, []);

  // 2. Intercept Edge-Swipe (popstate) & Hardware Back (giglizard_back_press) Events:
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // 1. If any inner modal is open, close it first and prevent further back actions
      if (bookingModalStopIndexRef.current !== null) {
        setBookingModalStopIndex(null);
        e.preventDefault?.();
        return;
      }
      if (showPrintModalRef.current) {
        setShowPrintModal(false);
        e.preventDefault?.();
        return;
      }

      // 2. If inside the wizard and on wizardStep > 1:
      // Prevent default app exit and decrement wizard step
      if (viewStateRef.current === "wizard" && wizardStepRef.current > 1) {
        e.preventDefault?.();
        const currentStep = wizardStepRef.current;
        const targetStep = (e.state && typeof e.state.wizardStep === "number" && e.state.wizardStep < currentStep)
          ? e.state.wizardStep
          : currentStep - 1;

        setWizardStep(Math.max(1, targetStep));

        // Reset scroll to top on step back
        try {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
          const tourScrollContainer = document.getElementById("tour-wizard-container");
          if (tourScrollContainer) tourScrollContainer.scrollTop = 0;
        } catch (_) {}
        return;
      }

      // 3. If on wizardStep === 1 and the user swipes back:
      // Transition activeTab back to 'home' instead of allowing the app shell/PWA to close
      if (viewStateRef.current === "wizard" && wizardStepRef.current === 1) {
        e.preventDefault?.();
        if (onNavigateToHome) {
          onNavigateToHome();
        } else {
          try {
            window.history.pushState({ tab: "home" }, "", "#home");
            window.dispatchEvent(new CustomEvent("giglizard_switch_tab", { detail: { tab: "home" } }));
          } catch (_) {}
        }
        return;
      }

      // 4. If in history view, step back to landing
      if (viewStateRef.current === "history") {
        e.preventDefault?.();
        setViewState("landing");
        return;
      }
    };

    const handleBackButton = (e: Event) => {
      // 1. Check inner modals
      if (bookingModalStopIndexRef.current !== null) {
        setBookingModalStopIndex(null);
        e.preventDefault();
        return;
      }
      if (showPrintModalRef.current) {
        setShowPrintModal(false);
        e.preventDefault();
        return;
      }

      // 2. Wizard back navigation
      if (viewStateRef.current === "wizard") {
        if (wizardStepRef.current > 1) {
          e.preventDefault();
          if (window.history.length > 1) {
            window.history.back();
          } else {
            setWizardStep(prev => Math.max(1, prev - 1));
          }
          return;
        } else {
          // wizardStep === 1: go home
          e.preventDefault();
          if (onNavigateToHome) {
            onNavigateToHome();
          } else {
            window.dispatchEvent(new CustomEvent("giglizard_switch_tab", { detail: { tab: "home" } }));
          }
          return;
        }
      }

      // 3. Saved history view
      if (viewStateRef.current === "history") {
        setViewState("landing");
        e.preventDefault();
        return;
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("giglizard_back_press", handleBackButton);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("giglizard_back_press", handleBackButton);
    };
  }, [onNavigateToHome]);

  // Scroll restoration: reset window and tour container scroll on step or stop index changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const tourScrollContainer = document.getElementById("tour-wizard-container");
    if (tourScrollContainer) tourScrollContainer.scrollTop = 0;
  }, [wizardStep, activeStageIndex, activeLodgingIndex]);

  // UI helpers & Feedback
  const [saveToast, setSaveToast] = useState<{ show: boolean; message: string; type: "success" | "info" }>({
    show: false,
    message: "",
    type: "success"
  });
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // New waypoint input in Step 2
  const [newWaypointInput, setNewWaypointInput] = useState("");

  const effectiveUserId = currentUser?.id || currentAccount?.id || null;

  // Load user's saved tours from Supabase on mount
  const refreshTours = async () => {
    setIsLoadingTours(true);
    try {
      const records = await fetchUserTours(effectiveUserId);
      setSavedTours(records);
    } catch (err) {
      console.warn("Could not load saved tours:", err);
    } finally {
      setIsLoadingTours(false);
    }
  };

  useEffect(() => {
    refreshTours();
  }, [effectiveUserId]);

  // Check if user authenticated while a pending tour draft was preserved
  useEffect(() => {
    if (effectiveUserId) {
      try {
        const pendingStr = localStorage.getItem(STORAGE_PENDING_DRAFT);
        if (pendingStr) {
          const parsed = JSON.parse(pendingStr);
          if (parsed && parsed.route_data) {
            saveTourToDatabase({
              id: parsed.id,
              user_id: effectiveUserId,
              name: parsed.name,
              status: parsed.status || "draft",
              route_data: parsed.route_data
            }).then(() => {
              localStorage.removeItem(STORAGE_PENDING_DRAFT);
              triggerToast("✓ In-progress tour synced with your account!", "success");
              refreshTours();
            });
          }
        }
      } catch (_) {}
    }
  }, [effectiveUserId]);

  const triggerToast = (message: string, type: "success" | "info" = "success") => {
    setSaveToast({ show: true, message, type });
    setTimeout(() => {
      setSaveToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  // Convert active stops to TourPlan format for map, export, and print
  const currentTourPlan: TourPlan = useMemo(() => {
    return {
      tourTitle: tourTitle || `${originCity} to ${destinationCity} Tour`,
      bandName: bandProfile?.name || "Touring Artist",
      startingCity: originCity,
      destinationCity,
      totalDistanceMiles,
      totalDriveTime,
      routeDescription: `${stops.length} performance dates along the driving corridor.`,
      stops,
      tourTips: [
        "Pack backup DI boxes and labeled cables.",
        "Verify venue power voltages and load-in bay height.",
        "Always park vans facing out under well-lit camera coverage."
      ],
      googleMapsDirectionsUrl: buildDynamicGoogleMapsUrl(stops)
    };
  }, [tourTitle, originCity, destinationCity, totalDistanceMiles, totalDriveTime, stops, bandProfile]);

  const financials = useMemo(() => {
    return calculateTourFinancials(stops);
  }, [stops]);

  // Handle starting a fresh tour
  const handleStartNewTour = () => {
    const defaultName = bandProfile?.name 
      ? `${bandProfile.name} Regional Tour` 
      : "West Coast Club Tour";
    setTourId(`tour-${Date.now()}`);
    setTourTitle(defaultName);
    setOriginCity("Seattle, WA");
    setDestinationCity("Medford, OR");
    setStops([]);
    setTotalDistanceMiles(0);
    setTotalDriveTime("");
    setTourStatus("draft");
    setWizardStep(1);
    setViewState("wizard");
  };

  // Preset quick starters
  const handleApplyPreset = (presetName: string, startCity: string, intermediateCities: string[], endCity: string) => {
    setTourId(`tour-${Date.now()}`);
    setTourTitle(presetName);
    setOriginCity(startCity);
    setDestinationCity(endCity);
    
    // Auto optimize with dates
    const res = calculateCorridorStops(startCity, endCity, startDate, endDate);
    
    // If specific intermediate cities requested, adjust
    if (intermediateCities.length > 0) {
      const customChain = [startCity, ...intermediateCities, endCity];
      const customStops: TourStop[] = customChain.map((cityStr, idx) => {
        const parts = cityStr.split(",").map(p => p.trim());
        const cCity = parts[0];
        const cState = parts[1] || "WA";
        return {
          id: `stop-${idx + 1}-${cCity.toLowerCase().replace(/\s+/g, "-")}`,
          stopName: idx === 0 ? `Kickoff: ${cCity}` : (idx === customChain.length - 1 ? `Finale: ${cCity}` : `Stop ${idx + 1}: ${cCity}`),
          city: cCity,
          state: cState,
          dayNumber: idx + 1,
          date: new Date(new Date(startDate).getTime() + idx * 86400000).toISOString().split("T")[0],
          driveTimeFromPrev: idx === 0 ? "0 hrs (Kickoff)" : "2 hr 30 min",
          distanceMilesFromPrev: idx === 0 ? 0 : 140,
          routeHighlight: `Drive along main highway to ${cCity}.`,
          localSceneNotes: "Live music hub.",
          suggestedVenues: [],
          lodgingOptions: findLodgingForCity(cCity, cState)
        };
      });
      const recal = recalculateStopsMetrics(customStops, startDate);
      setStops(recal.updatedStops);
      setTotalDistanceMiles(recal.totalDistanceMiles);
      setTotalDriveTime(recal.totalDriveTime);
    } else {
      setStops(res.stops);
      setTotalDistanceMiles(res.totalDistanceMiles);
      setTotalDriveTime(res.totalDriveTime);
    }

    setTourStatus("draft");
    setWizardStep(2);
    setViewState("wizard");
  };

  // Step 1 -> Step 2: Trigger corridor optimization
  const handleProceedToOptimization = () => {
    if (!originCity.trim() || !destinationCity.trim()) {
      alert("Please provide both an Origin City and Destination City.");
      return;
    }

    const res = calculateCorridorStops(originCity, destinationCity, startDate, endDate);
    const generatedStops = res.stops;

    if (isRoundTripLoop && generatedStops.length > 0) {
      // Generate return leg stops back to starting city
      const intermediates = generatedStops.slice(1, generatedStops.length - 1).reverse();
      const returnStops: TourStop[] = intermediates.map((stop, rIdx) => ({
        ...stop,
        id: `return-${stop.id || rIdx}-${Date.now()}`,
        stopName: `Return Leg: ${stop.city}`,
        selectedVenue: undefined,
        selectedLodging: undefined
      }));

      const originParts = originCity.split(",").map(p => p.trim());
      const oCity = originParts[0];
      const oState = originParts[1] || "WA";

      const homeStop: TourStop = {
        id: `return-home-${Date.now()}`,
        stopName: `Homecoming Finale: ${oCity}`,
        city: oCity,
        state: oState,
        dayNumber: generatedStops.length + returnStops.length + 1,
        date: "",
        driveTimeFromPrev: "2 hr 30 min",
        distanceMilesFromPrev: 130,
        routeHighlight: `Final return leg to kickoff city ${oCity}. Complete round-trip tour loop!`,
        localSceneNotes: "Celebratory homecoming tour wrap-up show.",
        suggestedVenues: [],
        lodgingOptions: findLodgingForCity(oCity, oState)
      };

      const fullChain = [...generatedStops, ...returnStops, homeStop];
      const recal = recalculateStopsMetrics(fullChain, startDate);
      setOriginalUndiversifiedStops(recal.updatedStops);

      if (isReturnDiversified) {
        const divRes = diversifyTourRoute(recal.updatedStops, startDate);
        setStops(divRes.updatedStops);
        setReplacedLoopPairs(divRes.replacedPairs);
        setTotalDistanceMiles(divRes.totalDistanceMiles);
        setTotalDriveTime(divRes.totalDriveTime);
      } else {
        setStops(recal.updatedStops);
        setReplacedLoopPairs([]);
        setTotalDistanceMiles(recal.totalDistanceMiles);
        setTotalDriveTime(recal.totalDriveTime);
      }
    } else {
      setStops(res.stops);
      setOriginalUndiversifiedStops([]);
      setReplacedLoopPairs([]);
      setTotalDistanceMiles(res.totalDistanceMiles);
      setTotalDriveTime(res.totalDriveTime);
    }
    setWizardStep(2);
  };

  // Step 2: Toggle Diversify Return Route (Loop / Alternate Cities)
  const handleToggleReturnDiversification = (shouldDiversify: boolean) => {
    setIsReturnDiversified(shouldDiversify);
    if (shouldDiversify) {
      const baseStops = originalUndiversifiedStops.length > 0 ? originalUndiversifiedStops : stops;
      if (originalUndiversifiedStops.length === 0) {
        setOriginalUndiversifiedStops(stops);
      }
      const divRes = diversifyTourRoute(baseStops, startDate);
      setStops(divRes.updatedStops);
      setReplacedLoopPairs(divRes.replacedPairs);
      setTotalDistanceMiles(divRes.totalDistanceMiles);
      setTotalDriveTime(divRes.totalDriveTime);
      triggerToast(`✓ Diversified ${divRes.replacedPairs.length} return stops into circular loop!`, "success");
    } else {
      if (originalUndiversifiedStops.length > 0) {
        const recal = recalculateStopsMetrics(originalUndiversifiedStops, startDate);
        setStops(recal.updatedStops);
        setReplacedLoopPairs([]);
        setTotalDistanceMiles(recal.totalDistanceMiles);
        setTotalDriveTime(recal.totalDriveTime);
        triggerToast("Reverted to direct return corridor stops.", "info");
      }
    }
  };

  // Step 2 Stop manipulations
  const handleMoveStop = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index <= 0) return;
    if (direction === "down" && index >= stops.length - 1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const reordered = [...stops];
    const temp = reordered[index];
    reordered[index] = reordered[newIndex];
    reordered[newIndex] = temp;

    const recalculated = recalculateStopsMetrics(reordered, startDate);
    setStops(recalculated.updatedStops);
    setTotalDistanceMiles(recalculated.totalDistanceMiles);
    setTotalDriveTime(recalculated.totalDriveTime);
  };

  const handleRemoveStop = (index: number) => {
    if (stops.length <= 2) {
      alert("A tour route requires at least an origin and a destination stop.");
      return;
    }
    const filtered = stops.filter((_, i) => i !== index);
    const recalculated = recalculateStopsMetrics(filtered, startDate);
    setStops(recalculated.updatedStops);
    setTotalDistanceMiles(recalculated.totalDistanceMiles);
    setTotalDriveTime(recalculated.totalDriveTime);
  };

  const handleAddWaypoint = (cityToAdd?: string) => {
    const raw = (cityToAdd || newWaypointInput).trim();
    if (!raw) return;

    const parts = raw.split(",").map(p => p.trim());
    const cCity = parts[0];
    const cState = parts[1] || "WA";

    // Insert before destination stop
    const destStop = stops[stops.length - 1];
    const intermediateStops = stops.slice(0, -1);

    const newStop: TourStop = {
      id: `stop-${Date.now()}-${cCity.toLowerCase().replace(/\s+/g, "-")}`,
      stopName: `Stop: ${cCity}`,
      city: cCity,
      state: cState,
      dayNumber: stops.length,
      date: new Date(new Date(startDate).getTime() + (stops.length - 1) * 86400000).toISOString().split("T")[0],
      driveTimeFromPrev: "1 hr 45 min",
      distanceMilesFromPrev: 95,
      routeHighlight: `Intermediate stop in ${cCity}, ${cState}.`,
      localSceneNotes: "Active regional touring market.",
      suggestedVenues: [],
      lodgingOptions: findLodgingForCity(cCity, cState)
    };

    const combined = [...intermediateStops, newStop, destStop];
    const recalculated = recalculateStopsMetrics(combined, startDate);
    setStops(recalculated.updatedStops);
    setTotalDistanceMiles(recalculated.totalDistanceMiles);
    setTotalDriveTime(recalculated.totalDriveTime);
    setNewWaypointInput("");
  };

  // Step 2: Edit Tour Stop methods (City switching, date adjustment & route recalculation)
  const handleOpenEditStop = (index: number) => {
    const target = stops[index];
    if (!target) return;
    setEditingStopIndex(index);
    setEditStopCity(target.city);
    setEditStopState(target.state || "WA");
    setEditStopDate(target.date || "");
    setEditStopNotes(target.customNotes || target.localSceneNotes || "");
    setEditStopRoutingPriority(target.routeHighlight || "Essential Tour Stop (Anchor Market)");
  };

  const handleCancelEditStop = () => {
    setEditingStopIndex(null);
    setEditStopCity("");
    setEditStopState("");
    setEditStopDate("");
    setEditStopNotes("");
    setEditStopRoutingPriority("");
  };

  const handleSaveEditStop = (index: number) => {
    if (index < 0 || index >= stops.length) return;
    const trimmedCity = editStopCity.trim();
    if (!trimmedCity) {
      triggerToast("Please enter a valid city name.", "info");
      return;
    }
    const trimmedState = editStopState.trim().toUpperCase() || "WA";
    const oldStop = stops[index];
    const cityOrStateChanged =
      oldStop.city.trim().toLowerCase() !== trimmedCity.toLowerCase() ||
      oldStop.state.trim().toLowerCase() !== trimmedState.toLowerCase();

    const updatedStops = [...stops];
    const updatedStop: TourStop = {
      ...oldStop,
      city: trimmedCity,
      state: trimmedState,
      stopName: `Stop: ${trimmedCity}`,
      date: editStopDate || oldStop.date,
      customNotes: editStopNotes,
      localSceneNotes: editStopNotes || oldStop.localSceneNotes,
      routeHighlight: editStopRoutingPriority || oldStop.routeHighlight
    };

    if (cityOrStateChanged) {
      // Reset or re-query recommended venues and lodging options for that newly chosen city
      updatedStop.selectedVenue = undefined;
      updatedStop.selectedLodging = undefined;
      updatedStop.suggestedVenues = [];
      updatedStop.lodgingOptions = findLodgingForCity(trimmedCity, trimmedState);

      // Invalidate existing venue cache for the new key to force re-query
      const newCacheKey = `${trimmedCity}_${trimmedState}`;
      setCityVenuesMap(prev => {
        const copy = { ...prev };
        delete copy[newCacheKey];
        delete copy[trimmedCity];
        return copy;
      });

      // Eagerly pre-query venues for the newly chosen city
      loadVenuesForStageCity(trimmedCity, trimmedState);
    }

    updatedStops[index] = updatedStop;

    // Recalculate transit mileage, drive time, and van gas budget for all route legs
    const recal = recalculateStopsMetrics(updatedStops, startDate);
    setStops(recal.updatedStops);
    setTotalDistanceMiles(recal.totalDistanceMiles);
    setTotalDriveTime(recal.totalDriveTime);

    // Sync tour origin or destination if the terminal stops were edited
    if (index === 0) {
      setOriginCity(`${trimmedCity}, ${trimmedState}`);
    } else if (index === updatedStops.length - 1) {
      setDestinationCity(`${trimmedCity}, ${trimmedState}`);
    }

    setEditingStopIndex(null);
    triggerToast(
      `✓ Stop #${index + 1} updated to ${trimmedCity}, ${trimmedState}. Route and itinerary recalculated!`,
      "success"
    );
  };

  // Step 2 -> Step 3: Advance to City-by-City stage setup
  const handleProceedToStages = () => {
    if (stops.length < 2) {
      alert("Please confirm at least two tour stops.");
      return;
    }
    setActiveStageIndex(0);
    setWizardStep(3);
    if (stops[0]) {
      loadVenuesForStageCity(stops[0].city, stops[0].state);
    }
  };

  // Loads venues for a specific city with strict state/province precision
  const loadVenuesForStageCity = async (cityName: string, stateName?: string) => {
    const cacheKey = stateName ? `${cityName}_${stateName}` : cityName;
    if (cityVenuesMap[cacheKey] && cityVenuesMap[cacheKey].length > 0) return;
    setIsLoadingVenues(true);
    try {
      // 1. Query Supabase public.venues strictly checking city and state
      let remoteVenues: Venue[] = [];
      try {
        let query = supabase
          .from("venues")
          .select("*")
          .ilike("city", `%${cityName.trim()}%`);

        if (stateName && stateName.trim()) {
          const s = stateName.trim().toUpperCase();
          if (s === "BC") {
            // Strictly BC / Canada
            query = query.or("state.eq.BC,state_province.eq.BC,country.eq.CA,country.eq.Canada");
          } else if (s === "WA") {
            // Strictly Washington State, not BC
            query = query.or("state.eq.WA,state_province.eq.WA");
          } else {
            query = query.or(`state.eq.${s},state_province.eq.${s}`);
          }
        }

        const { data, error } = await query;
        if (!error && data && Array.isArray(data)) {
          remoteVenues = data.map((v: any) => ({
            id: v.id || `venue-db-${v.name?.toLowerCase().replace(/\s+/g, "-")}`,
            name: v.name || "Live Venue",
            city: v.city || cityName,
            state: v.state || v.state_province || stateName,
            country: v.country || (stateName?.toUpperCase() === "BC" ? "CA" : "US"),
            address: v.address || `${cityName}, ${v.state || stateName || ""}`.trim(),
            capacity: Number(v.capacity) || 150,
            genres: Array.isArray(v.genres_accepted) 
              ? v.genres_accepted 
              : (v.genres_accepted ? String(v.genres_accepted).split(",").map((g: string) => g.trim()) : ["Live Music"]),
            contactEmail: v.booking_email || v.email || "",
            contactPhone: v.phone || "Inquire",
            website: v.website || undefined,
            hasPA: true,
            hasLighting: true,
            description: v.description || `Live music venue located in ${cityName}.`
          }));
        }
      } catch (err) {
        console.warn("Could not query Supabase venues:", err);
      }
      
      // 2. Query local curated MUSIC_VENUES & localStorage custom_venues_v1
      const localCustom: Venue[] = (() => {
        try {
          return JSON.parse(localStorage.getItem("custom_venues_v1") || "[]");
        } catch { return []; }
      })();
      const allLocal = [...MUSIC_VENUES, ...localCustom];
      const matchedLocal = allLocal.filter(v => {
        const cityMatch = v.city.toLowerCase() === cityName.toLowerCase() ||
          v.city.toLowerCase().includes(cityName.toLowerCase()) || 
          cityName.toLowerCase().includes(v.city.toLowerCase());
        if (!cityMatch) return false;

        if (stateName) {
          const s = stateName.toUpperCase();
          if (s === "BC") {
            // Strictly BC / Canada venues (Rickshaw, Commodore Ballroom, Cobalt, Biltmore, Fox, Wise Hall)
            // DO NOT return venues located in WA / Washington State
            return v.state?.toUpperCase() === "BC" || v.country?.toUpperCase() === "CA" || v.address?.includes("BC");
          }
          if (s === "WA") {
            // Strictly WA / US venues
            return (v.state?.toUpperCase() === "WA" || v.address?.includes(", WA")) &&
                   v.state?.toUpperCase() !== "BC" &&
                   !v.address?.includes("BC");
          }
          if (v.state) {
            return v.state.toUpperCase() === s;
          }
        }
        return true;
      });

      // Merge and deduplicate
      const seenNames = new Set<string>();
      const merged: Venue[] = [];
      [...remoteVenues, ...matchedLocal].forEach(v => {
        const key = v.name.toLowerCase().trim();
        if (!seenNames.has(key)) {
          seenNames.add(key);
          merged.push(v);
        }
      });

      setCityVenuesMap(prev => ({ 
        ...prev, 
        [cacheKey]: merged,
        [cityName]: merged 
      }));
    } catch (err) {
      console.warn("Could not query city venues:", err);
    } finally {
      setIsLoadingVenues(false);
    }
  };

  // Select venue for current stop (1-click from directory)
  const handleSelectVenueForStop = (stopIdx: number, venue: Venue) => {
    setStops(prev => {
      return prev.map((target, idx) => {
        if (idx !== stopIdx) return target;
        return {
          ...target,
          selectedVenue: {
            id: venue.id,
            name: venue.name,
            city: venue.city,
            address: venue.address || `${venue.city}, ${target.state}`,
            contactEmail: venue.contactEmail,
            contactPhone: venue.contactPhone,
            capacity: venue.capacity,
            loadInTime: target.selectedVenue?.loadInTime || "5:00 PM",
            soundcheckTime: target.selectedVenue?.soundcheckTime || "6:30 PM",
            doorsTime: target.selectedVenue?.doorsTime || "7:30 PM",
            setTime: target.selectedVenue?.setTime || "9:00 PM",
            ticketPrice: target.selectedVenue?.ticketPrice || "$12 Adv / $15 Door",
            bookingStatus: target.selectedVenue?.bookingStatus || "confirmed",
            doorGuarantee: target.selectedVenue?.doorGuarantee || "$350 Guarantee",
            doorSplitPercentage: target.selectedVenue?.doorSplitPercentage || "80% Door Split",
            website: venue.website
          }
        };
      });
    });

    // Immediately prompt for lodging in this city!
    setInterstitialLodgingPromptStop(stopIdx);
    setInlineLodgingStopIndex(null);
  };

  // Confirm custom stage (house show or commercial venue) with privacy shield
  const handleConfirmCustomStage = async (stopIdx: number) => {
    const cur = stops[stopIdx];
    if (!cur) return;

    const stopKey = cur.id || String(stopIdx);
    const selectedType = customStageType[stopKey] || "commercial";
    const inputs = customStageInputs[stopKey] || {};

    if (selectedType === "house_show") {
      if (!inputs.hostName?.trim()) {
        alert("Please provide a Host Name or DIY Space Name (e.g. 'Sarah's Basement' or 'The Treehouse').");
        return;
      }
      if (!inputs.address?.trim()) {
        alert("Please provide the residential street address for your band's private tour sheet.");
        return;
      }
    } else {
      if (!inputs.name?.trim()) {
        alert("Please provide a commercial venue or club name.");
        return;
      }
    }

    setIsSubmittingCustomStage(true);
    try {
      const payload = {
        venueType: selectedType,
        tourId: tourId || undefined,
        stopIndex: stopIdx,
        city: cur.city,
        state: cur.state,
        ...(selectedType === "house_show" ? {
          hostName: inputs.hostName?.trim(),
          address: inputs.address?.trim(),
          hostPhone: inputs.hostPhone?.trim(),
          loadInNotes: inputs.loadInNotes?.trim(),
          suggestedDonation: inputs.suggestedDonation?.trim()
        } : {
          name: inputs.name?.trim(),
          address: inputs.address?.trim(),
          contactName: inputs.contactName?.trim(),
          contactPhone: inputs.contactPhone?.trim(),
          contactEmail: inputs.contactEmail?.trim(),
          capacity: inputs.capacity?.trim(),
          soundSpecs: inputs.soundSpecs?.trim()
        })
      };

      const res = await fetch("/api/venues/community-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add stage");
      }

      const venueObj = data.venue;
      setStops(prev => {
        const copy = [...prev];
        if (copy[stopIdx]) {
          copy[stopIdx].selectedVenue = {
            ...venueObj,
            bookingStatus: "confirmed"
          };
        }
        return copy;
      });

      setCustomVenueMode(prev => ({ ...prev, [cur.id]: false }));
      triggerToast(
        data.message || (selectedType === "house_show" 
          ? "🔒 Private House Show saved to tour sheet" 
          : "🌐 Commercial Venue added to global directory"),
        "success"
      );
      setInterstitialLodgingPromptStop(stopIdx);
      setInlineLodgingStopIndex(null);
    } catch (err: any) {
      console.warn("Fallback adding custom stage:", err);
      const isHouse = selectedType === "house_show";
      const fallbackVenue: TourSelectedVenue = {
        id: `custom-stage-${Date.now()}`,
        name: isHouse ? (inputs.hostName?.trim() || "Private House Show / DIY Space") : (inputs.name?.trim() || "Commercial Venue"),
        address: inputs.address?.trim() || `${cur.city}, ${cur.state}`,
        city: cur.city,
        state: cur.state,
        contactName: isHouse ? inputs.hostName?.trim() : inputs.contactName?.trim(),
        contactPhone: isHouse ? inputs.hostPhone?.trim() : inputs.contactPhone?.trim(),
        contactEmail: !isHouse ? inputs.contactEmail?.trim() : undefined,
        hostName: isHouse ? inputs.hostName?.trim() : undefined,
        hostPhone: isHouse ? inputs.hostPhone?.trim() : undefined,
        notes: inputs.loadInNotes?.trim(),
        loadInNotes: inputs.loadInNotes?.trim(),
        ticketPrice: inputs.suggestedDonation?.trim(),
        suggestedDonation: inputs.suggestedDonation?.trim(),
        soundSpecs: inputs.soundSpecs?.trim(),
        capacity: inputs.capacity ? Number(inputs.capacity) : undefined,
        venueType: selectedType,
        isPrivate: isHouse,
        bookingStatus: "confirmed"
      };

      setStops(prev => {
        const copy = [...prev];
        if (copy[stopIdx]) {
          copy[stopIdx].selectedVenue = fallbackVenue;
        }
        return copy;
      });

      setCustomVenueMode(prev => ({ ...prev, [cur.id]: false }));
      triggerToast(isHouse ? "🔒 Private house show saved to tour sheet" : "Stage saved to tour sheet", "success");
      setInterstitialLodgingPromptStop(stopIdx);
      setInlineLodgingStopIndex(null);
    } finally {
      setIsSubmittingCustomStage(false);
    }
  };

  // Step 3 Interstitial Option B: "No, Continue Without Lodging"
  const handleSkipLodgingForStop = (stopIdx: number) => {
    setSkippedLodgingMap(prev => ({ ...prev, [stopIdx]: true }));
    setInterstitialLodgingPromptStop(null);
    setInlineLodgingStopIndex(null);
    handleClearLodgingForStop(stopIdx);

    const cityName = stops[stopIdx]?.city || "stop";
    triggerToast(`Skipped lodging for ${cityName}`, "info");

    // Flow Progression: loop to next stop, ending in Step 5: Review & Finalize
    if (stopIdx < stops.length - 1) {
      const nextIdx = stopIdx + 1;
      setActiveStageIndex(nextIdx);
      if (stops[nextIdx]) {
        loadVenuesForStageCity(stops[nextIdx].city, stops[nextIdx].state);
      }
    } else {
      setWizardStep(5);
      triggerToast("✓ All stops configured! Reviewing complete tour itinerary.", "success");
    }
  };

  // Step 3 Interstitial Option A: "Yes, Find Lodging"
  const handleOpenInlineLodging = (stopIdx: number) => {
    setInterstitialLodgingPromptStop(null);
    setInlineLodgingStopIndex(stopIdx);
  };

  // Lock in chosen lodging and advance to next city or Step 5
  const handleLockInLodgingAndAdvance = (stopIdx: number, lodgingOption?: TourLodgingOption) => {
    if (lodgingOption) {
      handleSelectLodgingForStop(stopIdx, lodgingOption);
    }

    setSkippedLodgingMap(prev => ({ ...prev, [stopIdx]: false }));
    setInterstitialLodgingPromptStop(null);
    setInlineLodgingStopIndex(null);

    const cityName = stops[stopIdx]?.city || "stop";
    triggerToast(`✓ Lodging locked for ${cityName}!`, "success");

    // Flow Progression: loop to next stop, ending in Step 5: Review & Finalize
    if (stopIdx < stops.length - 1) {
      const nextIdx = stopIdx + 1;
      setActiveStageIndex(nextIdx);
      if (stops[nextIdx]) {
        loadVenuesForStageCity(stops[nextIdx].city, stops[nextIdx].state);
      }
    } else {
      setWizardStep(5);
      triggerToast("✓ All tour stops configured! Reviewing complete itinerary.", "success");
    }
  };

  // Save custom lodging entry for stop
  const handleSaveCustomLodgingForStop = (stopIdx: number) => {
    const custom = customLodgingInputs[stopIdx];
    if (!custom?.name?.trim()) {
      alert("Please provide at least an accommodation or hotel name.");
      return;
    }

    setStops(prev => {
      const copy = [...prev];
      const target = copy[stopIdx];
      if (target) {
        target.selectedLodging = {
          name: custom.name.trim(),
          confirmationNumber: custom.confirmationNumber?.trim() || "",
          cost: parseFloat(custom.cost) || 85,
          gearSecurityNote: custom.notes?.trim() || "Band parking confirmed",
          notes: custom.notes?.trim() || "Self-booked accommodation",
          address: `${target.city}, ${target.state}`,
          type: "Band-Friendly Hotel"
        };
        target.lodgingNotes = custom.notes?.trim() || "Band parking confirmed";
      }
      return copy;
    });

    handleLockInLodgingAndAdvance(stopIdx);
  };

  // Update schedule times, contacts, and payout deal terms for stop venue
  const handleUpdateSchedule = (stopIdx: number, field: keyof TourSelectedVenue, value: string) => {
    setStops(prev => {
      const copy = [...prev];
      const target = copy[stopIdx];
      if (target) {
        if (!target.selectedVenue) {
          target.selectedVenue = {
            name: `${target.city} Stage`,
            city: target.city,
            address: `${target.city}, ${target.state}`,
            bookingStatus: "unconfirmed",
            [field]: value
          };
        } else {
          target.selectedVenue[field] = value as any;
        }
      }
      return copy;
    });
  };

  // Toggle venue booking status: unconfirmed -> penciled -> confirmed -> unconfirmed
  // Strictly isolated to stopIdx - zero bleed-over to other stops
  const handleToggleVenueStatus = (stopIdx: number, explicitStatus?: "unconfirmed" | "penciled" | "confirmed") => {
    let affectedCity = "";
    let affectedLabel = "";
    let affectedVenueName = "";

    setStops(prev => {
      return prev.map((stop, idx) => {
        if (idx !== stopIdx) {
          // Strictly preserve other stops without modifying references
          return stop;
        }

        const curStatus = stop.selectedVenue?.bookingStatus || (stop.selectedVenue?.name ? "unconfirmed" : "unconfirmed");
        const nextStatus: "unconfirmed" | "penciled" | "confirmed" = explicitStatus || (
          curStatus === "unconfirmed" ? "penciled" : curStatus === "penciled" ? "confirmed" : "unconfirmed"
        );

        affectedCity = stop.city;
        affectedLabel = nextStatus === "confirmed" ? "✓ Confirmed & Booked" : nextStatus === "penciled" ? "Penciled In (Hold)" : "Unconfirmed Lead";

        const currentVenue = stop.selectedVenue ? { ...stop.selectedVenue } : {
          id: `venue-${Date.now()}-${stopIdx}`,
          name: `${stop.city} Stage`,
          city: stop.city,
          address: `${stop.city}, ${stop.state}`
        };

        affectedVenueName = currentVenue.name || `${stop.city} Stage`;

        return {
          ...stop,
          selectedVenue: {
            ...currentVenue,
            bookingStatus: nextStatus
          }
        };
      });
    });

    if (affectedCity) {
      triggerToast(`Stop ${stopIdx + 1} (${affectedCity}): ${affectedVenueName} marked ${affectedLabel}`, "success");
    }
  };

  // Select lodging for current stop with auto-binding of property, address, phone, cost, and van security
  const handleSelectLodgingForStop = (stopIdx: number, lodging: TourLodgingOption, markAsBooked = true) => {
    let affectedCity = "";
    let propertyName = "";

    setStops(prev => {
      return prev.map((target, idx) => {
        if (idx !== stopIdx) return target;
        affectedCity = target.city;
        propertyName = lodging.name;

        const hotelPhone = lodging.phone || getCityHotelPhone(target.city, target.state);
        const hotelAddress = lodging.address || `${target.city}, ${target.state}`;
        const nightlyRate = parseNightlyRate(lodging.estPricePerNight);
        const securityNote = lodging.gearSecurityNote || "Ground-level monitored van parking. Bring guitars and high-value gear into room.";
        const confNum = target.selectedLodging?.confirmationNumber || (markAsBooked ? `CONF-${Date.now().toString().slice(-6)}` : "");

        const updatedLodging: TourSelectedLodging = {
          id: lodging.id,
          name: lodging.name,
          type: lodging.type,
          address: hotelAddress,
          phone: hotelPhone,
          cost: nightlyRate,
          confirmationNumber: confNum,
          gearSecurityNote: securityNote,
          bookingUrl: lodging.bookingSearchUrl,
          notes: securityNote,
          isBooked: markAsBooked
        };

        return {
          ...target,
          selectedLodging: updatedLodging,
          lodgingNotes: securityNote
        };
      });
    });

    if (affectedCity) {
      triggerToast(
        markAsBooked
          ? `✓ ${propertyName} bound to ${affectedCity} itinerary (Booked & Confirmed)`
          : `✓ ${propertyName} bound to ${affectedCity} itinerary`,
        "success"
      );
    }
  };

  // Update direct lodging fields (hotel name, confirmation number, budget, notes, address, phone, booked state) in stop's route_data
  const handleUpdateLodgingField = (
    stopIdx: number,
    field: "name" | "confirmationNumber" | "cost" | "notes" | "address" | "phone" | "type" | "isBooked" | "bookingPlatform" | "bookingUrl",
    value: any
  ) => {
    setStops(prev => {
      return prev.map((target, idx) => {
        if (idx !== stopIdx) return target;
        const existing: TourSelectedLodging = target.selectedLodging || {
          name: `Lodging in ${target.city}`,
          cost: 85,
          confirmationNumber: "",
          notes: "Band overnight accommodation",
          address: `${target.city}, ${target.state}`,
          phone: getCityHotelPhone(target.city, target.state),
          isBooked: false
        };
        const updated: TourSelectedLodging = {
          ...existing,
          [field]: value
        };
        return {
          ...target,
          selectedLodging: updated,
          ...(field === "notes" ? { lodgingNotes: value } : {})
        };
      });
    });
  };

  // Toggle "Mark as Booked" across tour stops with auto-binding of property details
  const handleToggleLodgingBooked = (stopIdx: number, forceState?: boolean) => {
    let affectedCity = "";
    let isNowBooked = false;
    let propName = "";

    setStops(prev => {
      return prev.map((target, idx) => {
        if (idx !== stopIdx) return target;
        affectedCity = target.city;

        const defaultOption = target.lodgingOptions?.[0];
        const existing = target.selectedLodging;

        const nextBooked = forceState !== undefined ? forceState : !(existing?.isBooked);
        isNowBooked = nextBooked;

        const name = existing?.name && !existing.name.startsWith("Lodging in ")
          ? existing.name
          : defaultOption?.name || `${target.city} Musician Suites & Inn`;
        propName = name;

        const address = existing?.address || defaultOption?.address || `${target.city}, ${target.state}`;
        const phone = existing?.phone || defaultOption?.phone || getCityHotelPhone(target.city, target.state);
        const cost = existing?.cost || (defaultOption ? parseNightlyRate(defaultOption.estPricePerNight) : 85);
        const securityNote = existing?.gearSecurityNote || existing?.notes || defaultOption?.gearSecurityNote || "Ground-level monitored van parking. Bring high-value gear into room.";
        const confNumber = existing?.confirmationNumber || (nextBooked ? `CONF-${Date.now().toString().slice(-6)}` : "");

        const updatedLodging: TourSelectedLodging = {
          ...existing,
          name,
          address,
          phone,
          cost,
          confirmationNumber: confNumber,
          gearSecurityNote: securityNote,
          notes: securityNote,
          isBooked: nextBooked
        };

        return {
          ...target,
          selectedLodging: updatedLodging,
          lodgingNotes: securityNote
        };
      });
    });

    if (affectedCity) {
      triggerToast(
        isNowBooked
          ? `✓ ${propName} marked Booked & Confirmed for ${affectedCity}!`
          : `Marked ${affectedCity} lodging as Pending`,
        "success"
      );
    }
  };

  // Clear lodging details for stop
  const handleClearLodgingForStop = (stopIdx: number) => {
    setStops(prev => {
      return prev.map((target, idx) => {
        if (idx !== stopIdx) return target;
        return {
          ...target,
          selectedLodging: undefined,
          lodgingNotes: ""
        };
      });
    });
  };

  // Commit lodging reservation and auto-sync directly into the stop's route_data JSONB in Supabase
  const handleCommitLodgingReservation = async (
    stopIdx: number,
    reservation: {
      name: string;
      confirmationNumber: string;
      cost: number | string;
      parkingNotes: string;
      notes: string;
      address?: string;
      phone?: string;
      type?: string;
      checkIn: string;
      checkOut: string;
    }
  ) => {
    let updatedStopsList: TourStop[] = [];

    setStops(prev => {
      const copy = prev.map((target, idx) => {
        if (idx !== stopIdx) return target;
        const hotelPhone = reservation.phone || target.selectedLodging?.phone || getCityHotelPhone(target.city, target.state);
        const hotelAddress = reservation.address || target.selectedLodging?.address || `${target.city}, ${target.state}`;
        const securityNote = reservation.parkingNotes || reservation.notes || "Monitored van lot; bring instruments into room.";

        const updatedLodging: TourSelectedLodging = {
          name: reservation.name,
          confirmationNumber: reservation.confirmationNumber,
          cost: reservation.cost,
          gearSecurityNote: securityNote,
          notes: reservation.notes || securityNote,
          address: hotelAddress,
          phone: hotelPhone,
          type: reservation.type || "Band-Friendly Hotel",
          isBooked: true
        };

        return {
          ...target,
          selectedLodging: updatedLodging,
          lodgingNotes: securityNote
        };
      });
      updatedStopsList = copy;
      return copy;
    });

    const stopsToSave = updatedStopsList.length > 0 ? updatedStopsList : stops;
    const updatedFinancials = calculateTourFinancials(stopsToSave);

    // Commit to route_data in Supabase if tourId or effectiveUserId exists
    if (effectiveUserId || tourId) {
      const activePlanName = tourTitle.trim() || `${originCity} to ${destinationCity} Tour`;
      const routeData = {
        origin: originCity,
        destination: destinationCity,
        startDate,
        endDate,
        currentStep: wizardStep,
        stops: stopsToSave,
        totalDistanceMiles,
        totalDriveTime,
        financials: updatedFinancials,
        bandProfile: bandProfile ? { name: bandProfile.name, genre: bandProfile.genre } : undefined,
        createdAtHuman: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      };

      try {
        const { data } = await saveTourToDatabase({
          id: tourId || undefined,
          user_id: effectiveUserId || "local",
          name: activePlanName,
          status: tourStatus,
          route_data: routeData
        });
        if (data?.id && !tourId) {
          setTourId(data.id);
        }
      } catch (err) {
        console.warn("Auto-syncing lodging reservation to Supabase route_data:", err);
      }
    }

    triggerToast("Lodging locked into tour itinerary", "success");
    setBookingModalStopIndex(null);
  };

  // Dispatch Master Tour Itinerary via Email to Band & Crew
  const handleSendEmailItinerary = async () => {
    if (!recipientEmailsInput.trim()) {
      alert("Please provide at least one recipient email address.");
      return;
    }

    const recipients = recipientEmailsInput
      .split(/[,;\n]/)
      .map(r => r.trim())
      .filter(r => r.length > 0 && r.includes("@"));

    if (recipients.length === 0) {
      alert("Please provide valid email addresses containing an '@' sign.");
      return;
    }

    setIsSendingEmail(true);
    setEmailDispatchResult(null);

    try {
      const payload = {
        recipients,
        tourTitle: tourTitle.trim() || `${originCity} to ${destinationCity} Tour`,
        bandName: bandProfile?.name || "Touring Band",
        tourPlan: currentTourPlan,
        notes: emailNotesInput.trim()
      };

      const res = await fetch("/api/tour/email-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch email itinerary.");
      }

      setEmailDispatchResult({
        success: true,
        count: recipients.length,
        recipients
      });
      triggerToast(`✓ Master Itinerary dispatched to ${recipients.length} recipients!`, "success");
    } catch (err: any) {
      console.error("Failed to email itinerary:", err);
      alert(`Could not send email itinerary: ${err.message || err}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Listen for partner booking window postMessage event (from embedded iframe or widget callback)
  useEffect(() => {
    const handleBookingWidgetMessage = (event: MessageEvent) => {
      if (!event.data) return;
      const data = event.data;
      if (
        data.type === "HOTEL_RESERVATION_CONFIRMED" ||
        data.type === "BOOKING_COMPLETE" ||
        data.type === "LODGING_BOOKING_COMPLETED" || 
        data.type === "GIGLIZARD_HOTEL_BOOKED" || 
        data.action === "booking_complete" ||
        data.action === "HOTEL_RESERVATION_CONFIRMED" ||
        (data.propertyName && (data.confirmationId || data.confirmationNumber))
      ) {
        const payload = data.payload || data;
        const targetIdx = typeof data.stopIndex === "number" ? data.stopIndex : (bookingModalStopIndex ?? activeStageIndex);
        if (targetIdx !== null && targetIdx >= 0 && targetIdx < stops.length) {
          handleCommitLodgingReservation(targetIdx, {
            name: payload.propertyName || payload.hotelName || payload.name || "Booked Partner Hotel",
            confirmationNumber: payload.confirmationId || payload.confirmationNumber || payload.bookingId || `CONF-${Math.floor(100000 + Math.random() * 900000)}`,
            cost: Number(parseNightlyRate(payload.totalPaid || payload.cost || payload.totalCost || 85)),
            parkingNotes: payload.parkingSpecifications || payload.parkingNotes || payload.parking || "Van & trailer parking confirmed",
            notes: payload.notes || payload.parking || "Booked via partner widget",
            address: payload.address || `${stops[targetIdx].city}, ${stops[targetIdx].state}`,
            type: payload.type || "Band-Friendly Hotel",
            checkIn: payload.checkIn || stops[targetIdx].date || "",
            checkOut: payload.checkOut || ""
          });
        }
      }
    };
    window.addEventListener("message", handleBookingWidgetMessage);
    return () => window.removeEventListener("message", handleBookingWidgetMessage);
  }, [bookingModalStopIndex, activeStageIndex, stops, tourId, effectiveUserId, originCity, destinationCity, startDate, endDate, wizardStep, totalDistanceMiles, totalDriveTime, bandProfile, tourTitle, tourStatus]);

  // Update custom stop notes
  const handleUpdateStopNotes = (stopIdx: number, notes: string) => {
    setStops(prev => {
      const copy = [...prev];
      if (copy[stopIdx]) {
        copy[stopIdx].customNotes = notes;
      }
      return copy;
    });
  };

  // Update date for stop
  const handleUpdateStopDate = (stopIdx: number, newDate: string) => {
    setStops(prev => {
      const copy = [...prev];
      if (copy[stopIdx]) {
        copy[stopIdx].date = newDate;
      }
      return copy;
    });
  };

  // Navigate between cities in Step 3
  const handleStageNext = () => {
    if (activeStageIndex < stops.length - 1) {
      const nextIdx = activeStageIndex + 1;
      setActiveStageIndex(nextIdx);
      setInterstitialLodgingPromptStop(null);
      setInlineLodgingStopIndex(null);
      if (stops[nextIdx]) {
        loadVenuesForStageCity(stops[nextIdx].city, stops[nextIdx].state);
      }
    } else {
      // Flow Progression: Finished all stops -> advance to Step 5: Review & Finalize Tour
      setWizardStep(5);
      triggerToast("✓ All stops configured! Reviewing final tour itinerary.", "success");
    }
  };

  const handleStagePrev = () => {
    if (activeStageIndex > 0) {
      const prevIdx = activeStageIndex - 1;
      setActiveStageIndex(prevIdx);
      setInterstitialLodgingPromptStop(null);
      setInlineLodgingStopIndex(null);
      if (stops[prevIdx]) {
        loadVenuesForStageCity(stops[prevIdx].city, stops[prevIdx].state);
      }
    }
  };

  // Navigate between cities in Step 4 (Lodging)
  const handleLodgingNext = () => {
    if (activeLodgingIndex < stops.length - 1) {
      setActiveLodgingIndex(activeLodgingIndex + 1);
    } else {
      // Finished all lodging -> proceed to Step 5 (Review & Finalize)
      setWizardStep(5);
    }
  };

  const handleLodgingPrev = () => {
    if (activeLodgingIndex > 0) {
      setActiveLodgingIndex(activeLodgingIndex - 1);
    }
  };

  // SAVE & FINISH LATER: Unified save handler available at every step
  const handleSaveAndFinishLater = async (markConfirmed = false) => {
    setIsSaving(true);
    const finalStatus = markConfirmed ? "confirmed" : tourStatus;
    const activePlanName = tourTitle.trim() || `${originCity} to ${destinationCity} Tour`;

    const routeData = {
      origin: originCity,
      destination: destinationCity,
      startDate,
      endDate,
      currentStep: markConfirmed ? 5 : wizardStep,
      stops,
      totalDistanceMiles,
      totalDriveTime,
      financials,
      bandProfile: bandProfile ? { name: bandProfile.name, genre: bandProfile.genre } : undefined,
      createdAtHuman: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    };

    // 1. If user is NOT logged in, preserve state locally and prompt login
    if (!effectiveUserId) {
      const pendingRecord = {
        id: tourId || `tour-${Date.now()}`,
        name: activePlanName,
        status: finalStatus,
        route_data: routeData
      };
      localStorage.setItem(STORAGE_PENDING_DRAFT, JSON.stringify(pendingRecord));
      localStorage.setItem(STORAGE_ACTIVE_DRAFT, JSON.stringify(currentTourPlan));
      
      triggerToast("Draft saved locally! Log in to save to your cloud account.", "info");
      setIsSaving(false);

      if (onTriggerLogin) {
        onTriggerLogin();
      }
      return;
    }

    // 2. User is authenticated -> save to public.tours in Supabase
    try {
      const { data, error } = await saveTourToDatabase({
        id: tourId || undefined,
        user_id: effectiveUserId,
        name: activePlanName,
        status: finalStatus,
        route_data: routeData
      });

      if (data?.id) {
        setTourId(data.id);
      }

      setTourStatus(finalStatus);
      triggerToast(
        markConfirmed 
          ? "🎉 Tour confirmed & saved to your account!" 
          : "✓ Tour draft saved! You can resume anytime from Tour History.",
        "success"
      );
      
      refreshTours();
    } catch (err: any) {
      console.warn("Save error:", err);
      triggerToast("Saved to offline cache. Will sync when connected.", "info");
    } finally {
      setIsSaving(false);
    }
  };

  // Resumes a saved tour from Tour History
  const handleResumeSavedTour = (record: SavedTourRecord) => {
    setTourId(record.id);
    setTourTitle(record.name);
    setTourStatus(record.status);

    const rd = record.route_data;
    if (rd) {
      setOriginCity(rd.origin || "Seattle, WA");
      setDestinationCity(rd.destination || "Medford, OR");
      if (rd.startDate) setStartDate(rd.startDate);
      if (rd.endDate) setEndDate(rd.endDate);
      if (rd.stops && Array.isArray(rd.stops)) {
        setStops(rd.stops);
      }
      setTotalDistanceMiles(rd.totalDistanceMiles || 0);
      setTotalDriveTime(rd.totalDriveTime || "");

      // Open on saved step or review
      const targetStep = record.status === "confirmed" ? 5 : (rd.currentStep || 2);
      setWizardStep(targetStep);
      setActiveStageIndex(0);
      setActiveLodgingIndex(0);
      if (rd.stops && rd.stops[0]) {
        loadVenuesForStageCity(rd.stops[0].city, rd.stops[0].state);
      }
    }

    setViewState("wizard");
  };

  // Deletes a saved tour
  const handleDeleteSavedTour = async (recordId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this tour itinerary?")) return;

    await deleteTourFromDatabase(recordId);
    setSavedTours(prev => prev.filter(t => t.id !== recordId));
    triggerToast("Tour deleted from your library.", "info");
  };

  // Duplicate a tour
  const handleDuplicateTour = async (record: SavedTourRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = `tour-${Date.now()}`;
    const newName = `${record.name} (Copy)`;
    
    await saveTourToDatabase({
      id: newId,
      user_id: effectiveUserId,
      name: newName,
      status: "draft",
      route_data: {
        ...record.route_data,
        currentStep: 2
      }
    });

    triggerToast(`Created duplicate: "${newName}"`, "success");
    refreshTours();
  };

  // Filtered tours for history view
  const filteredTours = useMemo(() => {
    return savedTours.filter(t => {
      if (historyFilter === "draft" && t.status !== "draft") return false;
      if (historyFilter === "confirmed" && t.status !== "confirmed") return false;
      if (!historySearchTerm) return true;
      const q = historySearchTerm.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.route_data?.origin?.toLowerCase().includes(q) ||
        t.route_data?.destination?.toLowerCase().includes(q)
      );
    });
  }, [savedTours, historyFilter, historySearchTerm]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16" id="tour-planner-root">
      
      {/* Toast Notification */}
      {saveToast.show && (
        <div 
          className={`fixed bottom-6 right-6 z-50 py-3 px-5 rounded-2xl shadow-2xl flex items-center gap-3 border text-sm font-bold animate-in fade-in slide-in-from-bottom-4 duration-300 ${
            saveToast.type === "success" 
              ? "bg-slate-900 text-emerald-300 border-emerald-500/40 shadow-emerald-950/40" 
              : "bg-slate-900 text-indigo-300 border-indigo-500/40 shadow-indigo-950/40"
          }`}
        >
          {saveToast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <Info className="w-5 h-5 text-indigo-400 shrink-0" />
          )}
          <span>{saveToast.message}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: CLEAN STARTUP LANDING SCREEN (Do NOT load prefilled tour)        */}
      {/* ========================================================================= */}
      {viewState === "landing" && (
        <div className="space-y-8 animate-in fade-in duration-300" id="tour-landing-view">
          
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl border border-indigo-900/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            
            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-black uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tour Planning &amp; Corridor Optimizer</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Design Your Next Tour Route
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Step-by-step guided tour creator that optimizes driving legs along interstate corridors, connects you with stages from our live venue directory, and budgets your lodging and gas expenses.
              </p>
            </div>
          </div>

          {/* Primary Action Choice Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="tour-startup-choices">
            
            {/* Action 1: Start New Tour */}
            <div 
              onClick={handleStartNewTour}
              className="bg-white rounded-3xl p-8 border-2 border-indigo-500/30 hover:border-indigo-600 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between space-y-6 relative overflow-hidden"
              id="btn-start-new-tour-card"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <Plus className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Start New Tour
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Build a custom tour from scratch. Enter your origin and destination to calculate optimized driving legs, select stages in each city, and assemble your tour run-of-show.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center text-sm font-black text-indigo-600 group-hover:translate-x-1 transition-transform gap-2">
                <span>Launch Guided Tour Wizard</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Action 2: Load Saved Tour / History */}
            <div 
              onClick={() => {
                refreshTours();
                setViewState("history");
              }}
              className="bg-white rounded-3xl p-8 border border-slate-200 hover:border-slate-400 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between space-y-6"
              id="btn-load-saved-tour-card"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <FolderOpen className="w-7 h-7 text-indigo-300" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-slate-900 group-hover:text-slate-700 transition-colors">
                      My Tours &amp; History
                    </h3>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      {savedTours.length} Saved
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Resume in-progress tour drafts right where you left off, review completed routes, export master print sheets, and manage your tour library.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center text-sm font-black text-slate-800 group-hover:translate-x-1 transition-transform gap-2">
                <span>View Saved Tours ({savedTours.length})</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

          </div>

          {/* Quick Corridor Starter Presets */}
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white space-y-4 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Popular Corridor Starter Presets (1-Click Setup)
              </span>
              <span className="text-xs text-slate-400">Pre-calculates optimal highway corridors</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => handleApplyPreset(
                  "Pacific Northwest 6-Stop Corridor",
                  "Bellingham, WA", 
                  ["Seattle, WA", "Tacoma, WA", "Portland, OR", "Eugene, OR"], 
                  "Medford, OR"
                )}
                className="p-4 rounded-2xl bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700 hover:border-indigo-500 text-left transition-all cursor-pointer group"
              >
                <div className="font-black text-white text-sm group-hover:text-indigo-300">🌲 PNW I-5 Corridor</div>
                <div className="text-xs text-slate-400 mt-1">Bellingham → Seattle → Portland → Eugene → Medford</div>
                <div className="text-[11px] text-indigo-400 font-bold mt-2">6 Stops • 450 mi</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset(
                  "California Coastline Showcase",
                  "San Francisco, CA", 
                  ["Santa Cruz, CA", "Santa Barbara, CA", "Los Angeles, CA"], 
                  "San Diego, CA"
                )}
                className="p-4 rounded-2xl bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700 hover:border-indigo-500 text-left transition-all cursor-pointer group"
              >
                <div className="font-black text-white text-sm group-hover:text-indigo-300">🌊 California Coastline</div>
                <div className="text-xs text-slate-400 mt-1">SF → Santa Cruz → Santa Barbara → LA → San Diego</div>
                <div className="text-[11px] text-indigo-400 font-bold mt-2">5 Stops • 520 mi</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset(
                  "Cascadia Highway Run",
                  "Vancouver, BC", 
                  ["Bellingham, WA", "Seattle, WA", "Olympia, WA"], 
                  "Portland, OR"
                )}
                className="p-4 rounded-2xl bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700 hover:border-indigo-500 text-left transition-all cursor-pointer group"
              >
                <div className="font-black text-white text-sm group-hover:text-indigo-300">🍁 Cascadia Run</div>
                <div className="text-xs text-slate-400 mt-1">Vancouver BC → Seattle → Olympia → Portland</div>
                <div className="text-[11px] text-indigo-400 font-bold mt-2">5 Stops • 315 mi</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset(
                  "Rocky Mountain Front Range",
                  "Fort Collins, CO", 
                  ["Boulder, CO", "Denver, CO", "Colorado Springs, CO"], 
                  "Albuquerque, NM"
                )}
                className="p-4 rounded-2xl bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700 hover:border-indigo-500 text-left transition-all cursor-pointer group"
              >
                <div className="font-black text-white text-sm group-hover:text-indigo-300">⛰️ Rocky Mountain Run</div>
                <div className="text-xs text-slate-400 mt-1">Fort Collins → Denver → Springs → Albuquerque</div>
                <div className="text-[11px] text-indigo-400 font-bold mt-2">5 Stops • 475 mi</div>
              </button>
            </div>
          </div>

          {/* Recent Saved Tours Preview (If any exist) */}
          {savedTours.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-indigo-600" />
                  <span>Recent Saved Tours</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setViewState("history")}
                  className="text-xs font-black text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  View All ({savedTours.length}) →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedTours.slice(0, 3).map((tour) => (
                  <div
                    key={tour.id}
                    onClick={() => handleResumeSavedTour(tour)}
                    className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer bg-slate-50/50 hover:bg-white group space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {tour.name}
                      </h4>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                        tour.status === "confirmed" 
                          ? "bg-emerald-100 text-emerald-800" 
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {tour.status === "confirmed" ? "Confirmed" : `Draft`}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">
                          {tour.route_data?.origin || "Start"} → {tour.route_data?.destination || "End"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{tour.route_data?.startDate || "Dates"} • {tour.route_data?.stops?.length || 0} stops</span>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-xs font-bold text-indigo-600">
                      <span>{tour.status === "confirmed" ? "View Itinerary" : "Resume Draft"}</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: MY TOURS / TOUR HISTORY LIST                                     */}
      {/* ========================================================================= */}
      {viewState === "history" && (
        <div className="space-y-6 animate-in fade-in duration-300" id="tour-history-view">
          
          {/* Header */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setViewState("landing")}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Tour Home</span>
              </button>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <FolderOpen className="w-7 h-7 text-indigo-600" />
                <span>My Saved Tours</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                All tour itineraries stored in your account database. Resume drafts or review confirmed routes.
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartNewTour}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md flex items-center gap-2 cursor-pointer transition-transform active:scale-98 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Tour</span>
            </button>
          </div>

          {/* Filters and Search Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by tour name or city..."
                value={historySearchTerm}
                onChange={(e) => setHistorySearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setHistoryFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-colors ${
                  historyFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All ({savedTours.length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter("draft")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-colors ${
                  historyFilter === "draft" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Drafts ({savedTours.filter(t => t.status === "draft").length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter("confirmed")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-colors ${
                  historyFilter === "confirmed" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Confirmed ({savedTours.filter(t => t.status === "confirmed").length})
              </button>
            </div>
          </div>

          {/* Tours Grid */}
          {filteredTours.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Compass className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">No tours found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {historySearchTerm 
                  ? "No saved tours matched your search criteria." 
                  : "You haven't planned any tours yet. Click below to start your first run."}
              </p>
              <button
                type="button"
                onClick={handleStartNewTour}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer"
              >
                Create Tour Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTours.map((tour) => {
                const stopsCount = tour.route_data?.stops?.length || 0;
                const venuesCount = tour.route_data?.financials?.confirmedVenuesCount || 0;

                return (
                  <div
                    key={tour.id}
                    onClick={() => handleResumeSavedTour(tour)}
                    className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-black text-slate-900 text-base group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {tour.name}
                        </h3>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shrink-0 ${
                          tour.status === "confirmed" 
                            ? "bg-emerald-100 text-emerald-800" 
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {tour.status === "confirmed" ? "Confirmed" : `Draft (Step ${tour.route_data?.currentStep || 2})`}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 font-bold">
                          <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate">
                            {tour.route_data?.origin || "Origin"} → {tour.route_data?.destination || "Destination"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {tour.route_data?.startDate || "TBD"} — {tour.route_data?.endDate || "TBD"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500 pt-1">
                          <span>📍 {stopsCount} stops</span>
                          <span>🏢 {venuesCount} confirmed stages</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Updated {new Date(tour.updated_at).toLocaleDateString()}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleDuplicateTour(tour, e)}
                          title="Duplicate tour"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSavedTour(tour.id, e)}
                          title="Delete tour"
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-black text-indigo-600 flex items-center gap-1 ml-2">
                          {tour.status === "confirmed" ? "Open" : "Resume"} →
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: GUIDED 4-STEP WIZARD (Setup -> Optimize -> Stages -> Review)      */}
      {/* ========================================================================= */}
      {viewState === "wizard" && (
        <div className="space-y-6 animate-in fade-in duration-300" id="tour-wizard-container">
          
          {/* Wizard Header Bar & Action Menu */}
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setViewState("landing")}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Menu</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                    Tour Creation Wizard
                  </span>
                  <span className="text-xs text-slate-400">• Step {wizardStep} of 5</span>
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {tourTitle || "Custom Tour Run"}
              </h2>
            </div>

            {/* Global Actions: Save & Finish Later */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleSaveAndFinishLater(false)}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black border border-slate-700 flex items-center gap-2 shadow-sm cursor-pointer transition-all active:scale-98"
                id="btn-save-finish-later-top"
              >
                <Save className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isSaving ? "Saving..." : "Save & Finish Later"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  refreshTours();
                  setViewState("history");
                }}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                title="View Saved Tours"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">My Tours</span>
              </button>
            </div>
          </div>

          {/* Stepper Progress Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
            <button
              type="button"
              onClick={() => setWizardStep(1)}
              className={`p-3 rounded-xl text-left transition-all cursor-pointer ${
                wizardStep === 1 
                  ? "bg-indigo-600 text-white shadow-md" 
                  : "hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div className="text-[10px] font-black uppercase tracking-wider opacity-80">Step 1</div>
              <div className="text-xs font-black truncate">1. Route Setup</div>
            </button>

            <button
              type="button"
              onClick={() => stops.length > 0 && setWizardStep(2)}
              disabled={stops.length === 0}
              className={`p-3 rounded-xl text-left transition-all ${
                wizardStep === 2 
                  ? "bg-indigo-600 text-white shadow-md" 
                  : stops.length > 0 
                  ? "hover:bg-slate-50 text-slate-700 cursor-pointer" 
                  : "opacity-40 cursor-not-allowed text-slate-400"
              }`}
            >
              <div className="text-[10px] font-black uppercase tracking-wider opacity-80">Step 2</div>
              <div className="text-xs font-black truncate">2. Corridor &amp; Stops</div>
            </button>

            <button
              type="button"
              onClick={() => stops.length > 0 && setWizardStep(3)}
              disabled={stops.length === 0}
              className={`p-3 rounded-xl text-left transition-all ${
                wizardStep === 3 
                  ? "bg-indigo-600 text-white shadow-md" 
                  : stops.length > 0 
                  ? "hover:bg-slate-50 text-slate-700 cursor-pointer" 
                  : "opacity-40 cursor-not-allowed text-slate-400"
              }`}
            >
              <div className="text-[10px] font-black uppercase tracking-wider opacity-80">Step 3</div>
              <div className="text-xs font-black truncate">3. Choose Stages &amp; Venues</div>
            </button>

            <button
              type="button"
              onClick={() => stops.length > 0 && setWizardStep(4)}
              disabled={stops.length === 0}
              className={`p-3 rounded-xl text-left transition-all ${
                wizardStep === 4 
                  ? "bg-indigo-600 text-white shadow-md" 
                  : stops.length > 0 
                  ? "hover:bg-slate-50 text-slate-700 cursor-pointer" 
                  : "opacity-40 cursor-not-allowed text-slate-400"
              }`}
            >
              <div className="text-[10px] font-black uppercase tracking-wider opacity-80">Step 4</div>
              <div className="text-xs font-black truncate">4. Book Hotels &amp; Lodging</div>
            </button>

            <button
              type="button"
              onClick={() => stops.length > 0 && setWizardStep(5)}
              disabled={stops.length === 0}
              className={`p-3 rounded-xl text-left transition-all ${
                wizardStep === 5 
                  ? "bg-indigo-600 text-white shadow-md" 
                  : stops.length > 0 
                  ? "hover:bg-slate-50 text-slate-700 cursor-pointer" 
                  : "opacity-40 cursor-not-allowed text-slate-400"
              }`}
            >
              <div className="text-[10px] font-black uppercase tracking-wider opacity-80">Step 5</div>
              <div className="text-xs font-black truncate">5. Review &amp; Finalize</div>
            </button>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* STEP 1: ROUTE SETUP                                                   */}
          {/* --------------------------------------------------------------------- */}
          {wizardStep === 1 && (
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8 animate-in fade-in duration-200">
              <div className="space-y-1.5 pb-4 border-b border-slate-100">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-600">
                  Step 1 • Geographic Framework
                </span>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Define Your Tour Corridor &amp; Dates
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Input your starting city, final destination, and date range. In Step 2, the smart corridor algorithm will calculate optimal waypoints.
                </p>
              </div>

              {/* Form Grid */}
              <div className="space-y-5">
                {/* Tour Title */}
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                    Tour Name / Run Title
                  </label>
                  <input
                    type="text"
                    value={tourTitle}
                    onChange={(e) => setTourTitle(e.target.value)}
                    placeholder="e.g. West Coast Summer Tour 2026"
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                {/* Origin and Destination with Swap */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                  <div>
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Origin City / State (Kickoff Point) *</span>
                    </label>
                    <input
                      type="text"
                      value={originCity}
                      onChange={(e) => setOriginCity(e.target.value)}
                      placeholder="e.g. Seattle, WA or Portland, OR"
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-600" />
                      <span>Destination City / State (Final Stop) *</span>
                    </label>
                    <input
                      type="text"
                      value={destinationCity}
                      onChange={(e) => setDestinationCity(e.target.value)}
                      placeholder="e.g. Medford, OR or Los Angeles, CA"
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Start Date and End Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      <span>Tour Start Date *</span>
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      <span>Tour End Date *</span>
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Vehicle Specifications & MPG */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Fuel className="w-4 h-4 text-amber-600" />
                      <span>Tour Vehicle &amp; Fuel Efficiency</span>
                    </label>
                    <span className="text-[11px] text-slate-500">Used for leg gas budgeting</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Vehicle Type
                      </label>
                      <select
                        value={vehicleType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVehicleType(val);
                          if (val.includes("15-Passenger")) setVehicleMpg(14);
                          else if (val.includes("Sprinter")) setVehicleMpg(18);
                          else if (val.includes("SUV")) setVehicleMpg(22);
                          else if (val.includes("Passenger Car")) setVehicleMpg(28);
                          else if (val.includes("Bus")) setVehicleMpg(8);
                        }}
                        className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
                      >
                        <option value="15-Passenger Touring Van">15-Passenger Touring Van (~14 MPG)</option>
                        <option value="Sprinter Van / Cargo">Sprinter Van / Diesel Cargo (~18 MPG)</option>
                        <option value="Mini-Van / SUV">Mini-Van / SUV (~22 MPG)</option>
                        <option value="Passenger Car / Wagon">Passenger Car / Station Wagon (~28 MPG)</option>
                        <option value="Tour Bus / RV">Tour Bus / Splitter RV (~8 MPG)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Estimated MPG (Miles Per Gallon)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="5"
                          max="50"
                          value={vehicleMpg}
                          onChange={(e) => setVehicleMpg(Math.max(5, Number(e.target.value) || 14))}
                          className="w-full p-3 pl-8 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                        />
                        <Fuel className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Round-Trip Loop Toggle */}
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Book Tour on Way Back Home (Round-Trip Loop)</span>
                        </span>
                        {isRoundTripLoop && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                            Enabled
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-indigo-800/80 max-w-xl">
                        Automatically generate reverse routing stops returning to your starting city, turning your tour into a complete round-trip loop.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={isRoundTripLoop}
                        onChange={(e) => setIsRoundTripLoop(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Diversify Return Route sub-toggle */}
                  {isRoundTripLoop && (
                    <div className="pt-3 border-t border-indigo-200/60 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Diversify Return Route (Loop / Alternate Cities)</span>
                        </span>
                        <p className="text-[11px] text-indigo-800/80">
                          Replaces duplicate cities on the return trip with adjacent, viable secondary music markets along parallel highways (e.g. Bend, Hood River, Yakima, Wenatchee, Everett).
                        </p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={isReturnDiversified}
                          onChange={(e) => setIsReturnDiversified(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => handleSaveAndFinishLater(false)}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Save className="w-4 h-4 text-slate-600" />
                  <span>Save &amp; Finish Later</span>
                </button>

                <button
                  type="button"
                  onClick={handleProceedToOptimization}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
                  id="btn-proceed-to-step2"
                >
                  <span>Optimize Driving Corridor (Step 2)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* STEP 2: SMART ROUTE OPTIMIZATION                                     */}
          {/* --------------------------------------------------------------------- */}
          {wizardStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200" id="tour-step-2-optimization">
              
              {/* Corridor Overview Banner */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-600">
                      Step 2 • Smart Corridor Optimization
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                      Corridor Stops &amp; Driving Logistics
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600">
                      We've calculated logical waypoints along the highway corridor to minimize mileage, gas costs, and driving fatigue. Add, remove, or reorder stops below.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveAndFinishLater(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save &amp; Finish Later</span>
                  </button>
                </div>

                {/* Key Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total Distance</span>
                    <div className="text-lg font-black text-slate-900 flex items-center gap-1">
                      <Navigation className="w-4 h-4 text-indigo-600" />
                      <span>{totalDistanceMiles} mi</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Est. Total Drive Time</span>
                    <div className="text-lg font-black text-slate-900 flex items-center gap-1">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span>{totalDriveTime}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Van Gas Budget (Est.)</span>
                    <div className="text-lg font-black text-emerald-700 flex items-center gap-1">
                      <Fuel className="w-4 h-4 text-emerald-600" />
                      <span>${financials.totalGas}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Performance Stops</span>
                    <div className="text-lg font-black text-slate-900 flex items-center gap-1">
                      <Building className="w-4 h-4 text-indigo-600" />
                      <span>{stops.length} Cities</span>
                    </div>
                  </div>
                </div>

                {/* Loop Route / Return Leg Diversification Card */}
                {(duplicateReturnAnalysis.isOutAndBack || isRoundTripLoop || duplicateReturnAnalysis.hasDuplicates || replacedLoopPairs.length > 0) && (
                  <div className="bg-gradient-to-br from-indigo-50/90 via-slate-50 to-emerald-50/70 border-2 border-indigo-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs" id="loop-route-diversification-card">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <RotateCcw className="w-4 h-4 text-indigo-600 shrink-0" />
                          <h4 className="text-sm font-black text-slate-900 tracking-tight">
                            Loop Route / Return Leg Diversification
                          </h4>
                          {isReturnDiversified && replacedLoopPairs.length > 0 ? (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ Diversified Circular Loop Active
                            </span>
                          ) : duplicateReturnAnalysis.hasDuplicates ? (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{duplicateReturnAnalysis.duplicateCount} Duplicate Cities Detected</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                              Circular Routing
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 max-w-2xl">
                          Replaces duplicate corridor stops on the return leg with adjacent, viable secondary music markets along parallel highways and byways (e.g. Bend, Hood River, Yakima, Wenatchee, Everett).
                        </p>
                      </div>

                      {/* Diversify Toggle */}
                      <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto bg-white/80 p-2 rounded-2xl border border-indigo-200/80 shadow-xs">
                        <span className="text-xs font-black text-slate-800">
                          Diversify Return Route
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isReturnDiversified}
                            onChange={(e) => handleToggleReturnDiversification(e.target.checked)}
                            className="sr-only peer"
                            id="toggle-diversify-return-route"
                          />
                          <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                    </div>

                    {/* Diversified Replacement Details */}
                    {isReturnDiversified && replacedLoopPairs.length > 0 ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-slate-700 uppercase tracking-wider text-[11px]">
                            Parallel Highway Music Markets ({replacedLoopPairs.length} Alternative Stops)
                          </span>
                          <span className="text-slate-500 text-[11px]">Zero redundant backtracking</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {replacedLoopPairs.map((pair, pIdx) => (
                            <div
                              key={pIdx}
                              className="p-3 bg-white rounded-xl border border-indigo-100 shadow-2xs flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="line-through text-slate-400 font-bold">{pair.originalCity}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span className="font-black text-emerald-800">{pair.newCity}, {pair.newState}</span>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                {pair.highway}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Driving logistics, van gas budget, and OpenStreetMap Leaflet waypoints automatically updated for this genuine circular touring loop.</span>
                        </div>
                      </div>
                    ) : duplicateReturnAnalysis.hasDuplicates ? (
                      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="font-black text-amber-900 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Repeating Cities on Return Leg: {duplicateReturnAnalysis.duplicateCities.join(" → ")}</span>
                          </div>
                          <p className="text-amber-800/80 text-[11px]">
                            Playing the same cities twice on the way back may dilute ticket sales. Turn on return diversification to route through adjacent secondary markets along parallel corridors!
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleReturnDiversification(true)}
                          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shrink-0 cursor-pointer transition-colors shadow-xs"
                        >
                          Diversify Route Now
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Stops Manager List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Sequential Corridor Stops ({stops.length})
                    </span>
                    <span className="text-xs text-slate-500">Reorder with arrows or delete</span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Native autocomplete suggestions for standard corridor cities */}
                    <datalist id="known-corridor-cities-list">
                      {KNOWN_CORRIDOR_CITIES.map((c) => (
                        <option key={c.label} value={`${c.city}, ${c.state}`}>
                          {c.label} • {c.tier}
                        </option>
                      ))}
                    </datalist>

                    {stops.map((stop, idx) => {
                      const isOrigin = idx === 0;
                      const isDestination = idx === stops.length - 1;
                      const isFatigued = stop.distanceMilesFromPrev > 260; // > 4.5 hours drive
                      const isEditing = editingStopIndex === idx;

                      if (isEditing) {
                        return (
                          <div
                            key={stop.id || idx}
                            className="p-5 rounded-2xl bg-indigo-50/70 border-2 border-indigo-500 shadow-md space-y-4 transition-all animate-in fade-in"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-200 pb-3">
                              <div className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                                  {idx + 1}
                                </span>
                                <div>
                                  <h4 className="font-black text-indigo-950 text-sm flex items-center gap-1.5">
                                    <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Edit Tour Stop #{idx + 1} — {stop.city}, {stop.state}</span>
                                  </h4>
                                  <p className="text-[11px] text-indigo-700">
                                    Update city, adjust show date, or modify routing priority. Transit metrics &amp; itinerary recalculate instantly.
                                  </p>
                                </div>
                              </div>
                              <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                                {isOrigin ? "Tour Kickoff" : isDestination ? "Tour Finale" : `Day ${idx + 1} Waypoint`}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* City & State Input */}
                              <div className="space-y-1.5 sm:col-span-2">
                                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>City &amp; State / Region</span>
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    list="known-corridor-cities-list"
                                    value={editStopCity}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val.includes(",")) {
                                        const [c, s] = val.split(",").map(p => p.trim());
                                        setEditStopCity(c);
                                        if (s) setEditStopState(s);
                                      } else {
                                        setEditStopCity(val);
                                      }
                                    }}
                                    placeholder="Enter city (e.g. Portland, Seattle, Eugene, Bend, Boise)"
                                    className="flex-1 px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-slate-900 shadow-2xs"
                                  />
                                  <input
                                    type="text"
                                    value={editStopState}
                                    onChange={(e) => setEditStopState(e.target.value.toUpperCase())}
                                    placeholder="State"
                                    maxLength={4}
                                    className="w-24 px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold text-slate-900 uppercase text-center shadow-2xs"
                                  />
                                </div>

                                {/* Quick Corridor City Switcher Badges */}
                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                  <span className="text-[11px] font-bold text-slate-500">Quick Corridor Suggestions:</span>
                                  {[
                                    "Portland, OR", 
                                    "Seattle, WA", 
                                    "Eugene, OR", 
                                    "Bend, OR", 
                                    "Olympia, WA", 
                                    "Tacoma, WA", 
                                    "Spokane, WA", 
                                    "Boise, ID", 
                                    "San Francisco, CA"
                                  ].map((quickCity) => {
                                    const [qC, qS] = quickCity.split(", ");
                                    const isCurrent = editStopCity.toLowerCase() === qC.toLowerCase() && editStopState.toUpperCase() === qS.toUpperCase();
                                    return (
                                      <button
                                        key={quickCity}
                                        type="button"
                                        onClick={() => {
                                          setEditStopCity(qC);
                                          setEditStopState(qS);
                                        }}
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                                          isCurrent
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                            : "bg-white hover:bg-indigo-100 text-slate-700 hover:text-indigo-900 border-slate-200"
                                        }`}
                                      >
                                        {quickCity}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Performance Date Picker */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Performance Date</span>
                                </label>
                                <input
                                  type="date"
                                  value={editStopDate}
                                  onChange={(e) => setEditStopDate(e.target.value)}
                                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-slate-900 shadow-2xs"
                                />
                                <span className="text-[11px] text-slate-500 block">
                                  Shifting show dates updates run-of-show &amp; hotel reservations.
                                </span>
                              </div>

                              {/* Routing Priority / Highlight */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                  <Compass className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Routing Priority / Category</span>
                                </label>
                                <select
                                  value={editStopRoutingPriority}
                                  onChange={(e) => setEditStopRoutingPriority(e.target.value)}
                                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-slate-900 shadow-2xs"
                                >
                                  <option value="Essential Tour Stop (Anchor Market)">Essential Tour Stop (Anchor Market)</option>
                                  <option value="High Priority Weekend Draw">High Priority Weekend Draw</option>
                                  <option value="Corridor Connector / Midweek Showcase">Corridor Connector / Midweek Showcase</option>
                                  <option value="DIY / Community Underplay">DIY / Community Underplay</option>
                                  <option value="Homecoming Wrap-up Show">Homecoming Wrap-up Show</option>
                                  <option value="Rest Day &amp; Van Maintenance">Rest Day &amp; Van Maintenance</option>
                                </select>
                                <span className="text-[11px] text-slate-500 block">
                                  Affects scheduling tags and band itinerary priority.
                                </span>
                              </div>

                              {/* Notes / Routing details */}
                              <div className="space-y-1.5 sm:col-span-2">
                                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                  <Info className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Scene Notes &amp; Routing Priorities</span>
                                </label>
                                <input
                                  type="text"
                                  value={editStopNotes}
                                  onChange={(e) => setEditStopNotes(e.target.value)}
                                  placeholder="e.g. Load-in at 5:00 PM, strong local radio station support, merchandise booth setup"
                                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-900 shadow-2xs"
                                />
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-indigo-200">
                              <button
                                type="button"
                                onClick={handleCancelEditStop}
                                className="px-4 py-2 text-xs font-black text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditStop(idx)}
                                className="px-5 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                                <span>Save Changes</span>
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={stop.id || idx}
                          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                              isOrigin 
                                ? "bg-indigo-600 text-white" 
                                : isDestination 
                                ? "bg-rose-600 text-white" 
                                : "bg-slate-100 text-slate-800"
                            }`}>
                              {idx + 1}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-black text-slate-900 text-sm">
                                  {stop.city}, {stop.state}
                                </h4>
                                {isOrigin && (
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                                    Kickoff
                                  </span>
                                )}
                                {isDestination && (
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                                    Finale
                                  </span>
                                )}
                                {isFatigued && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                                    <span>Fatigue Alert (&gt;4.5 hrs)</span>
                                  </span>
                                )}
                              </div>

                              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span>📅 Day {idx + 1} ({stop.date})</span>
                                <span>🚗 {stop.driveTimeFromPrev} ({stop.distanceMilesFromPrev} mi)</span>
                                <span>⛽ ~${stop.estimatedGasCost || 0} fuel</span>
                              </div>
                            </div>
                          </div>

                          {/* Stop Actions */}
                          <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
                            {/* Edit Tour Stop Action Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditStop(idx)}
                              className="text-[11px] font-black px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 shadow-2xs hover:border-indigo-300"
                              title={`Edit tour stop details for ${stop.city}, ${stop.state}`}
                            >
                              <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Edit Tour Stop</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleMoveStop(idx, "up")}
                              disabled={isOrigin}
                              title="Move Stop Up"
                              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleMoveStop(idx, "down")}
                              disabled={isDestination}
                              title="Move Stop Down"
                              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveStop(idx)}
                              title="Remove Stop"
                              className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Add Intermediate Waypoint Tool */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Add Custom Waypoint City to Route</span>
                  </span>

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Olympia, WA or Sacramento, CA"
                      value={newWaypointInput}
                      onChange={(e) => setNewWaypointInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddWaypoint()}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddWaypoint()}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-black shrink-0 cursor-pointer transition-colors"
                    >
                      Insert Stop
                    </button>
                  </div>
                </div>

                {/* Route Map Preview */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Interactive Corridor Map Preview
                    </span>
                    <span className="text-xs text-slate-500">OpenStreetMap route geometry</span>
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner h-80">
                    <TourMap
                      stops={stops}
                      tourTitle={tourTitle}
                      totalDistanceMiles={totalDistanceMiles}
                      totalDriveTime={totalDriveTime}
                      className="h-full w-full"
                    />
                  </div>
                </div>

                {/* Step 2 Action Buttons */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back to Route Setup</span>
                  </button>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleSaveAndFinishLater(false)}
                      className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Draft</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleProceedToStages}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
                      id="btn-proceed-to-step3"
                    >
                      <span>Set Up Stages &amp; Venues (Step 3)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* STEP 3: CITY-BY-CITY STAGE & LODGING SETUP                            */}
          {/* --------------------------------------------------------------------- */}
          {wizardStep === 3 && stops[activeStageIndex] && (
            <div className="space-y-6 animate-in fade-in duration-200" id="tour-step-3-stages">
              
              {/* Active Stop Card */}
              {(() => {
                const currentStop = stops[activeStageIndex];
                const rawVenues = cityVenuesMap[`${currentStop.city}_${currentStop.state}`] || cityVenuesMap[currentStop.city] || [];
                const availableVenues = rawVenues.length > 0 ? rawVenues : (currentStop.suggestedVenues || []);
                const isCustomMode = customVenueMode[currentStop.id];
                const hasSelectedVenue = Boolean(currentStop.selectedVenue?.name);
                const isLodgingResolved = Boolean(currentStop.selectedLodging?.name) || Boolean(skippedLodgingMap[activeStageIndex]);
                const showInterstitialPrompt = hasSelectedVenue && !isLodgingResolved && inlineLodgingStopIndex !== activeStageIndex;
                const showInlineLodging = inlineLodgingStopIndex === activeStageIndex;

                const stopLodgingOptions = (currentStop.lodgingOptions && currentStop.lodgingOptions.length > 0)
                  ? currentStop.lodgingOptions
                  : findLodgingForCity(currentStop.city, currentStop.state);

                const filteredLodgingOptions = stopLodgingOptions.filter(l => {
                  if (lodgingCategoryFilter === "hotels") return l.type.toLowerCase().includes("hotel") || l.type.toLowerCase().includes("motel") || l.type.toLowerCase().includes("inn");
                  if (lodgingCategoryFilter === "campgrounds") return l.type.toLowerCase().includes("van") || l.type.toLowerCase().includes("rv") || l.type.toLowerCase().includes("camp") || l.type.toLowerCase().includes("koa");
                  if (lodgingCategoryFilter === "free") return l.type.toLowerCase().includes("van") || l.type.toLowerCase().includes("parking") || l.estPricePerNight.includes("$0") || l.estPricePerNight.includes("Free");
                  return true;
                });

                return (
                  <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8">
                    
                    {/* City Stepper Navigation */}
                    <div className="space-y-3 pb-6 border-b border-slate-100">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-xs font-black uppercase tracking-wider text-indigo-600">
                            Step 3 • Stop-by-Stop Stages &amp; Lodging Selection
                          </span>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <span>Stop {activeStageIndex + 1} of {stops.length}:</span>
                            <span className="text-indigo-600">{currentStop.city}, {currentStop.state}</span>
                          </h3>
                          <p className="text-xs text-slate-500">
                            {currentStop.localSceneNotes || "Select a vetted live music venue, then configure overnight lodging accommodations."}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={handleStagePrev}
                            disabled={activeStageIndex === 0}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Previous City</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleStageNext}
                            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>{activeStageIndex === stops.length - 1 ? "Review Tour (Step 5)" : "Next City"}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Horizontal City Stepper Tabs */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2">
                        {stops.map((s, idx) => {
                          const stopVenueDone = Boolean(s.selectedVenue?.name);
                          const stopLodgingDone = Boolean(s.selectedLodging?.name) || Boolean(skippedLodgingMap[idx]);
                          const isFullyDone = stopVenueDone && stopLodgingDone;
                          const isActive = idx === activeStageIndex;

                          return (
                            <button
                              key={s.id || idx}
                              type="button"
                              onClick={() => {
                                setActiveStageIndex(idx);
                                setInterstitialLodgingPromptStop(null);
                                setInlineLodgingStopIndex(null);
                                loadVenuesForStageCity(s.city, s.state);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer transition-all ${
                                isActive 
                                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-black" 
                                  : isFullyDone
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                                  : stopVenueDone
                                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              }`}
                            >
                              <span>{idx + 1}. {s.city}</span>
                              {isFullyDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                              {!isFullyDone && stopVenueDone && <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section 1: Venue Selection */}
                    <div className="space-y-4" id="stop-venue-selection-section">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                            <Building className="w-4 h-4 text-indigo-600" />
                            <span>1. Select Live Music Venue in {currentStop.city}</span>
                          </h4>
                          <p className="text-xs text-slate-500">
                            Vetted live music stages matching your tour genre and room capacity.
                          </p>
                        </div>

                        {hasSelectedVenue && (
                          <button
                            type="button"
                            onClick={() => {
                              setStops(prev => {
                                const copy = [...prev];
                                if (copy[activeStageIndex]) {
                                  copy[activeStageIndex].selectedVenue = undefined;
                                }
                                return copy;
                              });
                              setInterstitialLodgingPromptStop(null);
                              setInlineLodgingStopIndex(null);
                            }}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer self-start sm:self-auto"
                          >
                            ← Change / Reselect Venue
                          </button>
                        )}
                      </div>

                      {/* If venue is already selected, display confirmation card */}
                      {hasSelectedVenue && !isCustomMode ? (() => {
                        const v = currentStop.selectedVenue;
                        const vStatus = v?.bookingStatus || "confirmed";

                        return (
                          <div className="p-5 rounded-2xl bg-slate-50 border-2 border-indigo-300 shadow-sm space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="font-black text-slate-900 text-lg">{v?.name}</h5>
                                  {(v?.isPrivate || v?.venueType === "house_show") && (
                                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1">
                                      <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                                      <span>Private House Show / DIY Space</span>
                                    </span>
                                  )}
                                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                    vStatus === "confirmed"
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                      : vStatus === "penciled"
                                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                                      : "bg-slate-200 text-slate-700 border border-slate-300"
                                  }`}>
                                    {vStatus === "confirmed" && <Check className="w-3 h-3 stroke-[3]" />}
                                    {vStatus === "confirmed" ? "✓ Confirmed & Booked" : vStatus === "penciled" ? "Penciled In (Hold)" : "Unconfirmed Lead"}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                                  <span>
                                    📍 {v?.address || `${currentStop.city}, ${currentStop.state}`}
                                    {(v?.isPrivate || v?.venueType === "house_show") && (
                                      <strong className="text-purple-700 ml-1">(Private Residential Address)</strong>
                                    )}
                                  </span>
                                  {v?.capacity && <span>👥 Cap: {v.capacity}</span>}
                                  {v?.contactPhone && <span>📞 {(v?.isPrivate || v?.venueType === "house_show") ? "Host Cell: " : ""}{v.contactPhone}</span>}
                                  {v?.contactEmail && <span>✉️ {v.contactEmail}</span>}
                                </div>
                                {(v?.loadInNotes || (v?.isPrivate && v?.notes)) && (
                                  <div className="text-[11px] text-purple-950 bg-purple-50 p-2.5 rounded-xl border border-purple-200">
                                    🔒 <strong>Door / Load-In Notes:</strong> {v.loadInNotes || v.notes}
                                  </div>
                                )}
                                {v?.suggestedDonation && (
                                  <div className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 w-fit">
                                    🎟️ Suggested Donation: {v.suggestedDonation}
                                  </div>
                                )}
                              </div>

                              {/* Manual Booking Status Toggle */}
                              <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => handleToggleVenueStatus(activeStageIndex, "unconfirmed")}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                                    vStatus === "unconfirmed" ? "bg-slate-800 text-white font-black" : "text-slate-600 hover:text-slate-900"
                                  }`}
                                >
                                  Unconfirmed / Lead
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleVenueStatus(activeStageIndex, "penciled")}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                                    vStatus === "penciled" ? "bg-amber-500 text-white font-black" : "text-slate-600 hover:text-slate-900"
                                  }`}
                                >
                                  Penciled In
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleVenueStatus(activeStageIndex, "confirmed")}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                                    vStatus === "confirmed" ? "bg-emerald-600 text-white font-black" : "text-slate-600 hover:text-slate-900"
                                  }`}
                                >
                                  ✓ Confirmed &amp; Booked
                                </button>
                              </div>
                            </div>

                            {/* Run of Show Times & Door Payout Terms */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                              <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-0.5">Load-In Time</label>
                                <input
                                  type="text"
                                  value={v?.loadInTime || "5:00 PM"}
                                  onChange={(e) => handleUpdateSchedule(activeStageIndex, "loadInTime", e.target.value)}
                                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                                  placeholder="5:00 PM"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-0.5">Soundcheck</label>
                                <input
                                  type="text"
                                  value={v?.soundcheckTime || "6:30 PM"}
                                  onChange={(e) => handleUpdateSchedule(activeStageIndex, "soundcheckTime", e.target.value)}
                                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                                  placeholder="6:30 PM"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-0.5">Set Time</label>
                                <input
                                  type="text"
                                  value={v?.setTime || "9:00 PM"}
                                  onChange={(e) => handleUpdateSchedule(activeStageIndex, "setTime", e.target.value)}
                                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                                  placeholder="9:00 PM"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-0.5">Door Terms ($ / %)</label>
                                <input
                                  type="text"
                                  value={v?.doorGuarantee || "$350 Guarantee (80% Door)"}
                                  onChange={(e) => handleUpdateSchedule(activeStageIndex, "doorGuarantee", e.target.value)}
                                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                                  placeholder="$350 or 80% Door"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })() : (
                        /* Directory Venues List or Custom Mode */
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                              Available Live Stages ({availableVenues.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => setCustomVenueMode(prev => ({ ...prev, [currentStop.id]: !isCustomMode }))}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1"
                            >
                              {isCustomMode ? "← Choose from Directory" : "+ Add Custom Stage (Commercial or House Show)"}
                            </button>
                          </div>

                          {isCustomMode ? (() => {
                            const stopKey = currentStop.id || String(activeStageIndex);
                            const selectedType = customStageType[stopKey] || "commercial";
                            const isHouseShow = selectedType === "house_show";
                            const inputs = customStageInputs[stopKey] || {};

                            const updateInput = (field: string, val: string) => {
                              setCustomStageInputs(prev => ({
                                ...prev,
                                [stopKey]: {
                                  ...(prev[stopKey] || {}),
                                  [field]: val
                                }
                              }));
                            };

                            return (
                              <div className="bg-slate-50 p-5 sm:p-6 rounded-3xl border-2 border-indigo-200/90 shadow-sm space-y-5 animate-in fade-in duration-200">
                                <div>
                                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <span>Add Custom Stage for {currentStop.city}, {currentStop.state}</span>
                                  </h4>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    Select the venue classification to control public directory listing vs. private tour privacy.
                                  </p>
                                </div>

                                {/* 1. Classification Toggle */}
                                <div className="p-1.5 bg-slate-200/80 rounded-2xl flex flex-col sm:flex-row gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setCustomStageType(prev => ({ ...prev, [stopKey]: "public_venue" }))}
                                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                      !isHouseShow
                                        ? "bg-white text-indigo-950 shadow-md ring-1 ring-slate-300"
                                        : "text-slate-600 hover:text-slate-900"
                                    }`}
                                  >
                                    <Globe className="w-4 h-4 text-indigo-600" />
                                    <span>Commercial / Public Music Venue</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setCustomStageType(prev => ({ ...prev, [stopKey]: "house_show" }))}
                                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                      isHouseShow
                                        ? "bg-purple-700 text-white shadow-md shadow-purple-900/30"
                                        : "text-slate-600 hover:text-slate-900"
                                    }`}
                                  >
                                    <Lock className="w-4 h-4 text-purple-200" />
                                    <span>Private House Show / DIY Space</span>
                                  </button>
                                </div>

                                {/* 2. Explicit Privacy Shield or Public Directory Notice Badge */}
                                {isHouseShow ? (
                                  <div className="p-4 rounded-2xl bg-purple-50 border-2 border-purple-300 flex items-start gap-3.5 text-xs text-purple-950 shadow-xs">
                                    <div className="p-2 rounded-xl bg-purple-600 text-white shrink-0 mt-0.5">
                                      <Shield className="w-4 h-4 stroke-[2.5]" />
                                    </div>
                                    <div className="space-y-1">
                                      <span className="font-black text-purple-950 text-xs uppercase tracking-wider block">
                                        🔒 Private / Anonymous Privacy Shield
                                      </span>
                                      <p className="text-xs text-purple-900 leading-relaxed font-semibold">
                                        🔒 Private / Anonymous: This residential address &amp; contact will ONLY appear on your band&apos;s private tour sheet and will NEVER be published to other users or search engines.
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-300 flex items-start gap-3.5 text-xs text-blue-950 shadow-xs">
                                    <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5">
                                      <Globe className="w-4 h-4 stroke-[2.5]" />
                                    </div>
                                    <div className="space-y-1">
                                      <span className="font-black text-blue-950 text-xs uppercase tracking-wider block">
                                        🌐 Public Directory
                                      </span>
                                      <p className="text-xs text-blue-900 leading-relaxed font-semibold">
                                        🌐 Public Directory: This verified commercial club/theater will be added to the global GigLizard venue directory for all touring bands.
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* 3. Conditional Input Fields */}
                                {isHouseShow ? (
                                  /* Private House Show Fields */
                                  <div className="space-y-3.5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                      <div>
                                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                                          Host Name *
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="e.g. Sarah's Basement / The Treehouse"
                                          value={inputs.hostName || ""}
                                          onChange={(e) => updateInput("hostName", e.target.value)}
                                          className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                                          Host Cell Phone *
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="e.g. 555-234-5678"
                                          value={inputs.hostPhone || ""}
                                          onChange={(e) => updateInput("hostPhone", e.target.value)}
                                          className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                                        Full Address * (Residential / Confidential)
                                      </label>
                                      <input
                                        type="text"
                                        placeholder={`e.g. 1420 Maple Ave, Apt 2, ${currentStop.city}, ${currentStop.state}`}
                                        value={inputs.address || ""}
                                        onChange={(e) => updateInput("address", e.target.value)}
                                        className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                                      />
                                      <span className="text-[10px] text-purple-700 mt-1 block font-medium">
                                        🔒 Stored securely only in your tour route data. Never rendered in public searches.
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                      <div>
                                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                                          Door / Load-in Notes
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="e.g. Back alley load-in, quiet after 11 PM"
                                          value={inputs.loadInNotes || ""}
                                          onChange={(e) => updateInput("loadInNotes", e.target.value)}
                                          className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-purple-600"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                                          Suggested Donation / Door
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="e.g. $10 suggested donation at door, BYOB"
                                          value={inputs.suggestedDonation || ""}
                                          onChange={(e) => updateInput("suggestedDonation", e.target.value)}
                                          className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  /* Commercial Public Venue Fields */
                                  <div className="space-y-3.5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                      <div>
                                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                                          Venue Name *
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="e.g. The Substation Club"
                                          value={inputs.name || ""}
                                          onChange={(e) => updateInput("name", e.target.value)}
                                          className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                                          Room Capacity
                                        </label>
                                        <input
                                          type="number"
                                          placeholder="e.g. 250"
                                          value={inputs.capacity || ""}
                                          onChange={(e) => updateInput("capacity", e.target.value)}
                                          className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                                        Address *
                                      </label>
                                      <input
                                        type="text"
                                        placeholder={`e.g. 645 NW 45th St, ${currentStop.city}, ${currentStop.state}`}
                                        value={inputs.address || ""}
                                        onChange={(e) => updateInput("address", e.target.value)}
                                        className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                                      />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                      <div>
                                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                                          Booking Contact
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="e.g. Alex Rivera"
                                          value={inputs.contactName || ""}
                                          onChange={(e) => updateInput("contactName", e.target.value)}
                                          className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                                          Phone
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="e.g. 206-555-0199"
                                          value={inputs.contactPhone || ""}
                                          onChange={(e) => updateInput("contactPhone", e.target.value)}
                                          className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                                          Booking Email
                                        </label>
                                        <input
                                          type="email"
                                          placeholder="e.g. booking@substation.com"
                                          value={inputs.contactEmail || ""}
                                          onChange={(e) => updateInput("contactEmail", e.target.value)}
                                          className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600"
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                                        PA / Sound Specs
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="e.g. 32-channel digital desk, 4 monitor mixes, 2x18 subs"
                                        value={inputs.soundSpecs || ""}
                                        onChange={(e) => updateInput("soundSpecs", e.target.value)}
                                        className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-600"
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Action Controls */}
                                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
                                  <button
                                    type="button"
                                    onClick={() => setCustomVenueMode(prev => ({ ...prev, [currentStop.id]: false }))}
                                    className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer order-2 sm:order-1"
                                  >
                                    ← Cancel &amp; Choose from Directory
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleConfirmCustomStage(activeStageIndex)}
                                    disabled={isSubmittingCustomStage}
                                    className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-black text-white shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 order-1 sm:order-2 ${
                                      isHouseShow
                                        ? "bg-purple-700 hover:bg-purple-800 shadow-purple-900/30"
                                        : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30"
                                    }`}
                                  >
                                    {isSubmittingCustomStage ? (
                                      <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        <span>Saving Stage...</span>
                                      </>
                                    ) : isHouseShow ? (
                                      <>
                                        <Lock className="w-3.5 h-3.5" />
                                        <span>🔒 Save Private House Show to Tour Sheet</span>
                                      </>
                                    ) : (
                                      <>
                                        <Globe className="w-3.5 h-3.5" />
                                        <span>🌐 Publish Commercial Venue &amp; Attach to Tour</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })() : (
                            /* Vetted Venues Grid with 1-click selection */
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              {availableVenues.map((v) => {
                                const isSelected = currentStop.selectedVenue?.name === v.name;

                                return (
                                  <div
                                    key={v.id || v.name}
                                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                                      isSelected 
                                        ? "bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-600/30 shadow-md" 
                                        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                                    }`}
                                  >
                                    <div className="space-y-1.5">
                                      <div className="flex items-start justify-between gap-2">
                                        <h5 className="font-black text-slate-900 text-sm">{v.name}</h5>
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                          {v.capacity || 150} cap
                                        </span>
                                      </div>
                                      <div className="text-xs text-slate-500 truncate">{v.address}</div>
                                      <div className="flex flex-wrap gap-1 pt-1">
                                        {v.hasPA && (
                                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                            In-House PA
                                          </span>
                                        )}
                                        {v.hasLighting && (
                                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                                            Stage Lights
                                          </span>
                                        )}
                                        {v.genres?.slice(0, 2).map((g) => (
                                          <span key={g} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                            {g}
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                                      <button
                                        type="button"
                                        onClick={() => handleSelectVenueForStop(activeStageIndex, v)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                                          isSelected
                                            ? "bg-indigo-600 text-white shadow-xs"
                                            : "bg-slate-900 hover:bg-indigo-600 text-white"
                                        }`}
                                      >
                                        {isSelected ? (
                                          <>
                                            <Check className="w-3.5 h-3.5" />
                                            <span>Stage Selected</span>
                                          </>
                                        ) : (
                                          <>
                                            <span>Select This Stage / Venue</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                          </>
                                        )}
                                      </button>
                                      {v.contactEmail && (
                                        <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                                          {v.contactEmail}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Section 2: Interstitial Accommodation Prompt per Stop */}
                    {showInterstitialPrompt && (() => {
                      const lodgingDates = getTourStopLodgingDates(currentStop.date);
                      const cityLinks = generateLodgingDeepLinks({
                        city: currentStop.city,
                        state: currentStop.state,
                        checkInDate: lodgingDates.checkIn,
                        checkOutDate: lodgingDates.checkOut,
                        guests: 4
                      });

                      return (
                        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 border border-indigo-500/40 shadow-xl space-y-5 animate-in fade-in duration-200" id="interstitial-lodging-prompt">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  ✓ Stage Locked: {currentStop.selectedVenue?.name}
                                </span>
                                <span className="text-xs text-indigo-300">• Stop {activeStageIndex + 1} of {stops.length}</span>
                              </div>
                              <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                Do you need lodging accommodations in {currentStop.city}?
                              </h4>
                              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                                Show night: <strong>{formatReadableDate(currentStop.date || lodgingDates.checkIn)}</strong> (Check-out: {formatReadableDate(lodgingDates.checkOut)}). Find band-friendly hotels with trailer/van parking, KOA &amp; RV campgrounds, or proceed without lodging.
                              </p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-indigo-800/50 border border-indigo-700/50 flex items-center justify-center shrink-0 hidden sm:flex">
                              <Hotel className="w-6 h-6 text-indigo-300" />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                            {/* Option A */}
                            <button
                              type="button"
                              onClick={() => handleOpenInlineLodging(activeStageIndex)}
                              className="p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center justify-between gap-3 shadow-lg shadow-emerald-600/30 cursor-pointer transition-all active:scale-98"
                              id={`btn-lodging-yes-${activeStageIndex}`}
                            >
                              <div className="flex items-center gap-3 text-left">
                                <div className="w-10 h-10 rounded-xl bg-emerald-700/60 flex items-center justify-center shrink-0">
                                  <Hotel className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <div className="font-black text-sm">Option A: Yes, Find Lodging</div>
                                  <div className="text-[11px] text-emerald-100 font-normal">Hotels, KOA/RV sites, secure parking</div>
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 shrink-0" />
                            </button>

                            {/* Option B */}
                            <button
                              type="button"
                              onClick={() => handleSkipLodgingForStop(activeStageIndex)}
                              className="p-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 font-black flex items-center justify-between gap-3 border border-slate-700 cursor-pointer transition-all active:scale-98"
                              id={`btn-lodging-no-${activeStageIndex}`}
                            >
                              <div className="flex items-center gap-3 text-left">
                                <div className="w-10 h-10 rounded-xl bg-slate-700/60 flex items-center justify-center shrink-0">
                                  <ArrowRight className="w-5 h-5 text-slate-300" />
                                </div>
                                <div>
                                  <div className="font-black text-sm">Option B: No, Continue Without Lodging</div>
                                  <div className="text-[11px] text-slate-400 font-normal">Skip accommodation and advance immediately</div>
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 shrink-0" />
                            </button>
                          </div>

                          {/* Quick OTA Deep-Link Strip */}
                          <div className="pt-2 border-t border-indigo-800/60 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                            <span className="text-[11px] text-slate-300 font-bold flex items-center gap-1.5">
                              <span>Instant OTA Deep-Links ({lodgingDates.checkIn} → {lodgingDates.checkOut}):</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <a
                                href={cityLinks.expediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] flex items-center gap-1 shadow-xs transition-colors"
                              >
                                <span>Reserve on Expedia (Pre-Filled Dates)</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              <a
                                href={cityLinks.bookingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] flex items-center gap-1 border border-slate-700 transition-colors"
                              >
                                <span>Booking.com</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              <a
                                href={cityLinks.koaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] flex items-center gap-1 border border-slate-700 transition-colors"
                              >
                                <span>KOA Campgrounds</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Section 3: Inline Lodging Module (Opened via Option A) */}
                    {showInlineLodging && (() => {
                      const lodgingDates = getTourStopLodgingDates(currentStop.date);
                      const cityLinks = generateLodgingDeepLinks({
                        city: currentStop.city,
                        state: currentStop.state,
                        checkInDate: lodgingDates.checkIn,
                        checkOutDate: lodgingDates.checkOut,
                        guests: 4
                      });

                      return (
                        <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border-2 border-indigo-200 space-y-6 animate-in fade-in duration-200" id="stop-lodging-module">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                            <div className="space-y-0.5">
                              <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                                Overnight Accommodations
                              </span>
                              <h4 className="text-xl font-black text-slate-900 tracking-tight">
                                Band Lodging &amp; Campgrounds in {currentStop.city}
                              </h4>
                              <p className="text-xs text-slate-500">
                                Check-in: <strong>{formatReadableDate(lodgingDates.checkIn)}</strong> → Check-out: <strong>{formatReadableDate(lodgingDates.checkOut)}</strong>. Pre-filtered for trailer parking and gear safety.
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <a
                                href={cityLinks.expediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-xs transition-colors"
                              >
                                <span>Reserve on Expedia (Pre-Filled Dates)</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleSkipLodgingForStop(activeStageIndex)}
                                className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 cursor-pointer"
                              >
                                Skip Lodging for this City
                              </button>
                            </div>
                          </div>

                          {/* Category Filter Pills */}
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                            <button
                              type="button"
                              onClick={() => setLodgingCategoryFilter("all")}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                                lodgingCategoryFilter === "all" ? "bg-indigo-600 text-white font-black" : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                              }`}
                            >
                              All Accommodations
                            </button>
                            <button
                              type="button"
                              onClick={() => setLodgingCategoryFilter("hotels")}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                                lodgingCategoryFilter === "hotels" ? "bg-indigo-600 text-white font-black" : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                              }`}
                            >
                              🏨 Band-Friendly Hotels &amp; Motels
                            </button>
                            <button
                              type="button"
                              onClick={() => setLodgingCategoryFilter("campgrounds")}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                                lodgingCategoryFilter === "campgrounds" ? "bg-indigo-600 text-white font-black" : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                              }`}
                            >
                              🏕 KOA &amp; RV Campgrounds
                            </button>
                            <button
                              type="button"
                              onClick={() => setLodgingCategoryFilter("free")}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                                lodgingCategoryFilter === "free" ? "bg-indigo-600 text-white font-black" : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                              }`}
                            >
                              🚐 Free Overnight Van Parking
                            </button>
                          </div>

                          {/* Curated Lodging Options Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {filteredLodgingOptions.map((lodge) => {
                              const isSelected = currentStop.selectedLodging?.name === lodge.name;
                              const lodgeLinks = generateLodgingDeepLinks({
                                city: currentStop.city,
                                state: currentStop.state,
                                checkInDate: lodgingDates.checkIn,
                                checkOutDate: lodgingDates.checkOut,
                                guests: 4,
                                lodgingName: lodge.name,
                                lodgingType: lodge.type
                              });

                              return (
                                <div
                                  key={lodge.id || lodge.name}
                                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                                    isSelected 
                                      ? "bg-emerald-50/70 border-emerald-600 ring-2 ring-emerald-600/30 shadow-md" 
                                      : "bg-white border-slate-200 hover:border-slate-300"
                                  }`}
                                >
                                  <div className="space-y-1.5">
                                    <div className="flex items-start justify-between gap-2">
                                      <h5 className="font-black text-slate-900 text-sm">{lodge.name}</h5>
                                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                        {lodge.estPricePerNight}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-indigo-700 font-bold">{lodge.type}</div>
                                    <div className="text-xs text-slate-500">{lodge.address}</div>

                                    {/* Gear Security & Parking Note */}
                                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700 space-y-1">
                                      <span className="font-bold text-slate-900 block flex items-center gap-1">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Parking &amp; Trailer Security:</span>
                                      </span>
                                      <p className="text-slate-600">{lodge.gearSecurityNote}</p>
                                    </div>

                                    {/* Amenities */}
                                    {lodge.amenities && lodge.amenities.length > 0 && (
                                      <div className="flex flex-wrap gap-1 pt-1">
                                        {lodge.amenities.map((am) => (
                                          <span key={am} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                            {am}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleLockInLodgingAndAdvance(activeStageIndex, lodge)}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                                          isSelected
                                            ? "bg-emerald-600 text-white shadow-xs"
                                            : "bg-slate-900 hover:bg-emerald-600 text-white"
                                        }`}
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Select &amp; Advance →</span>
                                      </button>

                                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          checked={Boolean(currentStop.selectedLodging?.name === lodge.name && currentStop.selectedLodging?.isBooked)}
                                          onChange={() => {
                                            if (currentStop.selectedLodging?.name !== lodge.name) {
                                              handleSelectLodgingForStop(activeStageIndex, lodge);
                                            }
                                            handleToggleLodgingBooked(activeStageIndex);
                                          }}
                                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                        />
                                        <span>Mark as Booked</span>
                                      </label>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <a
                                        href={lodgeLinks.expediaUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-black flex items-center gap-1 shadow-xs transition-colors"
                                        title="Reserve on Expedia with pre-filled gig dates"
                                      >
                                        <span>Expedia</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                      <a
                                        href={lodgeLinks.bookingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                        title="Search on Booking.com"
                                      >
                                        <span>Booking.com</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                        {/* Custom Lodging Booking Form Fallback */}
                        <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                          <span className="text-xs font-black uppercase text-slate-700 block">
                            Or Add Custom / Already Booked Lodging Reservation
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                            <input
                              type="text"
                              placeholder="Hotel / RV Campground Name *"
                              value={customLodgingInputs[activeStageIndex]?.name || ""}
                              onChange={(e) => setCustomLodgingInputs(prev => ({
                                ...prev,
                                [activeStageIndex]: { ...prev[activeStageIndex], name: e.target.value }
                              }))}
                              className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white"
                            />
                            <input
                              type="text"
                              placeholder="Confirmation #"
                              value={customLodgingInputs[activeStageIndex]?.confirmationNumber || ""}
                              onChange={(e) => setCustomLodgingInputs(prev => ({
                                ...prev,
                                [activeStageIndex]: { ...prev[activeStageIndex], confirmationNumber: e.target.value }
                              }))}
                              className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white"
                            />
                            <input
                              type="number"
                              placeholder="Nightly Cost ($)"
                              value={customLodgingInputs[activeStageIndex]?.cost || ""}
                              onChange={(e) => setCustomLodgingInputs(prev => ({
                                ...prev,
                                [activeStageIndex]: { ...prev[activeStageIndex], cost: e.target.value }
                              }))}
                              className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveCustomLodgingForStop(activeStageIndex)}
                              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer shadow-xs"
                            >
                              Save Reservation &amp; Advance →
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                    {/* Confirmed Lodging Display if already booked */}
                    {currentStop.selectedLodging?.name && !showInlineLodging && (
                      <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Hotel className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-black text-emerald-900 text-sm">
                              Confirmed Lodging: {currentStop.selectedLodging.name}
                            </span>
                            {currentStop.selectedLodging.cost && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                                ${currentStop.selectedLodging.cost} / night
                              </span>
                            )}
                          </div>
                          {currentStop.selectedLodging.gearSecurityNote && (
                            <p className="text-emerald-800 text-[11px]">{currentStop.selectedLodging.gearSecurityNote}</p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenInlineLodging(activeStageIndex)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 cursor-pointer self-start sm:self-auto shrink-0"
                        >
                          Change Lodging
                        </button>
                      </div>
                    )}

                    {/* Skipped Lodging Display */}
                    {skippedLodgingMap[activeStageIndex] && !currentStop.selectedLodging?.name && !showInlineLodging && (
                      <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-between gap-3 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-slate-500 shrink-0" />
                          <span>No lodging needed in {currentStop.city} (crashing with friends or driving through).</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenInlineLodging(activeStageIndex)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-200 text-slate-800 font-bold text-[11px] border border-slate-300 cursor-pointer shrink-0"
                        >
                          Add Lodging
                        </button>
                      </div>
                    )}

                    {/* Section 4: Show Schedule Times */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Show Date &amp; Run-of-Show Times</span>
                        </h4>
                        <span className="text-xs text-slate-500">Customized for this city stop</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Show Date</label>
                          <input
                            type="date"
                            value={currentStop.date || ""}
                            onChange={(e) => handleUpdateStopDate(activeStageIndex, e.target.value)}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Load-in Time</label>
                          <input
                            type="text"
                            value={currentStop.selectedVenue?.loadInTime || "5:00 PM"}
                            onChange={(e) => handleUpdateSchedule(activeStageIndex, "loadInTime", e.target.value)}
                            placeholder="5:00 PM"
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Soundcheck</label>
                          <input
                            type="text"
                            value={currentStop.selectedVenue?.soundcheckTime || "6:30 PM"}
                            onChange={(e) => handleUpdateSchedule(activeStageIndex, "soundcheckTime", e.target.value)}
                            placeholder="6:30 PM"
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Doors Open</label>
                          <input
                            type="text"
                            value={currentStop.selectedVenue?.doorsTime || "7:30 PM"}
                            onChange={(e) => handleUpdateSchedule(activeStageIndex, "doorsTime", e.target.value)}
                            placeholder="7:30 PM"
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Set Time</label>
                          <input
                            type="text"
                            value={currentStop.selectedVenue?.setTime || "9:00 PM"}
                            onChange={(e) => handleUpdateSchedule(activeStageIndex, "setTime", e.target.value)}
                            placeholder="9:00 PM"
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Tickets / Door</label>
                          <input
                            type="text"
                            value={currentStop.selectedVenue?.ticketPrice || "$12 Adv / $15 Door"}
                            onChange={(e) => handleUpdateSchedule(activeStageIndex, "ticketPrice", e.target.value)}
                            placeholder="$12 Door"
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 5: Custom City / Stage Notes */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                        City &amp; Technical Notes (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={currentStop.customNotes || ""}
                        onChange={(e) => handleUpdateStopNotes(activeStageIndex, e.target.value)}
                        placeholder="e.g. Inquire about house bass cab, co-bill support acts, merch table location..."
                        className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Step 3 Navigation Controls */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => setWizardStep(2)}
                          className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black cursor-pointer"
                        >
                          ← Back to Corridor (Step 2)
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveAndFinishLater(false)}
                          className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Draft</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        {activeStageIndex > 0 && (
                          <button
                            type="button"
                            onClick={handleStagePrev}
                            className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black cursor-pointer"
                          >
                            Previous City Stop
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={handleStageNext}
                          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
                          id="btn-next-stage-or-review"
                        >
                          <span>
                            {activeStageIndex === stops.length - 1 
                              ? "Review & Finalize Tour (Step 5) →" 
                              : "Next City Stop →"}
                          </span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })()}

            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* STEP 4: TOUR LODGING & ACCOMMODATIONS (Unlocked after stages chosen)  */}
          {/* --------------------------------------------------------------------- */}
          {wizardStep === 4 && stops[activeLodgingIndex] && (
            <div className="space-y-6 animate-in fade-in duration-200" id="tour-step-4-lodging">
              {(() => {
                const currentStop = stops[activeLodgingIndex];
                const { checkIn, checkOut } = getStopCheckInAndOut(currentStop, startDate, activeLodgingIndex);
                const formattedCheckIn = formatReadableDate(checkIn);
                const formattedCheckOut = formatReadableDate(checkOut);
                const { hotelsDotComUrl, bookingDotComUrl, googleHotelsUrl } = generateHotelSearchUrls(
                  currentStop.city,
                  currentStop.state,
                  checkIn,
                  checkOut
                );
                const hasLodgingDetails = Boolean(
                  currentStop.selectedLodging?.name ||
                  currentStop.selectedLodging?.confirmationNumber ||
                  currentStop.selectedLodging?.cost ||
                  currentStop.selectedLodging?.notes
                );
                const currentSnippet = pastedConfirmationSnippet[activeLodgingIndex] || "";

                return (
                  <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8">
                    
                    {/* Header & City Tabs */}
                    <div className="space-y-4 pb-6 border-b border-slate-100">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-xs font-black uppercase tracking-wider text-amber-600">
                            Step 4 • Book Hotels &amp; Accommodations
                          </span>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                            Stop {activeLodgingIndex + 1} of {stops.length}: {currentStop.city}, {currentStop.state}
                          </h3>
                          <p className="text-xs text-slate-500">
                            Show Night: <strong className="text-slate-800">{currentStop.date || formattedCheckIn}</strong> • Check-In: <strong className="text-slate-800">{formattedCheckIn}</strong> → Check-Out: <strong className="text-slate-800">{formattedCheckOut}</strong>
                          </p>

                          {/* Stop Venue Booking Status Badge & Quick Toggle */}
                          {(() => {
                            const v = currentStop.selectedVenue;
                            const vStatus = v?.bookingStatus || (v?.name ? "unconfirmed" : "unconfirmed");
                            const hasVenue = Boolean(v?.name);

                            return (
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Venue:</span>
                                <span className="text-xs font-black text-slate-900">{v?.name || "Unbooked / Missing Venue"}</span>
                                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                  !hasVenue 
                                    ? "bg-rose-100 text-rose-800 border border-rose-300"
                                    : vStatus === "confirmed"
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                    : vStatus === "penciled"
                                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                                    : "bg-slate-200 text-slate-700 border border-slate-300"
                                }`}>
                                  {vStatus === "confirmed" && hasVenue && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  {!hasVenue ? "Unbooked / Missing Venue" : vStatus === "confirmed" ? "✓ Venue Confirmed" : vStatus === "penciled" ? "Penciled In" : "Unconfirmed Lead"}
                                </span>

                                <div className="inline-flex rounded-lg bg-white p-0.5 border border-slate-200 text-[10px]">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleVenueStatus(activeLodgingIndex, "unconfirmed")}
                                    className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                                      vStatus === "unconfirmed" && hasVenue ? "bg-slate-800 text-white" : "text-slate-600 hover:text-slate-900"
                                    }`}
                                  >
                                    Lead
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleVenueStatus(activeLodgingIndex, "penciled")}
                                    className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                                      vStatus === "penciled" ? "bg-amber-500 text-white" : "text-slate-600 hover:text-slate-900"
                                    }`}
                                  >
                                    Penciled
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleVenueStatus(activeLodgingIndex, "confirmed")}
                                    className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                                      vStatus === "confirmed" ? "bg-emerald-600 text-white" : "text-slate-600 hover:text-slate-900"
                                    }`}
                                  >
                                    ✓ Confirmed
                                  </button>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleLodgingPrev}
                            disabled={activeLodgingIndex === 0}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Previous City</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleLodgingNext}
                            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-black flex items-center gap-1 cursor-pointer"
                          >
                            <span>{activeLodgingIndex === stops.length - 1 ? "Proceed to Review (Step 5)" : "Next City"}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Horizontal City Tabs */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
                        {stops.map((s, idx) => {
                          const isLodgingDone = Boolean(s.selectedLodging?.name || s.selectedLodging?.confirmationNumber);
                          const isActive = idx === activeLodgingIndex;

                          return (
                            <button
                              key={s.id || idx}
                              type="button"
                              onClick={() => setActiveLodgingIndex(idx)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer transition-all ${
                                isActive 
                                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/30 font-black" 
                                  : isLodgingDone
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              }`}
                            >
                              <span>{idx + 1}. {s.city}</span>
                              {isLodgingDone && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Clear, Honest Lodging Disclaimer Banner */}
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-xs">
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-800 shrink-0 mt-0.5">
                        <Info className="w-5 h-5 text-amber-800" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                          Direct Hotel Booking Policy
                        </h4>
                        <p className="text-xs sm:text-sm text-amber-950 leading-relaxed font-medium">
                          GigLizard helps your band find budget-friendly rooms and trailer parking along your route, but does NOT book rooms or charge your card. You will book directly on each hotel&apos;s official site. We are working on a seamless hotel booking solution.
                        </p>
                      </div>
                    </div>

                    {/* Direct Outbound Provider Buttons */}
                    {(() => {
                      const lodgingDates = getTourStopLodgingDates(currentStop.date || checkIn);
                      const cityLinks = generateLodgingDeepLinks({
                        city: currentStop.city,
                        state: currentStop.state,
                        checkInDate: lodgingDates.checkIn,
                        checkOutDate: lodgingDates.checkOut,
                        guests: 4
                      });

                      return (
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                              <ExternalLink className="w-4 h-4 text-emerald-600" />
                              <span>Live OTA Deep-Links for {currentStop.city} ({lodgingDates.checkIn} → {lodgingDates.checkOut})</span>
                            </h4>
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-slate-200 transition-colors w-fit">
                              <input
                                type="checkbox"
                                checked={Boolean(currentStop.selectedLodging?.isBooked)}
                                onChange={() => handleToggleLodgingBooked(activeLodgingIndex)}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                              <span>Mark {currentStop.city} Room as Booked</span>
                            </label>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                            {/* Expedia Deep Link */}
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-white border-2 border-amber-300 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between space-y-3">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                                    <Hotel className="w-4 h-4 text-amber-600" />
                                    <span>Expedia</span>
                                  </span>
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-200 text-amber-950">Official Partner</span>
                                </div>
                                <p className="text-[11px] text-slate-600">
                                  Gig night: <strong>{formatReadableDate(lodgingDates.checkIn)}</strong> → <strong>{formatReadableDate(lodgingDates.checkOut)}</strong>. Pre-filled dates &amp; 4 band guests.
                                </p>
                              </div>
                              <a
                                href={cityLinks.expediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                              >
                                <span>Reserve on Expedia (Pre-Filled Dates) ↗</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>

                            {/* Booking.com */}
                            <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition-all flex flex-col justify-between space-y-3">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-black text-slate-900 text-sm">Booking.com</span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">Free Parking Filter</span>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  Pre-filtered for on-site vehicle parking to safeguard tour vans and gear trailers.
                                </p>
                              </div>
                              <a
                                href={cityLinks.bookingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                              >
                                <span>Book on Booking.com ↗</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>

                            {/* KOA & Campgrounds */}
                            <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all flex flex-col justify-between space-y-3">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-black text-slate-900 text-sm">KOA / Van Camping</span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">RV / Van Sites</span>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  Tour van campsites, pull-through RV spaces, and 24/7 security near {currentStop.city}.
                                </p>
                              </div>
                              <a
                                href={cityLinks.koaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                              >
                                <span>Search KOA Campgrounds ↗</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Vetted Band-Friendly Hotels for this Stop */}
                    {currentStop.lodgingOptions && currentStop.lodgingOptions.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Recommended Band Motels in {currentStop.city}</span>
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {currentStop.lodgingOptions.map((opt, i) => {
                            const optKey = opt.id || opt.name || String(i);
                            const isEditingThisCard = inlineHotelEditKey === optKey;
                            const nightlyRate = parseNightlyRate(opt.estPricePerNight);
                            const totalCost = calculateStayCost(nightlyRate, 1);
                            const optDates = getTourStopLodgingDates(currentStop.date || checkIn);
                            const optLinks = generateLodgingDeepLinks({
                              city: currentStop.city,
                              state: currentStop.state,
                              checkInDate: optDates.checkIn,
                              checkOutDate: optDates.checkOut,
                              guests: 4,
                              lodgingName: opt.name,
                              lodgingType: opt.type
                            });
                            const isThisHotelSelected = currentStop.selectedLodging?.name === opt.name;
                            const isOptBooked = Boolean(isThisHotelSelected && currentStop.selectedLodging?.isBooked);
                            const phone = (isThisHotelSelected && currentStop.selectedLodging?.phone) || opt.phone || getCityHotelPhone(currentStop.city, currentStop.state);
                            const address = (isThisHotelSelected && currentStop.selectedLodging?.address) || opt.address || `${currentStop.city}, ${currentStop.state}`;

                            return (
                              <div
                                key={optKey}
                                className={`p-4 rounded-2xl border transition-all shadow-xs flex flex-col justify-between space-y-3 ${
                                  isOptBooked
                                    ? "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20"
                                    : isThisHotelSelected
                                    ? "border-indigo-400 bg-indigo-50/40 ring-1 ring-indigo-400/30"
                                    : "border-slate-200 bg-white hover:border-slate-300"
                                }`}
                              >
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <h5 className="font-black text-slate-900 text-sm">{opt.name}</h5>
                                        {isOptBooked ? (
                                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                                            <span>✓ BOOKED &amp; CONFIRMED</span>
                                          </span>
                                        ) : isThisHotelSelected ? (
                                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                                            Selected
                                          </span>
                                        ) : null}
                                      </div>
                                      <span className="text-xs text-slate-500 block mt-0.5">
                                        {opt.type} • {address}
                                      </span>
                                      {phone && (
                                        <div className="text-[11px] mt-1 flex items-center gap-1">
                                          <Phone className="w-3 h-3 text-indigo-500 shrink-0" />
                                          <span className="text-slate-500">Front Desk:</span>
                                          <a
                                            href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                                            className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                                            title={`Call front desk at ${phone}`}
                                          >
                                            {phone}
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                                        ${nightlyRate}/nt
                                      </span>
                                      <div className="text-[10px] text-slate-400 mt-0.5">
                                        Est. Total: ${totalCost}
                                      </div>
                                    </div>
                                  </div>

                                  {opt.gearSecurityNote && (
                                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-start gap-1.5">
                                      <Car className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                      <span>{opt.gearSecurityNote}</span>
                                    </div>
                                  )}

                                  {/* Quick Confirmation / Inline Hotel Details Row (User Request 2) */}
                                  {isEditingThisCard && (
                                    <div className="p-3 bg-white rounded-xl border border-indigo-200 shadow-2xs space-y-2 mt-2">
                                      <div className="text-[11px] font-black uppercase text-indigo-900 flex items-center justify-between">
                                        <span>Add / Edit Hotel Details for Itinerary</span>
                                        <span className="text-[10px] text-slate-400 font-normal">Auto-saves to tour</span>
                                      </div>

                                      {/* Quick Paste Ingest Row */}
                                      <div className="p-2 bg-indigo-50/70 rounded-lg border border-indigo-100 space-y-1">
                                        <div className="flex items-center justify-between text-[10px] font-bold text-indigo-900">
                                          <span className="flex items-center gap-1">
                                            <Clipboard className="w-3 h-3 text-indigo-600" />
                                            <span>Quick Paste Ingest (Confirmation Email / Text)</span>
                                          </span>
                                        </div>
                                        <input
                                          type="text"
                                          placeholder="Paste Expedia/Hotel receipt or confirmation email..."
                                          className="w-full p-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                                          onChange={(e) => {
                                            const text = e.target.value;
                                            if (text.trim()) {
                                              const parsed = parseBookingConfirmationSnippet(text);
                                              if (parsed.confirmationNumber) {
                                                handleUpdateLodgingField(activeLodgingIndex, "confirmationNumber", parsed.confirmationNumber);
                                              }
                                              if (parsed.hotelName) {
                                                handleUpdateLodgingField(activeLodgingIndex, "name", parsed.hotelName);
                                              }
                                              if (parsed.totalCost) {
                                                handleUpdateLodgingField(activeLodgingIndex, "cost", parsed.totalCost);
                                              }
                                              if (parsed.parkingNotes) {
                                                handleUpdateLodgingField(activeLodgingIndex, "notes", parsed.parkingNotes);
                                              }
                                              handleUpdateLodgingField(activeLodgingIndex, "isBooked", true);
                                              triggerToast("✓ Ingested confirmation details into itinerary!", "success");
                                            }
                                          }}
                                        />
                                      </div>

                                      <div className="space-y-1.5">
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-600 uppercase">Hotel / Motel Name</label>
                                          <input
                                            type="text"
                                            value={isThisHotelSelected && currentStop.selectedLodging?.name ? currentStop.selectedLodging.name : opt.name}
                                            onChange={(e) => {
                                              if (!isThisHotelSelected) {
                                                handleSelectLodgingForStop(activeLodgingIndex, opt, true);
                                              }
                                              handleUpdateLodgingField(activeLodgingIndex, "name", e.target.value);
                                            }}
                                            placeholder="Hotel Name"
                                            className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                                          />
                                        </div>

                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-600 uppercase">Street Address</label>
                                          <input
                                            type="text"
                                            value={(isThisHotelSelected && currentStop.selectedLodging?.address) || opt.address || `${currentStop.city}, ${currentStop.state}`}
                                            onChange={(e) => {
                                              if (!isThisHotelSelected) {
                                                handleSelectLodgingForStop(activeLodgingIndex, opt, true);
                                              }
                                              handleUpdateLodgingField(activeLodgingIndex, "address", e.target.value);
                                            }}
                                            placeholder="Street Address"
                                            className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                                          />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="block text-[10px] font-bold text-slate-600 uppercase">Front Desk Phone</label>
                                            <input
                                              type="text"
                                              value={(isThisHotelSelected && currentStop.selectedLodging?.phone) || phone}
                                              onChange={(e) => {
                                                if (!isThisHotelSelected) {
                                                  handleSelectLodgingForStop(activeLodgingIndex, opt, true);
                                                }
                                                handleUpdateLodgingField(activeLodgingIndex, "phone", e.target.value);
                                              }}
                                              placeholder="(555) 000-0000"
                                              className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-[10px] font-bold text-slate-600 uppercase">Confirmation / Res #</label>
                                            <input
                                              type="text"
                                              value={(isThisHotelSelected && currentStop.selectedLodging?.confirmationNumber) || ""}
                                              onChange={(e) => {
                                                if (!isThisHotelSelected) {
                                                  handleSelectLodgingForStop(activeLodgingIndex, opt, true);
                                                }
                                                handleUpdateLodgingField(activeLodgingIndex, "confirmationNumber", e.target.value);
                                              }}
                                              placeholder="e.g. CONF-89210"
                                              className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-indigo-700"
                                            />
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between pt-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleSelectLodgingForStop(activeLodgingIndex, opt, true);
                                            setInlineHotelEditKey(null);
                                          }}
                                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs inline-flex items-center gap-1 cursor-pointer"
                                        >
                                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                                          <span>✓ Save Hotel to Itinerary</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setInlineHotelEditKey(null)}
                                          className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer font-bold"
                                        >
                                          Close
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    {!isThisHotelSelected ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleSelectLodgingForStop(activeLodgingIndex, opt, true);
                                          setInlineHotelEditKey(optKey);
                                        }}
                                        className="px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-colors flex items-center gap-1 bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs"
                                        title="Select this hotel and bind to itinerary as Booked & Confirmed"
                                      >
                                        <Check className="w-3 h-3 stroke-[3]" />
                                        <span>Select &amp; Confirm</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const nextBooked = !isOptBooked;
                                          handleSelectLodgingForStop(activeLodgingIndex, opt, nextBooked);
                                          if (nextBooked) {
                                            setInlineHotelEditKey(optKey);
                                          }
                                        }}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-colors flex items-center gap-1 ${
                                          isOptBooked
                                            ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs"
                                            : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300"
                                        }`}
                                        title={isOptBooked ? "Click to mark pending" : "Click to mark as booked & confirmed"}
                                      >
                                        <Check className="w-3 h-3 stroke-[3]" />
                                        <span>{isOptBooked ? "✓ Booked & Confirmed" : "Mark as Booked"}</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (inlineHotelEditKey === optKey) {
                                          setInlineHotelEditKey(null);
                                        } else {
                                          if (!isThisHotelSelected) {
                                            handleSelectLodgingForStop(activeLodgingIndex, opt, true);
                                          }
                                          setInlineHotelEditKey(optKey);
                                        }
                                      }}
                                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1"
                                    >
                                      <span>{inlineHotelEditKey === optKey ? "Hide details ↑" : "Add Hotel Details ↓"}</span>
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <a
                                      href={optLinks.expediaUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={() => {
                                        handleSelectLodgingForStop(activeLodgingIndex, opt, true);
                                        setInlineHotelEditKey(optKey);
                                      }}
                                      className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer shrink-0"
                                      title="Reserve this property directly on Expedia with pre-filled dates"
                                    >
                                      <span>Reserve on Expedia ↗</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Streamlined Itinerary Import */}
                    <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 border-2 border-slate-200 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h5 className="text-sm font-black text-slate-900 flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Already booked your room? Enter your details below to save them to your master tour itinerary.</span>
                          </h5>
                          <p className="text-xs text-slate-500">
                            Enter your confirmed booking details to lock lodging into your route data and financial totals.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {hasLodgingDetails && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Saved in Route Data</span>
                            </span>
                          )}
                          {hasLodgingDetails && (
                            <button
                              type="button"
                              onClick={() => handleClearLodgingForStop(activeLodgingIndex)}
                              className="text-[11px] font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              Clear Details
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Confirmation Email Paste Snippet Reader */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700">
                          Instant Confirmation Paste Reader
                        </label>
                        <textarea
                          rows={2}
                          value={currentSnippet}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPastedConfirmationSnippet(prev => ({ ...prev, [activeLodgingIndex]: val }));
                            const parsed = parseBookingConfirmationSnippet(val);
                            if (parsed.hotelName) handleUpdateLodgingField(activeLodgingIndex, "name", parsed.hotelName);
                            if (parsed.confirmationNumber) handleUpdateLodgingField(activeLodgingIndex, "confirmationNumber", parsed.confirmationNumber);
                            if (parsed.totalCost) handleUpdateLodgingField(activeLodgingIndex, "cost", parsed.totalCost);
                            if (parsed.parkingNotes) handleUpdateLodgingField(activeLodgingIndex, "notes", parsed.parkingNotes);
                          }}
                          placeholder="Paste booking confirmation snippet from Booking.com, Hotels.com, or motel email to auto-extract fields..."
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                        />
                      </div>

                      {/* Clean Entry Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        <div>
                          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                            Hotel / Motel Name *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={currentStop.selectedLodging?.name || ""}
                              onChange={(e) => handleUpdateLodgingField(activeLodgingIndex, "name", e.target.value)}
                              placeholder="e.g. Motel 6 Central"
                              className="w-full p-2.5 pl-8 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                            />
                            <Hotel className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                            Street Address
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={currentStop.selectedLodging?.address || ""}
                              onChange={(e) => handleUpdateLodgingField(activeLodgingIndex, "address", e.target.value)}
                              placeholder={`e.g. 1024 Main St, ${currentStop.city}, ${currentStop.state}`}
                              className="w-full p-2.5 pl-8 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                            />
                            <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                            Front Desk Phone
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={currentStop.selectedLodging?.phone || ""}
                              onChange={(e) => handleUpdateLodgingField(activeLodgingIndex, "phone", e.target.value)}
                              placeholder="e.g. (555) 234-5678"
                              className="w-full p-2.5 pl-8 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                            />
                            <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                            Confirmed Reservation #
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={currentStop.selectedLodging?.confirmationNumber || ""}
                              onChange={(e) => handleUpdateLodgingField(activeLodgingIndex, "confirmationNumber", e.target.value)}
                              placeholder="e.g. CONF-8924192"
                              className="w-full p-2.5 pl-8 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                            />
                            <Receipt className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                            Cost ($/night) *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={currentStop.selectedLodging?.cost ?? ""}
                              onChange={(e) => handleUpdateLodgingField(activeLodgingIndex, "cost", e.target.value)}
                              placeholder="e.g. 95"
                              className="w-full p-2.5 pl-8 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                            />
                            <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                          Trailer Parking Notes *
                        </label>
                        <textarea
                          rows={2}
                          value={currentStop.selectedLodging?.notes ?? currentStop.lodgingNotes ?? ""}
                          onChange={(e) => handleUpdateLodgingField(activeLodgingIndex, "notes", e.target.value)}
                          placeholder="e.g. Front desk confirmed van + trailer parking in rear lot under spotlight. 14ft height clearance."
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                        />
                      </div>

                      {/* Direct Commit to Supabase route_data */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                        <span className="text-[11px] text-slate-500">
                          Saves directly into your tour route_data in Supabase.
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const lodging = currentStop.selectedLodging;
                            handleCommitLodgingReservation(activeLodgingIndex, {
                              name: lodging?.name || `Hotel in ${currentStop.city}`,
                              confirmationNumber: lodging?.confirmationNumber || `CONF-${Date.now().toString().slice(-6)}`,
                              cost: lodging?.cost !== undefined ? lodging.cost : 85,
                              parkingNotes: lodging?.notes || currentStop.lodgingNotes || "Ground lot trailer clearance confirmed",
                              notes: lodging?.notes || "",
                              address: lodging?.address || `${currentStop.city}, ${currentStop.state}`,
                              phone: lodging?.phone || getCityHotelPhone(currentStop.city, currentStop.state),
                              checkIn,
                              checkOut
                            });
                          }}
                          disabled={!currentStop.selectedLodging?.name}
                          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-emerald-600/30 transition-all cursor-pointer"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Save Reservation to Tour Itinerary</span>
                        </button>
                      </div>
                    </div>

                    {/* Step 4 Navigation Controls */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => setWizardStep(3)}
                          className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black cursor-pointer"
                        >
                          ← Back to Stages (Step 3)
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveAndFinishLater(false)}
                          className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Draft</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        {activeLodgingIndex > 0 && (
                          <button
                            type="button"
                            onClick={handleLodgingPrev}
                            className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black cursor-pointer"
                          >
                            Previous City Lodging
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={handleLodgingNext}
                          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-black shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
                          id="btn-next-lodging-or-review"
                        >
                          <span>
                            {activeLodgingIndex === stops.length - 1 
                              ? "Proceed to Review & Finalize (Step 5) →" 
                              : "Next City Lodging →"}
                          </span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })()}
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* STEP 5: REVIEW, INTERACTIVE MAP & FINALIZATION                        */}
          {/* --------------------------------------------------------------------- */}
          {wizardStep === 5 && (
            <div className="space-y-6 animate-in fade-in duration-200" id="tour-step-5-review">
              
              {/* Review Overview Banner */}
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6">
                
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {tourStatus === "confirmed" ? "Confirmed Run" : "Review Stage"}
                      </span>
                      <span className="text-xs text-slate-500">• {stops.length} Cities</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {tourTitle}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600">
                      {originCity} → {destinationCity} ({startDate} through {endDate})
                    </p>
                  </div>

                  {/* Top Confirmation & Export Actions */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {tourStatus !== "confirmed" && (
                      <button
                        type="button"
                        onClick={() => handleSaveAndFinishLater(true)}
                        className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-transform active:scale-98"
                        id="btn-confirm-tour-final"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Confirm &amp; Finalize Tour</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSaveAndFinishLater(false)}
                      className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center gap-2 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Draft</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowEmailModal(true)}
                      className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-2 shadow-md hover:shadow-indigo-600/30 cursor-pointer transition-all active:scale-98"
                      id="btn-open-email-itinerary"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Itinerary to Band &amp; Crew</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowPrintModal(true)}
                      className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-black flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
                      id="btn-open-print-modal"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Sheet</span>
                    </button>
                  </div>
                </div>

                {/* Financials & Distance Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-500">Total Mileage</span>
                    <div className="text-lg font-black text-slate-900 flex items-center gap-1">
                      <Navigation className="w-4 h-4 text-indigo-600" />
                      <span>{totalDistanceMiles} mi</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-500">Est. Drive Time</span>
                    <div className="text-lg font-black text-slate-900 flex items-center gap-1">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span>{totalDriveTime}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-500">Gas Budget</span>
                    <div className="text-lg font-black text-emerald-700 flex items-center gap-1">
                      <Fuel className="w-4 h-4 text-emerald-600" />
                      <span>${financials.totalGas}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-500">Lodging Est.</span>
                    <div className="text-lg font-black text-slate-900 flex items-center gap-1">
                      <Hotel className="w-4 h-4 text-indigo-600" />
                      <span>${financials.totalLodgingCost}</span>
                    </div>
                  </div>

                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-black uppercase text-slate-500">Confirmed Stages</span>
                    <div className="text-lg font-black text-indigo-700 flex items-center gap-1">
                      <Building className="w-4 h-4 text-indigo-600" />
                      <span>{financials.confirmedVenuesCount} / {stops.length}</span>
                    </div>
                  </div>
                </div>

                {/* Pre-Tour Flawless Execution Audit Engine Banner */}
                <div className={`p-5 sm:p-6 rounded-3xl border-2 space-y-4 ${
                  tourAuditReport.criticalIssuesCount > 0 
                    ? "bg-rose-50/70 border-rose-300"
                    : tourAuditReport.warningIssuesCount > 0
                    ? "bg-amber-50/70 border-amber-300"
                    : "bg-emerald-50/70 border-emerald-300"
                }`} id="tour-readiness-audit-card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className={`w-5 h-5 ${
                          tourAuditReport.criticalIssuesCount > 0 ? "text-rose-600" : tourAuditReport.warningIssuesCount > 0 ? "text-amber-600" : "text-emerald-600"
                        }`} />
                        <h4 className="text-base font-black text-slate-900 tracking-tight">
                          Pre-Tour Flawless Execution Audit
                        </h4>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          tourAuditReport.criticalIssuesCount > 0 
                            ? "bg-rose-100 text-rose-800"
                            : tourAuditReport.warningIssuesCount > 0
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {tourAuditReport.rating}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        {tourAuditReport.summaryText}
                      </p>
                    </div>

                    {/* Live Score Gauge */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-2xl font-black text-slate-900 leading-none">
                          {tourAuditReport.score}%
                        </div>
                        <div className="text-[10px] font-black uppercase text-slate-500">Readiness Score</div>
                      </div>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-xs ${
                        tourAuditReport.score >= 85 ? "bg-emerald-600" : tourAuditReport.score >= 60 ? "bg-amber-500" : "bg-rose-600"
                      }`}>
                        {tourAuditReport.score}%
                      </div>
                    </div>
                  </div>

                  {/* Audit Issues List with 1-click jumps & Inline Venue Contact Dossier */}
                  {tourAuditReport.issues.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
                      {tourAuditReport.issues.map((iss) => {
                        const targetStop = stops[iss.stopIndex];
                        const venue = targetStop?.selectedVenue;
                        const vStatus = targetStop?.venueStatus || (venue?.isPrivate ? "confirmed" : venue ? "penciled" : "unconfirmed");
                        const isVenueIssue = (iss.category === "venue" || iss.category === "contact" || iss.category === "terms" || vStatus !== "confirmed") && iss.category !== "lodging";
                        const isLodgingIssue = iss.category === "lodging";

                        const phone = venue?.contactPhone || venue?.hostPhone;
                        const email = venue?.contactEmail;
                        const contactPerson = venue?.contactName || venue?.hostName;
                        const isHouseShow = Boolean(venue?.isPrivate || venue?.venueType === "house_show");

                        const mailSubject = encodeURIComponent(`Booking Inquiry: ${tourTitle || "Upcoming Tour"} - ${iss.stopCity} (${targetStop?.date || "Show Date"})`);
                        const mailBody = encodeURIComponent(`Hi ${contactPerson || "Booking Team"},\n\nWe are routing our tour and would love to confirm a date with ${venue?.name || "your venue"} in ${iss.stopCity} on ${targetStop?.date || "our upcoming show date"}.\n\nPlease let us know your hold status, sound specs, and door settlement terms.\n\nTour: ${tourTitle || "Touring Artist"}\nCity: ${iss.stopCity}\nDate: ${targetStop?.date || ""}\n\nThank you!`);
                        const mailtoHref = email ? `mailto:${email}?subject=${mailSubject}&body=${mailBody}` : undefined;
                        const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : undefined;

                        return (
                          <div
                            key={iss.id}
                            className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-3 text-xs"
                          >
                            <div className="space-y-2">
                              {/* Header & Severity */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                    iss.severity === "critical" ? "bg-rose-600" : iss.severity === "warning" ? "bg-amber-500" : "bg-blue-500"
                                  }`} />
                                  <span className="text-xs font-black">{iss.title}</span>
                                </div>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                                  iss.severity === "critical" ? "bg-rose-100 text-rose-800 border border-rose-200" :
                                  iss.severity === "warning" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                                  "bg-blue-100 text-blue-800 border border-blue-200"
                                }`}>
                                  {iss.severity}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-500 leading-tight">
                                {iss.message}
                              </p>

                              {/* Inline Venue Contact Dossier for Unconfirmed/Pending Venues */}
                              {isVenueIssue && (
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2 mt-1">
                                  {/* Prominent Venue Name & Status */}
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                      <Building className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                      <span className="font-black text-slate-900 text-xs">
                                        {venue?.name || `No Venue Selected (${iss.stopCity})`}
                                      </span>
                                      {isHouseShow && (
                                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-0.5">
                                          <Lock className="w-2.5 h-2.5" />
                                          <span>House Show</span>
                                        </span>
                                      )}
                                    </div>

                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                      vStatus === "confirmed" ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                                      vStatus === "penciled" ? "bg-amber-100 text-amber-800 border border-amber-300" :
                                      "bg-rose-100 text-rose-800 border border-rose-300"
                                    }`}>
                                      {vStatus === "confirmed" ? "✓ Confirmed" : vStatus === "penciled" ? "Penciled In" : "Unconfirmed Lead"}
                                    </span>
                                  </div>

                                  {/* Primary Contact / Talent Buyer */}
                                  {contactPerson && (
                                    <div className="text-[11px] text-slate-700 flex items-center gap-1.5">
                                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span>Talent Buyer / Host: <strong className="text-slate-900">{contactPerson}</strong></span>
                                    </div>
                                  )}

                                  {/* Contact Links */}
                                  {(phone || email) ? (
                                    <div className="flex flex-wrap items-center gap-3 text-[11px]">
                                      {phone && (
                                        <a
                                          href={telHref}
                                          className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 hover:underline"
                                          title={`Call ${venue?.name || "Venue"}`}
                                        >
                                          <Phone className="w-3 h-3 text-indigo-500" />
                                          <span>{phone}</span>
                                        </a>
                                      )}
                                      {email && (
                                        <a
                                          href={mailtoHref}
                                          className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 hover:underline truncate max-w-[200px]"
                                          title={`Email ${email}`}
                                        >
                                          <Mail className="w-3 h-3 text-indigo-500" />
                                          <span className="truncate">{email}</span>
                                        </a>
                                      )}
                                    </div>
                                  ) : (
                                    venue?.name && (
                                      <p className="text-[10px] text-slate-400 italic">
                                        No direct booking contact phone/email on file.
                                      </p>
                                    )
                                  )}

                                  {/* Action Buttons Toolbar right inside that card */}
                                  <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-200">
                                    {phone && (
                                      <a
                                        href={telHref}
                                        className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-black text-[10px] uppercase border border-emerald-300 inline-flex items-center gap-1 transition-colors"
                                      >
                                        <Phone className="w-3 h-3" />
                                        <span>Call Booking</span>
                                      </a>
                                    )}
                                    {email && (
                                      <a
                                        href={mailtoHref}
                                        className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-black text-[10px] uppercase border border-indigo-300 inline-flex items-center gap-1 transition-colors"
                                      >
                                        <Mail className="w-3 h-3" />
                                        <span>Email Venue</span>
                                      </a>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleToggleVenueStatus(iss.stopIndex, "confirmed")}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase shadow-2xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                                      title={`Mark only Stop ${iss.stopIndex + 1} (${iss.stopCity}) as Confirmed & Booked`}
                                    >
                                      <Check className="w-3 h-3 stroke-[3]" />
                                      <span>✓ Mark Only This Stop Booked</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Card Footer with stop indicator and 1-click jump button */}
                            <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400">
                                Stop {iss.stopIndex + 1} • {iss.stopCity}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (iss.actionStep === 3) {
                                    setActiveStageIndex(iss.stopIndex);
                                    setWizardStep(3);
                                  } else if (iss.actionStep === 4) {
                                    setActiveLodgingIndex(iss.stopIndex);
                                    setWizardStep(4);
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-[11px] shrink-0 border border-indigo-200 cursor-pointer transition-colors"
                              >
                                {iss.actionLabel} →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-100/60 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Zero roadblocks detected. All venues confirmed, driving transit safe, and overnight accommodations locked.</span>
                    </div>
                  )}
                </div>

                {/* Full Interactive Leaflet Route Map */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      <span>Tour Route &amp; Stage Markers (OpenStreetMap)</span>
                    </h4>

                    <a
                      href={currentTourPlan.googleMapsDirectionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open in Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md h-96">
                    <TourMap
                      stops={stops}
                      tourTitle={tourTitle}
                      totalDistanceMiles={totalDistanceMiles}
                      totalDriveTime={totalDriveTime}
                      className="h-full w-full"
                    />
                  </div>
                </div>

                {/* Complete Day-by-Day Run-of-Show Itinerary */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">
                      Master Day-by-Day Run-of-Show
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        const txt = formatPersonalizedItineraryText(currentTourPlan, bandProfile?.name);
                        navigator.clipboard.writeText(txt);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 3000);
                      }}
                      className="text-xs font-bold text-slate-700 hover:text-indigo-600 flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedLink ? "Copied Itinerary!" : "Copy Itinerary Text"}</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {stops.map((stop, i) => (
                      <div
                        key={stop.id || i}
                        className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                              {stop.dayNumber || i + 1}
                            </span>
                            <h5 className="font-black text-slate-900 text-sm">
                              {stop.city}, {stop.state}
                            </h5>
                            <span className="text-xs text-slate-500 font-bold">({stop.date})</span>
                          </div>

                          <div className="text-xs text-slate-500 flex items-center gap-3">
                            <span>🚗 {stop.driveTimeFromPrev}</span>
                            <span>⛽ ~${stop.estimatedGasCost || 0} gas</span>
                          </div>
                        </div>

                        {/* Venue details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-black uppercase text-indigo-700 block">
                                🏢 Live Music Stage &amp; Booking
                              </span>
                              {(() => {
                                const vStat = stop.selectedVenue?.bookingStatus || (stop.selectedVenue?.name ? "unconfirmed" : "unconfirmed");
                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleVenueStatus(i)}
                                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer transition-colors ${
                                      vStat === "confirmed"
                                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300"
                                        : vStat === "penciled"
                                        ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300"
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
                                    }`}
                                    title="Click to toggle status: Unconfirmed -> Penciled -> Confirmed"
                                  >
                                    {vStat === "confirmed" && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                    <span>{vStat === "confirmed" ? "✓ Confirmed & Booked" : vStat === "penciled" ? "Penciled In" : "Unconfirmed Lead"}</span>
                                  </button>
                                );
                              })()}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="font-black text-slate-900 text-sm">
                                {stop.selectedVenue?.name || "Pending Stage Confirmation"}
                              </div>
                              {(stop.selectedVenue?.isPrivate || stop.selectedVenue?.venueType === "house_show") && (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                                  <span>Private House Show</span>
                                </span>
                              )}
                            </div>
                            {stop.selectedVenue?.address && (
                              <div className="text-slate-500 text-[11px]">
                                📍 {stop.selectedVenue.address}
                                {(stop.selectedVenue?.isPrivate || stop.selectedVenue?.venueType === "house_show") && (
                                  <span className="text-purple-600 font-bold ml-1.5">(Confidential Address)</span>
                                )}
                              </div>
                            )}
                            <div className="text-[11px] text-slate-600 pt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                              <span>Load-in: <strong>{stop.selectedVenue?.loadInTime || "5:00 PM"}</strong></span>
                              <span>Soundcheck: <strong>{stop.selectedVenue?.soundcheckTime || "6:30 PM"}</strong></span>
                              <span>Set: <strong>{stop.selectedVenue?.setTime || "9:00 PM"}</strong></span>
                            </div>
                            {(stop.selectedVenue?.loadInNotes || (stop.selectedVenue?.isPrivate && stop.selectedVenue?.notes)) && (
                              <div className="text-[11px] text-purple-950 bg-purple-50 p-2 rounded-lg border border-purple-200">
                                🚪 <strong>Door / Load-In:</strong> {stop.selectedVenue.loadInNotes || stop.selectedVenue.notes}
                              </div>
                            )}
                            {stop.selectedVenue?.suggestedDonation && (
                              <div className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded w-fit">
                                🎟️ Suggested Door/Donation: {stop.selectedVenue.suggestedDonation}
                              </div>
                            )}
                            {(stop.selectedVenue?.doorGuarantee || stop.selectedVenue?.doorSplitPercentage) && !stop.selectedVenue?.suggestedDonation && (
                              <div className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded w-fit">
                                💰 Deal: {stop.selectedVenue.doorGuarantee || ""} {stop.selectedVenue.doorSplitPercentage ? `(${stop.selectedVenue.doorSplitPercentage})` : ""}
                              </div>
                            )}
                            {(stop.selectedVenue?.contactName || stop.selectedVenue?.contactPhone) && (
                              <div className="text-[11px] text-slate-500">
                                👤 {(stop.selectedVenue?.isPrivate || stop.selectedVenue?.venueType === "house_show") ? "Host" : "Contact"}: {stop.selectedVenue?.contactName || ""} {stop.selectedVenue?.contactPhone ? `(${stop.selectedVenue.contactPhone})` : ""}
                              </div>
                            )}
                            
                            {/* Action to design poster */}
                            {stop.selectedVenue && onSelectVenueForPoster && (
                              <div className="pt-2">
                                <button
                                  type="button"
                                  onClick={() => onSelectVenueForPoster(stop.selectedVenue!.name, stop.city)}
                                  className="text-[11px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                                >
                                  <Sparkles className="w-3 h-3 text-amber-500" />
                                  <span>Design Concert Poster for this Gig →</span>
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-black uppercase text-slate-700 block">
                                🛏️ Lodging &amp; Van Security
                              </span>
                              {stop.selectedLodging?.isBooked || stop.selectedLodging?.confirmationNumber ? (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 font-mono">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  <span>✓ BOOKED &amp; CONFIRMED</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>Pending Booking</span>
                                </span>
                              )}
                            </div>

                            {/* Property Name */}
                            <div className="font-black text-slate-900 text-sm">
                              {stop.selectedLodging?.name || (stop.lodgingOptions && stop.lodgingOptions[0]?.name) || `Hotel in ${stop.city}`}
                            </div>

                            {/* Street Address */}
                            {(stop.selectedLodging?.address || stop.lodgingOptions?.[0]?.address) && (
                              <div className="text-slate-600 text-[11px] flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{stop.selectedLodging?.address || stop.lodgingOptions?.[0]?.address}</span>
                              </div>
                            )}

                            {/* Front Desk Phone */}
                            {(stop.selectedLodging?.phone || stop.lodgingOptions?.[0]?.phone || getCityHotelPhone(stop.city, stop.state)) && (
                              <div className="text-[11px] flex items-center gap-1">
                                <Phone className="w-3 h-3 text-indigo-500 shrink-0" />
                                <span className="text-slate-500">Front Desk:</span>
                                <a
                                  href={`tel:${(stop.selectedLodging?.phone || stop.lodgingOptions?.[0]?.phone || getCityHotelPhone(stop.city, stop.state)).replace(/[^\d+]/g, "")}`}
                                  className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                                  title={`Call front desk`}
                                >
                                  {stop.selectedLodging?.phone || stop.lodgingOptions?.[0]?.phone || getCityHotelPhone(stop.city, stop.state)}
                                </a>
                              </div>
                            )}

                            {/* Confirmation Number */}
                            {stop.selectedLodging?.confirmationNumber && (
                              <div className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded inline-block">
                                Confirmation #: {stop.selectedLodging.confirmationNumber}
                              </div>
                            )}

                            <div className="text-[11px] text-slate-600">
                              Est. Cost: <strong>${parseNightlyRate(stop.selectedLodging?.cost || 85).toLocaleString()}/night</strong>
                            </div>

                            {/* Van & Gear Security Notes */}
                            {(stop.selectedLodging?.gearSecurityNote || stop.selectedLodging?.notes || stop.lodgingNotes) && (
                              <div className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-start gap-1.5">
                                <Car className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                <span>
                                  <strong>Van Security:</strong> {stop.selectedLodging?.gearSecurityNote || stop.selectedLodging?.notes || stop.lodgingNotes}
                                </span>
                              </div>
                            )}

                            {/* Lodging Action Toolbar */}
                            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => handleOpenBookingModal(i)}
                                className="text-[11px] font-black text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Hotel className="w-3.5 h-3.5 text-amber-600" />
                                <span>{stop.selectedLodging?.name ? "Update Lodging Details →" : "Find Lodging →"}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleLodgingBooked(i)}
                                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1 ${
                                  stop.selectedLodging?.isBooked
                                    ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300"
                                    : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300"
                                }`}
                              >
                                {stop.selectedLodging?.isBooked ? (
                                  <>
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    <span>Marked Booked</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3" />
                                    <span>Mark as Booked</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {stop.customNotes && (
                          <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                            📝 <strong>Notes:</strong> {stop.customNotes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accommodations & Overnight Logistics Master Summary Table */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5" id="master-lodging-roster">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Hotel className="w-5 h-5 text-indigo-600" />
                        <h4 className="text-lg font-black text-slate-900 tracking-tight">
                          Accommodations &amp; Overnight Logistics Roster
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500">
                        Master overnight schedule for all {stops.length} tour stops with live Expedia &amp; Booking.com pre-filled reservation links.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {(() => {
                        const bookedCount = stops.filter(s => Boolean(s.selectedLodging?.isBooked || s.selectedLodging?.confirmationNumber)).length;
                        return (
                          <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>{bookedCount} of {stops.length} Stops Booked</span>
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-black">
                          <th className="pb-3 pr-3">Stop #</th>
                          <th className="pb-3 pr-3">City &amp; State</th>
                          <th className="pb-3 pr-3">Check-In / Out</th>
                          <th className="pb-3 pr-3">Property / Lodging</th>
                          <th className="pb-3 pr-3 text-center">Status</th>
                          <th className="pb-3 text-right">Instant Booking</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {stops.map((st, sIdx) => {
                          const dates = getTourStopLodgingDates(st.date);
                          const isBooked = Boolean(st.selectedLodging?.isBooked || st.selectedLodging?.confirmationNumber);
                          const propertyName = st.selectedLodging?.name || (st.lodgingOptions?.[0]?.name) || `Hotel in ${st.city}`;
                          const phone = st.selectedLodging?.phone || st.lodgingOptions?.[0]?.phone || getCityHotelPhone(st.city, st.state);
                          const address = st.selectedLodging?.address || st.lodgingOptions?.[0]?.address || `${st.city}, ${st.state}`;
                          const links = generateLodgingDeepLinks({
                            city: st.city,
                            state: st.state,
                            checkInDate: dates.checkIn,
                            checkOutDate: dates.checkOut,
                            guests: 4,
                            lodgingName: st.selectedLodging?.name || st.lodgingOptions?.[0]?.name
                          });

                          return (
                            <tr key={`roster-${st.id || sIdx}`} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 pr-3 font-black text-slate-800">
                                Stop {sIdx + 1}
                              </td>
                              <td className="py-3.5 pr-3 font-black text-slate-900">
                                <div>{st.city}, {st.state}</div>
                                <div className="text-[10px] font-normal text-slate-400">
                                  {st.selectedVenue?.name || "Stage pending"}
                                </div>
                              </td>
                              <td className="py-3.5 pr-3 text-slate-600">
                                <div className="font-bold text-slate-800">{dates.checkIn}</div>
                                <div className="text-[10px] text-slate-400">out: {dates.checkOut}</div>
                              </td>
                              <td className="py-3.5 pr-3">
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <Hotel className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>{propertyName}</span>
                                </div>
                                {address && (
                                  <div className="text-[10px] text-slate-500">
                                    📍 {address}
                                  </div>
                                )}
                                {phone && (
                                  <div className="text-[10px]">
                                    <a
                                      href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                                      className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline inline-flex items-center gap-0.5"
                                      title={`Call front desk at ${phone}`}
                                    >
                                      <Phone className="w-2.5 h-2.5 text-indigo-500" />
                                      <span>{phone}</span>
                                    </a>
                                  </div>
                                )}
                                {st.selectedLodging?.confirmationNumber && (
                                  <div className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded w-fit mt-0.5">
                                    Conf: {st.selectedLodging.confirmationNumber}
                                  </div>
                                )}
                              </td>
                              <td className="py-3.5 pr-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleLodgingBooked(sIdx)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer transition-all ${
                                    isBooked
                                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300"
                                      : "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300"
                                  }`}
                                  title="Click to toggle booked status"
                                >
                                  {isBooked ? (
                                    <>
                                      <Check className="w-3 h-3 stroke-[3]" />
                                      <span>Booked &amp; Confirmed</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3" />
                                      <span>Pending</span>
                                    </>
                                  )}
                                </button>
                              </td>
                              <td className="py-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <a
                                    href={links.expediaUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] flex items-center gap-1 shadow-2xs transition-colors shrink-0"
                                    title="Open Expedia reservation with pre-filled gig dates"
                                  >
                                    <span>Expedia</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                  <a
                                    href={links.bookingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] flex items-center gap-1 transition-colors shrink-0"
                                    title="Open Booking.com"
                                  >
                                    <span>Booking</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Step 5 Navigation Controls */}
                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setWizardStep(4)}
                      className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black cursor-pointer"
                    >
                      ← Back to Hotel Lodging (Step 4)
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewState("history")}
                      className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black cursor-pointer"
                    >
                      View All Saved Tours
                    </button>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setShowPrintModal(true)}
                      className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-black flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Sheet</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveAndFinishLater(true)}
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition-transform active:scale-98"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save as Confirmed Tour</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* Print & Master Itinerary Export Modal */}
      {showPrintModal && (
        <TourPrintModal
          tourPlan={currentTourPlan}
          bandName={bandProfile?.name}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* Email Master Itinerary to Band & Crew Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Email Master Itinerary
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Dispatch mobile-responsive HTML tour sheet with venue contacts and lodging confirmations.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailDispatchResult(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Email Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                  Recipient Email Addresses *
                </label>
                <textarea
                  rows={3}
                  value={recipientEmailsInput}
                  onChange={(e) => setRecipientEmailsInput(e.target.value)}
                  placeholder="bandmate@gmail.com, tourmanager@gmail.com, soundtech@audio.com"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Separate multiple band and crew email addresses with commas or newlines.
                </span>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                  Crew Notes / Call Time Announcements (Optional)
                </label>
                <textarea
                  rows={2}
                  value={emailNotesInput}
                  onChange={(e) => setEmailNotesInput(e.target.value)}
                  placeholder="e.g. Van leaves Seattle rehearsal space at 9:00 AM sharp on Day 1. Bring earplugs and merch bin."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Itinerary Contents Summary */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Automated Itinerary Dossier Includes:</span>
                </span>
                <ul className="text-[11px] space-y-1 pl-4 list-disc text-slate-600">
                  <li>Complete day-by-day transit route ({totalDistanceMiles} miles, gas estimates)</li>
                  <li>Venue dossiers: direct contact phones, load-in, soundcheck &amp; set times</li>
                  <li>Overnight lodging status with 1-click Expedia / Booking reservation links</li>
                  <li>Master day-of-show emergency checklist &amp; settlement protocols</li>
                </ul>
              </div>

              {emailDispatchResult?.success && (
                <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 stroke-[3] text-emerald-700 shrink-0" />
                  <span>Successfully dispatched tour itinerary to {emailDispatchResult.count} recipient(s)!</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailDispatchResult(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSendEmailItinerary}
                disabled={isSendingEmail || !recipientEmailsInput.trim()}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black shadow-md hover:shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all"
              >
                {isSendingEmail ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Master Itinerary</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Lodging Booking & Auto-Sync Modal */}
      {bookingModalStopIndex !== null && stops[bookingModalStopIndex] && (
        <TourLodgingModal
          isOpen={bookingModalStopIndex !== null}
          onClose={() => setBookingModalStopIndex(null)}
          stop={stops[bookingModalStopIndex]}
          stopIndex={bookingModalStopIndex}
          tourStartDate={startDate}
          onCommitReservation={handleCommitLodgingReservation}
        />
      )}

    </div>
  );
};

export default TourScheduler;
