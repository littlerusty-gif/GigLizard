import React from "react";
import { AlertTriangle, ShieldCheck, Check, ExternalLink, X, Info } from "lucide-react";

interface TourDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TourDisclaimerModal: React.FC<TourDisclaimerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      id="tour-disclaimer-modal-overlay"
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-amber-200 animate-in zoom-in-95 duration-150"
        id="tour-disclaimer-modal-container"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 p-5 sm:p-6 text-white flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shrink-0 mt-0.5">
              <AlertTriangle className="w-6 h-6 text-amber-100" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-200 block mb-1">
                Notice & Platform Policy
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Booking & Itinerary Notice
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close disclaimer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-5 text-slate-700">
          {/* Main Required Disclaimer Callout */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-300/80 text-amber-950 space-y-2">
            <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider text-amber-900">
              <Info className="w-4 h-4 text-amber-700" />
              <span>Important Booking Policy</span>
            </div>
            <p className="text-sm sm:text-base font-bold leading-relaxed text-amber-950">
              &ldquo;Booking is not final! You must contact the venue to book with them directly. This site is for planning &amp; exposure and does not book bands for any venue, hotel, or any other accommodation.&rdquo;
            </p>
          </div>

          {/* Key Points */}
          <div className="space-y-3 text-xs sm:text-sm text-slate-600">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 mt-0.5 text-xs">
                1
              </div>
              <p>
                <strong className="text-slate-900">Direct Venue Coordination:</strong> Use the direct contact emails and phone numbers provided in the directory to confirm dates, set times, and technical riders directly with venue talent buyers. GigLizard does not negotiate prices between bands and venues.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 mt-0.5 text-xs">
                2
              </div>
              <p>
                <strong className="text-slate-900">Independent Lodging:</strong> Hotel, motel, and campground recommendations are curated for van parking and gear security. Room reservations must be confirmed directly with accommodation providers.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 mt-0.5 text-xs">
                3
              </div>
              <p>
                <strong className="text-slate-900">Tour Run-of-Show:</strong> GigLizard provides automated routing, fuel budgeting, stage selection, and printable master sheets to keep your touring crew organized on the road.
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-400 font-medium text-center sm:text-left">
              GigLizard Touring &amp; Production Suite
            </p>
            <button
              onClick={onClose}
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-sm rounded-2xl shadow-md shadow-amber-600/20 transition-all cursor-pointer"
              id="acknowledge-tour-disclaimer-btn"
            >
              <Check className="w-4 h-4" />
              <span>I Understand &amp; Agree</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
