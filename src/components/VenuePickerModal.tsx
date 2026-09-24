import React, { useState } from "react";
import { TourStop, TourVenueStop, TourSelectedVenue, Venue } from "../types";
import { MUSIC_VENUES } from "../data/venues";
import { Search, Building, MapPin, Check, Plus, X, Users, DollarSign, Clock, Mail, Phone, ExternalLink } from "lucide-react";
import RatingStars from "./RatingStars";
import { getRatingStats } from "../utils/reviewsManager";


interface VenuePickerModalProps {
  stop: TourStop;
  onSave: (selectedVenue: TourSelectedVenue) => void;
  onClose: () => void;
}

export const VenuePickerModal: React.FC<VenuePickerModalProps> = ({ stop, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<"suggested" | "directory" | "custom">("suggested");
  const [searchQuery, setSearchQuery] = useState("");

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

  // All venues from data + local custom
  const allDirectoryVenues: Venue[] = (() => {
    const customVenues = (() => {
      const saved = localStorage.getItem("custom_venues_v1");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { return []; }
      }
      return [];
    })();
    return [...MUSIC_VENUES, ...customVenues];
  })();

  const filteredDirectoryVenues = allDirectoryVenues.filter(v => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      return v.city.toLowerCase().includes(stop.city.toLowerCase());
    }
    return (
      v.name.toLowerCase().includes(q) ||
      v.city.toLowerCase().includes(q) ||
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
            Suggested ({stop.suggestedVenues?.length || 0})
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
            Browse All Directory
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
            Custom Venue & Run-of-Show
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === "suggested" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-medium mb-3">
                Curated live stages in {stop.city} matched to your genre and tour routing:
              </p>
              {stop.suggestedVenues && stop.suggestedVenues.length > 0 ? (
                stop.suggestedVenues.map((v, i) => {
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
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">{v.name}</h3>
                            {isSelected && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full">
                                <Check className="w-3 h-3" /> Selected
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

              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No suggested venues for this stop. Use directory or custom entry.
                </div>
              )}
            </div>
          )}

          {activeTab === "directory" && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search 1,600+ venues by name, city, or genre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                {filteredDirectoryVenues.slice(0, 15).map((v) => {
                  const isSelected = stop.selectedVenue?.name === v.name;
                  const stats = getRatingStats(v.id, v.name, "venue");
                  return (
                    <div 
                      key={v.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900">{v.name}</p>
                        <RatingStars rating={stats.average} size="xs" showNumber={true} reviewCount={stats.count} />
                        <p className="text-[11px] text-slate-500">{v.city} &bull; Cap: {v.capacity || "N/A"}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectPredefined(v)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        {isSelected ? "Selected" : "Select"}
                      </button>
                    </div>
                  );
                })}
              </div>
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
