import React from "react";
import { X, Calendar, Sparkles, Building, Music, CheckCircle2, ChevronRight, Zap } from "lucide-react";
import { CalendarIngestSummary } from "../utils/calendarCrawler";

export interface CalendarIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: CalendarIngestSummary | null;
  onNavigateToBands?: () => void;
}

export default function CalendarIngestModal({
  isOpen,
  onClose,
  summary,
  onNavigateToBands
}: CalendarIngestModalProps) {
  if (!isOpen || !summary) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-500 flex items-center justify-center text-slate-950 font-black shadow-md">
              <Zap className="w-5 h-5 text-slate-950 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  30-Day Calendar Ingestion Complete
                </h3>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Live Synced
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Verified club calendars crawled, concert lineups extracted, and directory updated.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Calendars Scanned
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">
                  {summary.scannedVenuesCount}
                </span>
                <span className="text-xs font-bold text-slate-400">clubs</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                New Bands Added
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-700">
                  +{summary.newBandsAddedCount}
                </span>
                <span className="text-xs font-bold text-emerald-600">verified</span>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                Shows / Dates Logged
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-indigo-700">
                  {summary.existingBandsUpdatedCount + summary.newBandsAddedCount}
                </span>
                <span className="text-xs font-bold text-indigo-600">lineups</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                Rooms Indexed
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-amber-700">
                  {summary.newVenuesIndexedCount > 0 ? `+${summary.newVenuesIndexedCount}` : "Verified"}
                </span>
                <span className="text-xs font-bold text-amber-600">stages</span>
              </div>
            </div>
          </div>

          {/* Newly Discovered Bands List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-indigo-600" />
                <span>Newly Discovered Touring Acts ({summary.discoveredBands.length})</span>
              </h4>
              <span className="text-[11px] font-bold text-slate-500">
                Added directly to Supabase &amp; Directory
              </span>
            </div>

            {summary.discoveredBands.length > 0 ? (
              <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-64 overflow-y-auto bg-slate-50/50">
                {summary.discoveredBands.map((band, idx) => (
                  <div key={idx} className="p-3 hover:bg-white transition-colors flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <strong className="font-black text-slate-900 text-sm truncate">
                          {band.name}
                        </strong>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800">
                          {band.touring_tier}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{band.city_state}</span>
                        <span>•</span>
                        <span className="text-indigo-600 font-semibold truncate">
                          At: {band.sourceVenue}
                        </span>
                        {band.showDate && (
                          <>
                            <span>•</span>
                            <span>{band.showDate}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      {band.genres.slice(0, 2).map((g, gIdx) => (
                        <span key={gIdx} className="px-2 py-0.5 rounded-lg bg-slate-200/70 text-slate-700 text-[10px] font-semibold">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-600">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold">All active calendar acts are already registered in the directory!</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Existing records have been checked and confirmed up to date.
                </p>
              </div>
            )}
          </div>

          {/* Operational Log / Recommendation */}
          <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl text-xs space-y-1.5 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span>Next Recommended Run</span>
              <span className="text-amber-400 font-mono">
                {new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              The regional concert ingestion engine checks club websites, ticketing feeds, and Schema.org concert markup every 30 days to keep GigLizard lineups perpetually fresh.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500">
            Synced {new Date(summary.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </span>

          <div className="flex items-center gap-2">
            {onNavigateToBands && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToBands();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <span>View Bands Directory</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
