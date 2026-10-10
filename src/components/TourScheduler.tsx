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
  saveTourToDatabase, 
  fetchUserTours, 
  deleteTourFromDatabase, 
  fetchVenuesFromDatabaseForCity,
  SavedTourRecord
} from "../lib/supabase";
import { TourPrintModal } from "./TourPrintModal";
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
  Search,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  Save,
  ArrowLeftRight,
  Eye,
  Sliders
} from "lucide-react";

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

  // Step 3 City-by-City stage navigation
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [cityVenuesMap, setCityVenuesMap] = useState<Record<string, Venue[]>>({});
  const [isLoadingVenues, setIsLoadingVenues] = useState(false);
  const [customVenueMode, setCustomVenueMode] = useState<Record<string, boolean>>({});

  // UI helpers & Feedback
  const [saveToast, setSaveToast] = useState<{ show: boolean; message: string; type: "success" | "info" }>({
    show: false,
    message: "",
    type: "success"
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // New waypoint input in Step 2
  const [newWaypointInput, setNewWaypointInput] = useState("");

  const effectiveUserId = currentUser?.id || currentAccount?.id || null;

  // Android back-swipe / back button listener: close print modal or step back in wizard
  useEffect(() => {
    const handleBackButton = (e: Event) => {
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
    setStops(res.stops);
    setTotalDistanceMiles(res.totalDistanceMiles);
    setTotalDriveTime(res.totalDriveTime);
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
    loadVenuesForStageCity(stops[0].city);
  };

  // Loads venues for a specific city
  const loadVenuesForStageCity = async (cityName: string) => {
    if (cityVenuesMap[cityName]) return;
    setIsLoadingVenues(true);
    try {
      // 1. Query Supabase public.venues
      const remoteVenues = await fetchVenuesFromDatabaseForCity(cityName);
      
      // 2. Query local curated MUSIC_VENUES & localStorage custom_venues_v1
      const localCustom: Venue[] = (() => {
        try {
          return JSON.parse(localStorage.getItem("custom_venues_v1") || "[]");
        } catch { return []; }
      })();
      const allLocal = [...MUSIC_VENUES, ...localCustom];
      const matchedLocal = allLocal.filter(v => 
        v.city.toLowerCase().includes(cityName.toLowerCase()) || 
        cityName.toLowerCase().includes(v.city.toLowerCase())
      );

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

      setCityVenuesMap(prev => ({ ...prev, [cityName]: merged }));
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
          cost: lodging.estPricePerNight ? parseFloat(lodging.estPricePerNight.replace(/[^0-9.]/g, "")) : 95,
          gearSecurityNote: lodging.gearSecurityNote,
          bookingUrl: lodging.bookingSearchUrl
        };
      }
      return copy;
    });
  };

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
      loadVenuesForStageCity(stops[nextIdx].city);
    } else {
      // Finished all cities -> proceed to Step 4
      setWizardStep(4);
    }
  };

  const handleStagePrev = () => {
    if (activeStageIndex > 0) {
      const prevIdx = activeStageIndex - 1;
      setActiveStageIndex(prevIdx);
      loadVenuesForStageCity(stops[prevIdx].city);
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
      currentStep: markConfirmed ? 4 : wizardStep,
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
      const targetStep = record.status === "confirmed" ? 4 : (rd.currentStep || 2);
      setWizardStep(targetStep);
      setActiveStageIndex(0);
      if (rd.stops && rd.stops[0]) {
        loadVenuesForStageCity(rd.stops[0].city);
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
        <div className="space-y-6 animate-in fade-in duration-300" id="tour-wizard-view">
          
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
                  <span className="text-xs text-slate-400">• Step {wizardStep} of 4</span>
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
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
              <div className="text-xs font-black truncate">Route Setup</div>
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
              <div className="text-xs font-black truncate">Corridor Optimizer</div>
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
              <div className="text-xs font-black truncate">Stages &amp; Lodging</div>
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
              <div className="text-xs font-black truncate">Review &amp; Finalize</div>
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
                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
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
                const availableVenues = cityVenuesMap[currentStop.city] || [];
                const isCustomMode = customVenueMode[currentStop.id];

                return (
                  <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8">
                    
                    {/* City Stepper Pill Navigation */}
                    <div className="space-y-3 pb-6 border-b border-slate-100">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-xs font-black uppercase tracking-wider text-indigo-600">
                            Step 3 • City-by-City Venue &amp; Budget Setup
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
                            <span>{activeStageIndex === stops.length - 1 ? "Finish to Review" : "Next City"}</span>
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
                                loadVenuesForStageCity(s.city);
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

                    {/* Section 3: Lodging & Crash Pad */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Hotel className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Band Lodging &amp; Secure Parking in {currentStop.city}</span>
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {currentStop.lodgingOptions?.slice(0, 2).map((opt, i) => {
                          const isLodgingSelected = currentStop.selectedLodging?.name === opt.name;

                          return (
                            <div
                              key={opt.name || i}
                              onClick={() => handleSelectLodgingForStop(activeStageIndex, opt)}
                              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                                isLodgingSelected 
                                  ? "bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-600/30" 
                                  : "bg-white border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-black text-slate-900 text-xs">{opt.name}</div>
                                  <div className="text-[11px] text-slate-500">{opt.type}</div>
                                </div>
                                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                  {opt.estPricePerNight || "$85/nt"}
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg">
                                🔒 {opt.gearSecurityNote}
                              </div>

                              <div className="text-[11px] font-black text-indigo-600 pt-1">
                                {isLodgingSelected ? "✓ Lodging Assigned" : "Assign to Tour"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section 4: Custom City / Stage Notes */}
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
                          ← Back to Corridor
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
                            Previous City
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
                              ? "Review & Finalize Tour (Step 4) →" 
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
          {/* STEP 4: REVIEW, INTERACTIVE MAP & FINALIZATION                        */}
          {/* --------------------------------------------------------------------- */}
          {wizardStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200" id="tour-step-4-review">
              
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
                            <div className="text-[11px] text-slate-600">
                              Est. Cost: <strong>${stop.selectedLodging?.cost || 85}/night</strong>
                            </div>
                            <div className="text-[11px] text-slate-500 italic">
                              🔒 {stop.selectedLodging?.gearSecurityNote || stop.lodgingNotes}
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

                {/* Step 4 Navigation Controls */}
                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setWizardStep(3)}
                      className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black cursor-pointer"
                    >
                      ← Back to Stage Setup
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

    </div>
  );
};

export default TourScheduler;
