import React, { useState, useEffect } from "react";
import { 
  TourPlan, 
  TourStop, 
  TourVenueStop, 
  TourLodgingOption, 
  TourSelectedVenue, 
  TourSelectedLodging,
  BandProfile,
  Venue
} from "../types";
import { MUSIC_VENUES } from "../data/venues";
import { findLodgingForCity } from "../utils/tourLodgingData";
import { 
  generateFallbackPlan, 
  buildDynamicGoogleMapsUrl, 
  calculateTourFinancials, 
  formatPersonalizedItineraryText 
} from "../utils/tourRouteHelpers";
import { TourPrintModal, TOUR_PLANNER_DISCLAIMER } from "./TourPrintModal";
import { TourDisclaimerModal } from "./TourDisclaimerModal";
import { ItineraryValidationModal, ItineraryIssue } from "./ItineraryValidationModal";
import { VenuePickerModal } from "./VenuePickerModal";
import { LodgingPickerModal } from "./LodgingPickerModal";
import { EditStopModal } from "./EditStopModal";
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
  ShieldCheck, 
  Share2, 
  Printer, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Edit3, 
  Sparkles, 
  ExternalLink, 
  AlertCircle, 
  AlertTriangle,
  Layers, 
  ChevronRight, 
  Info, 
  CheckCircle2, 
  Music,
  FileText,
  Download
} from "lucide-react";

interface TourSchedulerProps {
  bandProfile?: BandProfile;
  onSelectVenueForPoster?: (venueName: string, city: string) => void;
  onNavigateToBooking?: (venueName: string) => void;
}

export const TourScheduler: React.FC<TourSchedulerProps> = ({
  bandProfile,
  onSelectVenueForPoster,
  onNavigateToBooking
}) => {
  // Input form state
  const [startingCity, setStartingCity] = useState("Bellingham, WA");
  const [intermediateDestinations, setIntermediateDestinations] = useState<string[]>([]);
  const [destinationCity, setDestinationCity] = useState("Medford, OR");
  const [tourTitle, setTourTitle] = useState(bandProfile?.name ? `${bandProfile.name} Northwest Run` : "West Coast Club Tour");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [tourPace, setTourPace] = useState("Standard club route (2-4 hr drive legs)");
  const [lodgingPref, setLodgingPref] = useState("Band-friendly hotels & motels with secure parking");
  
  // App state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [tourPlan, setTourPlan] = useState<TourPlan | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [viewMode, setViewMode] = useState<"personalized" | "explorer">("personalized");
  const [activeStopIndex, setActiveStopIndex] = useState<number | null>(0);

  // Modals
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(true);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationIssues, setValidationIssues] = useState<ItineraryIssue[]>([]);
  const [editingStopIndex, setEditingStopIndex] = useState<number | null>(null);
  const [selectingVenueStopIndex, setSelectingVenueStopIndex] = useState<number | null>(null);
  const [selectingLodgingStopIndex, setSelectingLodgingStopIndex] = useState<number | null>(null);
  const [inlineScheduleEditIndex, setInlineScheduleEditIndex] = useState<number | null>(null);

  // Load saved itinerary from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("giglizard_active_tour_plan_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.stops && parsed.stops.length > 0) {
          setTourPlan(parsed);
          if (parsed.startingCity) setStartingCity(parsed.startingCity);
          if (parsed.destinationCity) setDestinationCity(parsed.destinationCity);
          if (parsed.intermediateDestinations) setIntermediateDestinations(parsed.intermediateDestinations);
          if (parsed.tourTitle) setTourTitle(parsed.tourTitle);
          return;
        }
      } catch (e) {
        console.error("Could not parse saved tour plan", e);
      }
    }

    // Default plan
    const initialPlan = generateFallbackPlan("Bellingham, WA", "Medford, OR", []);
    setTourPlan(initialPlan);
  }, []);

  // Helper to query available venues for a given city
  const getCityAvailableVenues = (cityName: string): Venue[] => {
    const customVenues: Venue[] = (() => {
      const saved = localStorage.getItem("custom_venues_v1");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { return []; }
      }
      return [];
    })();
    const allVenues = [...MUSIC_VENUES, ...customVenues];
    const q = cityName.toLowerCase().trim();
    const matches = allVenues.filter(v => 
      v.city.toLowerCase().includes(q) || q.includes(v.city.toLowerCase())
    );
    return matches;
  };

  // Helper to query available lodging options for a given city
  const getCityAvailableLodging = (cityName: string, stateName: string): TourLodgingOption[] => {
    return findLodgingForCity(cityName, stateName);
  };

  // Save tour plan to local storage when modified
  const updateTourPlanState = (newPlan: TourPlan) => {
    // Recalculate dynamic Google Maps URL
    newPlan.googleMapsDirectionsUrl = buildDynamicGoogleMapsUrl(newPlan.stops);
    newPlan.totalDistanceMiles = newPlan.stops.reduce((acc, s) => acc + (s.distanceMilesFromPrev || 0), 0);
    
    setTourPlan(newPlan);
    try {
      localStorage.setItem("giglizard_active_tour_plan_v2", JSON.stringify(newPlan));
    } catch (e) {
      console.warn("Unable to persist tour plan to localStorage", e);
    }
  };

  // Validation function: scans stops for missing information
  const checkItineraryCompleteness = (): ItineraryIssue[] => {
    if (!tourPlan) return [];
    const issues: ItineraryIssue[] = [];

    tourPlan.stops.forEach((stop, idx) => {
      if (!stop.selectedVenue) {
        issues.push({
          stopIndex: idx,
          stop,
          type: "missing_venue",
          title: `Stop ${stop.dayNumber || idx + 1}: ${stop.city} - Missing Venue`,
          description: `No performance venue selected for ${stop.city}, ${stop.state}.`
        });
      }
      if (!stop.selectedLodging) {
        issues.push({
          stopIndex: idx,
          stop,
          type: "missing_lodging",
          title: `Stop ${stop.dayNumber || idx + 1}: ${stop.city} - Missing Lodging`,
          description: `No hotel, motel, or band accommodation selected for ${stop.city}.`
        });
      }
      if (!stop.date) {
        issues.push({
          stopIndex: idx,
          stop,
          type: "missing_date",
          title: `Stop ${stop.dayNumber || idx + 1}: ${stop.city} - Missing Tour Date`,
          description: `No date is assigned to this tour date.`
        });
      }
    });

    return issues;
  };

  // Initiates print / export workflow with pre-flight check
  const handleInitiateExport = () => {
    const issues = checkItineraryCompleteness();
    if (issues.length > 0) {
      setValidationIssues(issues);
      setShowValidationModal(true);
    } else {
      setShowPrintModal(true);
    }
  };

  // Auto-fills all missing venues and lodging with top suggestions
  const handleAutoFillMissing = () => {
    if (!tourPlan) return;
    const updatedStops = tourPlan.stops.map(stop => {
      let venue = stop.selectedVenue;
      if (!venue) {
        const available = getCityAvailableVenues(stop.city);
        if (available.length > 0) {
          const top = available[0];
          venue = {
            name: top.name,
            address: top.address || `${stop.city}, ${stop.state}`,
            city: top.city,
            contactEmail: top.contactEmail,
            contactPhone: top.contactPhone,
            capacity: top.capacity,
            loadInTime: "5:00 PM",
            soundcheckTime: "6:30 PM",
            doorsTime: "7:30 PM",
            setTime: "9:00 PM - 10:30 PM"
          };
        } else if (stop.suggestedVenues && stop.suggestedVenues.length > 0) {
          const sug = stop.suggestedVenues[0];
          venue = {
            name: sug.name,
            address: sug.address || `${stop.city}, ${stop.state}`,
            city: stop.city,
            contactEmail: sug.contactEmail,
            contactPhone: sug.contactPhone,
            capacity: sug.capacity,
            loadInTime: "5:00 PM",
            soundcheckTime: "6:30 PM",
            doorsTime: "7:30 PM",
            setTime: "9:00 PM - 10:30 PM"
          };
        }
      }

      let lodging = stop.selectedLodging;
      if (!lodging) {
        const availableLodging = getCityAvailableLodging(stop.city, stop.state);
        if (availableLodging.length > 0) {
          const topLodge = availableLodging[0];
          lodging = {
            name: topLodge.name,
            type: topLodge.type,
            address: topLodge.address,
            cost: 95,
            gearSecurityNote: topLodge.gearSecurityNote
          };
        } else if (stop.lodgingOptions && stop.lodgingOptions.length > 0) {
          const topLodge = stop.lodgingOptions[0];
          lodging = {
            name: topLodge.name,
            type: topLodge.type,
            address: topLodge.address,
            cost: 95,
            gearSecurityNote: topLodge.gearSecurityNote
          };
        }
      }

      return {
        ...stop,
        selectedVenue: venue,
        selectedLodging: lodging
      };
    });

    updateTourPlanState({
      ...tourPlan,
      stops: updatedStops
    });
    setShowValidationModal(false);
    setShowPrintModal(true);
  };

  // Add intermediate destination to form
  const handleAddIntermediateInput = () => {
    if (intermediateDestinations.length >= 6) return;
    setIntermediateDestinations([...intermediateDestinations, ""]);
  };

  const handleUpdateIntermediateInput = (index: number, value: string) => {
    const updated = [...intermediateDestinations];
    updated[index] = value;
    setIntermediateDestinations(updated);
  };

  const handleRemoveIntermediateInput = (index: number) => {
    const updated = intermediateDestinations.filter((_, i) => i !== index);
    setIntermediateDestinations(updated);
  };

  // Preset Routes
  const handleApplyPreset = (
    presetTitle: string,
    start: string, 
    intermediates: string[], 
    dest: string
  ) => {
    setTourTitle(presetTitle);
    setStartingCity(start);
    setIntermediateDestinations(intermediates);
    setDestinationCity(dest);

    const generated = generateFallbackPlan(start, dest, intermediates);
    generated.tourTitle = presetTitle;
    generated.bandName = bandProfile?.name || "Touring Band";
    updateTourPlanState(generated);
  };

  // Calculate / Plan Tour via API or Fallback
  const handleCalculateTour = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!startingCity.trim() || !destinationCity.trim()) {
      setErrorMsg("Please enter both a starting city and destination city.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    const cleanedIntermediates = intermediateDestinations.filter(c => c.trim().length > 0);

    try {
      const response = await fetch("/api/plan-tour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startingCity: startingCity.trim(),
          destinationCity: destinationCity.trim(),
          intermediateDestinations: cleanedIntermediates,
          bandProfile,
          tourPace,
          existingVenues: MUSIC_VENUES.slice(0, 30)
        })
      });

      if (!response.ok) {
        throw new Error("Failed to calculate AI tour routing");
      }

      const plan: TourPlan = await response.json();
      
      // Auto assign dates starting from startDate
      if (startDate) {
        const startD = new Date(startDate);
        plan.stops.forEach((stop, i) => {
          const d = new Date(startD);
          d.setDate(startD.getDate() + i);
          stop.date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" });
        });
      }

      plan.tourTitle = tourTitle;
      plan.bandName = bandProfile?.name || "Touring Band";
      plan.intermediateDestinations = cleanedIntermediates;

      updateTourPlanState(plan);
      setActiveStopIndex(0);
    } catch (err: any) {
      console.warn("Using fallback local tour generator:", err.message);
      const fallback = generateFallbackPlan(startingCity.trim(), destinationCity.trim(), cleanedIntermediates);
      
      if (startDate) {
        const startD = new Date(startDate);
        fallback.stops.forEach((stop, i) => {
          const d = new Date(startD);
          d.setDate(startD.getDate() + i);
          stop.date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" });
        });
      }

      fallback.tourTitle = tourTitle;
      fallback.bandName = bandProfile?.name || "Touring Band";
      updateTourPlanState(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  // Copy Itinerary Text
  const handleCopyItinerary = () => {
    if (!tourPlan) return;
    const formatted = formatPersonalizedItineraryText(tourPlan, bandProfile?.name);
    navigator.clipboard.writeText(formatted);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Stop Reordering & Mutation
  const handleMoveStop = (index: number, direction: "up" | "down") => {
    if (!tourPlan) return;
    const newStops = [...tourPlan.stops];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newStops.length) return;

    const [moved] = newStops.splice(index, 1);
    newStops.splice(targetIdx, 0, moved);

    // Re-index day numbers
    newStops.forEach((s, idx) => {
      s.dayNumber = idx + 1;
    });

    updateTourPlanState({
      ...tourPlan,
      stops: newStops
    });
  };

  const handleDeleteStop = (index: number) => {
    if (!tourPlan || tourPlan.stops.length <= 1) return;
    const newStops = tourPlan.stops.filter((_, i) => i !== index);
    newStops.forEach((s, idx) => {
      s.dayNumber = idx + 1;
    });

    updateTourPlanState({
      ...tourPlan,
      stops: newStops
    });
  };

  const handleAddCustomStop = () => {
    if (!tourPlan) return;
    const nextDay = tourPlan.stops.length + 1;
    const newStop: TourStop = {
      id: `stop-custom-${Date.now()}`,
      stopName: `Stop ${nextDay}: New Tour City`,
      city: "Bend",
      state: "OR",
      dayNumber: nextDay,
      driveTimeFromPrev: "2 hrs 15 mins",
      distanceMilesFromPrev: 120,
      routeHighlight: "Highway drive to newly added tour stop.",
      localSceneNotes: "Supportive indie music venue hub.",
      estimatedGasCost: 35,
      lodgingNotes: "Band-friendly lodging available downtown.",
      lodgingOptions: findLodgingForCity("Bend", "OR"),
      suggestedVenues: [
        {
          name: "The Domino Room",
          city: "Bend",
          address: "51 NW Greenwood Ave, Bend, OR",
          capacity: 350,
          genres: ["Rock", "Indie", "Punk"],
          contactEmail: "booking@dominoroom.com",
          hasPA: true,
          hasLighting: true
        }
      ]
    };

    updateTourPlanState({
      ...tourPlan,
      stops: [...tourPlan.stops, newStop]
    });
    setEditingStopIndex(tourPlan.stops.length);
  };

  // Venue & Lodging Selection Handlers
  const handleSaveVenueSelection = (venue: TourSelectedVenue) => {
    if (!tourPlan || selectingVenueStopIndex === null) return;
    const updatedStops = [...tourPlan.stops];
    updatedStops[selectingVenueStopIndex] = {
      ...updatedStops[selectingVenueStopIndex],
      selectedVenue: venue
    };
    updateTourPlanState({
      ...tourPlan,
      stops: updatedStops
    });
    setSelectingVenueStopIndex(null);
  };

  const handleQuickSelectVenueForStop = (stopIndex: number, venue: Venue | TourVenueStop | { name: string; city?: string; address?: string; contactEmail?: string; contactPhone?: string; capacity?: number; genres?: string[]; hasPA?: boolean; hasLighting?: boolean }) => {
    if (!tourPlan) return;
    const updatedStops = [...tourPlan.stops];
    const targetStop = updatedStops[stopIndex];
    
    // Preserve existing custom schedule times if already set on this stop
    const existingVenue = targetStop.selectedVenue;
    const selectedVenueData: TourSelectedVenue = {
      name: venue.name,
      address: venue.address || `${targetStop.city}, ${targetStop.state}`,
      city: venue.city || targetStop.city,
      contactEmail: venue.contactEmail,
      contactPhone: venue.contactPhone,
      capacity: venue.capacity,
      loadInTime: existingVenue?.loadInTime || "5:00 PM",
      soundcheckTime: existingVenue?.soundcheckTime || "6:30 PM",
      doorsTime: existingVenue?.doorsTime || "7:30 PM",
      setTime: existingVenue?.setTime || "9:00 PM - 10:30 PM"
    };

    updatedStops[stopIndex] = {
      ...targetStop,
      selectedVenue: selectedVenueData
    };

    updateTourPlanState({
      ...tourPlan,
      stops: updatedStops
    });
  };

  const handleUpdateVenueScheduleField = (stopIndex: number, field: "loadInTime" | "soundcheckTime" | "doorsTime" | "setTime", value: string) => {
    if (!tourPlan) return;
    const updatedStops = [...tourPlan.stops];
    const targetStop = updatedStops[stopIndex];
    if (!targetStop.selectedVenue) return;

    updatedStops[stopIndex] = {
      ...targetStop,
      selectedVenue: {
        ...targetStop.selectedVenue,
        [field]: value
      }
    };

    updateTourPlanState({
      ...tourPlan,
      stops: updatedStops
    });
  };

  const handleClearVenueSelection = (stopIndex: number) => {
    if (!tourPlan) return;
    const updatedStops = [...tourPlan.stops];
    updatedStops[stopIndex] = {
      ...updatedStops[stopIndex],
      selectedVenue: undefined
    };
    updateTourPlanState({
      ...tourPlan,
      stops: updatedStops
    });
  };

  const handleSaveLodgingSelection = (lodging: TourSelectedLodging) => {
    if (!tourPlan || selectingLodgingStopIndex === null) return;
    const updatedStops = [...tourPlan.stops];
    updatedStops[selectingLodgingStopIndex] = {
      ...updatedStops[selectingLodgingStopIndex],
      selectedLodging: lodging
    };
    updateTourPlanState({
      ...tourPlan,
      stops: updatedStops
    });
    setSelectingLodgingStopIndex(null);
  };

  const handleQuickSelectLodgingForStop = (stopIndex: number, option: TourLodgingOption) => {
    if (!tourPlan) return;
    const updatedStops = [...tourPlan.stops];
    const targetStop = updatedStops[stopIndex];
    
    const costMatch = option.estPricePerNight.match(/\d+/);
    const parsedCost = costMatch ? parseInt(costMatch[0], 10) : 95;

    const selectedLodgingData: TourSelectedLodging = {
      name: option.name,
      type: option.type,
      address: option.address || `${targetStop.city}, ${targetStop.state}`,
      cost: parsedCost,
      gearSecurityNote: option.gearSecurityNote
    };

    updatedStops[stopIndex] = {
      ...targetStop,
      selectedLodging: selectedLodgingData
    };

    updateTourPlanState({
      ...tourPlan,
      stops: updatedStops
    });
  };

  const handleClearLodgingSelection = (stopIndex: number) => {
    if (!tourPlan) return;
    const updatedStops = [...tourPlan.stops];
    updatedStops[stopIndex] = {
      ...updatedStops[stopIndex],
      selectedLodging: undefined
    };
    updateTourPlanState({
      ...tourPlan,
      stops: updatedStops
    });
  };

  const handleSaveStopDetails = (updated: Partial<TourStop>) => {
    if (!tourPlan || editingStopIndex === null) return;
    const updatedStops = [...tourPlan.stops];
    updatedStops[editingStopIndex] = {
      ...updatedStops[editingStopIndex],
      ...updated
    };
    updateTourPlanState({
      ...tourPlan,
      stops: updatedStops
    });
    setEditingStopIndex(null);
  };

  // Financial calculations
  const financials = tourPlan ? calculateTourFinancials(tourPlan.stops) : null;
  const currentGoogleMapsUrl = tourPlan ? buildDynamicGoogleMapsUrl(tourPlan.stops) : "";

  return (
    <div className="space-y-6 max-w-7xl mx-auto" id="tour-scheduler-container">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-extrabold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" />
              <span>Multi-Destination Tour Router &amp; Run-of-Show</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Smart Tour &amp; Itinerary Planner</span>
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Plan multi-city runs, browse and select available stages and secure van lodging in each city, customize load-in times, set schedules, and tech notes, and export complete printable tour sheets.
            </p>
          </div>

          {/* Quick Route Presets */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 shrink-0 max-w-md w-full">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-300 block mb-2">
              Popular Tour Route Presets (1-Click)
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyPreset(
                  "Pacific Northwest 6-Day Run",
                  "Bellingham, WA", 
                  ["Seattle, WA", "Tacoma, WA", "Portland, OR", "Eugene, OR"], 
                  "Medford, OR"
                )}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                🌲 PNW 6-Stop Corridor
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(
                  "Cascadia Highway Run",
                  "Vancouver, BC", 
                  ["Bellingham, WA", "Seattle, WA"], 
                  "Portland, OR"
                )}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                🍁 Cascadia Run
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(
                  "California Coast Showcase",
                  "San Francisco, CA", 
                  ["Santa Cruz, CA", "Santa Barbara, CA", "Los Angeles, CA"], 
                  "San Diego, CA"
                )}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                🌊 CA Coastline Run
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Disclaimer Banner */}
      <div 
        className="bg-amber-50 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
        id="tour-planner-disclaimer-banner"
      >
        <div className="flex items-start gap-3.5">
          <div className="p-2 bg-amber-200/60 rounded-xl shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-amber-800" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-900">
                Booking Policy &amp; Notice
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-amber-950 leading-snug">
              &ldquo;{TOUR_PLANNER_DISCLAIMER}&rdquo;
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowDisclaimerModal(true)}
          className="px-3.5 py-1.5 bg-amber-200/80 hover:bg-amber-200 text-amber-950 text-xs font-black rounded-xl shrink-0 transition-colors cursor-pointer"
        >
          View Full Policy
        </button>
      </div>

      {/* Form Section: Multi-Destination Route Builder */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        <form onSubmit={handleCalculateTour} className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-slate-900 text-base">
                Tour Route &amp; Stop Configuration
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Step 1: Set cities &bull; Step 2: Select venues &amp; lodging
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tour Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Tour Title / Run Name
              </label>
              <input
                type="text"
                value={tourTitle}
                onChange={(e) => setTourTitle(e.target.value)}
                placeholder="e.g. Pacific Northwest Album Release Tour"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Kickoff Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Tour Kickoff Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* City Corridor Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {/* Starting City */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-indigo-700 mb-1">
                📍 Origin / Starting City
              </label>
              <input
                type="text"
                value={startingCity}
                onChange={(e) => setStartingCity(e.target.value)}
                placeholder="e.g. Bellingham, WA"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Intermediate stops list */}
            {intermediateDestinations.map((city, idx) => (
              <div key={idx} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                    🛣️ Intermediate Stop #{idx + 1}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRemoveIntermediateInput(idx)}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-800"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => handleUpdateIntermediateInput(idx, e.target.value)}
                  placeholder="e.g. Seattle, WA or Portland, OR"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ))}

            {/* Destination City */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-emerald-700 mb-1">
                🏁 Final Tour Destination
              </label>
              <input
                type="text"
                value={destinationCity}
                onChange={(e) => setDestinationCity(e.target.value)}
                placeholder="e.g. Medford, OR or San Diego, CA"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handleAddIntermediateInput}
              disabled={intermediateDestinations.length >= 6}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Mid-Tour City (+ Stop)</span>
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoading ? "Generating Route..." : "Calculate & Update Route"}</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </form>
      </div>

      {/* Main Tour Itinerary Dashboard */}
      {tourPlan && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Top Control Bar & Financial Summary */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">
                    {tourPlan.tourTitle || "Active Tour Itinerary"}
                  </h3>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                    {tourPlan.stops.length} Tour Dates
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Route: {tourPlan.startingCity} → {tourPlan.destinationCity} &bull; Total Driving: {tourPlan.totalDistanceMiles} miles ({tourPlan.totalDriveTime})
                </p>
              </div>

              {/* Action Buttons: Export / Print, Add Stop, Maps */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddCustomStop}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-600" />
                  <span>Add Stop</span>
                </button>

                <button
                  type="button"
                  onClick={handleInitiateExport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-sm transition-all cursor-pointer"
                  id="open-export-print-btn"
                >
                  <Printer className="w-4 h-4" />
                  <span>Export / Print Sheet</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyItinerary}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    copiedLink 
                      ? "bg-emerald-600 text-white" 
                      : "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                  }`}
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? "Copied!" : "Copy Text"}</span>
                </button>

                <a
                  href={currentGoogleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>GPS Route</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>
            </div>

            {/* Financial & Metric Scorecard */}
            {financials && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Total Mileage</span>
                  <span className="text-sm font-black text-slate-900">{tourPlan.totalDistanceMiles} mi</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Est. Fuel Cost</span>
                  <span className="text-sm font-black text-slate-900">${financials.totalGas}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Lodging Budget</span>
                  <span className="text-sm font-black text-slate-900">${financials.totalLodgingCost}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Est. Travel Costs</span>
                  <span className="text-sm font-black text-slate-900">${financials.totalExpenses}</span>
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-xl text-center">
                  <span className="font-bold block text-[10px] uppercase">Confirmed Stages</span>
                  <span className="text-sm font-black">
                    {financials.confirmedVenuesCount} / {tourPlan.stops.length}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Stop-by-Stop Tour List with Per-City Venues & Lodging */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Music className="w-4 h-4 text-indigo-600" />
                <span>Tour Stops: Venues &amp; Lodging by City ({tourPlan.stops.length})</span>
              </h3>
              <button
                type="button"
                onClick={handleInitiateExport}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline flex items-center gap-1 cursor-pointer"
              >
                <span>Check Completeness &amp; Print</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {tourPlan.stops.map((stop, index) => {
              const isFirst = index === 0;
              const isLast = index === tourPlan.stops.length - 1;
              const cityVenues = getCityAvailableVenues(stop.city);
              const cityLodging = getCityAvailableLodging(stop.city, stop.state);

              return (
                <div
                  key={stop.id || index}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-slate-300"
                  id={`tour-stop-card-${index}`}
                >
                  {/* Stop Header Banner */}
                  <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-sm text-white shadow-sm shrink-0">
                        {stop.dayNumber || index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-base sm:text-lg text-white">
                            {stop.city}, {stop.state}
                          </h4>
                          <span className="text-xs text-indigo-300 font-semibold">
                            {stop.stopName}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-0.5">
                          {stop.date && (
                            <span className="text-indigo-200 font-bold flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{stop.date}</span>
                            </span>
                          )}
                          <span>
                            Leg: {stop.distanceMilesFromPrev > 0 ? `${stop.distanceMilesFromPrev} mi` : "Start point"} ({stop.driveTimeFromPrev})
                          </span>
                          <span>Fuel: ${stop.estimatedGasCost || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Controls: Reorder, Edit, Delete */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleMoveStop(index, "up")}
                        disabled={isFirst}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                        title="Move Stop Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveStop(index, "down")}
                        disabled={isLast}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                        title="Move Stop Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingStopIndex(index)}
                        className="p-1.5 text-slate-400 hover:text-indigo-300 rounded-lg hover:bg-slate-800 cursor-pointer"
                        title="Edit Stop Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {tourPlan.stops.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteStop(index)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 cursor-pointer"
                          title="Delete Stop"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stop Body */}
                  <div className="p-4 sm:p-6 space-y-5">
                    
                    {/* Highway Corridor note */}
                    <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-start gap-2">
                      <Compass className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Driving Corridor:</strong> {stop.routeHighlight} &bull; <span className="text-slate-500">{stop.localSceneNotes}</span>
                      </div>
                    </div>

                    {/* VENUES IN THIS CITY SECTION */}
                    <div className="border border-indigo-100 rounded-2xl p-4 sm:p-5 bg-indigo-50/20 space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-indigo-700" />
                          <span className="font-black text-xs uppercase tracking-wider text-indigo-950">
                            Available Live Venues in {stop.city}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectingVenueStopIndex(index)}
                            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer underline flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Custom Venue / Modify Times</span>
                          </button>
                          {stop.selectedVenue && (
                            <button
                              type="button"
                              onClick={() => handleClearVenueSelection(index)}
                              className="text-xs font-semibold text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* If a venue is already selected for this stop */}
                      {stop.selectedVenue ? (
                        <div className="bg-white rounded-2xl p-4 border-2 border-indigo-500/40 shadow-xs space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="font-black text-slate-900 text-sm sm:text-base">
                                  {stop.selectedVenue.name}
                                </h5>
                                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Selected Stage
                                </span>
                              </div>
                              {stop.selectedVenue.address && (
                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{stop.selectedVenue.address}</span>
                                </p>
                              )}
                            </div>

                            {stop.selectedVenue.ticketPrice && (
                              <div className="text-left sm:text-right">
                                <span className="text-[10px] text-slate-400 font-bold block uppercase">Door / Cover</span>
                                <span className="text-xs font-bold text-slate-700">
                                  {stop.selectedVenue.ticketPrice}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Run-of-Show Schedule Times */}
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-slate-800 text-[11px] flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Run-of-Show Schedule</span>
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setInlineScheduleEditIndex(inlineScheduleEditIndex === index ? null : index)}
                                  className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md border border-indigo-200 cursor-pointer transition-colors"
                                >
                                  {inlineScheduleEditIndex === index ? "Done Editing ✓" : "Quick Edit Times ✏️"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectingVenueStopIndex(index)}
                                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                                >
                                  Open Selector
                                </button>
                              </div>
                            </div>

                            {inlineScheduleEditIndex === index ? (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                <div>
                                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Load-in</label>
                                  <input
                                    type="text"
                                    value={stop.selectedVenue.loadInTime || "5:00 PM"}
                                    onChange={(e) => handleUpdateVenueScheduleField(index, "loadInTime", e.target.value)}
                                    placeholder="5:00 PM"
                                    className="w-full px-2 py-1 bg-white rounded-lg border border-indigo-300 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Soundcheck</label>
                                  <input
                                    type="text"
                                    value={stop.selectedVenue.soundcheckTime || "6:30 PM"}
                                    onChange={(e) => handleUpdateVenueScheduleField(index, "soundcheckTime", e.target.value)}
                                    placeholder="6:30 PM"
                                    className="w-full px-2 py-1 bg-white rounded-lg border border-indigo-300 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Doors</label>
                                  <input
                                    type="text"
                                    value={stop.selectedVenue.doorsTime || "7:30 PM"}
                                    onChange={(e) => handleUpdateVenueScheduleField(index, "doorsTime", e.target.value)}
                                    placeholder="7:30 PM"
                                    className="w-full px-2 py-1 bg-white rounded-lg border border-indigo-300 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-indigo-700 font-semibold mb-0.5">Set Time</label>
                                  <input
                                    type="text"
                                    value={stop.selectedVenue.setTime || "9:00 PM - 10:30 PM"}
                                    onChange={(e) => handleUpdateVenueScheduleField(index, "setTime", e.target.value)}
                                    placeholder="9:00 PM"
                                    className="w-full px-2 py-1 bg-white rounded-lg border border-indigo-400 text-xs font-extrabold text-indigo-700 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div 
                                  onClick={() => setInlineScheduleEditIndex(index)}
                                  className="p-1.5 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 cursor-pointer transition-colors"
                                  title="Click to edit load-in time"
                                >
                                  <span className="text-slate-400 font-semibold block text-[10px]">Load-in</span>
                                  <span className="font-bold text-slate-800">{stop.selectedVenue.loadInTime || "5:00 PM"}</span>
                                </div>
                                <div 
                                  onClick={() => setInlineScheduleEditIndex(index)}
                                  className="p-1.5 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 cursor-pointer transition-colors"
                                  title="Click to edit soundcheck time"
                                >
                                  <span className="text-slate-400 font-semibold block text-[10px]">Soundcheck</span>
                                  <span className="font-bold text-slate-800">{stop.selectedVenue.soundcheckTime || "6:30 PM"}</span>
                                </div>
                                <div 
                                  onClick={() => setInlineScheduleEditIndex(index)}
                                  className="p-1.5 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 cursor-pointer transition-colors"
                                  title="Click to edit doors time"
                                >
                                  <span className="text-slate-400 font-semibold block text-[10px]">Doors</span>
                                  <span className="font-bold text-slate-800">{stop.selectedVenue.doorsTime || "7:30 PM"}</span>
                                </div>
                                <div 
                                  onClick={() => setInlineScheduleEditIndex(index)}
                                  className="p-1.5 bg-indigo-50/70 rounded-lg border border-indigo-200 hover:border-indigo-400 cursor-pointer transition-colors"
                                  title="Click to edit set time"
                                >
                                  <span className="text-indigo-600 font-semibold block text-[10px]">Set Time</span>
                                  <span className="font-bold text-indigo-700">{stop.selectedVenue.setTime || "9:00 PM - 10:30 PM"}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Venue Contacts & Action Buttons */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs border-t border-slate-100">
                            <div className="text-slate-500 text-[11px]">
                              {stop.selectedVenue.contactEmail && <span>Email: {stop.selectedVenue.contactEmail} </span>}
                              {stop.selectedVenue.contactPhone && <span>&bull; Phone: {stop.selectedVenue.contactPhone}</span>}
                            </div>

                            <div className="flex items-center gap-2">
                              {onSelectVenueForPoster && (
                                <button
                                  type="button"
                                  onClick={() => onSelectVenueForPoster(stop.selectedVenue!.name, stop.city)}
                                  className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200"
                                >
                                  🎨 Gig Poster
                                </button>
                              )}
                              {onNavigateToBooking && (
                                <button
                                  type="button"
                                  onClick={() => onNavigateToBooking(stop.selectedVenue!.name)}
                                  className="text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200"
                                >
                                  ✉️ Booking Contact
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {/* List of Available Venues in this City to Select */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                          {cityVenues.length > 0 
                            ? `Available Stages in ${stop.city} (${cityVenues.length})` 
                            : `Suggested Stages for ${stop.city}`}
                        </span>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {cityVenues.length > 0 ? (
                            cityVenues.map((venue) => {
                              const isSelected = stop.selectedVenue?.name === venue.name;
                              return (
                                <div 
                                  key={venue.id || venue.name}
                                  className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2 ${
                                    isSelected 
                                      ? "bg-indigo-50/70 border-indigo-400 ring-1 ring-indigo-400" 
                                      : "bg-white border-slate-200 hover:border-indigo-300"
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-start justify-between gap-2">
                                      <h6 className="font-extrabold text-xs text-slate-900">
                                        {venue.name}
                                      </h6>
                                      {venue.capacity && (
                                        <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                          Cap: {venue.capacity}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                      {venue.address}
                                    </p>
                                    {venue.genres && (
                                      <div className="flex flex-wrap gap-1 mt-1.5">
                                        {venue.genres.slice(0, 3).map((g, gi) => (
                                          <span key={gi} className="text-[9px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                                            {g}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-1">
                                    <span className="text-[10px] text-slate-400">
                                      {venue.hasPA ? "🔊 Pro PA" : "PA Inquire"}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleQuickSelectVenueForStop(index, venue)}
                                      className={`text-xs font-black px-3 py-1 rounded-xl transition-all cursor-pointer ${
                                        isSelected 
                                          ? "bg-indigo-600 text-white" 
                                          : "bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-800"
                                      }`}
                                    >
                                      {isSelected ? "Selected ✓" : "Select Venue"}
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            stop.suggestedVenues.map((sug, sIdx) => {
                              const isSelected = stop.selectedVenue?.name === sug.name;
                              return (
                                <div 
                                  key={sIdx}
                                  className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all flex flex-col justify-between gap-2"
                                >
                                  <div>
                                    <div className="flex items-start justify-between gap-2">
                                      <h6 className="font-extrabold text-xs text-slate-900">{sug.name}</h6>
                                      {sug.capacity && (
                                        <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                          Cap: {sug.capacity}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">{sug.address || `${stop.city}, ${stop.state}`}</p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleQuickSelectVenueForStop(index, {
                                      id: `sug-${sIdx}`,
                                      name: sug.name,
                                      city: stop.city,
                                      address: sug.address || `${stop.city}, ${stop.state}`,
                                      capacity: sug.capacity,
                                      genres: sug.genres,
                                      contactEmail: sug.contactEmail,
                                      contactPhone: sug.contactPhone,
                                      hasPA: sug.hasPA,
                                      hasLighting: sug.hasLighting
                                    })}
                                    className={`text-xs font-black px-3 py-1 rounded-xl transition-all cursor-pointer ${
                                      isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-800"
                                    }`}
                                  >
                                    {isSelected ? "Selected ✓" : "Select Venue"}
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>

                    {/* LODGING IN THIS CITY SECTION */}
                    <div className="border border-amber-100 rounded-2xl p-4 sm:p-5 bg-amber-50/20 space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Hotel className="w-4 h-4 text-amber-700" />
                          <span className="font-black text-xs uppercase tracking-wider text-amber-950">
                            Available Lodging &amp; Accommodations in {stop.city}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectingLodgingStopIndex(index)}
                            className="text-xs font-bold text-amber-800 hover:text-amber-950 cursor-pointer underline flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Custom Lodging / Reservation #</span>
                          </button>
                          {stop.selectedLodging && (
                            <button
                              type="button"
                              onClick={() => handleClearLodgingSelection(index)}
                              className="text-xs font-semibold text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* If lodging is selected for this stop */}
                      {stop.selectedLodging ? (
                        <div className="bg-white rounded-2xl p-4 border-2 border-amber-500/40 shadow-xs space-y-2.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="font-black text-slate-900 text-sm sm:text-base">
                                  {stop.selectedLodging.name}
                                </h5>
                                <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                                  {stop.selectedLodging.type || "Confirmed Stay"}
                                </span>
                              </div>
                              {stop.selectedLodging.address && (
                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{stop.selectedLodging.address}</span>
                                </p>
                              )}
                            </div>

                            {stop.selectedLodging.cost && (
                              <div className="text-left sm:text-right">
                                <span className="text-[10px] text-slate-400 font-bold block uppercase">Nightly Rate</span>
                                <span className="text-sm font-extrabold text-slate-900">
                                  ${stop.selectedLodging.cost}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Gear security note */}
                          <div className="bg-amber-50 p-2.5 rounded-xl text-xs text-amber-900 border border-amber-200/60 flex items-start gap-2">
                            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                            <div>
                              <strong>Van &amp; Gear Security:</strong> {stop.selectedLodging.gearSecurityNote || "Back van tightly against brick wall. Bring guitars and pedalboards inside rooms."}
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {/* List of Available Lodging Options in this City to Select */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                          Band-Friendly Options for {stop.city} ({cityLodging.length})
                        </span>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                          {cityLodging.map((option) => {
                            const isSelected = stop.selectedLodging?.name === option.name;
                            return (
                              <div
                                key={option.id || option.name}
                                className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2 ${
                                  isSelected 
                                    ? "bg-amber-50/70 border-amber-400 ring-1 ring-amber-400" 
                                    : "bg-white border-slate-200 hover:border-amber-300"
                                }`}
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-1">
                                    <h6 className="font-extrabold text-xs text-slate-900">{option.name}</h6>
                                  </div>
                                  <span className="text-[10px] font-bold text-amber-800 block mt-0.5">
                                    {option.type} &bull; {option.estPricePerNight}
                                  </span>
                                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                                    {option.distanceToVenues}
                                  </p>
                                </div>

                                <div className="pt-2 border-t border-slate-100 mt-1 flex items-center justify-between">
                                  <span className="text-[10px] text-slate-400">Secure Parking</span>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickSelectLodgingForStop(index, option)}
                                    className={`text-xs font-black px-3 py-1 rounded-xl transition-all cursor-pointer ${
                                      isSelected 
                                        ? "bg-amber-600 text-white" 
                                        : "bg-slate-100 hover:bg-amber-600 hover:text-white text-slate-800"
                                    }`}
                                  >
                                    {isSelected ? "Selected ✓" : "Select Lodging"}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* Google Maps Embed Section */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Personalized Multi-Stop Driving Map
                </h3>
              </div>
              <a
                href={currentGoogleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
              >
                <span>Full Turn-by-Turn GPS</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <p className="text-xs text-slate-500">
              Synchronized GPS route connecting all your selected venue addresses, cities, and lodging stops.
            </p>

            <div className="w-full h-80 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <iframe
                title="Tour Route Navigation Map"
                className="w-full h-full border-0"
                loading="lazy"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(tourPlan.stops.map(s => s.selectedVenue?.address || `${s.city}, ${s.state}`).join(" to "))}&output=embed`}
              />
            </div>
          </div>

          {/* Tour Road Tips */}
          {tourPlan.tourTips && tourPlan.tourTips.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 text-amber-900">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5 mb-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Touring Logistics &amp; Road Security Protocol</span>
              </h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {tourPlan.tourTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">&bull;</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}

      {/* Pop Up Disclaimer on First Open */}
      <TourDisclaimerModal
        isOpen={showDisclaimerModal}
        onClose={() => setShowDisclaimerModal(false)}
      />

      {/* Pre-Export Validation Modal */}
      {showValidationModal && tourPlan && (
        <ItineraryValidationModal
          isOpen={showValidationModal}
          tourPlan={tourPlan}
          issues={validationIssues}
          onFixVenue={(stopIndex) => {
            setSelectingVenueStopIndex(stopIndex);
          }}
          onFixLodging={(stopIndex) => {
            setSelectingLodgingStopIndex(stopIndex);
          }}
          onFixStop={(stopIndex) => {
            setEditingStopIndex(stopIndex);
          }}
          onAutoFillMissing={handleAutoFillMissing}
          onProceedToExport={() => {
            setShowValidationModal(false);
            setShowPrintModal(true);
          }}
          onClose={() => setShowValidationModal(false)}
        />
      )}

      {/* Print & Export Modal */}
      {showPrintModal && tourPlan && (
        <TourPrintModal
          tourPlan={tourPlan}
          bandName={bandProfile?.name}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* Modals for Editing Details */}
      {selectingVenueStopIndex !== null && tourPlan && (
        <VenuePickerModal
          stop={tourPlan.stops[selectingVenueStopIndex]}
          onSave={handleSaveVenueSelection}
          onClose={() => setSelectingVenueStopIndex(null)}
        />
      )}

      {selectingLodgingStopIndex !== null && tourPlan && (
        <LodgingPickerModal
          stop={tourPlan.stops[selectingLodgingStopIndex]}
          onSave={handleSaveLodgingSelection}
          onClose={() => setSelectingLodgingStopIndex(null)}
        />
      )}

      {editingStopIndex !== null && tourPlan && (
        <EditStopModal
          stop={tourPlan.stops[editingStopIndex]}
          onSave={handleSaveStopDetails}
          onClose={() => setEditingStopIndex(null)}
        />
      )}

    </div>
  );
};

export default TourScheduler;
