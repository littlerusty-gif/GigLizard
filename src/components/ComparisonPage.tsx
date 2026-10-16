import React from "react";
import { 
  Check, X, Sparkles, Building, Users, ShieldCheck, 
  ArrowRight, Scale, DollarSign, Clock, HelpCircle, Heart 
} from "lucide-react";

interface ComparisonPageProps {
  onSelectTab: (tab: any) => void;
  onOpenCheckout: () => void;
  onOpenRegister: () => void;
}

export default function ComparisonPage({ 
  onSelectTab, 
  onOpenCheckout, 
  onOpenRegister 
}: ComparisonPageProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-12 animate-fade-in" id="comparison-page-root">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full border border-indigo-200">
          <Scale className="w-3.5 h-3.5 text-indigo-600" />
          <span>Independent Platform Comparison</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          GigLizard vs Legacy Booking Portals
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed max-w-xl mx-auto">
          See why touring independent bands choose GigLizard over expensive $30/month subscription paywalls like Sonicbids.
        </p>
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-white rounded-3xl border border-gray-200/90 overflow-hidden shadow-md">
        <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black tracking-tight">Feature & Cost Breakdown</h3>
            <p className="text-xs text-slate-400">Direct comparison based on publicly available features as of 2026.</p>
          </div>
          <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full">
            No Recurring Traps
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-slate-50 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                <th className="py-4 px-6">Capability</th>
                <th className="py-4 px-6 text-indigo-600 font-black bg-indigo-50/50">GigLizard</th>
                <th className="py-4 px-6 text-slate-400">Sonicbids / Legacy Portals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-4 px-6 font-bold text-slate-900">
                  Venue Discovery & Search
                  <span className="block text-[11px] text-gray-500 font-normal">Browsing clubs, capacities, sound specs, and addresses</span>
                </td>
                <td className="py-4 px-6 bg-indigo-50/30 font-bold text-emerald-600 flex items-center gap-1.5 mt-1">
                  <Check className="w-4 h-4 text-emerald-600 font-black" />
                  <span>100% Free Forever</span>
                </td>
                <td className="py-4 px-6 text-rose-500 font-semibold">
                  Requires Paid Subscription ($19.99 - $34.99/mo)
                </td>
              </tr>

              <tr>
                <td className="py-4 px-6 font-bold text-slate-900">
                  Booking Communication Method
                  <span className="block text-[11px] text-gray-500 font-normal">How your pitch reaches the talent buyer</span>
                </td>
                <td className="py-4 px-6 bg-indigo-50/30 font-bold text-indigo-700">
                  Direct Email to Verified Bookers
                </td>
                <td className="py-4 px-6 text-slate-500">
                  Proprietary in-app inbox (often unmonitored)
                </td>
              </tr>

              <tr>
                <td className="py-4 px-6 font-bold text-slate-900">
                  Band Contact Access Pricing
                  <span className="block text-[11px] text-gray-500 font-normal">Unlocking co-bill bands in corridor cities</span>
                </td>
                <td className="py-4 px-6 bg-indigo-50/30 font-bold text-indigo-700">
                  $9.99 flat 30-Day Pass (No auto-renew)
                </td>
                <td className="py-4 px-6 text-slate-500">
                  Recurring monthly charges ($240+/year)
                </td>
              </tr>

              <tr>
                <td className="py-4 px-6 font-bold text-slate-900">
                  Stage Plot Designer
                  <span className="block text-[11px] text-gray-500 font-normal">Interactive gear layout and monitor wedge mapping</span>
                </td>
                <td className="py-4 px-6 bg-indigo-50/30 font-bold text-emerald-600 flex items-center gap-1.5 mt-1">
                  <Check className="w-4 h-4 text-emerald-600 font-black" />
                  <span>Built-in & Free (PNG/PDF)</span>
                </td>
                <td className="py-4 px-6 text-slate-400">
                  Not included (Requires external software)
                </td>
              </tr>

              <tr>
                <td className="py-4 px-6 font-bold text-slate-900">
                  Tech Rider & Patch List Builder
                  <span className="block text-[11px] text-gray-500 font-normal">Input channel tables, mic choices, +48V toggles</span>
                </td>
                <td className="py-4 px-6 bg-indigo-50/30 font-bold text-emerald-600 flex items-center gap-1.5 mt-1">
                  <Check className="w-4 h-4 text-emerald-600 font-black" />
                  <span>Built-in & Free (ASCII/PDF)</span>
                </td>
                <td className="py-4 px-6 text-slate-400">
                  Not included
                </td>
              </tr>

              <tr>
                <td className="py-4 px-6 font-bold text-slate-900">
                  Smart Tour Planner & Van Gas Calculator
                  <span className="block text-[11px] text-gray-500 font-normal">Google Maps route, drive hours, lodging & gas</span>
                </td>
                <td className="py-4 px-6 bg-indigo-50/30 font-bold text-emerald-600 flex items-center gap-1.5 mt-1">
                  <Check className="w-4 h-4 text-emerald-600 font-black" />
                  <span>Built-in & Free</span>
                </td>
                <td className="py-4 px-6 text-slate-400">
                  Not included
                </td>
              </tr>

              <tr>
                <td className="py-4 px-6 font-bold text-slate-900">
                  Concert Poster / Gig Flyer Maker
                  <span className="block text-[11px] text-gray-500 font-normal">Vintage halftone and modern neon flyer generator</span>
                </td>
                <td className="py-4 px-6 bg-indigo-50/30 font-bold text-emerald-600 flex items-center gap-1.5 mt-1">
                  <Check className="w-4 h-4 text-emerald-600 font-black" />
                  <span>Built-in & Free</span>
                </td>
                <td className="py-4 px-6 text-slate-400">
                  Not included
                </td>
              </tr>

              <tr>
                <td className="py-4 px-6 font-bold text-slate-900">
                  Satisfaction Guarantee
                  <span className="block text-[11px] text-gray-500 font-normal">Refund policy if you don't find active dates</span>
                </td>
                <td className="py-4 px-6 bg-indigo-50/30 font-bold text-emerald-600">
                  100% 7-Day Money-Back Refund
                </td>
                <td className="py-4 px-6 text-slate-500">
                  Strict no-refund recurring billing
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Summary Box */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 md:p-10 border border-slate-800 text-center space-y-4">
        <h3 className="text-2xl font-black">Ready to Book Without the Middleman?</h3>
        <p className="text-xs md:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Search 4,800+ music venues for $0, generate professional stage plots and riders, and unlock 1,300+ band contacts only when your tour is on the calendar.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            type="button"
            onClick={() => onSelectTab("venues")}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer transition-all flex items-center gap-2"
          >
            <span>Browse Venues (Free)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onSelectTab("pricing")}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700 cursor-pointer transition-all"
          >
            <span>View Pricing & Pass Details</span>
          </button>
        </div>
      </div>
    </div>
  );
}
