import React, { useState } from "react";
import { TourStop, TourLodgingOption, TourSelectedLodging } from "../types";
import { Shield, Hotel, MapPin, DollarSign, Check, X, Building, Car, ExternalLink, BedDouble } from "lucide-react";

interface LodgingPickerModalProps {
  stop: TourStop;
  onSave: (selectedLodging: TourSelectedLodging) => void;
  onClose: () => void;
}

export const LodgingPickerModal: React.FC<LodgingPickerModalProps> = ({ stop, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<"suggested" | "custom">("suggested");

  // Custom lodging state
  const [customName, setCustomName] = useState(stop.selectedLodging?.name || "");
  const [customType, setCustomType] = useState(stop.selectedLodging?.type || "Band-Friendly Hotel");
  const [customAddress, setCustomAddress] = useState(stop.selectedLodging?.address || "");
  const [customCost, setCustomCost] = useState<number | string>(stop.selectedLodging?.cost || 95);
  const [customConfirmation, setCustomConfirmation] = useState(stop.selectedLodging?.confirmationNumber || "");
  const [customCheckIn, setCustomCheckIn] = useState(stop.selectedLodging?.checkInTime || "3:00 PM / Late");
  const [customCheckOut, setCustomCheckOut] = useState(stop.selectedLodging?.checkOutTime || "11:00 AM");
  const [customSecurityNote, setCustomSecurityNote] = useState(
    stop.selectedLodging?.gearSecurityNote || "Back touring van tightly against wall. Bring guitars and pedalboards inside."
  );
  const [customNotes, setCustomNotes] = useState(stop.selectedLodging?.notes || "");

  const handleSelectSuggested = (lodge: TourLodgingOption) => {
    // Extract numeric price if possible
    let costVal: number | string = 95;
    if (lodge.estPricePerNight) {
      const match = lodge.estPricePerNight.match(/\d+/);
      if (match) costVal = parseInt(match[0], 10);
    }

    onSave({
      id: lodge.id,
      name: lodge.name,
      type: lodge.type,
      address: lodge.address || `${stop.city}, ${stop.state}`,
      cost: costVal,
      checkInTime: "Late Night Arrival OK",
      checkOutTime: "11:00 AM",
      gearSecurityNote: lodge.gearSecurityNote,
      bookingUrl: lodge.bookingSearchUrl,
      notes: lodge.amenities?.join(" • ")
    });
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    onSave({
      name: customName.trim(),
      type: customType,
      address: customAddress.trim() || `${stop.city}, ${stop.state}`,
      cost: customCost,
      confirmationNumber: customConfirmation.trim(),
      checkInTime: customCheckIn,
      checkOutTime: customCheckOut,
      gearSecurityNote: customSecurityNote,
      notes: customNotes
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-600 p-2 rounded-xl text-white">
              <Hotel className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Lodging & Van Security for {stop.city}, {stop.state}
              </h2>
              <p className="text-xs text-slate-300">
                Choose safe, band-vetted rooms or save custom reservation details
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("suggested")}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === "suggested" 
                ? "border-amber-600 text-amber-700 font-extrabold" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Curated Recommendations ({stop.lodgingOptions?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("custom")}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === "custom" 
                ? "border-amber-600 text-amber-700 font-extrabold" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Custom Lodging / Airbnb / Crash Pad
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === "suggested" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-medium mb-3">
                Band-friendly accommodations in {stop.city} with oversized parking, late check-in, and gear security:
              </p>

              {stop.lodgingOptions && stop.lodgingOptions.length > 0 ? (
                stop.lodgingOptions.map((lodge, i) => {
                  const isSelected = stop.selectedLodging?.name === lodge.name;
                  return (
                    <div 
                      key={lodge.id || i}
                      className={`p-4 rounded-xl border transition-all ${
                        isSelected 
                          ? "border-amber-600 bg-amber-50/60 shadow-xs" 
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {lodge.type}
                            </span>
                            <h3 className="font-extrabold text-slate-900 text-sm">{lodge.name}</h3>
                            {isSelected && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-amber-600 text-white text-[10px] font-bold rounded-full">
                                <Check className="w-3 h-3" /> Selected
                              </span>
                            )}
                          </div>

                          {lodge.address && (
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{lodge.address}</span>
                              {lodge.distanceToVenues && (
                                <span className="text-slate-400">({lodge.distanceToVenues})</span>
                              )}
                            </p>
                          )}

                          {lodge.estPricePerNight && (
                            <p className="text-xs font-bold text-slate-700">
                              Est. Rate: {lodge.estPricePerNight}
                            </p>
                          )}

                          {lodge.gearSecurityNote && (
                            <div className="bg-amber-100/70 text-amber-900 rounded-lg p-2 text-xs font-medium border border-amber-200/60 mt-1">
                              <strong>Van Security:</strong> {lodge.gearSecurityNote}
                            </div>
                          )}

                          {lodge.amenities && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {lodge.amenities.map((am, aIdx) => (
                                <span key={aIdx} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                  {am}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectSuggested(lodge)}
                          className="shrink-0 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                          {isSelected ? "Keep Selected" : "Select Lodging"}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No predefined lodging available. Use custom entry below.
                </div>
              )}
            </div>
          )}

          {activeTab === "custom" && (
            <form onSubmit={handleSaveCustom} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Lodging / Property Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Best Western Plus, Airbnb on 4th Ave, Drummer's Friend's House"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Type</label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white"
                  >
                    <option value="Band-Friendly Hotel">Band Hotel</option>
                    <option value="Budget Motel / Inn">Budget Motel</option>
                    <option value="Airbnb / Group Suite">Airbnb House</option>
                    <option value="Musician Crash Pad / Hostel">Musician Crash Pad</option>
                    <option value="Van / RV Secure Parking">Van Camping</option>
                    <option value="Driving Through / No Lodging">Driving Through</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    placeholder="e.g., 100 Main St, Seattle, WA"
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nightly Cost ($)</label>
                  <input
                    type="text"
                    placeholder="e.g. 110 or 0 for friend's pad"
                    value={customCost}
                    onChange={(e) => setCustomCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Confirmation / Lock Code</label>
                  <input
                    type="text"
                    placeholder="e.g., #HM89201 or keypad 4829"
                    value={customConfirmation}
                    onChange={(e) => setCustomConfirmation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Check-in Time</label>
                  <input
                    type="text"
                    placeholder="3:00 PM / Late OK"
                    value={customCheckIn}
                    onChange={(e) => setCustomCheckIn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Check-out Time</label>
                  <input
                    type="text"
                    placeholder="11:00 AM"
                    value={customCheckOut}
                    onChange={(e) => setCustomCheckOut(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Van Parking & Gear Security Plan</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Park in well-lit rear alley. Back bumper pressed against brick wall. Bring master guitar flight cases into room 104."
                  value={customSecurityNote}
                  onChange={(e) => setCustomSecurityNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-xs"
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
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Lodging Selection
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
