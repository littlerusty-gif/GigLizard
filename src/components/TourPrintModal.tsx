import React, { useState } from "react";
import { TourPlan, TourStop } from "../types";
import { calculateTourFinancials, buildDynamicGoogleMapsUrl, formatPersonalizedItineraryText } from "../utils/tourRouteHelpers";
import { 
  Printer, 
  X, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Clock, 
  Shield, 
  Fuel, 
  Music, 
  ExternalLink, 
  Download, 
  FileText, 
  Copy, 
  Check, 
  AlertTriangle,
  Info,
  CheckCircle2,
  Navigation
} from "lucide-react";

interface TourPrintModalProps {
  tourPlan: TourPlan;
  bandName?: string;
  onClose: () => void;
}

export const TOUR_PLANNER_DISCLAIMER = "Booking is not final! You must contact the venue to book with them directly. This site is for planning & exposure and does not book bands for any venue, hotel, or any other accommodation.";

export const TourPrintModal: React.FC<TourPrintModalProps> = ({ tourPlan, bandName, onClose }) => {
  const fin = calculateTourFinancials(tourPlan.stops);
  const mapsUrl = buildDynamicGoogleMapsUrl(tourPlan.stops);
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = formatPersonalizedItineraryText(tourPlan, bandName);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadTxt = () => {
    const text = formatPersonalizedItineraryText(tourPlan, bandName);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeTitle = (tourPlan.tourTitle || "tour_itinerary").toLowerCase().replace(/[^a-z0-9]/g, "_");
    link.download = `${safeTitle}_master_sheet.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const exportData = {
      app: "GigLizard Tour Planner",
      version: "2.0",
      generatedAt: new Date().toISOString(),
      disclaimer: TOUR_PLANNER_DISCLAIMER,
      tourTitle: tourPlan.tourTitle,
      bandName: bandName || tourPlan.bandName,
      startingCity: tourPlan.startingCity,
      destinationCity: tourPlan.destinationCity,
      totalDistanceMiles: tourPlan.totalDistanceMiles,
      totalDriveTime: tourPlan.totalDriveTime,
      financials: fin,
      googleMapsRouteUrl: mapsUrl,
      stops: tourPlan.stops
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeTitle = (tourPlan.tourTitle || "tour_itinerary").toLowerCase().replace(/[^a-z0-9]/g, "_");
    link.download = `${safeTitle}_itinerary.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
      id="tour-print-modal-overlay"
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-slate-200"
        id="tour-print-modal-container"
      >
        {/* Action Header - Hidden during print */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 bg-slate-900 text-white gap-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">Print &amp; Export Tour Itinerary</h2>
              <p className="text-xs text-slate-300">Clean run-of-show for clipboard, van crew, venues, and crew riders</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              id="print-action-btn"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={handleDownloadTxt}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              title="Download clean plain text sheet"
            >
              <FileText className="w-4 h-4" />
              <span>Export .TXT</span>
            </button>

            <button
              onClick={handleDownloadJson}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              title="Download structured JSON file"
            >
              <Download className="w-4 h-4" />
              <span>JSON</span>
            </button>

            <button
              onClick={handleCopyText}
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                copied ? "bg-emerald-600 text-white" : "bg-slate-800 hover:bg-slate-700 text-white"
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>

            <button
              onClick={onClose}
              type="button"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close print preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 text-slate-800 font-sans print:p-0 print:m-0" id="printable-tour-document">
          
          {/* Prominent Required Disclaimer Box (Both Screen & Print) */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mb-6 text-amber-950 text-xs sm:text-sm">
            <div className="flex items-center gap-2 font-black uppercase tracking-wider text-amber-900 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Official Tour Notice &amp; Disclaimer</span>
            </div>
            <p className="font-bold leading-relaxed">
              &ldquo;{TOUR_PLANNER_DISCLAIMER}&rdquo;
            </p>
          </div>

          {/* Header info */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 text-xs font-black uppercase tracking-widest mb-1">
                <Music className="w-4 h-4" />
                <span>GigLizard Tour Master Run-of-Show</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {tourPlan.tourTitle || `${bandName || "Touring Band"} Run`}
              </h1>
              <p className="text-sm font-bold text-slate-600 mt-0.5">
                Route: {tourPlan.startingCity} → {tourPlan.destinationCity} &bull; {tourPlan.stops.length} Tour Dates
              </p>
            </div>
            <div className="text-left sm:text-right text-xs text-slate-500 font-medium">
              <p>Generated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
              <p className="font-mono text-[11px] text-indigo-600 font-bold">Total Mileage: {tourPlan.totalDistanceMiles} mi</p>
            </div>
          </div>

          {/* Quick Summary Metrics Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mb-6 text-center text-xs">
            <div className="p-2">
              <span className="text-slate-500 block text-[11px] uppercase font-bold tracking-wider">Total Drive</span>
              <span className="font-extrabold text-slate-900 text-sm">{tourPlan.totalDriveTime}</span>
            </div>
            <div className="p-2 border-l border-slate-200">
              <span className="text-slate-500 block text-[11px] uppercase font-bold tracking-wider">Est. Fuel Cost</span>
              <span className="font-extrabold text-slate-900 text-sm">${fin.totalGas}</span>
            </div>
            <div className="p-2 border-l border-slate-200">
              <span className="text-slate-500 block text-[11px] uppercase font-bold tracking-wider">Lodging Budget</span>
              <span className="font-extrabold text-slate-900 text-sm">${fin.totalLodgingCost}</span>
            </div>
            <div className="p-2 border-l border-slate-200">
              <span className="text-slate-500 block text-[11px] uppercase font-bold tracking-wider">Confirmed Stages</span>
              <span className="font-extrabold text-indigo-700 text-sm">{fin.confirmedVenuesCount} / {tourPlan.stops.length}</span>
            </div>
          </div>

          {/* Stop By Stop Itinerary Run of Show */}
          <div className="space-y-4 mb-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center justify-between">
              <span>Day-by-Day Performance Schedule &amp; Logistics</span>
              <span className="text-xs font-normal text-slate-500 lowercase">{tourPlan.stops.length} stops</span>
            </h2>

            {tourPlan.stops.map((stop, idx) => (
              <div 
                key={stop.id || idx}
                className="border border-slate-200 rounded-2xl p-4 bg-white break-inside-avoid"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-900 text-white font-extrabold text-xs">
                      {stop.dayNumber || idx + 1}
                    </span>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        {stop.city}, {stop.state}
                      </h3>
                      {stop.date && (
                        <p className="text-xs text-indigo-600 font-bold">{stop.date}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 font-medium flex items-center gap-3">
                    <span>Leg: {stop.distanceMilesFromPrev > 0 ? `${stop.distanceMilesFromPrev} mi` : "Start"} ({stop.driveTimeFromPrev})</span>
                    <span>Fuel: ${stop.estimatedGasCost || 0}</span>
                  </div>
                </div>

                {/* Venue & Schedule Column */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1 mb-1">
                      <Music className="w-3 h-3" />
                      <span>Stage &amp; Performance</span>
                    </span>
                    <p className="text-sm font-extrabold text-slate-900">
                      {stop.selectedVenue?.name || (stop.suggestedVenues[0]?.name ? `${stop.suggestedVenues[0].name} (Suggested)` : "Pending Venue Selection")}
                    </p>
                    {stop.selectedVenue?.address && (
                      <p className="text-slate-600 text-[11px] mt-0.5">{stop.selectedVenue.address}</p>
                    )}
                    {stop.selectedVenue?.contactPhone && (
                      <p className="text-slate-500 text-[11px] mt-0.5">Phone: {stop.selectedVenue.contactPhone}</p>
                    )}
                    {stop.selectedVenue?.contactEmail && (
                      <p className="text-slate-500 text-[11px]">Email: {stop.selectedVenue.contactEmail}</p>
                    )}

                    {/* Schedule times */}
                    <div className="grid grid-cols-2 gap-1.5 mt-2.5 pt-2 border-t border-slate-200 text-[11px]">
                      <div>
                        <span className="text-slate-400 font-semibold">Load-In: </span>
                        <span className="font-bold text-slate-800">{stop.selectedVenue?.loadInTime || "5:00 PM"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold">Soundcheck: </span>
                        <span className="font-bold text-slate-800">{stop.selectedVenue?.soundcheckTime || "6:30 PM"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold">Doors: </span>
                        <span className="font-bold text-slate-800">{stop.selectedVenue?.doorsTime || "7:30 PM"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold">Set Time: </span>
                        <span className="font-bold text-indigo-700">{stop.selectedVenue?.setTime || "9:00 PM"}</span>
                      </div>
                    </div>

                    {stop.selectedVenue?.ticketPrice && (
                      <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-semibold">Door / Cover:</span>
                        <span className="text-slate-800 font-bold">{stop.selectedVenue.ticketPrice}</span>
                      </div>
                    )}
                  </div>

                  {/* Lodging & Security Column */}
                  <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider flex items-center gap-1 mb-1">
                      <Shield className="w-3 h-3" />
                      <span>Lodging &amp; Van Security</span>
                    </span>
                    <p className="text-sm font-extrabold text-slate-900">
                      {stop.selectedLodging?.name || (stop.lodgingOptions && stop.lodgingOptions[0]?.name ? `${stop.lodgingOptions[0].name} (Suggested)` : "Pending Lodging Selection")}
                    </p>
                    {stop.selectedLodging?.address && (
                      <p className="text-slate-600 text-[11px] mt-0.5">{stop.selectedLodging.address}</p>
                    )}
                    {stop.selectedLodging?.cost && (
                      <p className="text-slate-700 text-[11px] font-bold mt-0.5">Rate: ${stop.selectedLodging.cost}/night</p>
                    )}
                    {stop.selectedLodging?.confirmationNumber && (
                      <p className="text-indigo-600 text-[11px] font-mono font-bold mt-0.5">Confirmation #: {stop.selectedLodging.confirmationNumber}</p>
                    )}
                    
                    <div className="mt-2.5 pt-2 border-t border-slate-200 text-[11px] text-amber-900 font-medium">
                      <p>
                        ⚠️ {stop.selectedLodging?.gearSecurityNote || stop.lodgingNotes || "Back van tightly against wall. Bring high-value instruments into rooms."}
                      </p>
                    </div>
                  </div>
                </div>

                {stop.customNotes && (
                  <div className="mt-3 p-2.5 bg-indigo-50/60 rounded-xl text-xs text-indigo-900 font-medium border border-indigo-100">
                    <strong>Stop Notes:</strong> {stop.customNotes}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tour GPS Link & Notes */}
          <div className="border-t border-slate-200 pt-4 text-xs text-slate-600 space-y-3 break-inside-avoid">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <p className="font-bold text-slate-900 text-xs sm:text-sm">Navigation &amp; Driving Directions:</p>
                <p className="text-slate-500 text-[11px]">Open all {tourPlan.stops.length} tour corridor stops and turn-by-turn routing directly in Google Maps.</p>
              </div>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors text-xs shrink-0 cursor-pointer print:border print:border-emerald-700 print:text-emerald-800 print:bg-emerald-50"
                id="tour-google-maps-directions-btn"
              >
                <Navigation className="w-4 h-4 shrink-0" />
                <span>Step by step instructions by Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
              </a>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 text-xs">
              <strong className="block mb-1.5 font-bold uppercase tracking-wider text-[11px]">Road Rules, Logistics &amp; Disclaimer:</strong>
              <p className="mb-2 font-semibold">
                &ldquo;{TOUR_PLANNER_DISCLAIMER}&rdquo;
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>Never leave guitars, synthesizers, pedals, or merchandise cash in the touring van unattended overnight.</li>
                <li>Verify load-in entrance, parking clearance, and front-of-house engineer contact prior to departure.</li>
                <li>Keep physical and digital copies of your stage plot, channel input list, and tech rider handy for venue sound engineers.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
