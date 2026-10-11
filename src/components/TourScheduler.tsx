import React, { useState, useEffect, useMemo } from "react";
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
import { findLodgingForCity } from "../utils/tourLodgingData";
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
  formatDriveTime
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
  BedDouble
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
}

type ViewState = "landing" | "history" | "wizard";

const STORAGE_ACTIVE_DRAFT = "giglizard_active_tour_plan_v2";
const STORAGE_PENDING_DRAFT = "giglizard_pending_tour_draft";

export const TourScheduler: React.FC<TourSchedulerProps> = ({
  bandProfile,
  onSelectVenueForPoster,
  currentUser,
  currentAccount,
  onTriggerLogin
}) => {
  // Navigation & View Mode
  const [viewState, setViewState] = useState<ViewState>("landing");
  const [wizardStep, setWizardStep] = useState<number>(1); // 1: Setup, 2: Optimization, 3: Stages, 4: Review

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

  // Step 3 City-by-City stage navigation
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [cityVenuesMap, setCityVenuesMap] = useState<Record<string, Venue[]>>({});
  const [isLoadingVenues, setIsLoadingVenues] = useState(false);
  const [customVenueMode, setCustomVenueMode] = useState<Record<string, boolean>>({});

  // Step 4 City-by-City lodging navigation & confirmation snippets
  const [activeLodgingIndex, setActiveLodgingIndex] = useState(0);
  const [pastedConfirmationSnippet, setPastedConfirmationSnippet] = useState<Record<number, string>>({});

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
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // In-app lodging booking modal state
  const [bookingModalStopIndex, setBookingModalStopIndex] = useState<number | null>(null);

  const handleOpenBookingModal = (stopIdx: number) => {
    setBookingModalStopIndex(stopIdx);
  };

  // New waypoint input in Step 2
  const [newWaypointInput, setNewWaypointInput] = useState("");

  const effectiveUserId = currentUser?.id || currentAccount?.id || null;

  // Android back-swipe / back button listener: close print modal or step back in wizard
  useEffect(() => {
    const handleBackButton = (e: Event) => {
      if (bookingModalStopIndex !== null) {
        setBookingModalStopIndex(null);
        e.preventDefault();
        return;
      }
      if (showPrintModal) {
        setShowPrintModal(false);
        e.preventDefault();
        return;
      }
      if (viewState !== "landing") {
        if (viewState === "saved-tours") {
          setViewState("landing");
          e.preventDefault();
        } else if (viewState === "city-detail") {
          setViewState("optimizer");
          e.preventDefault();
        } else if (viewState === "optimizer") {
          setViewState("route-setup");
          e.preventDefault();
        } else if (viewState === "route-setup") {
          setViewState("landing");
          e.preventDefault();
        }
      }
    };
    window.addEventListener("giglizard_back_press", handleBackButton);
    return () => {
      window.removeEventListener("giglizard_back_press", handleBackButton);
    };
  }, [showPrintModal, viewState]);

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
      setStops(recal.updatedStops);
      setTotalDistanceMiles(recal.totalDistanceMiles);
      setTotalDriveTime(recal.totalDriveTime);
    } else {
      setStops(res.stops);
      setTotalDistanceMiles(res.totalDistanceMiles);
      setTotalDriveTime(res.totalDriveTime);
    }
    setWizardStep(2);
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

  // Select venue for current stop
  const handleSelectVenueForStop = (stopIdx: number, venue: Venue) => {
    setStops(prev => {
      const copy = [...prev];
      const target = copy[stopIdx];
      if (target) {
        target.selectedVenue = {
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
          website: venue.website
        };
      }
      return copy;
    });
  };

  // Update schedule times for current stop
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
            [field]: value
          };
        } else {
          target.selectedVenue[field] = value as any;
        }
      }
      return copy;
    });
  };

  // Select lodging for current stop
  const handleSelectLodgingForStop = (stopIdx: number, lodging: TourLodgingOption) => {
    setStops(prev => {
      const copy = [...prev];
      const target = copy[stopIdx];
      if (target) {
        target.selectedLodging = {
          id: lodging.id,
          name: lodging.name,
          type: lodging.type,
          address: lodging.address,
          cost: parseNightlyRate(lodging.estPricePerNight),
          confirmationNumber: target.selectedLodging?.confirmationNumber || "",
          gearSecurityNote: lodging.gearSecurityNote,
          bookingUrl: lodging.bookingSearchUrl,
          notes: target.selectedLodging?.notes || lodging.gearSecurityNote || ""
        };
        if (!target.lodgingNotes && lodging.gearSecurityNote) {
          target.lodgingNotes = lodging.gearSecurityNote;
        }
      }
      return copy;
    });
  };

  // Update direct lodging fields (hotel name, confirmation number, budget, notes) in stop's route_data
  const handleUpdateLodgingField = (
    stopIdx: number,
    field: "name" | "confirmationNumber" | "cost" | "notes" | "address" | "type",
    value: any
  ) => {
    setStops(prev => {
      const copy = [...prev];
      const target = copy[stopIdx];
      if (target) {
        const existing = target.selectedLodging || {
          name: "",
          cost: 85,
          confirmationNumber: "",
          notes: ""
        };
        target.selectedLodging = {
          ...existing,
          [field]: value
        };
        if (field === "notes") {
          target.lodgingNotes = value;
        }
      }
      return copy;
    });
  };

  // Clear lodging details for stop
  const handleClearLodgingForStop = (stopIdx: number) => {
    setStops(prev => {
      const copy = [...prev];
      if (copy[stopIdx]) {
        copy[stopIdx].selectedLodging = undefined;
        copy[stopIdx].lodgingNotes = "";
      }
      return copy;
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
      type?: string;
      checkIn: string;
      checkOut: string;
    }
  ) => {
    let updatedStopsList: TourStop[] = [];

    setStops(prev => {
      const copy = [...prev];
      const target = copy[stopIdx];
      if (target) {
        target.selectedLodging = {
          name: reservation.name,
          confirmationNumber: reservation.confirmationNumber,
          cost: reservation.cost,
          gearSecurityNote: reservation.parkingNotes,
          notes: reservation.notes,
          address: reservation.address,
          type: reservation.type || "Band-Friendly Hotel"
        };
        target.lodgingNotes = reservation.parkingNotes || reservation.notes;
      }
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
      if (stops[nextIdx]) {
        loadVenuesForStageCity(stops[nextIdx].city, stops[nextIdx].state);
      }
    } else {
      // Finished all cities -> proceed to Step 4 (Lodging)
      setActiveLodgingIndex(0);
      setWizardStep(4);
    }
  };

  const handleStagePrev = () => {
    if (activeStageIndex > 0) {
      const prevIdx = activeStageIndex - 1;
      setActiveStageIndex(prevIdx);
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
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 flex items-center justify-between gap-4">
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

                {/* Stops Manager List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Sequential Corridor Stops ({stops.length})
                    </span>
                    <span className="text-xs text-slate-500">Reorder with arrows or delete</span>
                  </div>

                  <div className="space-y-2.5">
                    {stops.map((stop, idx) => {
                      const isOrigin = idx === 0;
                      const isDestination = idx === stops.length - 1;
                      const isFatigued = stop.distanceMilesFromPrev > 260; // > 4.5 hours drive

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
                            {/* Lodging Action */}
                            <button
                              type="button"
                              onClick={() => handleOpenBookingModal(idx)}
                              className={`text-[11px] font-black px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                                stop.selectedLodging?.name 
                                  ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200" 
                                  : "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200"
                              }`}
                              title={stop.selectedLodging?.name ? "Update lodging reservation details" : "Find lodging options and save reservation"}
                            >
                              <Hotel className={`w-3.5 h-3.5 ${stop.selectedLodging?.name ? "text-emerald-600" : "text-amber-600"}`} />
                              <span className="truncate max-w-[140px] sm:max-w-[200px]">
                                {stop.selectedLodging?.name ? `Confirmed: ${stop.selectedLodging.name}` : "Find Lodging"}
                              </span>
                              {stop.selectedLodging?.name && <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />}
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
                const availableVenues = cityVenuesMap[`${currentStop.city}_${currentStop.state}`] || cityVenuesMap[currentStop.city] || [];
                const isCustomMode = customVenueMode[currentStop.id];

                return (
                  <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8">
                    
                    {/* City Stepper Pill Navigation */}
                    <div className="space-y-3 pb-6 border-b border-slate-100">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-xs font-black uppercase tracking-wider text-indigo-600">
                            Step 3 • Choose Stages &amp; Performance Venues
                          </span>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                            Stop {activeStageIndex + 1} of {stops.length}: {currentStop.city}, {currentStop.state}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleStagePrev}
                            disabled={activeStageIndex === 0}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Previous City</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleStageNext}
                            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1 cursor-pointer"
                          >
                            <span>{activeStageIndex === stops.length - 1 ? "Proceed to Lodging (Step 4)" : "Next City"}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Horizontal City Tabs */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2">
                        {stops.map((s, idx) => {
                          const isDone = Boolean(s.selectedVenue);
                          const isActive = idx === activeStageIndex;

                          return (
                            <button
                              key={s.id || idx}
                              type="button"
                              onClick={() => {
                                setActiveStageIndex(idx);
                                loadVenuesForStageCity(s.city, s.state);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer transition-all ${
                                isActive 
                                   ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-black" 
                                  : isDone
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              }`}
                            >
                              <span>{idx + 1}. {s.city}</span>
                              {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section 1: Venue Selection from public.venues */}
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                            <Building className="w-4 h-4 text-indigo-600" />
                            <span>Select Performance Stage in {currentStop.city}</span>
                          </h4>
                          <p className="text-xs text-slate-500">
                            Loaded from public.venues and local verified room directories.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setCustomVenueMode(prev => ({ ...prev, [currentStop.id]: !isCustomMode }))}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer self-start sm:self-auto"
                        >
                          {isCustomMode ? "← Choose from Directory" : "+ Enter Custom / Unlisted Venue"}
                        </button>
                      </div>

                      {/* Custom Venue Input Form */}
                      {isCustomMode ? (
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                          <span className="text-xs font-black uppercase text-slate-700 block">
                            Custom Venue / Independent Space Details
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Venue Name *"
                              value={currentStop.selectedVenue?.name || ""}
                              onChange={(e) => handleUpdateSchedule(activeStageIndex, "name", e.target.value)}
                              className="p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                            />
                            <input
                              type="text"
                              placeholder="Street Address"
                              value={currentStop.selectedVenue?.address || ""}
                              onChange={(e) => handleUpdateSchedule(activeStageIndex, "address", e.target.value)}
                              className="p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                            />
                            <input
                              type="text"
                              placeholder="Contact Booking Email"
                              value={currentStop.selectedVenue?.contactEmail || ""}
                              onChange={(e) => handleUpdateSchedule(activeStageIndex, "contactEmail", e.target.value)}
                              className="p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                            />
                            <input
                              type="text"
                              placeholder="Capacity (e.g. 150)"
                              value={currentStop.selectedVenue?.capacity || ""}
                              onChange={(e) => handleUpdateSchedule(activeStageIndex, "capacity", e.target.value)}
                              className="p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      ) : (
                        /* Directory Venues List */
                        <div className="space-y-3">
                          {isLoadingVenues ? (
                            <div className="p-8 text-center text-xs text-slate-400">
                              Querying verified stages in {currentStop.city}...
                            </div>
                          ) : availableVenues.length === 0 ? (
                            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                              <span className="text-xs text-slate-600 block font-bold">
                                No pre-seeded directory venues found for {currentStop.city}.
                              </span>
                              <button
                                type="button"
                                onClick={() => setCustomVenueMode(prev => ({ ...prev, [currentStop.id]: true }))}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold cursor-pointer"
                              >
                                Enter Custom Venue Name
                              </button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {availableVenues.map((v) => {
                                const isSelected = currentStop.selectedVenue?.name === v.name;

                                return (
                                  <div
                                    key={v.id}
                                    onClick={() => handleSelectVenueForStop(activeStageIndex, v)}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
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
                                            Lighting
                                          </span>
                                        )}
                                        {v.genres?.slice(0, 2).map((g) => (
                                          <span key={g} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                            {g}
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="pt-2 flex items-center justify-between text-xs font-black">
                                      <span className={isSelected ? "text-indigo-700" : "text-slate-500"}>
                                        {isSelected ? "✓ Selected Stage" : "Click to Select"}
                                      </span>
                                      {v.contactEmail && (
                                        <span className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
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

                    {/* Section 2: Show Schedule Times */}
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

                    {/* Section 3: Custom City / Stage Notes */}
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
                            Previous City Stage
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
                              ? "Proceed to Book Hotels & Lodging (Step 4) →" 
                              : "Next City Stage →"}
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
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <ExternalLink className="w-4 h-4 text-emerald-600" />
                        <span>Book with Direct Providers for {currentStop.city}</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        {/* Hotels.com */}
                        <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all flex flex-col justify-between space-y-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-slate-900 text-sm">Hotels.com</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Low Rates</span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Pre-filtered with check-in on {formattedCheckIn} &amp; checkout on {formattedCheckOut}.
                            </p>
                          </div>
                          <a
                            href={hotelsDotComUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs hover:shadow-emerald-600/20 transition-all cursor-pointer"
                          >
                            <span>Book on Hotels.com ↗</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        {/* Booking.com */}
                        <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all flex flex-col justify-between space-y-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-slate-900 text-sm">Booking.com</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">Free Parking</span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Auto-filtered for on-site parking to safeguard tour vans and equipment trailers.
                            </p>
                          </div>
                          <a
                            href={bookingDotComUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs hover:shadow-emerald-600/20 transition-all cursor-pointer"
                          >
                            <span>Book on Booking.com ↗</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        {/* Google Hotels */}
                        <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all flex flex-col justify-between space-y-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-slate-900 text-sm">Google Hotels</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">Van &amp; Trailer</span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Satellite map views of motel lots, outdoor van parking, and exterior room access.
                            </p>
                          </div>
                          <a
                            href={googleHotelsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs hover:shadow-emerald-600/20 transition-all cursor-pointer"
                          >
                            <span>Book on Google Hotels ↗</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Vetted Band-Friendly Hotels for this Stop */}
                    {currentStop.lodgingOptions && currentStop.lodgingOptions.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Recommended Band Motels in {currentStop.city}</span>
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {currentStop.lodgingOptions.map((opt, i) => {
                            const nightlyRate = parseNightlyRate(opt.estPricePerNight);
                            const totalCost = calculateStayCost(nightlyRate, 1);
                            const fullCity = currentStop.state ? `${currentStop.city}, ${currentStop.state}` : currentStop.city;
                            const nameLower = opt.name.toLowerCase();
                            let providerUrl = opt.bookingSearchUrl || `https://www.google.com/travel/hotels/${encodeURIComponent(currentStop.city)}?q=${encodeURIComponent(`${opt.name} ${fullCity}`)}&dates=${checkIn},${checkOut}`;
                            if (nameLower.includes("motel 6")) {
                              providerUrl = `https://www.motel6.com/en/home/reservations.html#/search?destination=${encodeURIComponent(currentStop.city)}&checkin=${checkIn}&checkout=${checkOut}`;
                            } else if (nameLower.includes("red roof")) {
                              providerUrl = `https://www.redroof.com/search?q=${encodeURIComponent(fullCity)}&checkin=${checkIn}&checkout=${checkOut}`;
                            } else if (nameLower.includes("best western")) {
                              providerUrl = `https://www.bestwestern.com/en_US/book/hotels-in-${encodeURIComponent(currentStop.city.toLowerCase().replace(/\s+/g, "-"))}.html?destination=${encodeURIComponent(fullCity)}&checkIn=${checkIn}&checkOut=${checkOut}`;
                            } else if (nameLower.includes("super 8") || nameLower.includes("wyndham")) {
                              providerUrl = `https://www.wyndhamhotels.com/super-8?destination=${encodeURIComponent(fullCity)}&checkin_date=${checkIn}&checkout_date=${checkOut}`;
                            } else if (opt.bookingSearchUrl && opt.bookingSearchUrl.startsWith("http")) {
                              if (opt.bookingSearchUrl.includes("google.com/travel/hotels") && !opt.bookingSearchUrl.includes("dates=")) {
                                providerUrl = `${opt.bookingSearchUrl}?dates=${checkIn},${checkOut}`;
                              }
                            }
                            const providerName = opt.name.includes("Motel 6") ? "Motel 6" : opt.name.includes("Best Western") ? "Best Western" : opt.name.includes("Red Roof") ? "Red Roof Inn" : opt.name.includes("Super 8") ? "Super 8" : opt.name.includes("Hotel Leo") ? "Hotel Leo" : opt.name.includes("Belltown") ? "The Belltown Inn" : opt.name;

                            return (
                              <div
                                key={opt.name || i}
                                className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs flex flex-col justify-between space-y-3"
                              >
                                <div className="space-y-1.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <h5 className="font-black text-slate-900 text-sm">{opt.name}</h5>
                                      <span className="text-xs text-slate-500">{opt.type} • {opt.address || currentStop.city}</span>
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
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSelectLodgingForStop(activeLodgingIndex, opt)}
                                    className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                                  >
                                    Fill details below ↓
                                  </button>

                                  <a
                                    href={providerUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1 shadow-xs hover:shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
                                  >
                                    <span>Book on {providerName} ↗</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
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
                            Hotel Name *
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
                            Confirmed Reservation # *
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
                            Cost ($) *
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
                      onClick={() => setShowPrintModal(true)}
                      className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-black flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
                      id="btn-open-print-modal"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Itinerary Sheet</span>
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
                          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                            <span className="text-[10px] font-black uppercase text-indigo-700 block">
                              🏢 Confirmed Stage &amp; Venue
                            </span>
                            <div className="font-black text-slate-900 text-sm">
                              {stop.selectedVenue?.name || "Pending Stage Confirmation"}
                            </div>
                            {stop.selectedVenue?.address && (
                              <div className="text-slate-500">{stop.selectedVenue.address}</div>
                            )}
                            <div className="text-[11px] text-slate-600 pt-1 flex flex-wrap gap-2">
                              <span>Load-in: <strong>{stop.selectedVenue?.loadInTime || "5:00 PM"}</strong></span>
                              <span>Soundcheck: <strong>{stop.selectedVenue?.soundcheckTime || "6:30 PM"}</strong></span>
                              <span>Set: <strong>{stop.selectedVenue?.setTime || "9:00 PM"}</strong></span>
                            </div>
                            
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

                          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                            <span className="text-[10px] font-black uppercase text-slate-700 block">
                              🛏️ Lodging &amp; Van Security
                            </span>
                            <div className="font-black text-slate-900">
                              {stop.selectedLodging?.name || "Band-friendly accommodations"}
                            </div>
                            {stop.selectedLodging?.confirmationNumber && (
                              <div className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded inline-block">
                                Confirmation #: {stop.selectedLodging.confirmationNumber}
                              </div>
                            )}
                            <div className="text-[11px] text-slate-600">
                              Est. Cost: <strong>${parseNightlyRate(stop.selectedLodging?.cost || 85).toLocaleString()}/night</strong>
                            </div>
                            {(stop.selectedLodging?.notes || stop.selectedLodging?.gearSecurityNote || stop.lodgingNotes) && (
                              <div className="text-[11px] text-slate-500 italic">
                                🔒 {stop.selectedLodging?.notes || stop.selectedLodging?.gearSecurityNote || stop.lodgingNotes}
                              </div>
                            )}

                            {/* Lodging Link and Confirmed Badge */}
                            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => handleOpenBookingModal(i)}
                                className="text-[11px] font-black text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Hotel className="w-3.5 h-3.5 text-amber-600" />
                                <span>{stop.selectedLodging?.name ? "Update Lodging →" : "Find Lodging →"}</span>
                              </button>

                              {stop.selectedLodging?.name && (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  <span>Booked &amp; Confirmed</span>
                                </span>
                              )}
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
