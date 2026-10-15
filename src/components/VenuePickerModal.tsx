import React, { useState, useEffect, useMemo } from "react";
import { TourStop, TourVenueStop, TourSelectedVenue, Venue } from "../types";
import { MUSIC_VENUES } from "../data/venues";
import { getMergedVenuesList } from "../utils/directoryStore";
import { Search, Building, MapPin, Check, Plus, X, Users, DollarSign, Clock, Mail, Phone, ExternalLink, Loader2, Filter } from "lucide-react";
import RatingStars from "./RatingStars";
import { getRatingStats } from "../utils/reviewsManager";
import { supabase } from "../lib/supabase";
import { CONTINENTAL_US_STATES, parseFreeformCityState, STATE_NAME_TO_CODE_MAP } from "../constants/states";

export interface VenuePickerModalProps {
  isOpen?: boolean;
  stop: TourStop;
  onSave: (selectedVenue: TourSelectedVenue) => void;
  onClose: () => void;
  suggestedVenues?: Venue[];
  loadVenuesForStageCity?: (cityName: string, stateName?: string) => Promise<Venue[]>;
  cityName?: string;
  allVenues?: Venue[];
  directoryVenues?: Venue[];
}

export const VenuePickerModal: React.FC<VenuePickerModalProps> = ({ 
  isOpen = true,
  stop, 
  onSave, 
  onClose,
  suggestedVenues,
  loadVenuesForStageCity,
  cityName,
  allVenues: propAllVenues,
  directoryVenues: propDirectoryVenues
}) => {
  const [activeTab, setActiveTab] = useState<"suggested" | "directory" | "custom">("suggested");
  const [searchQuery, setSearchQuery] = useState("");
  const [directoryStateFilter, setDirectoryStateFilter] = useState("All");

  // 1. Resolve in-memory venues directory (132+ items from props, directoryStore, or MUSIC_VENUES)
  const allVenues = useMemo(() => {
    if (propAllVenues && propAllVenues.length > 0) return propAllVenues;
    if (propDirectoryVenues && propDirectoryVenues.length > 0) return propDirectoryVenues;
    const merged = getMergedVenuesList();
    if (merged && merged.length > 0) return merged;
    return MUSIC_VENUES;
  }, [propAllVenues, propDirectoryVenues]);

  const rawCity = (cityName || stop.city || "").trim();
  const rawState = (stop.state || "").trim();
  const parsed = parseFreeformCityState(cityName || `${stop.city || ""}, ${stop.state || ""}`);
  const targetCityName = (parsed.city || (rawCity.includes(",") ? rawCity.split(",")[0] : rawCity) || "").trim();
  const targetStateName = (parsed.state || (rawCity.includes(",") ? rawCity.split(",")[1] : rawState) || "").trim();
  const stateCode = (STATE_NAME_TO_CODE_MAP[targetStateName.toLowerCase()] || targetStateName).trim();

  const targetCity = targetCityName.toLowerCase();
  const targetState = targetStateName.toLowerCase();

  const effectiveCity = targetCityName || stop.city || "";
  const effectiveState = targetStateName || stop.state || "";

  // 1. Robust Field Extraction:
  // When filtering allVenues, inspect all possible location fields: v.city, v.city_state, v.address, and v.state
  const realMatches = useMemo(() => {
    if (!allVenues || allVenues.length === 0) return [];

    return allVenues.filter((v: any) => {
      const vName = (v.name || '').toLowerCase();
      // Exclude any hardcoded placeholder mock like "Everett Live Stage & Hall"
      if (vName.includes('live stage & hall')) return false;

      const vCity = (v.city || '').toLowerCase();
      const vCityState = (v.city_state || '').toLowerCase();
      const vAddress = (v.address || '').toLowerCase();
      const vState = (v.state || '').toLowerCase();

      const matchesCity = vCity.includes(targetCity) || 
                          vCityState.includes(targetCity) || 
                          vAddress.includes(targetCity);

      const matchesState = !targetState || 
                           vState.includes(targetState) || 
                           vCityState.includes(targetState) ||
                           (targetState === 'wa' && (vState.includes('washington') || vCityState.includes('wa'))) ||
                           (targetState === 'or' && (vState.includes('oregon') || vCityState.includes('or'))) ||
                           (targetState === 'ca' && (vState.includes('california') || vCityState.includes('ca'))) ||
                           (targetState === 'co' && (vState.includes('colorado') || vCityState.includes('co'))) ||
                           (targetState === 'bc' && (vState.includes('bc') || vCityState.includes('bc')));

      return matchesCity && matchesState;
    });
  }, [allVenues, targetCity, targetState]);

  // Suggested venues state with immediate local matching
  const [suggestedVenuesList, setSuggestedVenuesList] = useState<Venue[]>(() => {
    if (realMatches && realMatches.length > 0) return realMatches;
    if (suggestedVenues && suggestedVenues.length > 0) {
      const filtered = suggestedVenues.filter(v => !(v.name || '').toLowerCase().includes('live stage & hall'));
      if (filtered.length > 0) return filtered;
    }
    if (stop.suggestedVenues && stop.suggestedVenues.length > 0) {
      const filtered = (stop.suggestedVenues as any[]).filter(v => !(v.name || '').toLowerCase().includes('live stage & hall'));
      if (filtered.length > 0) return filtered;
    }
    return [];
  });

  // Synchronously set isLoadingSuggested to false if real in-memory matches are already present
  const [isLoadingSuggested, setIsLoadingSuggested] = useState<boolean>(() => {
    if (realMatches && realMatches.length > 0) return false;
    return true;
  });

  // Browse All Directory venues state directly initialized with live in-memory pool (132 items)
  const [allDirectoryVenues, setAllDirectoryVenues] = useState<Venue[]>(() => {
    return allVenues && allVenues.length > 0 ? allVenues : [];
  });
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(false);

  // Synchronous in-memory derivation & fallback network query
  useEffect(() => {
    if (!isOpen) return;

    // If in-memory real matches are available, render immediately with 0ms latency
    if (realMatches && realMatches.length > 0) {
      setSuggestedVenuesList(realMatches);
      setIsLoadingSuggested(false);
      setActiveTab("suggested");
      return;
    }

    // 2. Force Query Supabase if In-Memory List Has 0 Matches:
    // If realMatches.length === 0, perform a direct fallback query to the database
    let isMounted = true;
    setIsLoadingSuggested(true);

    async function loadFallbackVenues() {
      try {
        let results: Venue[] = [];

        // Direct query to venues in Supabase checking city, city_state, and address
        let { data, error } = await supabase
          .from('venues')
          .select('*')
          .or(`city.ilike.%${targetCity}%,city_state.ilike.%${targetCity}%,address.ilike.%${targetCity}%`);

        if (error) {
          // Fallback if city_state column does not exist on table schema
          const retryRes = await supabase
            .from('venues')
            .select('*')
            .or(`city.ilike.%${targetCity}%,address.ilike.%${targetCity}%`);
          data = retryRes.data;
          error = retryRes.error;
        }

        if (error) {
          console.error("Direct Supabase venue query error:", error);
        } else if (data && Array.isArray(data) && data.length > 0) {
          // Exclude any hardcoded placeholder mock like "Everett Live Stage & Hall"
          const filteredData = data.filter((v: any) => !(v.name || '').toLowerCase().includes('live stage & hall'));
          results = filteredData.map((v: any) => ({
            id: v.id || `venue-db-${v.name?.toLowerCase().replace(/\s+/g, "-")}`,
            name: v.name || "Live Venue",
            city: v.city || effectiveCity,
            state: v.state || effectiveState,
            country: (v.state || targetState)?.toUpperCase() === "BC" ? "CA" : "US",
            address: v.address || `${v.city || effectiveCity}, ${v.state || effectiveState}`.trim(),
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
            description: v.description || `Live music venue located in ${v.city || effectiveCity}.`
          }));
        }

        if (isMounted) {
          setSuggestedVenuesList(results || []);
          if (results && results.length > 0) {
            setActiveTab("suggested");
          }
        }
      } catch (err) {
        console.error("Failed to query fallback venues:", err);
        if (isMounted) {
          setSuggestedVenuesList([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingSuggested(false);
        }
      }
    }

    loadFallbackVenues();

    return () => {
      isMounted = false;
    };
  }, [isOpen, realMatches, targetCity, targetState, effectiveCity, effectiveState]);

  // Sync background live Supabase directory without blocking user
  useEffect(() => {
    let isMounted = true;
    async function fetchAllDirectoryVenues() {
      if (!allVenues || allVenues.length === 0) {
        setIsLoadingDirectory(true);
      }
      try {
        const { data, error } = await supabase
          .from("venues")
          .select("*")
          .order("name", { ascending: true });

        if (error) {
          console.error("Supabase directory fetch error:", error);
        } else if (data && Array.isArray(data) && isMounted && data.length > 0) {
          const mapped: Venue[] = data.map((v: any) => ({
            id: v.id || `venue-db-${v.name?.toLowerCase().replace(/\s+/g, "-")}`,
            name: v.name || "Live Venue",
            city: v.city || "",
            state: v.state || "",
            country: v.state?.toUpperCase() === "BC" ? "CA" : "US",
            address: v.address || `${v.city}, ${v.state}`.trim(),
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
            description: v.description || `Live music venue located in ${v.city}.`
          }));
          setAllDirectoryVenues(mapped);
        }
      } catch (err) {
        console.error("Error fetching all directory venues:", err);
      } finally {
        if (isMounted) setIsLoadingDirectory(false);
      }
    }

    if (isOpen) {
      fetchAllDirectoryVenues();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, allVenues]);

  // Custom venue form state
  const [customName, setCustomName] = useState(stop.selectedVenue?.name || "");
  const [customAddress, setCustomAddress] = useState(stop.selectedVenue?.address || "");
  const [customContactEmail, setCustomContactEmail] = useState(stop.selectedVenue?.contactEmail || "");
  const [customContactPhone, setCustomContactPhone] = useState(stop.selectedVenue?.contactPhone || "");
  const [customCapacity, setCustomCapacity] = useState<number | string>(stop.selectedVenue?.capacity || 200);
  const [customLoadIn, setCustomLoadIn] = useState(stop.selectedVenue?.loadInTime || "5:00 PM");
  const [customSoundcheck, setCustomSoundcheck] = useState(stop.selectedVenue?.soundcheckTime || "6:30 PM");
  const [customDoors, setCustomDoors] = useState(stop.selectedVenue?.doorsTime || "7:30 PM");
  const [customSetTime, setCustomSetTime] = useState(stop.selectedVenue?.setTime || "9:00 PM - 10:30 PM");
  const [customTicketPrice, setCustomTicketPrice] = useState(stop.selectedVenue?.ticketPrice || "$12 Adv / $15 Door");
  const [customNotes, setCustomNotes] = useState(stop.selectedVenue?.notes || "");

  // Directory filter: Live text search & State filter across all verified venues in the database
  const filteredDirectoryVenues = allDirectoryVenues.filter(v => {
    if (directoryStateFilter !== "All" && v.state?.toUpperCase() !== directoryStateFilter.toUpperCase()) {
      return false;
    }
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      v.name.toLowerCase().includes(q) ||
      (v.city && v.city.toLowerCase().includes(q)) ||
      (v.state && v.state.toLowerCase().includes(q)) ||
      (v.address && v.address.toLowerCase().includes(q)) ||
      (v.genres && v.genres.some(g => g.toLowerCase().includes(q)))
    );
  });

  const handleSelectPredefined = (venue: TourVenueStop | Venue) => {
    onSave({
      id: venue.id,
      name: venue.name,
      address: venue.address || `${stop.city}, ${stop.state}`,
      city: venue.city || stop.city,
      contactEmail: venue.contactEmail,
      contactPhone: venue.contactPhone,
      capacity: venue.capacity,
      loadInTime: customLoadIn || "5:00 PM",
      soundcheckTime: customSoundcheck || "6:30 PM",
      doorsTime: customDoors || "7:30 PM",
      setTime: customSetTime || "9:00 PM - 10:30 PM",
      ticketPrice: customTicketPrice || "$15 Adv / $18 Door",
      bookingStatus: "penciled",
      notes: (venue as any).description || customNotes
    });
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    onSave({
      name: customName.trim(),
      address: customAddress.trim() || `${stop.city}, ${stop.state}`,
      city: stop.city,
      contactEmail: customContactEmail.trim(),
      contactPhone: customContactPhone.trim(),
      capacity: Number(customCapacity) || undefined,
      loadInTime: customLoadIn,
      soundcheckTime: customSoundcheck,
      doorsTime: customDoors,
      setTime: customSetTime,
      ticketPrice: customTicketPrice,
      bookingStatus: "penciled",
      notes: customNotes
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Select Venue &amp; Run-of-Show for {stop.city}, {stop.state}
              </h2>
              <p className="text-xs text-slate-300">
                Set stage schedule (Load-in, Soundcheck, Doors, Set) and pick or customize your stage
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Run-of-Show Schedule Timing Bar */}
        <div className="bg-indigo-950 text-white p-3.5 border-b border-indigo-900/60 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-indigo-200">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>STAGE RUN-OF-SHOW SCHEDULE</span>
            </div>
            {/* Quick Presets */}
            <div className="flex items-center gap-1 text-[10px]">
              <span className="text-slate-400 font-semibold mr-1 hidden sm:inline">Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setCustomLoadIn("5:00 PM");
                  setCustomSoundcheck("6:30 PM");
                  setCustomDoors("7:30 PM");
                  setCustomSetTime("9:00 PM - 10:30 PM");
                }}
                className="px-2 py-0.5 rounded-md bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 hover:text-white transition-colors cursor-pointer border border-indigo-700/50"
              >
                Standard Club (5pm / 9pm)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomLoadIn("4:00 PM");
                  setCustomSoundcheck("5:15 PM");
                  setCustomDoors("6:30 PM");
                  setCustomSetTime("7:45 PM - 9:00 PM");
                }}
                className="px-2 py-0.5 rounded-md bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 hover:text-white transition-colors cursor-pointer border border-indigo-700/50"
              >
                Early Matinee (4pm / 7:45pm)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomLoadIn("6:00 PM");
                  setCustomSoundcheck("7:30 PM");
                  setCustomDoors("8:30 PM");
                  setCustomSetTime("10:00 PM - 11:30 PM");
                }}
                className="px-2 py-0.5 rounded-md bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 hover:text-white transition-colors cursor-pointer border border-indigo-700/50"
              >
                Late Headliner (6pm / 10pm)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-indigo-900/50 p-2 rounded-xl border border-indigo-800/80">
              <label className="block text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-1">
                Load-In Time
              </label>
              <input
                type="text"
                value={customLoadIn}
                onChange={(e) => setCustomLoadIn(e.target.value)}
                placeholder="5:00 PM"
                className="w-full px-2 py-1.5 bg-slate-900/90 text-white rounded-lg border border-indigo-700/70 text-xs font-semibold focus:ring-1 focus:ring-indigo-400 focus:outline-hidden"
              />
            </div>
            <div className="bg-indigo-900/50 p-2 rounded-xl border border-indigo-800/80">
              <label className="block text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-1">
                Soundcheck Time
              </label>
              <input
                type="text"
                value={customSoundcheck}
                onChange={(e) => setCustomSoundcheck(e.target.value)}
                placeholder="6:30 PM"
                className="w-full px-2 py-1.5 bg-slate-900/90 text-white rounded-lg border border-indigo-700/70 text-xs font-semibold focus:ring-1 focus:ring-indigo-400 focus:outline-hidden"
              />
            </div>
            <div className="bg-indigo-900/50 p-2 rounded-xl border border-indigo-800/80">
              <label className="block text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-1">
                Doors Open
              </label>
              <input
                type="text"
                value={customDoors}
                onChange={(e) => setCustomDoors(e.target.value)}
                placeholder="7:30 PM"
                className="w-full px-2 py-1.5 bg-slate-900/90 text-white rounded-lg border border-indigo-700/70 text-xs font-semibold focus:ring-1 focus:ring-indigo-400 focus:outline-hidden"
              />
            </div>
            <div className="bg-indigo-900/50 p-2 rounded-xl border border-indigo-800/80">
              <label className="block text-[10px] text-amber-300 font-bold uppercase tracking-wider mb-1">
                Set Time
              </label>
              <input
                type="text"
                value={customSetTime}
                onChange={(e) => setCustomSetTime(e.target.value)}
                placeholder="9:00 PM - 10:30 PM"
                className="w-full px-2 py-1.5 bg-slate-900/90 text-amber-300 rounded-lg border border-amber-500/60 text-xs font-bold focus:ring-1 focus:ring-amber-400 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("suggested")}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === "suggested" 
                ? "border-indigo-600 text-indigo-700 font-extrabold" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Suggested ({suggestedVenuesList.length > 0 ? suggestedVenuesList.length : realMatches.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("directory")}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === "directory" 
                ? "border-indigo-600 text-indigo-700 font-extrabold" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Browse All Directory {allDirectoryVenues.length > 0 ? `(${allDirectoryVenues.length})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("custom")}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === "custom" 
                ? "border-indigo-600 text-indigo-700 font-extrabold" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Custom Venue &amp; Run-of-Show
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === "suggested" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <p className="text-xs text-slate-600 font-medium">
                  Curated live stages in {stop.city}, {stop.state} matched to your tour routing:
                </p>
                {suggestedVenuesList.length > 0 && (
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                    {suggestedVenuesList.length} options found
                  </span>
                )}
              </div>

              {/* If suggestedVenuesList.length > 0, show the rooms immediately without showing spinner */}
              {suggestedVenuesList.length > 0 ? (
                suggestedVenuesList.map((v, i) => {
                  const isSelected = stop.selectedVenue?.name === v.name;
                  const stats = getRatingStats(v.id || "", v.name, "venue");
                  return (
                    <div 
                      key={v.id || i}
                      className={`p-4 rounded-xl border transition-all ${
                        isSelected 
                          ? "border-indigo-600 bg-indigo-50/60 shadow-xs" 
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">{v.name}</h3>
                            {isSelected && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full">
                                <Check className="w-3 h-3" /> Selected
                              </span>
                            )}
                            {v.city && v.city.toLowerCase() !== effectiveCity.toLowerCase() && (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                Regional: {v.city}, {v.state}
                              </span>
                            )}
                          </div>
                          <RatingStars
                            rating={stats.average}
                            size="sm"
                            showNumber={true}
                            reviewCount={stats.count}
                          />
                          {v.address && (
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{v.address}</span>
                            </p>
                          )}
                          {v.capacity && (
                            <p className="text-xs text-slate-600 mt-1 font-medium">
                              Capacity: {v.capacity} guests &bull; {v.genres?.slice(0, 3).join(", ")}
                            </p>
                          )}
                          {v.description && (
                            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 italic">
                              "{v.description}"
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectPredefined(v)}
                          className="shrink-0 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                          {isSelected ? "Keep Selected" : "Select Venue"}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : isLoadingSuggested ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-3">
                  <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold text-slate-600">
                    Finding live music stages in {effectiveCity}, {effectiveState}...
                  </span>
                </div>
              ) : (
                <div className="text-center py-10 px-4 space-y-3 bg-slate-50/70 rounded-2xl border border-dashed border-slate-300 my-2 animate-in fade-in duration-150">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
                    <Building className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-800">
                      No verified venues listed in {effectiveCity}, {effectiveState} yet
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      We haven't indexed rooms in this specific corridor town yet. Add your custom venue and soundcheck times in seconds.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("custom")}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>+ Add Custom Venue</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("directory")}
                      className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                    >
                      Browse All Directory
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "directory" && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search all 62+ database venues by name, city, state, or genre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
                <div className="sm:w-56 shrink-0">
                  <select
                    value={directoryStateFilter}
                    onChange={(e) => setDirectoryStateFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="All">All 48 States (+DC)</option>
                    {CONTINENTAL_US_STATES.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.code} - {st.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isLoadingDirectory ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-3">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                  <span className="text-xs font-bold text-slate-600">Loading verified database venues...</span>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {filteredDirectoryVenues.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No venues matched "{searchQuery}".
                    </div>
                  ) : (
                    filteredDirectoryVenues.map((v) => {
                      const isSelected = stop.selectedVenue?.name === v.name;
                      const stats = getRatingStats(v.id, v.name, "venue");
                      return (
                        <div 
                          key={v.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                            isSelected 
                              ? "border-indigo-600 bg-indigo-50/60" 
                              : "border-slate-200 bg-white hover:border-indigo-200"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-slate-900">{v.name}</p>
                              {v.city && (
                                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {v.city}, {v.state}
                                </span>
                              )}
                            </div>
                            <RatingStars rating={stats.average} size="xs" showNumber={true} reviewCount={stats.count} />
                            <p className="text-[11px] text-slate-500">
                              {v.address ? `${v.address} • ` : ""}Cap: {v.capacity || "N/A"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSelectPredefined(v)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer shrink-0"
                          >
                            {isSelected ? "Keep Selected" : "Select"}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "custom" && (
            <form onSubmit={handleSaveCustom} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Venue / Club Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., The Sunset Tavern, House Show, City Arts Center"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    placeholder="e.g., 5433 Ballard Ave NW, Seattle, WA"
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Booking Email / Phone</label>
                  <input
                    type="text"
                    placeholder="e.g., booking@venue.com or 555-0192"
                    value={customContactEmail}
                    onChange={(e) => setCustomContactEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Schedule Run-of-Show */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-800 text-xs mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Run-of-Show Schedule Times</span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Load-in</label>
                    <input
                      type="text"
                      value={customLoadIn}
                      onChange={(e) => setCustomLoadIn(e.target.value)}
                      placeholder="5:00 PM"
                      className="w-full px-2 py-1.5 bg-white rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Soundcheck</label>
                    <input
                      type="text"
                      value={customSoundcheck}
                      onChange={(e) => setCustomSoundcheck(e.target.value)}
                      placeholder="6:30 PM"
                      className="w-full px-2 py-1.5 bg-white rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Doors</label>
                    <input
                      type="text"
                      value={customDoors}
                      onChange={(e) => setCustomDoors(e.target.value)}
                      placeholder="7:30 PM"
                      className="w-full px-2 py-1.5 bg-white rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Set Time</label>
                    <input
                      type="text"
                      value={customSetTime}
                      onChange={(e) => setCustomSetTime(e.target.value)}
                      placeholder="9:00 PM"
                      className="w-full px-2 py-1.5 bg-white rounded-lg border border-slate-300 text-xs font-bold text-indigo-700"
                    />
                  </div>
                </div>
              </div>

              {/* Ticket & Door Info */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ticket / Door Cover Price</label>
                <input
                  type="text"
                  placeholder="e.g. $15 Adv / $18 Door (or Free / 21+)"
                  value={customTicketPrice}
                  onChange={(e) => setCustomTicketPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Venue Notes / Co-bills / Guest List</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Supporting local punk band, bring own DI boxes, merchandise fee 0%"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Venue Selection
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
