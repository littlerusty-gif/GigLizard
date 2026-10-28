import React, { useState, useEffect, useMemo } from "react";
import { Venue, UserAccount } from "../types";
import { MUSIC_VENUES } from "../data/venues";
import { supabase } from "../lib/supabase";
import { ProgrammaticVenueRoute } from "../utils/venueSeoRoutes";
import {
  MapPin,
  Mail,
  Phone,
  Globe,
  Volume2,
  Lightbulb,
  Users,
  Check,
  Compass,
  ArrowRight,
  ExternalLink,
  Copy,
  PlusCircle,
  Building,
  Sparkles,
  ShieldCheck,
  Calendar,
  Sliders,
  FileText,
  Image as ImageIcon
} from "lucide-react";

interface CityVenueDirectoryProps {
  programmaticRoute: ProgrammaticVenueRoute;
  currentAccount?: UserAccount | null;
  onNavigateProgrammaticRoute?: (route: ProgrammaticVenueRoute | null, url: string) => void;
  onSelectVenueForPoster?: (venue: Venue) => void;
  onTriggerRegisterVenue?: () => void;
}

interface VenueRecord {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  booking_email: string;
  website?: string | null;
  capacity?: number | null;
  genres_accepted?: string[] | null;
  age_limit?: string | null;
  hasPA?: boolean;
  hasLighting?: boolean;
  description?: string | null;
  phone?: string | null;
}

export default function CityVenueDirectory({
  programmaticRoute,
  currentAccount,
  onNavigateProgrammaticRoute,
  onSelectVenueForPoster,
  onTriggerRegisterVenue
}: CityVenueDirectoryProps) {
  const city = programmaticRoute.city || "Nashville";
  const stateCode = (programmaticRoute.stateCode || "TN").toUpperCase();
  const stateName = programmaticRoute.stateName || stateCode;

  // Synchronously compute initial curated venue matches from MUSIC_VENUES
  const initialLocalMatches = useMemo(() => {
    return MUSIC_VENUES.filter(v => {
      const matchCity = v.city?.toLowerCase() === city.toLowerCase() || v.address?.toLowerCase().includes(city.toLowerCase());
      const matchState = v.state?.toUpperCase() === stateCode || v.address?.toUpperCase().includes(`, ${stateCode}`);
      return matchCity && matchState;
    }).map(lv => ({
      id: lv.id,
      name: lv.name,
      city: lv.city || city,
      state: lv.state || stateCode,
      address: lv.address,
      booking_email: lv.contactEmail,
      website: lv.website,
      capacity: lv.capacity || 200,
      genres_accepted: lv.genres,
      age_limit: "21+",
      hasPA: lv.hasPA !== false,
      hasLighting: lv.hasLighting !== false,
      description: lv.description,
      phone: lv.contactPhone
    }));
  }, [city, stateCode]);

  const [loading, setLoading] = useState(() => initialLocalMatches.length === 0);
  const [venues, setVenues] = useState<VenueRecord[]>(() => initialLocalMatches);
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<VenueRecord | null>(null);

  // Keep venues in sync if city / stateCode route changes
  useEffect(() => {
    if (initialLocalMatches.length > 0) {
      setVenues(initialLocalMatches);
      setLoading(false);
    }
  }, [initialLocalMatches]);

  // Fetch venues for this specific city and state from Supabase
  useEffect(() => {
    let isMounted = true;

    async function loadCityVenues() {
      if (initialLocalMatches.length === 0) {
        setLoading(true);
      }
      try {
        // 1. Query Supabase public.venues table
        const { data: supaVenues, error } = await supabase
          .from("venues")
          .select("*")
          .ilike("city", city)
          .ilike("state", stateCode);

        // 2. Query matching local curated venues
        const localMatches = MUSIC_VENUES.filter(v => {
          const matchCity = v.city?.toLowerCase() === city.toLowerCase() || v.address?.toLowerCase().includes(city.toLowerCase());
          const matchState = v.state?.toUpperCase() === stateCode || v.address?.toUpperCase().includes(`, ${stateCode}`);
          return matchCity && matchState;
        });

        // 3. Merge and deduplicate by normalized name
        const combinedMap = new Map<string, VenueRecord>();

        // Seed with local curated data first (rich production details)
        localMatches.forEach(lv => {
          const key = lv.name.toLowerCase().trim();
          combinedMap.set(key, {
            id: lv.id,
            name: lv.name,
            city: lv.city || city,
            state: lv.state || stateCode,
            address: lv.address,
            booking_email: lv.contactEmail,
            website: lv.website,
            capacity: lv.capacity || 200,
            genres_accepted: lv.genres,
            age_limit: "21+",
            hasPA: lv.hasPA !== false,
            hasLighting: lv.hasLighting !== false,
            description: lv.description,
            phone: lv.contactPhone
          });
        });

        // Merge Supabase database records
        if (supaVenues && supaVenues.length > 0) {
          supaVenues.forEach((sv: any) => {
            const key = (sv.name || "").toLowerCase().trim();
            const existing = combinedMap.get(key);
            let genresList: string[] = ["Rock", "Indie", "Alternative"];
            if (Array.isArray(sv.genres_accepted) && sv.genres_accepted.length > 0) {
              genresList = sv.genres_accepted;
            } else if (existing?.genres_accepted) {
              genresList = existing.genres_accepted;
            }

            combinedMap.set(key, {
              id: sv.id || existing?.id || `v-${Math.random()}`,
              name: sv.name,
              city: sv.city || existing?.city || city,
              state: sv.state || existing?.state || stateCode,
              address: sv.address || existing?.address || `${city}, ${stateCode}`,
              booking_email: sv.booking_email || sv.email || existing?.booking_email || "booking@giglizard.us",
              website: sv.website || existing?.website || null,
              capacity: sv.capacity || existing?.capacity || 250,
              genres_accepted: genresList,
              age_limit: sv.age_limit || existing?.age_limit || "21+",
              hasPA: existing ? existing.hasPA : true,
              hasLighting: existing ? existing.hasLighting : true,
              description: sv.description || existing?.description || `Independent live music stage in ${city}, ${stateCode}. Host to touring acts, regional showcases, and DIY concerts.`,
              phone: sv.phone || existing?.phone || null
            });
          });
        }

        const finalList = Array.from(combinedMap.values()).sort((a, b) => {
          // Sort by capacity descending
          return (b.capacity || 0) - (a.capacity || 0);
        });

        if (isMounted) {
          setVenues(finalList);
          // If the route specified an individual venue, highlight it
          if (programmaticRoute.venueSlug || programmaticRoute.venueName) {
            const target = finalList.find(v => 
              v.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === programmaticRoute.venueSlug?.toLowerCase() ||
              v.name.toLowerCase() === programmaticRoute.venueName?.toLowerCase()
            );
            if (target) setSelectedVenue(target);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading venues for city:", err);
        if (isMounted) setLoading(false);
      }
    }

    loadCityVenues();

    return () => {
      isMounted = false;
    };
  }, [city, stateCode, programmaticRoute.venueSlug, programmaticRoute.venueName]);

  // Compute City Summary Bar Metrics
  const summaryMetrics = useMemo(() => {
    const totalRooms = venues.length;
    const totalCapacity = venues.reduce((acc, v) => acc + (v.capacity || 0), 0);
    const avgCapacity = totalRooms > 0 ? Math.round(totalCapacity / totalRooms) : 250;

    // Aggregate genre frequencies
    const genreCounts: Record<string, number> = {};
    venues.forEach(v => {
      if (Array.isArray(v.genres_accepted)) {
        v.genres_accepted.forEach(g => {
          const clean = g.trim();
          if (clean) {
            genreCounts[clean] = (genreCounts[clean] || 0) + 1;
          }
        });
      }
    });

    const commonGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre]) => genre);

    if (commonGenres.length === 0) {
      commonGenres.push("Indie Rock", "Punk", "Americana", "Alternative");
    }

    return {
      totalRooms,
      avgCapacity,
      commonGenres
    };
  }, [venues]);

  // Dynamic Metadata & JSON-LD ItemList Schema Injection
  useEffect(() => {
    const pageTitle = `Music Venues in ${city}, ${stateCode} | Booking & Production Specs - GigLizard`;
    const pageDescription = `Find and contact verified music venues in ${city}, ${stateCode}. View stage specs, capacities, and DIY booking guidelines for touring bands.`;
    const canonicalUrl = `https://www.giglizard.us/venues/${city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${stateCode.toLowerCase()}`;

    // Update document title and description
    document.title = pageTitle;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", pageDescription);

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", canonicalUrl);

    // Inject Schema.org ItemList with MusicVenue items
    const schemaItemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `Live Music Venues & Booking Specs in ${city}, ${stateCode}`,
      "description": pageDescription,
      "url": canonicalUrl,
      "numberOfItems": venues.length,
      "itemListElement": venues.slice(0, 30).map((v, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "item": {
          "@type": "MusicVenue",
          "name": v.name,
          "address": {
            "@type": "PostalAddress",
            "streetAddress": v.address,
            "addressLocality": v.city,
            "addressRegion": v.state,
            "addressCountry": "US"
          },
          "maximumAttendeeCapacity": v.capacity || undefined,
          "telephone": v.phone || undefined,
          "url": v.website ? (v.website.startsWith("http") ? v.website : `https://${v.website}`) : undefined,
          "description": v.description || undefined
        }
      }))
    };

    let scriptTag = document.getElementById("programmatic-city-jsonld") as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement("script");
      scriptTag.id = "programmatic-city-jsonld";
      scriptTag.type = "application/ld+json";
      document.head.appendChild(scriptTag);
    }
    scriptTag.text = JSON.stringify(schemaItemList, null, 2);

    return () => {
      const existing = document.getElementById("programmatic-city-jsonld");
      if (existing) existing.remove();
    };
  }, [city, stateCode, venues]);

  const handleCopyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmailId(id);
    setTimeout(() => setCopiedEmailId(null), 2500);
  };

  const handleNavigateToGeneral = () => {
    if (onNavigateProgrammaticRoute) {
      onNavigateProgrammaticRoute(null, "/venues");
    }
  };

  return (
    <div className="space-y-6" id="city-venue-directory-root">
      {/* 1. Breadcrumbs Linking back to GigLizard Home and General Venue Directory */}
      <nav
        aria-label="Breadcrumbs"
        className="flex items-center gap-2 text-xs font-semibold text-slate-500 flex-wrap"
      >
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            if (onNavigateProgrammaticRoute) onNavigateProgrammaticRoute(null, "/");
          }}
          className="hover:text-indigo-600 transition-colors"
        >
          Home
        </a>
        <span className="text-slate-300">/</span>
        <a
          href="/venues"
          onClick={(e) => {
            e.preventDefault();
            handleNavigateToGeneral();
          }}
          className="hover:text-indigo-600 transition-colors"
        >
          Venue Directory
        </a>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-bold">
          {city}, {stateCode}
        </span>
        {selectedVenue && (
          <>
            <span className="text-slate-300">/</span>
            <span className="text-indigo-600 font-bold truncate max-w-[200px]">
              {selectedVenue.name}
            </span>
          </>
        )}
      </nav>

      {/* 2. SEO Hero Header with H1 */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 md:p-10 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>Touring Corridor Directory · {stateName}</span>
          </div>

          {/* Exact required H1 */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Live Music Venues & Booking Specs in {city}, {stateCode}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
            Direct talent buyer booking emails, club capacities, house PA specs, and DIY stage dimensions across {city}, {stateName}. Zero subscription fees or booking middleman cuts.
          </p>

          {/* 3. City Summary Bar */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-400" />
                <span>Verified Rooms</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mt-1">
                {loading ? "..." : summaryMetrics.totalRooms}
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                Active live stages
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Avg Room Capacity</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mt-1">
                {loading ? "..." : `${summaryMetrics.avgCapacity} cap`}
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                Mid-sized club average
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Common Genres</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {summaryMetrics.commonGenres.map((g) => (
                  <span
                    key={g}
                    className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-200 border border-indigo-400/20"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Required Call-To-Action Banner */}
      <div
        className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-emerald-500/10 border-2 border-indigo-500/30 rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-5 shadow-lg bg-slate-900 text-white"
        id="city-venue-cta-banner"
      >
        <div className="space-y-1.5 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Community Curated Stages</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Are you a local venue or promoter? Claim or add your room for touring acts.
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Ensure touring acts have your exact soundboard specs, stage dimensions, load-in directives, and verified talent buyer inboxes. 100% free with no subscription gate.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (onTriggerRegisterVenue) {
                onTriggerRegisterVenue();
              } else {
                handleNavigateToGeneral();
              }
            }}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Claim or Add Room</span>
          </button>
          <button
            type="button"
            onClick={handleNavigateToGeneral}
            className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>All 48 States</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5. Venue List / Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span>Verified Live Stages in {city}</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {venues.length} Available
            </span>
          </h3>

          <button
            type="button"
            onClick={handleNavigateToGeneral}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
          >
            <span>Back to National Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-600">
              Querying verified {city}, {stateCode} venue database...
            </p>
          </div>
        ) : venues.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <Building className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-base font-bold text-slate-900">
              No live stages listed in {city}, {stateCode} yet
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Be the first to add a live music stage or DIY room in {city} to help touring bands discover your space.
            </p>
            <button
              type="button"
              onClick={() => {
                if (onTriggerRegisterVenue) onTriggerRegisterVenue();
                else handleNavigateToGeneral();
              }}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add {city} Venue</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {venues.map((venue) => {
              const isSelected = selectedVenue?.id === venue.id;
              const venueSlug = venue.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

              return (
                <div
                  key={venue.id}
                  id={`venue-card-${venue.id}`}
                  className={`bg-white rounded-2xl border transition-all hover:shadow-lg p-5 sm:p-6 flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? "border-indigo-600 ring-2 ring-indigo-500/20 shadow-md"
                      : "border-slate-200 shadow-xs"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Name, Capacity & Age Limit */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                          {venue.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="truncate">{venue.address}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Users className="w-3 h-3 text-indigo-500" />
                          <span>{venue.capacity ? `${venue.capacity} cap` : "150 cap"}</span>
                        </span>
                        {venue.age_limit && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            {venue.age_limit}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Genres */}
                    {venue.genres_accepted && venue.genres_accepted.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {venue.genres_accepted.slice(0, 4).map((g) => (
                          <span
                            key={g}
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Production / Stage Specs */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-150 grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700">
                        <Volume2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>PA System:</span>
                        <span className="text-emerald-700 font-extrabold">
                          {venue.hasPA ? "House PA On-Site" : "Band Provides PA"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-700">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Lighting:</span>
                        <span className="text-slate-800 font-semibold">
                          {venue.hasLighting ? "Stage Rig Installed" : "Basic Ambience"}
                        </span>
                      </div>
                    </div>

                    {/* Vibe / Stage Notes */}
                    {venue.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {venue.description}
                      </p>
                    )}
                  </div>

                  {/* Booking Contact Info & Production Actions */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700 font-mono text-[11px] bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 truncate max-w-[220px]">
                        <Mail className="w-3 h-3 text-indigo-600 shrink-0" />
                        <span className="truncate">{venue.booking_email}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyEmail(venue.booking_email, venue.id)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 flex items-center gap-1 transition-all cursor-pointer"
                        >
                          {copiedEmailId === venue.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Email</span>
                            </>
                          )}
                        </button>

                        {venue.website && (
                          <a
                            href={venue.website.startsWith("http") ? venue.website : `https://${venue.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors"
                            title="Visit Official Website"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Action Tool Triggers: Poster & Stage Plot */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectVenueForPoster) {
                            onSelectVenueForPoster({
                              id: venue.id,
                              name: venue.name,
                              city: venue.city,
                              state: venue.state,
                              capacity: venue.capacity || 200,
                              address: venue.address,
                              genres: venue.genres_accepted || ["Rock"],
                              contactEmail: venue.booking_email,
                              contactPhone: venue.phone || "",
                              hasPA: Boolean(venue.hasPA),
                              hasLighting: Boolean(venue.hasLighting),
                              description: venue.description || "",
                              website: venue.website || ""
                            });
                          }
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>Design Gig Flyer</span>
                      </button>

                      <a
                        href={`/venues/${city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${stateCode.toLowerCase()}/${venueSlug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedVenue(venue);
                        }}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
                      >
                        <span>View Specs</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Venue Profile Specs Modal when selected */}
      {selectedVenue && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          onClick={() => setSelectedVenue(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600">
                  {selectedVenue.city}, {selectedVenue.state} Live Stage Profile
                </span>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                  {selectedVenue.name}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{selectedVenue.address}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedVenue(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400">Capacity</span>
                <div className="text-lg font-black text-slate-900">{selectedVenue.capacity || 200} guests</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400">Age Policy</span>
                <div className="text-lg font-black text-slate-900">{selectedVenue.age_limit || "21+"}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Audio Rig</span>
                <div className="text-lg font-black text-emerald-700">House PA</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Production & Booking Guidelines
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                {selectedVenue.description || `Active live music room in ${city}, ${stateCode}. Load-in starts 2 hours prior to doors. Bring digital stage plots and tech riders.`}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="w-full sm:w-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyEmail(selectedVenue.booking_email, "modal")}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  {copiedEmailId === "modal" ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Copied Booking Email!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy {selectedVenue.booking_email}</span>
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedVenue(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Close Specs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
