import React, { useState } from "react";
import { TourStop } from "../types";
import { MapPin, Calendar, Clock, Fuel, X, Save, Edit3 } from "lucide-react";

interface EditStopModalProps {
  stop: TourStop;
  onSave: (updatedStop: Partial<TourStop>) => void;
  onClose: () => void;
}

export const EditStopModal: React.FC<EditStopModalProps> = ({ stop, onSave, onClose }) => {
  const [stopName, setStopName] = useState(stop.stopName || "");
  const [city, setCity] = useState(stop.city || "");
  const [state, setState] = useState(stop.state || "");
  const [dayNumber, setDayNumber] = useState<number | string>(stop.dayNumber || 1);
  const [date, setDate] = useState(stop.date || "");
  const [driveTime, setDriveTime] = useState(stop.driveTimeFromPrev || "2 hrs 0 mins");
  const [distanceMiles, setDistanceMiles] = useState<number | string>(stop.distanceMilesFromPrev || 100);
  const [gasCost, setGasCost] = useState<number | string>(stop.estimatedGasCost || 35);
  const [customNotes, setCustomNotes] = useState(stop.customNotes || "");

  // Schedule Run-of-Show times
  const [loadInTime, setLoadInTime] = useState(stop.selectedVenue?.loadInTime || "5:00 PM");
  const [soundcheckTime, setSoundcheckTime] = useState(stop.selectedVenue?.soundcheckTime || "6:30 PM");
  const [doorsTime, setDoorsTime] = useState(stop.selectedVenue?.doorsTime || "7:30 PM");
  const [setTime, setSetTime] = useState(stop.selectedVenue?.setTime || "9:00 PM - 10:30 PM");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) return;

    const updatedVenue = stop.selectedVenue ? {
      ...stop.selectedVenue,
      loadInTime: loadInTime.trim() || "5:00 PM",
      soundcheckTime: soundcheckTime.trim() || "6:30 PM",
      doorsTime: doorsTime.trim() || "7:30 PM",
      setTime: setTime.trim() || "9:00 PM - 10:30 PM"
    } : undefined;

    onSave({
      stopName: stopName.trim() || `Stop in ${city.trim()}`,
      city: city.trim(),
      state: state.trim(),
      dayNumber: Number(dayNumber) || 1,
      date: date.trim() || undefined,
      driveTimeFromPrev: driveTime.trim(),
      distanceMilesFromPrev: Number(distanceMiles) || 0,
      estimatedGasCost: Number(gasCost) || 0,
      customNotes: customNotes.trim() || undefined,
      ...(updatedVenue ? { selectedVenue: updatedVenue } : {})
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Edit Tour Stop Details</h2>
              <p className="text-xs text-slate-300">Customize city, date, mileage, and travel time</p>
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

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Stop Title</label>
            <input
              type="text"
              value={stopName}
              onChange={(e) => setStopName(e.target.value)}
              placeholder="e.g. Leg 2: Portland Bridge City"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block font-bold text-slate-700 mb-1">City *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Portland"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. OR"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Day #</label>
              <input
                type="number"
                min={1}
                value={dayNumber}
                onChange={(e) => setDayNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Performance Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Drive Time</label>
              <input
                type="text"
                value={driveTime}
                onChange={(e) => setDriveTime(e.target.value)}
                placeholder="2 hrs 15 mins"
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Distance (Miles)</label>
              <input
                type="number"
                min={0}
                value={distanceMiles}
                onChange={(e) => setDistanceMiles(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Est. Gas ($)</label>
              <input
                type="number"
                min={0}
                value={gasCost}
                onChange={(e) => setGasCost(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          {/* Run-of-Show Schedule Times */}
          <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Run-of-Show Times {stop.selectedVenue ? `(${stop.selectedVenue.name})` : "(Default)"}</span>
              </span>
              <span className="text-[10px] text-indigo-600 font-semibold">Load-in &bull; Soundcheck &bull; Doors &bull; Set</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">Load-in</label>
                <input
                  type="text"
                  value={loadInTime}
                  onChange={(e) => setLoadInTime(e.target.value)}
                  placeholder="5:00 PM"
                  className="w-full px-2 py-1.5 bg-white rounded-lg border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">Soundcheck</label>
                <input
                  type="text"
                  value={soundcheckTime}
                  onChange={(e) => setSoundcheckTime(e.target.value)}
                  placeholder="6:30 PM"
                  className="w-full px-2 py-1.5 bg-white rounded-lg border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">Doors</label>
                <input
                  type="text"
                  value={doorsTime}
                  onChange={(e) => setDoorsTime(e.target.value)}
                  placeholder="7:30 PM"
                  className="w-full px-2 py-1.5 bg-white rounded-lg border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">Set Time</label>
                <input
                  type="text"
                  value={setTime}
                  onChange={(e) => setSetTime(e.target.value)}
                  placeholder="9:00 PM - 10:30 PM"
                  className="w-full px-2 py-1.5 bg-white rounded-lg border border-indigo-300 text-xs font-bold text-indigo-700"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Custom Notes / Parking Instructions</label>
            <textarea
              rows={2}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Arrive early for load-in alley gate. Bring extra XLR cables."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
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
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Stop</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
