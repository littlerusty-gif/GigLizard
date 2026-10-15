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
  RouteDiversificationResult,
  estimateDrivingDistanceMiles,
  calculateGasCost,
  findCityCoordinates,
  calculateGreatCircleDistanceMiles
} from "../utils/corridorOptimizer";
import { CONTINENTAL_US_STATES, parseFreeformCityState, POPULAR_NATIONWIDE_HUBS, STATE_NAME_TO_CODE_MAP } from "../constants/states";
import { getMergedVenuesList } from "../utils/directoryStore";
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
import { EditStopModal } from "./EditStopModal";
import { VenuePickerModal } from "./VenuePickerModal";
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
  Loader2,
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
  const allDirectoryVenues = useMemo(() => getMergedVenuesList(), []);
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
  const [editModalStopIndex, setEditModalStopIndex] = useState<number | null>(null);
  const [showRouteSettings, setShowRouteSettings] = useState(false);
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
  // Venue picker modal state
  const [venueModalStopIndex, setVenueModalStopIndex] = useState<number | null>(null);
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [loadingVenueStopIdx, setLoadingVenueStopIdx] = useState<number | null>(null);
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

    const parsed = parseFreeformCityState(raw);
    const cCity = parsed.city;
    const cState = parsed.state || "WA";

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

  // Save changes from EditStopModal
  const handleSaveEditStopFromModal = (index: number, updatedFields: Partial<TourStop>) => {
    const target = stops[index];
    if (!target) return;

    const newCity = (updatedFields.city || target.city).trim();
    const newState = (updatedFields.state || target.state).trim();
    const cityChanged = newCity.toLowerCase() !== target.city.toLowerCase() || newState.toLowerCase() !== target.state.toLowerCase();

    const updatedStops = stops.map((s, i) => {
      if (i !== index) return s;
      const baseStop: TourStop = {
        ...s,
        ...updatedFields,
        city: newCity,
        state: newState,
        stopName: updatedFields.stopName || s.stopName,
        date: updatedFields.date || s.date,
        driveTimeFromPrev: updatedFields.driveTimeFromPrev || s.driveTimeFromPrev,
        distanceMilesFromPrev: updatedFields.distanceMilesFromPrev !== undefined ? Number(updatedFields.distanceMilesFromPrev) : s.distanceMilesFromPrev,
        estimatedGasCost: updatedFields.estimatedGasCost !== undefined ? Number(updatedFields.estimatedGasCost) : s.estimatedGasCost,
        customNotes: updatedFields.customNotes !== undefined ? updatedFields.customNotes : s.customNotes
      };

      if (cityChanged) {
        return {
          ...baseStop,
          suggestedVenues: [],
          selectedVenue: undefined,
          lodgingOptions: findLodgingForCity(newCity, newState),
          selectedLodging: undefined
        };
      }
      return baseStop;
    });

    const recal = recalculateStopsMetrics(updatedStops, startDate);
    setStops(recal.updatedStops);
    setTotalDistanceMiles(recal.totalDistanceMiles);
    setTotalDriveTime(recal.totalDriveTime);

    if (index === 0) {
      setOriginCity(`${newCity}, ${newState}`);
    } else if (index === updatedStops.length - 1) {
      setDestinationCity(`${newCity}, ${newState}`);
    }

    if (cityChanged) {
      const cityKey = `${newCity.toLowerCase()}_${newState.toLowerCase()}`;
      setCityVenuesMap(prev => {
        const copy = { ...prev };
        delete copy[cityKey];
        return copy;
      });
      loadVenuesForStageCity(newCity, newState);
    }

    triggerToast(`✓ Stop #${index + 1} (${newCity}, ${newState}) updated!`, "success");
  };

  // Quick-toggle cycling for Stage/Venue status:
  // Default is 'hold' ("ON HOLD"). When venue selected -> 'penciled' ("PENCILED IN").
  // Clicking badge while in 'penciled' toggles to 'confirmed'.
  // Clicking again cycles: 'confirmed' -> 'hold' -> 'penciled' -> 'confirmed'
  const handleCycleVenueStatus = (stopIdx: number, targetStatus?: "penciled" | "hold" | "confirmed") => {
    let affectedCity = "";
    let affectedLabel = "";
    let affectedVenueName = "";

    setStops(prev => {
      return prev.map((stop, idx) => {
        if (idx !== stopIdx) return stop;

        const curStatus = stop.selectedVenue?.bookingStatus || "hold";
        let nextStatus: "penciled" | "hold" | "confirmed";
        if (targetStatus) {
          nextStatus = targetStatus;
        } else {
          if (curStatus === "penciled") {
            nextStatus = "confirmed";
          } else if (curStatus === "confirmed") {
            nextStatus = "hold";
          } else {
            // curStatus === "hold" or unconfirmed
            nextStatus = "penciled";
          }
        }

        affectedCity = stop.city;
        affectedLabel = nextStatus === "confirmed" ? "✓ Confirmed & Booked" : nextStatus === "penciled" ? "Penciled In" : "On Hold";

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
      triggerToast(`Stop #${stopIdx + 1} (${affectedCity}): Stage marked ${affectedLabel}`, "success");
    }
  };

  // Quick-toggle cycling for Lodging status: 'penciled' -> 'hold' -> 'confirmed' -> 'penciled'
  const handleCycleLodgingStatus = (stopIdx: number, targetStatus?: "penciled" | "hold" | "confirmed") => {
    let affectedCity = "";
    let affectedLabel = "";
    let affectedPropName = "";

    setStops(prev => {
      return prev.map((stop, idx) => {
        if (idx !== stopIdx) return stop;

        const curStatus = stop.selectedLodging?.bookingStatus || (stop.selectedLodging?.isBooked ? "confirmed" : "penciled");
        let nextStatus: "penciled" | "hold" | "confirmed";
        if (targetStatus) {
          nextStatus = targetStatus;
        } else {
          if (curStatus === "penciled" || curStatus === "unconfirmed") {
            nextStatus = "hold";
          } else if (curStatus === "hold") {
            nextStatus = "confirmed";
          } else {
            nextStatus = "penciled";
          }
        }

        affectedCity = stop.city;
        affectedLabel = nextStatus === "confirmed" ? "✓ Confirmed & Booked" : nextStatus === "hold" ? "On Hold" : "Penciled In";

        const defaultOption = stop.lodgingOptions?.[0];
        const existing = stop.selectedLodging;
        const isNowBooked = nextStatus === "confirmed";

        const name = existing?.name && !existing.name.startsWith("Lodging in ")
          ? existing.name
          : defaultOption?.name || `${stop.city} Musician Suites & Inn`;
        affectedPropName = name;

        const address = existing?.address || defaultOption?.address || `${stop.city}, ${stop.state}`;
        const phone = existing?.phone || defaultOption?.phone || getCityHotelPhone(stop.city, stop.state);
        const cost = existing?.cost || (defaultOption ? parseNightlyRate(defaultOption.estPricePerNight) : 85);
        const securityNote = existing?.gearSecurityNote || existing?.notes || defaultOption?.gearSecurityNote || "Ground-level monitored van parking. Bring high-value gear into room.";
        const confNumber = existing?.confirmationNumber || (isNowBooked ? `CONF-${Date.now().toString().slice(-6)}` : "");

        return {
          ...stop,
          selectedLodging: {
            ...existing,
            name,
            address,
            phone,
            cost,
            confirmationNumber: confNumber,
            gearSecurityNote: securityNote,
            notes: securityNote,
            isBooked: isNowBooked,
            bookingStatus: nextStatus
          },
          lodgingNotes: securityNote
        };
      });
    });

    if (affectedCity) {
      triggerToast(`Stop #${stopIdx + 1} (${affectedCity}): Lodging marked ${affectedLabel}`, "success");
    }
  };

  // Select and commit venue from VenuePickerModal:
  // Automatically changes that stop's booking status badge from "ON HOLD" to "PENCILED IN"
  const handleCommitVenuePicker = (stopIdx: number, selectedVenue: TourSelectedVenue) => {
    setStops(prev => prev.map((s, idx) => {
      if (idx !== stopIdx) return s;
      const current = s.selectedVenue || {};
      const nextStatus: "penciled" | "hold" | "confirmed" = "penciled";

      return {
        ...s,
        selectedVenue: {
          ...current,
          ...selectedVenue,
          bookingStatus: nextStatus
        }
      };
    }));

    setIsVenueModalOpen(false);
    setVenueModalStopIndex(null);
    triggerToast(
      `✓ Stage selected for Stop #${stopIdx + 1} (${stops[stopIdx]?.city || ""}): ${selectedVenue.name}. Marked Penciled In!`,
      "success"
    );
  };

  // Open Venue Modal: Instant 0ms modal opening without blocking on network
  const handleOpenVenueModalForStop = (stopIdx: number) => {
    const targetStop = stops[stopIdx];
    if (!targetStop) return;

    // Immediately open modal cleanly
    setVenueModalStopIndex(stopIdx);
    setIsVenueModalOpen(true);
  };

  // Booking Health progress calculations (Stages Booked & Lodging Secured)
  const bookingHealth = useMemo(() => {
    const totalStops = stops.length || 1;
    const stagesConfirmed = stops.filter(s => s.selectedVenue?.bookingStatus === "confirmed").length;
    const stagesPenciled = stops.filter(s => s.selectedVenue?.bookingStatus === "penciled").length;
    const stagesHold = stops.filter(s => !s.selectedVenue?.bookingStatus || s.selectedVenue?.bookingStatus === "hold" || s.selectedVenue?.bookingStatus === "unconfirmed").length;
    const stagesConfirmedPercent = Math.round((stagesConfirmed / totalStops) * 100);

    const lodgingConfirmed = stops.filter(s => s.selectedLodging?.bookingStatus === "confirmed" || s.selectedLodging?.isBooked).length;
    const lodgingHold = stops.filter(s => s.selectedLodging?.bookingStatus === "hold" && !s.selectedLodging?.isBooked).length;
    const lodgingPenciled = stops.filter(s => (!s.selectedLodging?.bookingStatus || s.selectedLodging?.bookingStatus === "penciled" || s.selectedLodging?.bookingStatus === "unconfirmed") && !s.selectedLodging?.isBooked).length;
    const lodgingConfirmedPercent = Math.round((lodgingConfirmed / totalStops) * 100);

    return {
      stagesConfirmed,
      stagesHold,
      stagesPenciled,
      stagesConfirmedPercent,
      lodgingConfirmed,
      lodgingHold,
      lodgingPenciled,
      lodgingConfirmedPercent
    };
  }, [stops]);

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

  // Loads venues for a specific city with fallback to state query
  // Instant In-Memory Filter (0ms Latency) from memory directory (132 items) + indexed Supabase fallback
  const loadVenuesForStageCity = async (cityName: string, stateName?: string): Promise<Venue[]> => {
    let cleanCity = (cityName || "").trim();
    let cleanState = (stateName || "").trim();

    if (cleanCity.includes(",")) {
      const parts = cleanCity.split(",");
      cleanCity = parts[0].trim();
      if (!cleanState && parts[1]) {
        cleanState = parts[1].trim();
      }
    }

    const stateCode = (STATE_NAME_TO_CODE_MAP[cleanState.toLowerCase()] || cleanState).trim();
    const cacheKey = cleanState ? `${cleanCity}_${cleanState.toUpperCase()}` : cleanCity;

    if (cityVenuesMap[cacheKey] !== undefined) {
      return cityVenuesMap[cacheKey];
    }

    // 1. Instant In-Memory Filter (0ms Latency)
    const inMemory = allDirectoryVenues && allDirectoryVenues.length > 0 ? allDirectoryVenues : getMergedVenuesList();
    const targetCity = cleanCity.toLowerCase();
    const targetState = cleanState.toLowerCase();

    const inMemMatches = inMemory.filter((v: any) => {
      const vName = (v.name || '').toLowerCase();
      // Exclude hardcoded placeholder mock like "Everett Live Stage & Hall"
      if (vName.includes('live stage & hall')) return false;

      const vCity = (v.city || '').trim().toLowerCase();
      const vState = (v.state || '').trim().toLowerCase();
      const vAddress = (v.address || '').trim().toLowerCase();

      const cityMatch = !targetCity || vCity.includes(targetCity) || targetCity.includes(vCity) || vAddress.includes(targetCity);
      const stateMatch = !targetState || vState === targetState || 
                         (targetState === 'wa' && (vState === 'washington' || vState === 'wa')) ||
                         (targetState === 'washington' && (vState === 'wa' || vState === 'washington')) ||
                         (targetState === 'or' && (vState === 'oregon' || vState === 'or')) ||
                         (targetState === 'oregon' && (vState === 'or' || vState === 'oregon')) ||
                         (targetState === 'ca' && (vState === 'california' || vState === 'ca')) ||
                         (targetState === 'california' && (vState === 'ca' || vState === 'california')) ||
                         (targetState === 'co' && (vState === 'colorado' || vState === 'co')) ||
                         (targetState === 'colorado' && (vState === 'co' || vState === 'colorado')) ||
                         (targetState === 'bc' && (vState === 'bc' || vState === 'british columbia')) ||
                         (targetState === 'british columbia' && (vState === 'bc' || vState === 'british columbia')) ||
                         (STATE_NAME_TO_CODE_MAP[vState] && STATE_NAME_TO_CODE_MAP[vState].toLowerCase() === targetState) ||
                         (STATE_NAME_TO_CODE_MAP[targetState] && STATE_NAME_TO_CODE_MAP[targetState].toLowerCase() === vState) ||
                         (STATE_NAME_TO_CODE_MAP[targetState] && STATE_NAME_TO_CODE_MAP[vState] && STATE_NAME_TO_CODE_MAP[targetState] === STATE_NAME_TO_CODE_MAP[vState]);

      return cityMatch && stateMatch;
    });

    if (inMemMatches.length > 0) {
      setCityVenuesMap(prev => ({ 
        ...prev, 
        [cacheKey]: inMemMatches,
        [cleanCity]: inMemMatches,
        [cityName]: inMemMatches
      }));

      setStops(prev => prev.map(s => {
        if (s.city.toLowerCase() === cleanCity.toLowerCase() || s.city.toLowerCase() === cityName.toLowerCase()) {
          return {
            ...s,
            suggestedVenues: inMemMatches as any
          };
        }
        return s;
      }));

      return inMemMatches;
    }

    // 2. Direct Supabase Query when in-memory has 0 matches:
    setIsLoadingVenues(true);
    try {
      let remoteVenues: Venue[] = [];
      try {
        let res = await supabase
          .from("venues")
          .select("*")
          .or(`city.ilike.%${cleanCity}%,city_state.ilike.%${cleanCity}%,address.ilike.%${cleanCity}%`);

        if (res.error) {
          res = await supabase
            .from("venues")
            .select("*")
            .or(`city.ilike.%${cleanCity}%,address.ilike.%${cleanCity}%`);
        }

        const data = res.data;
        if (res.error) {
          console.error("Supabase venue fetch error:", res.error);
        } else if (data && Array.isArray(data)) {
          const filteredData = data.filter((v: any) => !(v.name || '').toLowerCase().includes('live stage & hall'));
          remoteVenues = filteredData.map((v: any) => ({
            id: v.id || `venue-db-${v.name?.toLowerCase().replace(/\s+/g, "-")}`,
            name: v.name || "Live Venue",
            city: v.city || cleanCity,
            state: v.state || cleanState,
            country: v.state?.toUpperCase() === "BC" ? "CA" : "US",
            address: v.address || `${v.city || cleanCity}, ${v.state || cleanState}`.trim(),
            capacity: Number(v.capacity) || 150,
            genres: Array.isArray(v.genres_accepted) 
              ? v.genres_accepted 
              : (v.genres_accepted ? String(v.genres_accepted).split(",").map((g: string) => g.trim()) : ["Live Music"]),
            contactEmail: v.official_email || v.booking_email || v.email || "",
            official_email: v.official_email || v.booking_email || v.email || "",
            contactPhone: v.phone || v.contact_phone || "Inquire",
            website: v.website || undefined,
            hasPA: true,
            hasLighting: true,
            description: v.description || `Live music venue located in ${v.city || cleanCity}.`
          }));
        }
      } catch (err) {
        console.error("Supabase venue fetch error:", err);
      }

      setCityVenuesMap(prev => ({ 
        ...prev, 
        [cacheKey]: remoteVenues,
        [cleanCity]: remoteVenues,
        [cityName]: remoteVenues
      }));

      // Update stop suggested venues in state for this specific city
      setStops(prev => prev.map(s => {
        if (s.city.toLowerCase() === cleanCity.toLowerCase() || s.city.toLowerCase() === cityName.toLowerCase()) {
          return {
            ...s,
            suggestedVenues: remoteVenues as any
          };
        }
        return s;
      }));

      return remoteVenues;
    } catch (err) {
      console.error("Failed loading venues for stage city:", err);
      return [];
    } finally {
      setIsLoadingVenues(false);
    }
  };

  // Add Return Leg (Route Home) Option: Dynamic nationwide return leg routing back to originCity (home base)
  const handleAddReturnLegStop = () => {
    if (stops.length === 0) {
      triggerToast("Please configure your tour stops first before generating a return leg.", "info");
      return;
    }

    const lastStop = stops[stops.length - 1];
    const { city: homeCity, state: homeState } = parseFreeformCityState(originCity);

    // If the last stop is already the home base, inform user
    if (lastStop.city.toLowerCase().trim() === homeCity.toLowerCase().trim() &&
        lastStop.state?.toUpperCase().trim() === homeState.toUpperCase().trim()) {
      triggerToast(`Your tour is already scheduled to return to ${homeCity}, ${homeState}!`, "info");
      return;
    }

    // Get current stops cities set to avoid immediate back-to-back duplicate if multiple options exist
    const recentCities = new Set(stops.map(s => s.city.toLowerCase().trim()));

    // Find candidate corridor cities between lastStop and homeCity
    const lastCoords = findCityCoordinates(`${lastStop.city}, ${lastStop.state}`);
    const homeCoords = findCityCoordinates(`${homeCity}, ${homeState}`);
    const directDistance = calculateGreatCircleDistanceMiles(lastCoords.lat, lastCoords.lng, homeCoords.lat, homeCoords.lng);

    // Existing return leg count
    const existingReturnLegs = stops.filter(s => s.isReturnLeg);
    
    // Candidates that lie between last stop and home base
    const returnCandidates = KNOWN_CORRIDOR_CITIES.filter(c => {
      const cName = c.city.toLowerCase().trim();
      if (cName === lastStop.city.toLowerCase().trim() || cName === homeCity.toLowerCase().trim()) return false;
      if (recentCities.has(cName)) return false;

      const distFromLast = calculateGreatCircleDistanceMiles(lastCoords.lat, lastCoords.lng, c.lat, c.lng);
      const distToHome = calculateGreatCircleDistanceMiles(c.lat, c.lng, homeCoords.lat, homeCoords.lng);
      const totalPath = distFromLast + distToHome;
      return totalPath <= Math.max(1, directDistance) * 1.38;
    }).sort((a, b) => {
      const distA = calculateGreatCircleDistanceMiles(lastCoords.lat, lastCoords.lng, a.lat, a.lng);
      const distB = calculateGreatCircleDistanceMiles(lastCoords.lat, lastCoords.lng, b.lat, b.lng);
      return distA - distB;
    });

    // Choose next candidate or the home base if no intermediate candidate or already routed close enough
    let nextStopCity = homeCity;
    let nextStopState = homeState;
    let nextHighlight = `Home base victory homecoming show in ${homeCity}!`;
    let isFinalHome = true;

    if (returnCandidates.length > 0 && directDistance > 160 && existingReturnLegs.length < returnCandidates.length) {
      // Pick next intermediate along the return corridor
      const candidate = returnCandidates[0];
      nextStopCity = candidate.city;
      nextStopState = candidate.state;
      nextHighlight = `${candidate.tier} stop on return corridor: ${candidate.sceneHighlight}`;
      isFinalHome = false;
    }

    const nextCoords = findCityCoordinates(`${nextStopCity}, ${nextStopState}`);
    const drivingDistance = estimateDrivingDistanceMiles(lastCoords.lat, lastCoords.lng, nextCoords.lat, nextCoords.lng) || 60;
    const driveTimeStr = formatDriveTime(drivingDistance);
    const gasCost = calculateGasCost(drivingDistance);

    // Compute next performance date (day after the last stop)
    let nextDateStr = "";
    if (lastStop && lastStop.date) {
      try {
        const d = new Date(lastStop.date + "T12:00:00");
        d.setDate(d.getDate() + 1);
        nextDateStr = d.toISOString().split("T")[0];
      } catch {
        nextDateStr = new Date().toISOString().split("T")[0];
      }
    } else {
      nextDateStr = new Date().toISOString().split("T")[0];
    }

    const newReturnStop: TourStop = {
      id: `stop-return-${Date.now()}`,
      stopName: isFinalHome ? `Home Base: ${nextStopCity}` : `Return Leg: ${nextStopCity}`,
      city: nextStopCity,
      state: nextStopState,
      dayNumber: stops.length + 1,
      date: nextDateStr,
      distanceMilesFromPrev: drivingDistance,
      driveTimeFromPrev: driveTimeStr,
      estimatedGasCost: gasCost,
      routeHighlight: nextHighlight,
      localSceneNotes: isFinalHome 
        ? `Home base celebratory homecoming show in ${nextStopCity}, ${nextStopState}.`
        : `Return corridor stop heading toward ${homeCity}, ${homeState}.`,
      isReturnLeg: true,
      selectedVenue: {
        id: "",
        name: "",
        city: nextStopCity,
        address: `${nextStopCity}, ${nextStopState}`,
        bookingStatus: "hold",
        loadInTime: "5:00 PM",
        soundcheckTime: "6:30 PM",
        doorsTime: "7:30 PM",
        setTime: "9:00 PM - 10:30 PM",
        ticketPrice: "$12 Adv / $15 Door",
        notes: isFinalHome ? "Homecoming show - on hold" : "Return leg stage - on hold"
      },
      selectedLodging: {
        id: "",
        name: "",
        address: `${nextStopCity}, ${nextStopState}`,
        bookingStatus: "penciled",
        isBooked: false,
        notes: isFinalHome ? "Home sweet home" : "Return leg lodging - penciled in"
      },
      suggestedVenues: [],
      lodgingOptions: findLodgingForCity(nextStopCity, nextStopState)
    };

    setStops(prev => [...prev, newReturnStop]);

    // Pre-cache venues for this return city
    loadVenuesForStageCity(nextStopCity, nextStopState);

    triggerToast(
      isFinalHome 
        ? `+ Added Homecoming Stop: ${nextStopCity}, ${nextStopState}!`
        : `+ Added Return Stop: ${nextStopCity}, ${nextStopState} heading toward Home Base (${homeCity})!`,
      "success"
    );
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
            bookingStatus: target.selectedVenue?.bookingStatus || "penciled",
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
            bookingStatus: "penciled"
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
        bookingStatus: "penciled"
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
                  "I-80 Midwest Heartland Tour",
                  "Chicago, IL", 
                  ["Iowa City, IA", "Des Moines, IA", "Omaha, NE", "Lincoln, NE"], 
                  "Denver, CO"
                )}
                className="p-4 rounded-2xl bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700 hover:border-indigo-500 text-left transition-all cursor-pointer group"
              >
                <div className="font-black text-white text-sm group-hover:text-indigo-300">⚡ I-80 Heartland Corridor</div>
                <div className="text-xs text-slate-400 mt-1">Chicago → Iowa City → Des Moines → Omaha → Denver</div>
                <div className="text-[11px] text-indigo-400 font-bold mt-2">6 Stops • 1,010 mi</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset(
                  "I-40 Music Highway Run",
                  "Nashville, TN", 
                  ["Memphis, TN", "Little Rock, AR", "Oklahoma City, OK", "Amarillo, TX"], 
                  "Albuquerque, NM"
                )}
                className="p-4 rounded-2xl bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700 hover:border-indigo-500 text-left transition-all cursor-pointer group"
              >
                <div className="font-black text-white text-sm group-hover:text-indigo-300">🎸 I-40 Music Highway</div>
                <div className="text-xs text-slate-400 mt-1">Nashville → Memphis → Little Rock → OKC → Albuquerque</div>
                <div className="text-[11px] text-indigo-400 font-bold mt-2">6 Stops • 1,180 mi</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset(
                  "I-10 Sunbelt Desert Corridor",
                  "Houston, TX", 
                  ["San Antonio, TX", "El Paso, TX", "Tucson, AZ"], 
                  "Phoenix, AZ"
                )}
                className="p-4 rounded-2xl bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700 hover:border-indigo-500 text-left transition-all cursor-pointer group"
              >
                <div className="font-black text-white text-sm group-hover:text-indigo-300">🌵 I-10 Sunbelt Run</div>
                <div className="text-xs text-slate-400 mt-1">Houston → San Antonio → El Paso → Tucson → Phoenix</div>
                <div className="text-[11px] text-indigo-400 font-bold mt-2">5 Stops • 1,170 mi</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset(
                  "I-95 Northeast Megalopolis",
                  "Boston, MA", 
                  ["New York, NY", "Philadelphia, PA", "Baltimore, MD"], 
                  "Washington, DC"
                )}
                className="p-4 rounded-2xl bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700 hover:border-indigo-500 text-left transition-all cursor-pointer group"
              >
                <div className="font-black text-white text-sm group-hover:text-indigo-300">🏙️ I-95 Northeast Corridor</div>
                <div className="text-xs text-slate-400 mt-1">Boston → New York → Philadelphia → Baltimore → DC</div>
                <div className="text-[11px] text-indigo-400 font-bold mt-2">5 Stops • 440 mi</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset(
                  "I-70 Crossroads of America",
                  "Columbus, OH", 
                  ["Indianapolis, IN", "St. Louis, MO", "Columbia, MO", "Kansas City, MO"], 
                  "Denver, CO"
                )}
                className="p-4 rounded-2xl bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700 hover:border-indigo-500 text-left transition-all cursor-pointer group"
              >
                <div className="font-black text-white text-sm group-hover:text-indigo-300">🌽 I-70 Heartland Run</div>
                <div className="text-xs text-slate-400 mt-1">Columbus → Indy → St. Louis → Kansas City → Denver</div>
                <div className="text-[11px] text-indigo-400 font-bold mt-2">6 Stops • 1,260 mi</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset(
                  "I-35 Central Spine Corridor",
                  "Minneapolis, MN", 
                  ["Des Moines, IA", "Kansas City, MO", "Oklahoma City, OK", "Dallas, TX"], 
                  "Austin, TX"
                )}
                className="p-4 rounded-2xl bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700 hover:border-indigo-500 text-left transition-all cursor-pointer group"
              >
                <div className="font-black text-white text-sm group-hover:text-indigo-300">🚚 I-35 Central Spine</div>
                <div className="text-xs text-slate-400 mt-1">Minneapolis → Des Moines → KC → Dallas → Austin</div>
                <div className="text-[11px] text-indigo-400 font-bold mt-2">6 Stops • 1,180 mi</div>
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
          
          {/* Run-of-Show Master Board Header Bar */}
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
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
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                    {tourStatus === "confirmed" ? "✓ Confirmed Tour Run" : "Run-of-Show Master Board"}
                  </span>
                  <span className="text-xs text-slate-400">• {stops.length} Tour Stops</span>
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {tourTitle || "Custom Tour Run"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                {originCity} → {destinationCity} • {startDate} through {endDate}
              </p>
            </div>

            {/* Global Actions Toolbar: 2-column grid on mobile, horizontal flex on sm+ */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowRouteSettings(!showRouteSettings)}
                className={`w-full sm:w-auto justify-center px-3.5 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-colors ${
                  showRouteSettings
                    ? "bg-indigo-600 text-white border-indigo-500"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
                title="Toggle Corridor & Route Setup"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-300" />
                <span>Route Settings</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveAndFinishLater(false)}
                disabled={isSaving}
                className="w-full sm:w-auto justify-center px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black border border-slate-700 flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-98"
                id="btn-save-draft-top"
              >
                <Save className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isSaving ? "Saving..." : "Save Draft"}</span>
              </button>

              {tourStatus !== "confirmed" ? (
                <button
                  type="button"
                  onClick={() => handleSaveAndFinishLater(true)}
                  className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
                  id="btn-confirm-tour-top"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Confirm Tour</span>
                </button>
              ) : (
                <span className="w-full sm:w-auto justify-center px-3 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Confirmed</span>
                </span>
              )}

              <button
                type="button"
                onClick={() => setShowEmailModal(true)}
                className="w-full sm:w-auto justify-center px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer transition-colors"
                id="btn-open-email-modal-top"
                title="Email Master Itinerary to Band & Crew"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Band</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="w-full sm:w-auto justify-center px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Print Run-of-Show Sheet"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  refreshTours();
                  setViewState("history");
                }}
                className="w-full sm:w-auto justify-center px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-1 cursor-pointer"
                title="View Saved Tours"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>My Tours</span>
              </button>
            </div>
          </div>

          {/* Collapsible Route Settings Panel */}
          {showRouteSettings && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <span>Corridor Framework &amp; Highway Waypoints</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Adjust origin, destination, dates, and circular routing. Modifying endpoints will recalculate intermediate stops.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRouteSettings(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Starting / Home City</label>
                  <input
                    type="text"
                    list="tour-nationwide-hubs-list"
                    value={originCity}
                    onChange={(e) => setOriginCity(e.target.value)}
                    placeholder="e.g. Seattle, WA or Austin, TX"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Destination / Turnaround City</label>
                  <input
                    type="text"
                    list="tour-nationwide-hubs-list"
                    value={destinationCity}
                    onChange={(e) => setDestinationCity(e.target.value)}
                    placeholder="e.g. San Francisco, CA or Chicago, IL"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tour Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tour End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Loop & Add Waypoint Row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={isRoundTripLoop}
                      onChange={(e) => setIsRoundTripLoop(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Round-Trip Circular Loop (Returns to starting city)</span>
                  </label>

                  {isRoundTripLoop && (
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-700">
                      <input
                        type="checkbox"
                        checked={isReturnDiversified}
                        onChange={(e) => handleToggleReturnDiversification(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Diversify return corridor with alternate towns</span>
                    </label>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleProceedToOptimization}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Recalculate Corridor &amp; Stops</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* RUN-OF-SHOW MASTER BOARD: OPTION 1 UNIFIED SPLIT LAYOUT               */}
          {/* ===================================================================== */}
          {stops.length === 0 ? (
            /* Empty State: Initial Corridor Builder */
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center max-w-xl mx-auto space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Compass className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Define Your Tour Corridor
                </h3>
                <p className="text-xs text-slate-600">
                  Select your tour starting city and final turnaround destination. The intelligent corridor engine will generate your master day-by-day run-of-show board.
                </p>
              </div>

              <div className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Starting / Home City</label>
                  <input
                    type="text"
                    list="tour-nationwide-hubs-list"
                    value={originCity}
                    onChange={(e) => setOriginCity(e.target.value)}
                    placeholder="e.g. Seattle, WA or Austin, TX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Destination City</label>
                  <input
                    type="text"
                    list="tour-nationwide-hubs-list"
                    value={destinationCity}
                    onChange={(e) => setDestinationCity(e.target.value)}
                    placeholder="e.g. Chicago, IL or San Francisco, CA"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleProceedToOptimization}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <span>Optimize Corridor &amp; Open Master Board</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* UNIFIED SPLIT LAYOUT */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="run-of-show-master-board">
              
              {/* ================================================================= */}
              {/* STICKY LEFT PANEL (30-35%): Vitals, Booking Health & TourMap      */}
              {/* ================================================================= */}
              <div className="col-span-12 lg:col-span-4 xl:col-span-4 space-y-4 lg:sticky lg:top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto pr-1">
                
                {/* Embedded Leaflet TourMap */}
                <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Tour Route Map</span>
                    </span>
                    <a
                      href={currentTourPlan.googleMapsDirectionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <span>Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="w-full max-w-full h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden border border-slate-200 relative shadow-inner" style={{ touchAction: "pan-x pan-y" }}>
                    <TourMap
                      stops={stops}
                      tourTitle={tourTitle}
                      totalDistanceMiles={totalDistanceMiles}
                      totalDriveTime={totalDriveTime}
                      className="h-full w-full"
                    />
                  </div>
                </div>

                {/* Tour Vitals Card */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Compass className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">
                      Tour Vitals &amp; Logistics
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 block">Total Miles</span>
                      <div className="text-base font-black text-slate-900 flex items-center gap-1">
                        <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{totalDistanceMiles} mi</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 block">Drive Hours</span>
                      <div className="text-base font-black text-slate-900 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{totalDriveTime || "0 hrs"}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-1">
                      <span className="text-[10px] font-black uppercase text-emerald-700 block">Est. Van Gas</span>
                      <div className="text-base font-black text-emerald-800 flex items-center gap-1">
                        <Fuel className="w-3.5 h-3.5 text-emerald-600" />
                        <span>${financials.totalGas}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-200/80 space-y-1">
                      <span className="text-[10px] font-black uppercase text-indigo-700 block">Est. Budget</span>
                      <div className="text-base font-black text-indigo-900 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                        <span>${financials.totalGas + financials.totalLodgingCost}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Health Progress Bars Card */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">
                        Booking Health
                      </h3>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {stops.length} Days Total
                    </span>
                  </div>

                  {/* Progress Bar 1: Stages Booked */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-700 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Stages Booked</span>
                      </span>
                      <span className="font-mono text-xs font-black text-indigo-700">
                        {bookingHealth.stagesConfirmed} / {stops.length} ({bookingHealth.stagesConfirmedPercent}%)
                      </span>
                    </div>

                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/60">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${(bookingHealth.stagesConfirmed / stops.length) * 100}%` }}
                        title={`Confirmed: ${bookingHealth.stagesConfirmed}`}
                      />
                      <div
                        className="bg-blue-400 h-full transition-all duration-300"
                        style={{ width: `${(bookingHealth.stagesHold / stops.length) * 100}%` }}
                        title={`On Hold: ${bookingHealth.stagesHold}`}
                      />
                      <div
                        className="bg-amber-300 h-full transition-all duration-300"
                        style={{ width: `${(bookingHealth.stagesPenciled / stops.length) * 100}%` }}
                        title={`Penciled: ${bookingHealth.stagesPenciled}`}
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-500 font-medium pt-0.5">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        <span>{bookingHealth.stagesConfirmed} Confirmed</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                        <span>{bookingHealth.stagesHold} Hold</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-300 inline-block" />
                        <span>{bookingHealth.stagesPenciled} Penciled</span>
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar 2: Lodging Secured */}
                  <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-700 flex items-center gap-1">
                        <Hotel className="w-3.5 h-3.5 text-amber-600" />
                        <span>Lodging Secured</span>
                      </span>
                      <span className="font-mono text-xs font-black text-emerald-700">
                        {bookingHealth.lodgingConfirmed} / {stops.length} ({bookingHealth.lodgingConfirmedPercent}%)
                      </span>
                    </div>

                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/60">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${(bookingHealth.lodgingConfirmed / stops.length) * 100}%` }}
                        title={`Secured: ${bookingHealth.lodgingConfirmed}`}
                      />
                      <div
                        className="bg-blue-400 h-full transition-all duration-300"
                        style={{ width: `${(bookingHealth.lodgingHold / stops.length) * 100}%` }}
                        title={`Hold: ${bookingHealth.lodgingHold}`}
                      />
                      <div
                        className="bg-amber-300 h-full transition-all duration-300"
                        style={{ width: `${(bookingHealth.lodgingPenciled / stops.length) * 100}%` }}
                        title={`Pending: ${bookingHealth.lodgingPenciled}`}
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-500 font-medium pt-0.5">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        <span>{bookingHealth.lodgingConfirmed} Secured</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                        <span>{bookingHealth.lodgingHold} Hold</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-300 inline-block" />
                        <span>{bookingHealth.lodgingPenciled} Pending</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Add Waypoint Bar in Left Panel */}
                <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                    + Add Tour Waypoint
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      list="known-corridor-cities-list"
                      value={newWaypointInput}
                      onChange={(e) => setNewWaypointInput(e.target.value)}
                      placeholder="e.g. Olympia, WA"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddWaypoint}
                      disabled={!newWaypointInput.trim()}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-black shrink-0 cursor-pointer transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>

              {/* ================================================================= */}
              {/* SCROLLABLE RIGHT PANEL (65-70%): Chronological Day-by-Day Cards    */}
              {/* ================================================================= */}
              <div className="col-span-12 lg:col-span-8 xl:col-span-8 space-y-4">
                
                {/* Right Panel Header Bar */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                      <span>Chronological Day-by-Day Schedule</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      {stops.length} dates • Review transit legs, contracts, load-in times, and hotel holds.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const txt = formatPersonalizedItineraryText(currentTourPlan, bandProfile?.name);
                      navigator.clipboard.writeText(txt);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 3000);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition-colors"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? "Copied Itinerary!" : "Copy Itinerary Text"}</span>
                  </button>
                </div>

                {/* Native Autocomplete Datalist for Corridor Cities & Hubs */}
                <datalist id="known-corridor-cities-list">
                  {POPULAR_NATIONWIDE_HUBS.map(h => (
                    <option key={`hub-${h}`} value={h}>
                      {h} (Tour Hub)
                    </option>
                  ))}
                  {KNOWN_CORRIDOR_CITIES.map((c) => (
                    <option key={`${c.city}-${c.state}`} value={`${c.city}, ${c.state}`}>
                      {c.city}, {c.state} ({c.tier})
                    </option>
                  ))}
                </datalist>

                <datalist id="tour-nationwide-hubs-list">
                  {POPULAR_NATIONWIDE_HUBS.map(h => (
                    <option key={`nhub-${h}`} value={h} />
                  ))}
                  {KNOWN_CORRIDOR_CITIES.map(c => (
                    <option key={`ncity-${c.city}-${c.state}`} value={`${c.city}, ${c.state}`} />
                  ))}
                </datalist>

                {/* Day-by-Day Tour Stop Cards */}
                <div className="space-y-4">
                  {stops.map((stop, idx) => {
                    const isOrigin = idx === 0;
                    const isDestination = idx === stops.length - 1;
                    const isFatigued = (stop.distanceMilesFromPrev || 0) > 240 || (
                      Boolean(stop.driveTimeFromPrev && (
                        stop.driveTimeFromPrev.includes("4 hr") || 
                        stop.driveTimeFromPrev.includes("5 hr") || 
                        stop.driveTimeFromPrev.includes("6 hr") || 
                        stop.driveTimeFromPrev.includes("7 hr") || 
                        stop.driveTimeFromPrev.includes("8 hr")
                      ))
                    );

                    // Stage status defaults to 'hold' ("ON HOLD") if unselected/unconfirmed
                    const venueRawStatus = stop.selectedVenue?.bookingStatus;
                    const venueStatus: "penciled" | "hold" | "confirmed" = 
                      venueRawStatus === "confirmed" ? "confirmed" : 
                      venueRawStatus === "penciled" ? "penciled" : "hold";

                    // Lodging status defaults to 'penciled' if unconfirmed
                    const lodgingRawStatus = stop.selectedLodging?.bookingStatus;
                    const lodgingStatus: "penciled" | "hold" | "confirmed" =
                      (lodgingRawStatus === "confirmed" || stop.selectedLodging?.isBooked) ? "confirmed" :
                      lodgingRawStatus === "hold" ? "hold" : "penciled";

                    const isInlineEditing = editingStopIndex === idx;

                    const isMedfordFinale = (stop.city.toLowerCase().includes("medford") || (!stop.isReturnLeg && (idx === 5 || isDestination))) && !stop.isReturnLeg;

                    return (
                      <React.Fragment key={stop.id || idx}>
                        <div
                          id={`master-stop-card-${idx}`}
                          className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-all"
                        >
                        {/* Stop Header Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                              {stop.dayNumber || idx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-base font-black text-slate-900 tracking-tight">
                                  {stop.city}, {stop.state}
                                </h4>
                                {isOrigin && (
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                                    Tour Kickoff
                                  </span>
                                )}
                                {isDestination && !isOrigin && !stop.isReturnLeg && (
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                                    Tour Finale
                                  </span>
                                )}
                                {stop.isReturnLeg && (
                                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold flex items-center gap-1 shadow-2xs">
                                    <Compass className="w-3 h-3 text-amber-600" />
                                    <span>Return Leg</span>
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 font-bold">
                                {formatReadableDate(stop.date || "")}
                              </span>
                            </div>
                          </div>

                          {/* Stop Action Buttons (Edit Stop, Reorder, Remove) */}
                          <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => setEditModalStopIndex(idx)}
                              className="w-full sm:w-auto justify-center px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-200"
                              title="Edit Tour Stop (City, Date, Times)"
                            >
                              <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Edit Tour Stop</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleMoveStop(idx, "up")}
                              disabled={idx === 0}
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-30 text-slate-600 cursor-pointer border border-slate-200"
                              title="Move Stop Earlier"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleMoveStop(idx, "down")}
                              disabled={idx === stops.length - 1}
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-30 text-slate-600 cursor-pointer border border-slate-200"
                              title="Move Stop Later"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            {stops.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveStop(idx)}
                                className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer border border-slate-200 transition-colors"
                                title="Remove Tour Stop"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Transit Badge (Miles, Drive Time, Fatigue Warning) */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {isOrigin ? (
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200">
                              <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Kickoff Leg • 0 mi transit</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 text-xs font-bold text-slate-700 bg-slate-100/90 px-3 py-1.5 rounded-xl border border-slate-200">
                              <span className="flex items-center gap-1.5">
                                <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                                <span>{stop.distanceMilesFromPrev || 0} mi</span>
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                <span>{stop.driveTimeFromPrev || "0 hrs"}</span>
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="flex items-center gap-1.5 text-emerald-700">
                                <Fuel className="w-3.5 h-3.5 text-emerald-600" />
                                <span>~${stop.estimatedGasCost || Math.round((stop.distanceMilesFromPrev || 0) * 0.28)} gas</span>
                              </span>
                            </div>
                          )}

                          {isFatigued && !isOrigin && (
                            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Fatigue Warning (&gt;4 hrs drive)</span>
                            </span>
                          )}
                        </div>

                        {/* Inline Stop Editor (if open) */}
                        {isInlineEditing && (
                          <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-200 space-y-3 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between pb-2 border-b border-indigo-200/60">
                              <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                                <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Quick Edit Stop #{idx + 1}</span>
                              </span>
                              <button
                                type="button"
                                onClick={handleCancelEditStop}
                                className="text-xs font-bold text-slate-500 hover:text-slate-700"
                              >
                                Cancel
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  City &amp; State (Corridor Autocomplete)
                                </label>
                                <input
                                  type="text"
                                  list="known-corridor-cities-list"
                                  value={`${editStopCity}${editStopState ? `, ${editStopState}` : ""}`}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const parts = val.split(",").map(p => p.trim());
                                    setEditStopCity(parts[0] || "");
                                    if (parts[1]) setEditStopState(parts[1]);
                                  }}
                                  placeholder="e.g. Eugene, OR"
                                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">Performance Date</label>
                                <input
                                  type="date"
                                  value={editStopDate}
                                  onChange={(e) => setEditStopDate(e.target.value)}
                                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Routing / Priority Notes</label>
                              <input
                                type="text"
                                value={editStopNotes}
                                onChange={(e) => setEditStopNotes(e.target.value)}
                                placeholder="e.g. Must soundcheck before 6:00 PM for festival slot"
                                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                              />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={handleCancelEditStop}
                                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditStop(idx)}
                                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Save Changes</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Two-Column Grid: Stage / Venue (Left) & Overnight Lodging (Right) */}
                        <div className="flex flex-col md:grid md:grid-cols-2 gap-3 pt-1">
                          
                          {/* ======================================================= */}
                          {/* STAGE & VENUE CARD                                      */}
                          {/* ======================================================= */}
                          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
                            <div className="space-y-2">
                              {/* Header & Quick-Toggle Status */}
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-black uppercase text-indigo-700 flex items-center gap-1">
                                  <Building className="w-3.5 h-3.5" />
                                  <span>Live Stage &amp; Booking</span>
                                </span>

                                {/* Click-to-Toggle Confirmation & Cycling: ON HOLD -> PENCILED IN -> CONFIRMED */}
                                <button
                                  type="button"
                                  onClick={() => handleCycleVenueStatus(idx)}
                                  className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer transition-colors border shadow-2xs ${
                                    venueStatus === "confirmed"
                                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-300"
                                      : venueStatus === "penciled"
                                      ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300"
                                      : "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300"
                                  }`}
                                  title={
                                    venueStatus === "penciled"
                                      ? "Penciled In: Click to toggle to Confirmed"
                                      : venueStatus === "confirmed"
                                      ? "Confirmed: Click to cycle to On Hold"
                                      : "On Hold: Click to cycle to Penciled In"
                                  }
                                >
                                  {venueStatus === "confirmed" ? (
                                    <>
                                      <Check className="w-3 h-3 stroke-[3] text-emerald-600" />
                                      <span>✓ Confirmed</span>
                                    </>
                                  ) : venueStatus === "penciled" ? (
                                    <>
                                      <Pencil className="w-3 h-3 text-amber-600" />
                                      <span>Penciled In</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3 text-blue-600" />
                                      <span>On Hold</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Venue Name */}
                              <div className="font-black text-slate-900 text-sm">
                                {stop.selectedVenue?.name || "Pending Stage Selection"}
                              </div>

                              {/* Address */}
                              <div className="text-slate-600 text-[11px] flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{stop.selectedVenue?.address || `${stop.city}, ${stop.state}`}</span>
                              </div>

                              {/* Schedule Times */}
                              <div className="text-[11px] text-slate-600 pt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                                <span>Load-in: <strong>{stop.selectedVenue?.loadInTime || "5:00 PM"}</strong></span>
                                <span>Soundcheck: <strong>{stop.selectedVenue?.soundcheckTime || "6:30 PM"}</strong></span>
                                <span>Set: <strong>{stop.selectedVenue?.setTime || "9:00 PM"}</strong></span>
                              </div>

                              {/* Deal / Door / Capacity */}
                              {(stop.selectedVenue?.doorGuarantee || stop.selectedVenue?.ticketPrice || stop.selectedVenue?.capacity) && (
                                <div className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded w-fit border border-emerald-200">
                                  🎟️ {stop.selectedVenue.ticketPrice || "$12-$15"} {stop.selectedVenue.doorGuarantee ? `• ${stop.selectedVenue.doorGuarantee}` : ""} {stop.selectedVenue.capacity ? `(${stop.selectedVenue.capacity} cap)` : ""}
                                </div>
                              )}

                              {/* Contact */}
                              {(stop.selectedVenue?.contactPhone || stop.selectedVenue?.contactEmail) && (
                                <div className="text-[11px] text-slate-500 pt-0.5">
                                  📞 Contact: {stop.selectedVenue.contactPhone || ""} {stop.selectedVenue.contactEmail ? `(${stop.selectedVenue.contactEmail})` : ""}
                                </div>
                              )}
                            </div>

                            {/* Action to Design Poster */}
                            {stop.selectedVenue?.name && onSelectVenueForPoster && (
                              <div className="pt-2 border-t border-slate-200/80">
                                <button
                                  type="button"
                                  onClick={() => onSelectVenueForPoster(stop.selectedVenue!.name, stop.city)}
                                  className="text-[11px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Design Concert Poster for this Gig →</span>
                                </button>
                              </div>
                            )}

                            {/* Action to Find / Select Venue Options */}
                            <div className="pt-2 border-t border-slate-200/80">
                              <button
                                type="button"
                                onClick={() => handleOpenVenueModalForStop(idx)}
                                disabled={loadingVenueStopIdx === idx}
                                className="w-full py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 disabled:opacity-60 text-indigo-950 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-indigo-200"
                              >
                                {loadingVenueStopIdx === idx ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 text-indigo-700 animate-spin" />
                                    <span>Querying Stages...</span>
                                  </>
                                ) : (
                                  <>
                                    <Building className="w-3.5 h-3.5 text-indigo-700" />
                                    <span>{stop.selectedVenue?.name ? "Change / Find Venue Options →" : "Find Venue Options →"}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* ======================================================= */}
                          {/* OVERNIGHT LODGING CARD                                  */}
                          {/* ======================================================= */}
                          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
                            <div className="space-y-2">
                              {/* Header & Quick-Toggle Status */}
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-black uppercase text-amber-800 flex items-center gap-1">
                                  <Hotel className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Overnight Lodging</span>
                                </span>

                                {/* Quick-Toggle Button Cycling: penciled -> hold -> confirmed -> penciled */}
                                <button
                                  type="button"
                                  onClick={() => handleCycleLodgingStatus(idx)}
                                  className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer transition-colors border shadow-2xs ${
                                    lodgingStatus === "confirmed"
                                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-300"
                                      : lodgingStatus === "hold"
                                      ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300"
                                      : "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300"
                                  }`}
                                  title="Click to cycle status: Penciled -> Hold -> Confirmed"
                                >
                                  {lodgingStatus === "confirmed" ? (
                                    <>
                                      <Check className="w-3 h-3 stroke-[3] text-emerald-600" />
                                      <span>✓ Confirmed</span>
                                    </>
                                  ) : lodgingStatus === "hold" ? (
                                    <>
                                      <Clock className="w-3 h-3 text-blue-600" />
                                      <span>On Hold</span>
                                    </>
                                  ) : (
                                    <>
                                      <Pencil className="w-3 h-3 text-amber-600" />
                                      <span>Penciled In</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Hotel / Property Name */}
                              <div className="font-black text-slate-900 text-sm truncate">
                                {stop.selectedLodging?.name || (stop.lodgingOptions && stop.lodgingOptions[0]?.name) || `Band Hotel in ${stop.city}`}
                              </div>

                              {/* Address */}
                              <div className="text-slate-600 text-[11px] flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{stop.selectedLodging?.address || stop.lodgingOptions?.[0]?.address || `${stop.city}, ${stop.state}`}</span>
                              </div>

                              {/* Confirmation # or Est. Cost */}
                              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                                {stop.selectedLodging?.confirmationNumber && (
                                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                                    Conf: {stop.selectedLodging.confirmationNumber}
                                  </span>
                                )}
                                <span className="text-slate-600">
                                  Est. Rate: <strong>${parseNightlyRate(stop.selectedLodging?.cost || (stop.lodgingOptions && stop.lodgingOptions[0]?.estPricePerNight) || 85)}/night</strong>
                                </span>
                              </div>

                              {/* Van & Gear Security Notes */}
                              {(stop.selectedLodging?.gearSecurityNote || stop.lodgingNotes || stop.lodgingOptions?.[0]?.gearSecurityNote) && (
                                <div className="text-[11px] text-amber-950 bg-amber-50 p-2 rounded-xl border border-amber-200 flex items-start gap-1.5">
                                  <Car className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                  <span className="leading-tight">
                                    <strong>Van Security:</strong> {stop.selectedLodging?.gearSecurityNote || stop.lodgingNotes || stop.lodgingOptions?.[0]?.gearSecurityNote}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Booking Action Button: Opens TourLodgingModal */}
                            <div className="pt-2 border-t border-slate-200/80">
                              <button
                                type="button"
                                onClick={() => handleOpenBookingModal(idx)}
                                className="w-full py-2 px-3 rounded-xl bg-amber-100/80 hover:bg-amber-200 text-amber-950 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-amber-300"
                              >
                                <Hotel className="w-3.5 h-3.5 text-amber-700" />
                                <span>{stop.selectedLodging?.name ? "Update Lodging & Booking →" : "Find Lodging Options →"}</span>
                              </button>
                            </div>
                          </div>

                        </div>

                        {/* Stop Custom Notes (if any) */}
                        {stop.customNotes && (
                          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            📝 <strong>Stop Notes:</strong> {stop.customNotes}
                          </div>
                        )}
                      </div>

                      {/* Directly below Stop 6 (Medford, OR • Tour Finale): Book Gigs On The Way Home Banner Card */}
                      {isMedfordFinale && (
                        <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-indigo-500/10 p-5 rounded-3xl border-2 border-dashed border-amber-300 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 mb-2">
                          <div className="flex items-center gap-3.5">
                            <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-sm shrink-0">
                              <Compass className="w-6 h-6 stroke-[2.5]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-base font-black text-slate-900">Book Gigs On The Way Home</h4>
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                  Route Home
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                                Don't drive 400+ deadhead miles back empty-handed! Add northbound tour stops through Roseburg, Eugene, or Portland back toward your home base.
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleAddReturnLegStop}
                            className="shrink-0 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer transition-all shadow-xs hover:shadow-md active:scale-95"
                          >
                            <Plus className="w-4 h-4 stroke-[3]" />
                            <span>+ Add Return Stop Toward Home Base</span>
                          </button>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Additional option to keep adding return legs if any already present */}
                {stops.some(s => s.isReturnLeg) && (
                  <div className="pt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={handleAddReturnLegStop}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300 text-xs font-black flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3] text-amber-600" />
                      <span>+ Add Another Return Stop Toward Home Base</span>
                    </button>
                  </div>
                )}

                {/* ================================================================= */}
                {/* EXECUTION AUDIT & TOUR-READINESS PRE-FLIGHT (RELOCATED TO BOTTOM) */}
                {/* ================================================================= */}
                <div 
                  id="tour-execution-audit-bottom-card"
                  className={`mt-6 rounded-3xl p-6 sm:p-7 border shadow-md space-y-5 transition-all ${
                    tourAuditReport.criticalIssuesCount > 0
                      ? "bg-gradient-to-br from-rose-50/90 via-white to-rose-50/40 border-rose-200 text-rose-950"
                      : tourAuditReport.warningIssuesCount > 0
                      ? "bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 border-amber-200 text-amber-950"
                      : "bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 border-emerald-200 text-emerald-950"
                  }`}
                >
                  {/* Card Header & Score */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className={`p-2 rounded-2xl ${
                          tourAuditReport.criticalIssuesCount > 0
                            ? "bg-rose-500 text-white"
                            : tourAuditReport.warningIssuesCount > 0
                            ? "bg-amber-500 text-white"
                            : "bg-emerald-500 text-white"
                        }`}>
                          <ShieldAlert className="w-5 h-5 stroke-[2.5]" />
                        </span>
                        <div>
                          <h4 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
                            <span>Execution Audit</span>
                            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                              tourAuditReport.criticalIssuesCount > 0
                                ? "bg-rose-100 text-rose-800 border-rose-300"
                                : tourAuditReport.warningIssuesCount > 0
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : "bg-emerald-100 text-emerald-800 border-emerald-300"
                            }`}>
                              {tourAuditReport.rating}
                            </span>
                          </h4>
                          <p className="text-xs text-slate-600 font-medium">
                            Comprehensive pre-flight departure audit across venues, driving fatigue, and lodging.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Readiness Score</div>
                        <div className="font-mono text-2xl font-black text-slate-900">
                          {tourAuditReport.score}%
                        </div>
                      </div>
                      <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                        <span className={`text-xl font-black font-mono ${
                          tourAuditReport.score >= 80 ? "text-emerald-600" :
                          tourAuditReport.score >= 50 ? "text-amber-600" : "text-rose-600"
                        }`}>
                          {tourAuditReport.score}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Bar & Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>{tourAuditReport.summaryText}</span>
                      <span className="text-[11px] font-semibold text-slate-500">{tourAuditReport.totalStops} Total Stops</span>
                    </div>
                    <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${
                          tourAuditReport.score >= 80 ? "bg-emerald-500" :
                          tourAuditReport.score >= 50 ? "bg-amber-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${Math.max(5, tourAuditReport.score)}%` }}
                      />
                    </div>
                  </div>

                  {/* Status Pills Breakdown */}
                  <div className="flex flex-wrap gap-1.5 text-xs pt-1">
                    {tourAuditReport.criticalIssuesCount > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-300 font-black rounded-xl text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{tourAuditReport.criticalIssuesCount} Critical Blocker{tourAuditReport.criticalIssuesCount > 1 ? "s" : ""}</span>
                      </span>
                    )}
                    {tourAuditReport.warningIssuesCount > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 font-black rounded-xl text-[11px]">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{tourAuditReport.warningIssuesCount} Advisory Warning{tourAuditReport.warningIssuesCount > 1 ? "s" : ""}</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-xl text-[11px]">
                      <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{tourAuditReport.confirmedVenuesCount} Confirmed • {tourAuditReport.penciledVenuesCount} Penciled</span>
                    </span>
                    {tourAuditReport.unconfirmedVenuesCount > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 font-bold rounded-xl text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{tourAuditReport.unconfirmedVenuesCount} Unbooked Venues</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-xl text-[11px]">
                      <Hotel className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{tourAuditReport.bookedLodgingCount} / {tourAuditReport.totalStops} Rooms Secured</span>
                    </span>
                  </div>

                  {/* Detailed Issues List */}
                  {tourAuditReport.issues.length > 0 && (
                    <div className="space-y-2.5 pt-2">
                      <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                        Operational Checklist & Action Items:
                      </div>
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {tourAuditReport.issues.map((issue) => (
                          <div 
                            key={issue.id}
                            className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                              issue.severity === "critical"
                                ? "bg-rose-50/80 border-rose-200 text-rose-900"
                                : issue.severity === "warning"
                                ? "bg-amber-50/80 border-amber-200 text-amber-900"
                                : "bg-slate-50 border-slate-200 text-slate-800"
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  issue.severity === "critical"
                                    ? "bg-rose-600 text-white"
                                    : issue.severity === "warning"
                                    ? "bg-amber-500 text-slate-950"
                                    : "bg-slate-600 text-white"
                                }`}>
                                  {issue.severity === "critical" ? "Critical Blocker" : "Advisory"}
                                </span>
                                <span className="font-extrabold text-slate-900">
                                  {issue.title}
                                </span>
                              </div>
                              <p className="text-[11.5px] opacity-90 leading-relaxed">
                                {issue.message}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById(`master-stop-card-${issue.stopIndex}`);
                                if (el) {
                                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                                  el.classList.add("ring-2", "ring-indigo-500");
                                  setTimeout(() => el.classList.remove("ring-2", "ring-indigo-500"), 2000);
                                }
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold border border-slate-300 text-xs shrink-0 cursor-pointer transition-colors shadow-2xs text-center"
                            >
                              Jump to Stop #{issue.stopIndex + 1} →
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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

      {/* Edit Stop Modal */}
      {editModalStopIndex !== null && stops[editModalStopIndex] && (
        <EditStopModal
          stop={stops[editModalStopIndex]}
          onClose={() => setEditModalStopIndex(null)}
          onSave={(updated) => {
            handleSaveEditStopFromModal(editModalStopIndex, updated);
            setEditModalStopIndex(null);
          }}
        />
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

      {/* Venue Picker Modal */}
      {isVenueModalOpen && venueModalStopIndex !== null && stops[venueModalStopIndex] && (
        <VenuePickerModal
          key={`venue-modal-${stops[venueModalStopIndex].id || venueModalStopIndex}-${stops[venueModalStopIndex].city}-${stops[venueModalStopIndex].state}`}
          isOpen={isVenueModalOpen}
          stop={stops[venueModalStopIndex]}
          cityName={stops[venueModalStopIndex].city}
          allVenues={allDirectoryVenues}
          suggestedVenues={
            (stops[venueModalStopIndex]?.suggestedVenues && stops[venueModalStopIndex].suggestedVenues.length > 0)
              ? stops[venueModalStopIndex].suggestedVenues
              : (cityVenuesMap[`${stops[venueModalStopIndex].city}_${stops[venueModalStopIndex].state}`] || 
                 cityVenuesMap[stops[venueModalStopIndex].city] || 
                 [])
          }
          loadVenuesForStageCity={loadVenuesForStageCity}
          onClose={() => {
            setIsVenueModalOpen(false);
            setVenueModalStopIndex(null);
          }}
          onSave={(selectedVenue) => {
            handleCommitVenuePicker(venueModalStopIndex, selectedVenue);
          }}
        />
      )}

    </div>
  );
};

export default TourScheduler;
