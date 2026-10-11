import React, { useState, useEffect } from "react";
import { TourStop, TourLodgingOption, TourSelectedLodging } from "../types";
import { 
  X, Hotel, ShieldCheck, Check, ExternalLink, Calendar, 
  Clock, DollarSign, Receipt, Car, Sparkles, MapPin, 
  AlertCircle, RefreshCw, KeyRound, BedDouble, Lock, Info
} from "lucide-react";
import { findLodgingForCity } from "../utils/tourLodgingData";

interface TourLodgingModalProps {
  isOpen: boolean;
  onClose: () => void;
  stop: TourStop;
  stopIndex: number;
  tourStartDate: string;
  onCommitReservation: (
    stopIndex: number, 
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
  ) => void;
}

export const TourLodgingModal: React.FC<TourLodgingModalProps> = ({
  isOpen,
  onClose,
  stop,
  stopIndex,
  tourStartDate,
  onCommitReservation
}) => {
  if (!isOpen || !stop) return null;

  // 1. Calculate check-in (show night) and check-out (next morning)
  const calculateDates = () => {
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

  const initialDates = calculateDates();
  const [checkInDate, setCheckInDate] = useState(initialDates.checkIn);
  const [checkOutDate, setCheckOutDate] = useState(initialDates.checkOut);

  // Active provider tab
  const [activeProvider, setActiveProvider] = useState<"partner" | "booking" | "hotels" | "google">("partner");

  // Vetted city lodging options
  const cityLodgings = stop.lodgingOptions && stop.lodgingOptions.length > 0 
    ? stop.lodgingOptions 
    : findLodgingForCity(stop.city, stop.state);

  // Existing selected lodging fallback
  const existing = stop.selectedLodging;

  // Form State for Reservation Import
  const [propertyName, setPropertyName] = useState<string>(
    existing?.name || (cityLodgings[0]?.name ?? `Band Motel ${stop.city}`)
  );
  const [confirmationNumber, setConfirmationNumber] = useState<string>(
    existing?.confirmationNumber || `GLZ-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [totalCost, setTotalCost] = useState<string>(
    existing?.cost ? String(existing.cost) : (cityLodgings[0]?.estPricePerNight?.replace(/[^0-9]/g, "") || "85")
  );
  const [parkingSpecs, setParkingSpecs] = useState<string>(
    existing?.gearSecurityNote || existing?.notes || "Ground-level surface lot with 14ft trailer clearance, lighted parking under CCTV."
  );
  const [roomNotes, setRoomNotes] = useState<string>(
    existing?.notes || "Late check-in requested for 1:30 AM after load-out. 2 Double Queen beds reserved under band manager name."
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format readable dates
  const formatReadable = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
      }
    } catch {}
    return dateStr;
  };

  // Generate external urls
  const fullCity = stop.state ? `${stop.city}, ${stop.state}` : stop.city;
  const bookingDotComUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
    fullCity
  )}&checkin=${checkInDate}&checkout=${checkOutDate}&group_adults=2&no_rooms=1&nflt=hotelfacility%3D2`;

  const hotelsDotComUrl = `https://www.hotels.com/Hotel-Search?destination=${encodeURIComponent(
    fullCity
  )}&startDate=${checkInDate}&endDate=${checkOutDate}&adults=2&sort=PRICE_LOW_TO_HIGH`;

  const googleHotelsUrl = `https://www.google.com/travel/hotels/${encodeURIComponent(
    fullCity
  )}?dates=${checkInDate}%2C${checkOutDate}`;

  // Handle preset selection
  const handleSelectPreset = (opt: TourLodgingOption) => {
    setPropertyName(opt.name);
    if (opt.estPricePerNight) {
      const parsedCost = opt.estPricePerNight.replace(/[^0-9]/g, "");
      if (parsedCost) setTotalCost(parsedCost);
    }
    if (opt.gearSecurityNote) {
      setParkingSpecs(opt.gearSecurityNote);
    }
  };

  // Generate new confirmation #
  const handleGenerateId = () => {
    const letters = ["HTL", "RES", "BKD", "GLZ"][Math.floor(Math.random() * 4)];
    const num = Math.floor(100000 + Math.random() * 900000);
    setConfirmationNumber(`${letters}-${num}`);
  };

  // Trigger postMessage simulation (partner widget completion hook)
  const handleSimulateWidgetCompletion = (presetName?: string, presetCost?: number, presetParking?: string) => {
    const payload = {
      type: "LODGING_BOOKING_COMPLETED",
      payload: {
        hotelName: presetName || propertyName,
        confirmationNumber: `BKG-${Math.floor(100000 + Math.random() * 900000)}`,
        cost: presetCost || Number(totalCost) || 85,
        parkingNotes: presetParking || parkingSpecs,
        notes: roomNotes,
        address: `${stop.city}, ${stop.state}`,
        type: "Band-Friendly Hotel"
      },
      stopIndex
    };
    // Post to window so the window message listener handles it
    window.postMessage(payload, "*");
  };

  // Commit and import
  const handleSaveAndImport = () => {
    setIsSubmitting(true);
    try {
      onCommitReservation(stopIndex, {
        name: propertyName.trim() || `Hotel in ${stop.city}`,
        confirmationNumber: confirmationNumber.trim() || `GLZ-${Date.now().toString().slice(-6)}`,
        cost: totalCost ? Number(totalCost) || totalCost : 85,
        parkingNotes: parkingSpecs.trim(),
        notes: roomNotes.trim(),
        address: `${stop.city}, ${stop.state}`,
        type: "Band-Friendly Hotel",
        checkIn: checkInDate,
        checkOut: checkOutDate
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      id="in-app-lodging-booking-modal"
    >
      <div 
        className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-lodging-title"
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white p-5 sm:p-6 shrink-0 flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs flex items-center gap-1">
                <Hotel className="w-3 h-3" />
                <span>Stop {stopIndex + 1} Lodging Hub</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-slate-900 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Van &amp; Gear Secure</span>
              </span>
            </div>

            <h3 id="modal-lodging-title" className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Book Band Lodging &amp; Van Parking:</span>
              <span className="text-amber-200 underline decoration-amber-300">{stop.city}, {stop.state}</span>
            </h3>

            <p className="text-xs text-amber-100 max-w-2xl">
              Pre-populated for show night check-in &amp; morning checkout. Direct-book below or auto-capture your confirmed reservation straight into the tour itinerary.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date & Filter Summary Bar */}
        <div className="bg-amber-50/90 border-b border-amber-200/80 px-5 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-700" />
              <div>
                <span className="text-[10px] font-black uppercase text-amber-800 block">Check-In (Show Night)</span>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="bg-white border border-amber-300 rounded px-2 py-0.5 text-xs font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700" />
              <div>
                <span className="text-[10px] font-black uppercase text-amber-800 block">Check-Out (Morning)</span>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="bg-white border border-amber-300 rounded px-2 py-0.5 text-xs font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-600">Active Criteria:</span>
            <span className="bg-white px-2 py-1 rounded-md border border-amber-200 text-[11px] font-black text-amber-900 flex items-center gap-1">
              <Car className="w-3 h-3 text-amber-600" />
              <span>Oversized Van / Trailer Parking</span>
            </span>
          </div>
        </div>

        {/* Modal Body: Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* Provider Selection Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveProvider("partner")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black shrink-0 flex items-center gap-1.5 cursor-pointer transition-all ${
                activeProvider === "partner"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>GigLizard Band Partner Network</span>
              <span className="bg-white/20 text-[10px] px-1.5 py-0.2 rounded-full font-bold">Vetted</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveProvider("booking")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black shrink-0 flex items-center gap-1.5 cursor-pointer transition-all ${
                activeProvider === "booking"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>Booking.com (Free Parking)</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>

            <button
              type="button"
              onClick={() => setActiveProvider("hotels")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black shrink-0 flex items-center gap-1.5 cursor-pointer transition-all ${
                activeProvider === "hotels"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>Hotels.com (Low Rates)</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>

            <button
              type="button"
              onClick={() => setActiveProvider("google")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black shrink-0 flex items-center gap-1.5 cursor-pointer transition-all ${
                activeProvider === "google"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>Google Hotels (Lot Satellite)</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>
          </div>

          {/* Partner Booking Engine / Search Container View */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                  <Hotel className="w-4 h-4 text-amber-600" />
                  <span>
                    {activeProvider === "partner" && `Vetted Band Crash Pads & Motels in ${stop.city}`}
                    {activeProvider === "booking" && `Booking.com Partner Portal — ${stop.city}`}
                    {activeProvider === "hotels" && `Hotels.com Partner Portal — ${stop.city}`}
                    {activeProvider === "google" && `Google Hotels Satellite Lot Search — ${stop.city}`}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Select any option to auto-populate reservation details, or use the 1-click book action.
                </p>
              </div>

              {/* Direct Open in new window fallback link */}
              <a
                href={
                  activeProvider === "booking" 
                    ? bookingDotComUrl 
                    : activeProvider === "hotels" 
                    ? hotelsDotComUrl 
                    : googleHotelsUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 self-start sm:self-auto bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all cursor-pointer"
              >
                <span>Open Direct in New Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Embedded Live Property Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {cityLodgings.map((lodging, idx) => {
                const isSelected = propertyName.toLowerCase() === lodging.name.toLowerCase();

                return (
                  <div
                    key={lodging.name || idx}
                    onClick={() => handleSelectPreset(lodging)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative ${
                      isSelected
                        ? "bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/20 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-900 text-xs sm:text-sm">
                            {lodging.name}
                          </span>
                          {isSelected && (
                            <span className="bg-amber-600 text-white rounded-full p-0.5">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{lodging.address || `${stop.city}, ${stop.state}`}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 block">
                          {lodging.estPricePerNight || "$85/nt"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold block pt-0.5">
                          {lodging.type || "Band Motel"}
                        </span>
                      </div>
                    </div>

                    {lodging.gearSecurityNote && (
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] text-slate-600 flex items-start gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{lodging.gearSecurityNote}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                      <span className="text-[11px] font-bold text-amber-700">
                        {isSelected ? "✓ Active in Import Form" : "Click to select"}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPreset(lodging);
                          handleSimulateWidgetCompletion(lodging.name, 85, lodging.gearSecurityNote);
                        }}
                        className="text-[11px] font-black px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white cursor-pointer transition-colors"
                      >
                        1-Click Instant Book
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Simulated Partner Web Frame (when booking.com or external selected) */}
            {activeProvider !== "partner" && (
              <div className="mt-3 p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono text-[11px]">
                      {activeProvider === "booking" && `https://booking.com/search?city=${encodeURIComponent(stop.city)}&free_parking=1`}
                      {activeProvider === "hotels" && `https://hotels.com/search?dest=${encodeURIComponent(stop.city)}&sort=price`}
                      {activeProvider === "google" && `https://google.com/travel/hotels?q=${encodeURIComponent(stop.city)}`}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">SSL 256-Bit Sandbox</span>
                </div>

                <div className="bg-slate-900 text-slate-200 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Partner Reservation Stream Connected</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      When booking through external partner tabs, copy your confirmation # into the form below, or click below to simulate an automated widget webhook.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSimulateWidgetCompletion()}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shrink-0 cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Trigger Partner Sync Callback</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Automated "Complete & Import Reservation" Form Container */}
          <div className="bg-gradient-to-br from-indigo-50/80 via-white to-amber-50/50 border-2 border-indigo-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-indigo-100">
              <div className="space-y-0.5">
                <h4 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  <span>Complete &amp; Import Reservation to Itinerary</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Values below will be automatically saved to <code className="bg-indigo-100 px-1 py-0.5 rounded text-[10px] font-mono text-indigo-800">route_data</code> in Supabase and marked as "Booked &amp; Confirmed".
                </p>
              </div>

              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-900 flex items-center gap-1 self-start sm:self-auto">
                <ShieldCheck className="w-3 h-3 text-indigo-600" />
                <span>Auto-Sync Ready</span>
              </span>
            </div>

            {/* Input Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              
              {/* Hotel Property Name */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Hotel / Accommodation Name *</span>
                  <span className="text-[10px] text-slate-400 font-normal">e.g. Motel 6 Portland Central</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                    placeholder="e.g. Motel 6 Portland Central or Airbnb on 4th"
                    className="w-full p-2.5 pl-8 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                  <Hotel className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Confirmation Number / Booking ID */}
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Confirmation / Booking ID *</span>
                  <button
                    type="button"
                    onClick={handleGenerateId}
                    className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Auto-Gen
                  </button>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={confirmationNumber}
                    onChange={(e) => setConfirmationNumber(e.target.value)}
                    placeholder="e.g. CONF-8924192"
                    className="w-full p-2.5 pl-8 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Total Stay Cost ($) */}
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Total Stay Cost ($) *</span>
                  <span className="text-[10px] text-slate-400 font-normal">nightly / total</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={totalCost}
                    onChange={(e) => setTotalCost(e.target.value)}
                    placeholder="e.g. 85 or 120"
                    className="w-full p-2.5 pl-8 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                  <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Parking Specifications */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Van &amp; Trailer Parking Clearance *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Height, pull-through, lighting</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={parkingSpecs}
                    onChange={(e) => setParkingSpecs(e.target.value)}
                    placeholder="e.g. Ground lot with 14ft clearance, pull-through trailer parking"
                    className="w-full p-2.5 pl-8 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                  <Car className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Room Notes & Late Check-In */}
              <div className="sm:col-span-3 space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Room Details &amp; Crew Notes</span>
                  <span className="text-[10px] text-slate-400 font-normal">Load-out arrival time, bed count</span>
                </label>
                <textarea
                  rows={2}
                  value={roomNotes}
                  onChange={(e) => setRoomNotes(e.target.value)}
                  placeholder="e.g. 2 double beds reserved under band manager name. Front desk confirmed van + trailer parking in rear lot under spotlight. Late check-in after midnight show."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>

            </div>

            {/* Commit Action Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Financial totals for this tour will automatically update with this reservation cost.</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndImport}
                  disabled={isSubmitting || !propertyName}
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isSubmitting ? "Syncing Itinerary..." : "Complete & Import Reservation"}</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
