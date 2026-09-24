import React from "react";
import { TourPlan, TourStop, TourVenueStop, TourLodgingOption } from "../types";
import { 
  AlertCircle, 
  CheckCircle2, 
  Building, 
  Hotel, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  X, 
  Printer, 
  Download, 
  Edit3, 
  Check 
} from "lucide-react";

export interface ItineraryIssue {
  stopIndex: number;
  stop: TourStop;
  type: "missing_venue" | "missing_lodging" | "missing_date" | "missing_times";
  title: string;
  description: string;
}

interface ItineraryValidationModalProps {
  isOpen: boolean;
  tourPlan: TourPlan;
  issues: ItineraryIssue[];
  onFixVenue: (stopIndex: number) => void;
  onFixLodging: (stopIndex: number) => void;
  onFixStop: (stopIndex: number) => void;
  onAutoFillMissing: () => void;
  onProceedToExport: () => void;
  onClose: () => void;
}

export const ItineraryValidationModal: React.FC<ItineraryValidationModalProps> = ({
  isOpen,
  tourPlan,
  issues,
  onFixVenue,
  onFixLodging,
  onFixStop,
  onAutoFillMissing,
  onProceedToExport,
  onClose
}) => {
  if (!isOpen) return null;

  const hasIssues = issues.length > 0;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      id="itinerary-validation-modal-overlay"
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
        id="itinerary-validation-modal-container"
      >
        {/* Header */}
        <div className={`p-5 sm:p-6 text-white flex items-center justify-between ${
          hasIssues 
            ? "bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700" 
            : "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700"
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
              {hasIssues ? (
                <AlertCircle className="w-6 h-6 text-white" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80 block mb-0.5">
                Pre-Flight Itinerary Check
              </span>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                {hasIssues ? "Review Missing Itinerary Information" : "Itinerary Ready for Export!"}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {hasIssues ? (
            <>
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs sm:text-sm text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-950">
                    We noticed {issues.length} item{issues.length > 1 ? "s" : ""} requiring attention before final export.
                  </p>
                  <p className="text-amber-800 text-xs mt-0.5">
                    You can resolve them individually below, auto-fill them with suggested Northwest stages and lodging, or proceed directly to print/export.
                  </p>
                </div>
              </div>

              {/* Quick Auto-Fill Action */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-indigo-50/80 rounded-2xl border border-indigo-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-indigo-950">
                    Auto-Fill all missing stops with top recommendations?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onAutoFillMissing}
                  className="w-full sm:w-auto px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  Auto-Fill All Missing
                </button>
              </div>

              {/* List of Detected Issues */}
              <div className="space-y-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                  Items to Review ({issues.length})
                </span>

                {issues.map((issue, idx) => (
                  <div 
                    key={idx}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        issue.type === "missing_venue" 
                          ? "bg-indigo-100 text-indigo-700" 
                          : issue.type === "missing_lodging" 
                          ? "bg-amber-100 text-amber-800" 
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {issue.type === "missing_venue" && <Building className="w-4 h-4" />}
                        {issue.type === "missing_lodging" && <Hotel className="w-4 h-4" />}
                        {issue.type === "missing_date" && <Calendar className="w-4 h-4" />}
                        {issue.type === "missing_times" && <Clock className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">
                            Stop {issue.stop.dayNumber || issue.stopIndex + 1}: {issue.stop.city}, {issue.stop.state}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {issue.description}
                        </p>
                      </div>
                    </div>

                    {/* Quick Fix Button */}
                    <div className="self-end sm:self-center shrink-0">
                      {issue.type === "missing_venue" && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onFixVenue(issue.stopIndex);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          Select Venue
                        </button>
                      )}
                      {issue.type === "missing_lodging" && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onFixLodging(issue.stopIndex);
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          Select Lodging
                        </button>
                      )}
                      {(issue.type === "missing_date" || issue.type === "missing_times") && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onFixStop(issue.stopIndex);
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          Edit Details
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                All {tourPlan.stops.length} Tour Stops Completely Configured!
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Every stop has a confirmed stage venue, load-in schedule, direct contact details, and secure lodging reserved.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold rounded-xl cursor-pointer"
          >
            Back to Planner
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onProceedToExport();
            }}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer ${
              hasIssues 
                ? "bg-slate-900 hover:bg-slate-800" 
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
            id="proceed-export-btn"
          >
            <Printer className="w-4 h-4" />
            <span>{hasIssues ? "Proceed to Export & Print Anyway" : "Open Print & Export Sheet"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
