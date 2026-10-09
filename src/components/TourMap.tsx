import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TourStop } from "../types";
import { 
  Navigation, 
  MapPin, 
  Clock, 
  Calendar, 
  Maximize2, 
  ExternalLink, 
  Music, 
  Building, 
  RotateCcw,
  Layers,
  Sparkles
} from "lucide-react";

// Known coordinates for fast, immediate rendering of popular touring cities
const KNOWN_CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Pacific Northwest
  "bellingham, wa": { lat: 48.7519, lng: -122.4787 },
  "bellingham": { lat: 48.7519, lng: -122.4787 },
  "everett, wa": { lat: 47.9790, lng: -122.2021 },
  "everett": { lat: 47.9790, lng: -122.2021 },
  "seattle, wa": { lat: 47.6062, lng: -122.3321 },
  "seattle": { lat: 47.6062, lng: -122.3321 },
  "tacoma, wa": { lat: 47.2529, lng: -122.4443 },
  "tacoma": { lat: 47.2529, lng: -122.4443 },
  "olympia, wa": { lat: 47.0379, lng: -122.9007 },
  "olympia": { lat: 47.0379, lng: -122.9007 },
  "vancouver, wa": { lat: 45.6387, lng: -122.6615 },
  "spokane, wa": { lat: 47.6588, lng: -117.4260 },
  "yakima, wa": { lat: 46.6021, lng: -120.5059 },
  "wenatchee, wa": { lat: 47.4235, lng: -120.3103 },
  "portland, or": { lat: 45.5152, lng: -122.6784 },
  "portland": { lat: 45.5152, lng: -122.6784 },
  "salem, or": { lat: 44.9429, lng: -123.0351 },
  "salem": { lat: 44.9429, lng: -123.0351 },
  "eugene, or": { lat: 44.0521, lng: -123.0868 },
  "eugene": { lat: 44.0521, lng: -123.0868 },
  "corvallis, or": { lat: 44.5646, lng: -123.2620 },
  "bend, or": { lat: 44.0582, lng: -121.3153 },
  "bend": { lat: 44.0582, lng: -121.3153 },
  "medford, or": { lat: 42.3265, lng: -122.8756 },
  "medford": { lat: 42.3265, lng: -122.8756 },
  "ashland, or": { lat: 42.1946, lng: -122.7095 },
  "boise, id": { lat: 43.6150, lng: -116.2023 },
  "boise": { lat: 43.6150, lng: -116.2023 },
  "missoula, mt": { lat: 46.8721, lng: -113.9940 },
  "bozeman, mt": { lat: 45.6770, lng: -111.0429 },
  "vancouver, bc": { lat: 49.2827, lng: -123.1207 },
  "victoria, bc": { lat: 48.4284, lng: -123.3656 },

  // California & West Coast
  "sacramento, ca": { lat: 38.5816, lng: -121.4944 },
  "san francisco, ca": { lat: 37.7749, lng: -122.4194 },
  "san francisco": { lat: 37.7749, lng: -122.4194 },
  "oakland, ca": { lat: 37.8044, lng: -122.2712 },
  "oakland": { lat: 37.8044, lng: -122.2712 },
  "san jose, ca": { lat: 37.3382, lng: -121.8863 },
  "santa cruz, ca": { lat: 36.9741, lng: -122.0308 },
  "fresno, ca": { lat: 36.7468, lng: -119.7726 },
  "bakersfield, ca": { lat: 35.3733, lng: -119.0187 },
  "santa barbara, ca": { lat: 34.4208, lng: -119.6982 },
  "los angeles, ca": { lat: 34.0522, lng: -118.2437 },
  "los angeles": { lat: 34.0522, lng: -118.2437 },
  "long beach, ca": { lat: 33.7701, lng: -118.1937 },
  "san diego, ca": { lat: 32.7157, lng: -117.1611 },
  "san diego": { lat: 32.7157, lng: -117.1611 },

  // Mountain & Southwest
  "reno, nv": { lat: 39.5296, lng: -119.8138 },
  "las vegas, nv": { lat: 36.1699, lng: -115.1398 },
  "las vegas": { lat: 36.1699, lng: -115.1398 },
  "salt lake city, ut": { lat: 40.7608, lng: -111.8910 },
  "phoenix, az": { lat: 33.4484, lng: -112.0740 },
  "tucson, az": { lat: 32.2226, lng: -110.9747 },
  "denver, co": { lat: 39.7392, lng: -104.9903 },
  "boulder, co": { lat: 40.0150, lng: -105.2705 },
  "albuquerque, nm": { lat: 35.0844, lng: -106.6504 },

  // Texas & South
  "austin, tx": { lat: 30.2672, lng: -97.7431 },
  "san antonio, tx": { lat: 29.4241, lng: -98.4936 },
  "houston, tx": { lat: 29.7604, lng: -95.3698 },
  "dallas, tx": { lat: 32.7767, lng: -96.7970 },
  "nashville, tn": { lat: 36.1627, lng: -86.7816 },
  "memphis, tn": { lat: 35.1495, lng: -90.0490 },
  "new orleans, la": { lat: 29.9511, lng: -90.0715 },
  "atlanta, ga": { lat: 33.7490, lng: -84.3880 },

  // Midwest & East
  "chicago, il": { lat: 41.8781, lng: -87.6298 },
  "minneapolis, mn": { lat: 44.9778, lng: -93.2650 },
  "milwaukee, wi": { lat: 43.0389, lng: -87.9065 },
  "st. louis, mo": { lat: 38.6270, lng: -90.1994 },
  "detroit, mi": { lat: 42.3314, lng: -83.0458 },
  "cleveland, oh": { lat: 41.4993, lng: -81.6944 },
  "new york, ny": { lat: 40.7128, lng: -74.0060 },
  "philadelphia, pa": { lat: 39.9526, lng: -75.1652 },
  "boston, ma": { lat: 42.3601, lng: -71.0589 }
};

export interface ResolvedStopLocation {
  stop: TourStop;
  index: number;
  lat: number;
  lng: number;
  label: string;
  venueName: string;
  address: string;
  city: string;
  state: string;
}

interface TourMapProps {
  stops: TourStop[];
  tourTitle?: string;
  totalDistanceMiles?: number;
  totalDriveTime?: string;
  activeStopIndex?: number | null;
  onSelectStop?: (index: number) => void;
  className?: string;
}

export const TourMap: React.FC<TourMapProps> = ({
  stops,
  tourTitle = "Tour Route",
  totalDistanceMiles,
  totalDriveTime,
  activeStopIndex,
  onSelectStop,
  className = ""
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylinesRef = useRef<L.Polyline[]>([]);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [selectedStopIndex, setSelectedStopIndex] = useState<number | null>(activeStopIndex ?? 0);
  const [mapStyle, setMapStyle] = useState<"standard" | "voyager" | "satellite">("voyager");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);

  // Sync internal selected stop with prop changes
  useEffect(() => {
    if (activeStopIndex !== null && activeStopIndex !== undefined) {
      setSelectedStopIndex(activeStopIndex);
      // Pan to the selected stop if map exists
      if (mapInstanceRef.current && markersRef.current[activeStopIndex]) {
        const marker = markersRef.current[activeStopIndex];
        mapInstanceRef.current.panTo(marker.getLatLng(), { animate: true });
        marker.openPopup();
      }
    }
  }, [activeStopIndex]);

  // Resolve coordinates for all stops
  const resolvedStops: ResolvedStopLocation[] = useMemo(() => {
    return stops.map((stop, index) => {
      const cityKey = `${stop.city}, ${stop.state || ""}`.toLowerCase().trim();
      const simpleCityKey = stop.city.toLowerCase().trim();
      const venueName = stop.selectedVenue?.name || stop.suggestedVenues?.[0]?.name || `${stop.city} Venue`;
      const address = stop.selectedVenue?.address || stop.suggestedVenues?.[0]?.address || `${stop.city}, ${stop.state}`;

      let coords = KNOWN_CITY_COORDINATES[cityKey] || KNOWN_CITY_COORDINATES[simpleCityKey];

      if (!coords) {
        // Fallback offset around Pacific Northwest center
        const baseLat = 47.6062;
        const baseLng = -122.3321;
        const latOffset = (index - stops.length / 2) * 0.45;
        const lngOffset = (index % 2 === 0 ? 0.2 : -0.2);
        coords = {
          lat: baseLat + latOffset,
          lng: baseLng + lngOffset
        };
      }

      return {
        stop,
        index,
        lat: coords.lat,
        lng: coords.lng,
        label: `Stop ${index + 1}`,
        venueName,
        address,
        city: stop.city,
        state: stop.state
      };
    });
  }, [stops]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up old instance if container was remounted
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const defaultLat = resolvedStops.length > 0 ? resolvedStops[0].lat : 47.6062;
    const defaultLng = resolvedStops.length > 0 ? resolvedStops[0].lng : -122.3321;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 7,
      zoomControl: true,
      scrollWheelZoom: true
    });

    mapInstanceRef.current = map;

    // Set initial tile layer (Free OpenStreetMap / CartoDB Voyager)
    const getTileConfig = (style: "standard" | "voyager" | "satellite") => {
      if (style === "standard") {
        return {
          url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        };
      } else if (style === "satellite") {
        return {
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          attribution: '&copy; Esri, Maxar, Earthstar Geographics'
        };
      } else {
        // Voyager: Modern, elegant light aesthetic
        return {
          url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        };
      }
    };

    const tileConf = getTileConfig(mapStyle);
    const tileLayer = L.tileLayer(tileConf.url, {
      attribution: tileConf.attribution,
      maxZoom: 19
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Invalidate size after mounting to avoid Leaflet rendering artifacts
    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when Map Style toggled
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    let url = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    let attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

    if (mapStyle === "standard") {
      url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      attribution = '&copy; OpenStreetMap contributors';
    } else if (mapStyle === "satellite") {
      url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      attribution = '&copy; Esri World Imagery';
    }

    tileLayerRef.current = L.tileLayer(url, {
      attribution,
      maxZoom: 19
    }).addTo(mapInstanceRef.current);
  }, [mapStyle]);

  // Update Markers, Route Polylines, and Fit Bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || resolvedStops.length === 0) return;

    // 1. Clear previous markers and polylines
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];
    polylinesRef.current.forEach(p => map.removeLayer(p));
    polylinesRef.current = [];

    // 2. Add Stop Markers with custom HTML DivIcons
    const bounds = L.latLngBounds([]);

    resolvedStops.forEach((loc, idx) => {
      const isStart = idx === 0;
      const isEnd = idx === resolvedStops.length - 1;
      const isSelected = selectedStopIndex === loc.index;

      bounds.extend([loc.lat, loc.lng]);

      // Badge color styling
      const bgHex = isStart ? "#10b981" : isEnd ? "#f43f5e" : "#6366f1";
      const borderHex = isStart ? "#059669" : isEnd ? "#e11d48" : "#4f46e5";

      const customIcon = L.divIcon({
        className: "custom-tour-pin",
        html: `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            transform: translate(-50%, -100%);
            cursor: pointer;
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.25));
          ">
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background-color: ${bgHex};
              border: 2px solid #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-weight: 900;
              font-size: 13px;
              box-shadow: 0 0 0 2px ${borderHex};
              transition: transform 0.2s ease;
            ">
              ${idx + 1}
            </div>
            <div style="
              margin-top: 3px;
              background-color: ${isSelected ? "#0f172a" : "#ffffff"};
              color: ${isSelected ? "#ffffff" : "#1e293b"};
              border: 1px solid ${isSelected ? "#334155" : "#cbd5e1"};
              padding: 2px 7px;
              border-radius: 6px;
              font-size: 10px;
              font-weight: 700;
              white-space: nowrap;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            ">
              ${loc.city}
            </div>
          </div>
        `,
        iconSize: [32, 54],
        iconAnchor: [16, 54],
        popupAnchor: [0, -52]
      });

      const marker = L.marker([loc.lat, loc.lng], { icon: customIcon });

      // Rich Leaflet Popup
      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; color: #0f172a; padding: 4px; min-width: 210px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 800; color: #4f46e5; text-transform: uppercase;">
              Stop ${idx + 1} &bull; Day ${loc.stop.dayNumber || idx + 1}
            </span>
            ${loc.stop.date ? `<span style="font-size: 10px; color: #64748b;">${loc.stop.date}</span>` : ""}
          </div>
          <div style="font-size: 13px; font-weight: 900; color: #0f172a; margin-bottom: 2px;">
            ${loc.venueName}
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 8px;">
            📍 ${loc.address || `${loc.city}, ${loc.state}`}
          </div>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px; font-size: 11px; margin-bottom: 8px;">
            <div><strong>Leg:</strong> ${loc.stop.driveTimeFromPrev || "Start Point"}</div>
            <div><strong>Distance:</strong> ${loc.stop.distanceMilesFromPrev ? `${loc.stop.distanceMilesFromPrev} mi` : "Starting Venue"}</div>
            ${loc.stop.selectedVenue?.capacity ? `<div><strong>Capacity:</strong> ${loc.stop.selectedVenue.capacity} guests</div>` : ""}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <a 
              href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address || `${loc.venueName}, ${loc.city}, ${loc.state}`)}"
              target="_blank"
              rel="noopener noreferrer"
              style="color: #4f46e5; font-size: 11px; font-weight: 700; text-decoration: none;"
            >
              Open in Maps &rarr;
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 280 });

      marker.on("click", () => {
        setSelectedStopIndex(loc.index);
        onSelectStop?.(loc.index);
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });

    // 3. Render Route Polylines
    if (resolvedStops.length >= 2) {
      const latlngs: [number, number][] = resolvedStops.map(s => [s.lat, s.lng]);

      // Glow outline line
      const glowLine = L.polyline(latlngs, {
        color: "#4f46e5",
        weight: 8,
        opacity: 0.35,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(map);

      // Core crisp polyline
      const coreLine = L.polyline(latlngs, {
        color: "#6366f1",
        weight: 4,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(map);

      polylinesRef.current = [glowLine, coreLine];

      // Try fetching free OpenStreetMap OSRM driving geometry for real road curves
      const osrmCoordinates = resolvedStops.map(s => `${s.lng},${s.lat}`).join(";");
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${osrmCoordinates}?overview=full&geometries=geojson`;

      setIsRoutingLoading(true);
      fetch(osrmUrl)
        .then(res => res.json())
        .then(data => {
          setIsRoutingLoading(false);
          if (data && data.routes && data.routes[0] && data.routes[0].geometry) {
            const coords = data.routes[0].geometry.coordinates;
            const roadLatLngs: [number, number][] = coords.map((c: [number, number]) => [c[1], c[0]]);

            // Replace straight lines with true road-following polyline
            polylinesRef.current.forEach(p => map.removeLayer(p));

            const roadGlow = L.polyline(roadLatLngs, {
              color: "#4338ca",
              weight: 8,
              opacity: 0.35,
              lineCap: "round",
              lineJoin: "round"
            }).addTo(map);

            const roadCore = L.polyline(roadLatLngs, {
              color: "#6366f1",
              weight: 4,
              opacity: 0.95,
              lineCap: "round",
              lineJoin: "round"
            }).addTo(map);

            polylinesRef.current = [roadGlow, roadCore];
          }
        })
        .catch(err => {
          setIsRoutingLoading(false);
          // Seamlessly keeps direct polyline fallback
          console.warn("OSRM road routing fallback active:", err?.message || err);
        });
    }

    // 4. Auto-fit bounds with padding
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [resolvedStops, onSelectStop]);

  // Handle Jump to Stop button click
  const handleJumpToStop = useCallback((index: number) => {
    setSelectedStopIndex(index);
    onSelectStop?.(index);
    const map = mapInstanceRef.current;
    const target = resolvedStops[index];
    if (map && target) {
      map.panTo([target.lat, target.lng], { animate: true });
      if (markersRef.current[index]) {
        markersRef.current[index].openPopup();
      }
    }
  }, [resolvedStops, onSelectStop]);

  // Handle Fit View bounds
  const handleResetBounds = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || resolvedStops.length === 0) return;
    const bounds = L.latLngBounds(resolvedStops.map(s => [s.lat, s.lng]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [resolvedStops]);

  // Handle Fullscreen resize trigger
  const handleToggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);
  };

  // Google Maps external turn-by-turn navigation URL for mobile users
  const googleMapsRouteUrl = useMemo(() => {
    if (!stops || stops.length === 0) return "https://www.google.com/maps";
    const getLoc = (s: TourStop) => {
      if (s.selectedVenue?.address && s.selectedVenue.address.length > 4) {
        return s.selectedVenue.address;
      }
      return `${s.city}, ${s.state || ""}`.trim();
    };
    const origin = getLoc(stops[0]);
    const destination = getLoc(stops[stops.length - 1]);
    const waypoints = stops.slice(1, -1).map(getLoc);
    const wpParam = waypoints.length > 0 ? `&waypoints=${encodeURIComponent(waypoints.join("|"))}` : "";
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${wpParam}&travelmode=driving`;
  }, [stops]);

  return (
    <div 
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all ${
        isFullscreen 
          ? "fixed inset-4 z-50 shadow-2xl rounded-2xl border-slate-300" 
          : className
      }`}
    >
      {/* Header Bar */}
      <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                {tourTitle} - Interactive Tour Route Map
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                <span>OpenStreetMap</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Free OpenStreetMap &amp; Leaflet visualization with live venue stops &amp; driving routes
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Map Style Selector */}
          <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setMapStyle("voyager")}
              className={`px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                mapStyle === "voyager" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-300 hover:text-white"
              }`}
              title="Clean high-contrast vector cartography"
            >
              Voyager
            </button>
            <button
              type="button"
              onClick={() => setMapStyle("standard")}
              className={`px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                mapStyle === "standard" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-300 hover:text-white"
              }`}
              title="Standard OpenStreetMap tiles"
            >
              OSM
            </button>
            <button
              type="button"
              onClick={() => setMapStyle("satellite")}
              className={`px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                mapStyle === "satellite" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-300 hover:text-white"
              }`}
              title="High-resolution aerial satellite imagery"
            >
              Satellite
            </button>
          </div>

          {/* Reset Bounds Button */}
          <button
            type="button"
            onClick={handleResetBounds}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Reset view to fit all tour stops"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* External GPS Directions Link */}
          <a
            href={googleMapsRouteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            title="Open turn-by-turn mobile GPS directions"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Turn-by-Turn GPS</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>

          {/* Fullscreen Expand Toggle */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Expand Map"}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Stop Jump Carousel Strip */}
      {stops.length > 0 && (
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 overflow-x-auto scrollbar-none flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider shrink-0 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>Jump to Stop:</span>
          </span>
          <div className="flex items-center gap-1.5">
            {resolvedStops.map((s, idx) => {
              const isActive = selectedStopIndex === idx;
              return (
                <button
                  key={`stop-pill-${idx}`}
                  type="button"
                  onClick={() => handleJumpToStop(idx)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    isActive 
                      ? "bg-indigo-600 text-white border-indigo-700 shadow-xs scale-102" 
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}>
                    {idx + 1}
                  </span>
                  <span>{s.city}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Leaflet Map Canvas */}
      <div className={`w-full relative bg-slate-100 ${isFullscreen ? "flex-1 min-h-[500px]" : "h-96 sm:h-[450px]"}`}>
        <div 
          ref={mapContainerRef} 
          className="w-full h-full z-0" 
          style={{ minHeight: "380px" }}
        />

        {/* Legend / Route Summary Overlay */}
        <div className="absolute bottom-3 left-3 z-1000 bg-white/95 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200/90 shadow-md text-xs space-y-1.5 max-w-xs pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
            <span className="text-[11px] font-bold text-slate-700">Origin: {stops[0]?.city || "Start"}</span>
          </div>
          {stops.length > 2 && (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-indigo-200" />
              <span className="text-[11px] font-bold text-slate-700">{stops.length - 2} Tour Stages</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200" />
            <span className="text-[11px] font-bold text-slate-700">Destination: {stops[stops.length - 1]?.city || "End"}</span>
          </div>
          {totalDistanceMiles !== undefined && (
            <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-3 text-[10px] text-slate-500">
              <span>{totalDistanceMiles} total driving miles</span>
              {totalDriveTime && <span className="font-semibold text-slate-700">{totalDriveTime}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TourMap;
